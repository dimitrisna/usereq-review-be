const mongoose = require('mongoose');
const Project = require('../models/project');
const User = require('../models/user');
const GeneralComment = require('../models/general-comment');

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



const validateProjectAccess = async (userId, projectId, userRole = 'User') => {
  const project = await Project.findOne({
    _id: projectId,
    users: { $in: [userId] }
  });
  if (!project && userRole !== 'Admin') {
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

    const { artifactType, artifactId, rating, comment, ...scores } = req.body;
    console.log('[BE:Reviews] Review data received:', { artifactType, artifactId, rating, comment, scores });
    
    const entry = this.reviewModelMap[artifactType];
    if (!entry) return res.status(400).json({ error: 'Invalid artifact type' });

    const { model: ReviewModel, refField, artifactModel: ArtifactModel } = entry;
    const artifact = await ArtifactModel.findById(artifactId);
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    await validateProjectAccess(user._id, artifact.project, user.role);

    // For designPattern, make sure scores are correctly mapped
    let reviewData = {
      reviewer: user._id,
      project: artifact.project,
      [refField]: artifactId,
      rating,
      comment,
    };
    
    // For design patterns, add score fields explicitly
    if (artifactType === 'designPattern') {
      reviewData = {
        ...reviewData,
        patternSelectionScore: scores.patternSelectionScore,
        implementationScore: scores.implementationScore,
        flexibilityScore: scores.flexibilityScore,
        documentationScore: scores.documentationScore
      };
    } else {
      // For other types
      reviewData = { ...reviewData, ...scores };
    }
    
    console.log('[BE:Reviews] Final review data to save:', reviewData);

    let review = await ReviewModel.findOne({ [refField]: artifactId, reviewer: user._id });
    if (review) {
      console.log('[BE:Reviews] Updating existing review');
      // Update each field explicitly to ensure they're saved
      Object.keys(reviewData).forEach(key => {
        if (reviewData[key] !== undefined) {
          review[key] = reviewData[key];
        }
      });
    } else {
      console.log('[BE:Reviews] Creating new review');
      review = new ReviewModel(reviewData);
    }

    await review.save();
    console.log('[BE:Reviews] Review saved successfully');
    
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
    
    // Return the complete updated review
    res.status(201).json({ 
      success: true,
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        scores: {
          patternSelectionScore: review.patternSelectionScore,
          implementationScore: review.implementationScore,
          flexibilityScore: review.flexibilityScore,
          documentationScore: review.documentationScore
        }
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
    const entry = reviewModelMap[artifactType];
    if (!entry) return res.status(400).json({ error: 'Invalid artifact type' });

    const { model: ReviewModel, refField, artifactModel: ArtifactModel } = entry;
    const artifact = await ArtifactModel.findById(artifactId);
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    let review = await ReviewModel.findOne({ [refField]: artifactId, reviewer: user._id });

    if (review) {
      review = await includeRubricScores(review.toObject(), artifactType, artifact.project, user._id);
    } else {
      review = {
        artifactType,
        artifactId,
        rating: 0,
        comment: ''
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
    const entry = reviewModelMap[artifactType];
    if (!entry) return res.status(400).json({ error: 'Invalid artifact type' });

    const { model: ReviewModel, refField, artifactModel: ArtifactModel } = entry;
    const artifact = await ArtifactModel.findById(artifactId);
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    await validateProjectAccess(user._id, artifact.project, user.role);

    const reviews = await ReviewModel.find({ [refField]: artifactId })
      .populate('reviewer', 'fullName username');

    res.json({ reviews });
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

    await validateProjectAccess(user._id, projectId, user.role);

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
    res.status(201).json({ generalComment });
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
    await validateProjectAccess(user._id, projectId, user.role);

    const generalComment = await GeneralComment.findOne({
      project: projectId,
      artifactType,
      user: user._id
    });

    res.json({ comment: generalComment?.comment || '' });
  } catch (error) {
    console.error('Get general comment error:', error);
    res.status(500).json({ error: error.message });
  }
};
