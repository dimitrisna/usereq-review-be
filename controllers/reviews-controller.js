const mongoose = require('mongoose');
const Project = require('../models/project');
const User = require('../models/user');
const GeneralComment = require('../models/general-comment');
const { SYSTEM_USER_ID } = require('../utilities/constants');

const {
  RequirementReview,
  StoryReview,
  ActivityDiagramReview,
  UseCaseDiagramReview,
  SequenceDiagramReview,
  ClassDiagramReview,
  DesignPatternReview,
  MockupReview
} = require('../models');

exports.reviewModelMap = {
  requirement: {
    model: RequirementReview,
    refField: 'requirement',
    artifactModel: require('../models/project-requirement')
  },
  story: {
    model: StoryReview,
    refField: 'story',
    artifactModel: require('../models/project-story')
  },
  activityDiagram: {
    model: ActivityDiagramReview,
    refField: 'activityDiagram',
    artifactModel: require('../models/activity-diagram')
  },
  useCaseDiagram: {
    model: UseCaseDiagramReview,
    refField: 'useCaseDiagram',
    artifactModel: require('../models/use-case-diagram')
  },
  sequenceDiagram: {
    model: SequenceDiagramReview,
    refField: 'sequenceDiagram',
    artifactModel: require('../models/sequence-diagram')
  },
  classDiagram: {
    model: ClassDiagramReview,
    refField: 'classDiagram',
    artifactModel: require('../models/class-diagram')
  },
  designPattern: {
    model: DesignPatternReview,
    refField: 'designPattern',
    artifactModel: require('../models/design-pattern')
  },
  mockup: {
    model: MockupReview,
    refField: 'mockup',
    artifactModel: require('../models/mockup')
  }
};

const validateProjectAccess = async (user, projectId) => {
  // For admins, allow access to all projects
  if (user.role === 'Admin') {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    return project;
  }
  
  // For regular users, check if they are a member of the project
  const project = await Project.findOne({
    _id: projectId,
    users: { $in: [user._id] }
  });
  
  if (!project) {
    throw new Error('Not authorized to access this project');
  }
  
  return project;
};

const includeRubricScores = async (review, artifactType, projectId, userId) => {
  const RubricEvaluation = require('../models/rubric-evaluation');
  try {
    const rubricEvaluation = await RubricEvaluation.findOne({
      project: projectId,
      rubricType: artifactType + 's',
      evaluator: userId
    });

    if (rubricEvaluation) {
      review.rubricScores = rubricEvaluation.criteria.reduce((scores, criterion) => {
        scores[criterion.name.replace(/\s+/g, '')] = criterion.score;
        return scores;
      }, {});
      review.overallRubricScore = rubricEvaluation.overallScore;
    }
  } catch (error) {
    console.error('Error including rubric scores:', error);
  }

  return review;
};

exports.submitReview = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Only admins can submit reviews
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can create or edit reviews' });
    }

    // Get data from request
    const { artifactType, artifactId, rating, comment, ...scores } = req.body;
    
    const entry = this.reviewModelMap[artifactType];
    if (!entry) return res.status(400).json({ error: 'Invalid artifact type' });

    const { model: ReviewModel, refField, artifactModel: ArtifactModel } = entry;
    const artifact = await ArtifactModel.findById(artifactId);
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, artifact.project);

    // Create review data with SYSTEM_USER_ID as reviewer
    let reviewData = {
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)
,
      project: artifact.project,
      [refField]: artifactId,
      rating,
      comment,
      ...scores
    };
    
    // Look for existing review by SYSTEM_USER_ID
    let review = await ReviewModel.findOne({ 
      [refField]: artifactId, 
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)
 
    });
    
    if (review) {
      // Update existing review
      Object.keys(reviewData).forEach(key => {
        if (reviewData[key] !== undefined) {
          review[key] = reviewData[key];
        }
      });
    } else {
      // Create new review
      review = new ReviewModel(reviewData);
    }

    await review.save();
    
    // Update aggregate rubric data
    try {
      const rubricController = require('./rubric-controller');
      await rubricController.updateAggregateRubric(
        artifact.project,
        artifactType + 's'
      );
    } catch (err) {
      console.error('[BE:Reviews] Error updating aggregate rubric:', err);
    }
    
    // Return success
    res.status(201).json({ 
      success: true,
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        scores: { ...scores },
        isEditable: user.role === 'Admin' // Only admins can edit
      }
    });
  } catch (error) {
    console.error('[BE:Reviews] Submit review error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMyReview = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { artifactType, artifactId } = req.params;
    const entry = this.reviewModelMap[artifactType];
    if (!entry) return res.status(400).json({ error: 'Invalid artifact type' });

    const { model: ReviewModel, refField, artifactModel: ArtifactModel } = entry;
    const artifact = await ArtifactModel.findById(artifactId);
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, artifact.project);

    // Get SYSTEM USER's review (not the current user's)
    let review = await ReviewModel.findOne({ 
      [refField]: artifactId, 
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)
 
    });

    if (review) {
      review = await includeRubricScores(review.toObject(), artifactType, artifact.project, user._id);
      review.isEditable = user.role === 'Admin'; // Only admins can edit
    } else {
      review = {
        artifactType,
        artifactId,
        rating: 0,
        comment: '',
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    }

    res.json({ review });
  } catch (error) {
    console.error('Get my review error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getArtifactReviews = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { artifactType, artifactId } = req.params;
    const entry = this.reviewModelMap[artifactType];
    if (!entry) return res.status(400).json({ error: 'Invalid artifact type' });

    const { model: ReviewModel, refField, artifactModel: ArtifactModel } = entry;
    const artifact = await ArtifactModel.findById(artifactId);
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, artifact.project);

    const reviews = await ReviewModel.find({ [refField]: artifactId })
      .populate('reviewer', 'fullName username');
    
    // Add isEditable flag to each review
    const reviewsWithEditFlag = reviews.map(review => {
      const reviewObj = review.toObject();
      reviewObj.isEditable = user.role === 'Admin'; // Only admins can edit
      return reviewObj;
    });

    res.json({ reviews: reviewsWithEditFlag });
  } catch (error) {
    console.error('Get artifact reviews error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.saveGeneralComment = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { projectId, artifactType, comment } = req.body;
    const validTypes = [
      'requirements', 'storys', 'activityDiagrams', 'useCaseDiagrams',
      'sequenceDiagrams', 'classDiagrams', 'designPatterns', 'mockups'
    ];
    if (!validTypes.includes(artifactType)) {
      return res.status(400).json({ error: 'Invalid artifact type' });
    }

    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, projectId);

    let generalComment = await GeneralComment.findOne({
      project: projectId,
      artifactType,
      user: user._id
    });

    if (generalComment) {
      generalComment.comment = comment;
    } else {
      generalComment = new GeneralComment({
        project: projectId,
        artifactType,
        comment,
        user: user._id
      });
    }

    await generalComment.save();
    
    // Add isEditable flag
    const responseData = generalComment.toObject();
    responseData.isEditable = user.role === 'Admin'; // Only admins can edit
    
    res.status(201).json({ generalComment: responseData });
  } catch (error) {
    console.error('Save general comment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getGeneralComment = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { projectId, artifactType } = req.params;
    
    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, projectId);

    const generalComment = await GeneralComment.findOne({
      project: projectId,
      artifactType,
      user: user._id
    });

    // Add isEditable flag
    const isEditable = user.role === 'Admin'; // Only admins can edit
    
    res.json({ 
      comment: generalComment?.comment || '',
      isEditable 
    });
  } catch (error) {
    console.error('Get general comment error:', error);
    res.status(500).json({ error: error.message });
  }
};