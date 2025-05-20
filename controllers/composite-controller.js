// controllers/composite-controller.js
const mongoose = require('mongoose');
const Project = require('../models/project');
const User = require('../models/user');
const RubricEvaluation = require('../models/rubric-evaluation');
const GeneralComment = require('../models/general-comment');
const Mockup = require('../models/mockup');
const DesignPattern = require('../models/design-pattern');
const ProjectRequirement = require('../models/project-requirement');
const ProjectStory = require('../models/project-story');
const ClassDiagram = require('../models/class-diagram');
const ActivityDiagram = require('../models/activity-diagram');
const SequenceDiagram = require('../models/sequence-diagram');
const UseCaseDiagram = require('../models/use-case-diagram');
const AggregateRubric = require('../models/aggregate-rubric');

const {
  ActivityDiagramReview,
  ClassDiagramReview,
  DesignPatternReview,
  MockupReview,
  RequirementReview,
  SequenceDiagramReview,
  StoryReview,
  UseCaseDiagramReview
} = require('../models');

// System user constant for reviews
const SYSTEM_USER_ID = '000000000000000000000000';

// Helper for validating project access
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

// Get project dashboard with statistics
exports.getProjectDashboard = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) return res.status(401).json({ message: 'Authentication required' });
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;
    const project = await validateProjectAccess(user, projectId);

    await project.populate([
      'requirements',
      'stories',
      'activityDiagrams',
      'useCaseDiagrams',
      'sequenceDiagrams',
      'classDiagrams',
      'designPatterns',
      'mockups_ref'
    ]);

    const stats = {};

    const calculateStats = async (items, model, field) => {
      if (items.length > 0) {
        const ids = items.map(item => item._id);
        const reviewed = await model.countDocuments({
          [field]: { $in: ids },
          reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)  // Only count official reviews
        });
        return { total: ids.length, reviewed };
      }
      return { total: 0, reviewed: 0 };
    };

    stats.requirements = await calculateStats(project.requirements, RequirementReview, 'requirement');
    stats.stories = await calculateStats(project.stories, StoryReview, 'story');
    stats.activityDiagrams = await calculateStats(project.activityDiagrams, ActivityDiagramReview, 'activityDiagram');
    stats.useCaseDiagrams = await calculateStats(project.useCaseDiagrams, UseCaseDiagramReview, 'useCaseDiagram');
    stats.sequenceDiagrams = await calculateStats(project.sequenceDiagrams, SequenceDiagramReview, 'sequenceDiagram');
    stats.classDiagrams = await calculateStats(project.classDiagrams, ClassDiagramReview, 'classDiagram');
    stats.designPatterns = await calculateStats(project.designPatterns, DesignPatternReview, 'designPattern');
    stats.mockups = await calculateStats(project.mockups_ref, MockupReview, 'mockup');

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        description: project.description,
        tags: project.tags,
        motto: project.motto,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching project dashboard:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get mockup navigation tree
exports.getMockupNavigationTree = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) return res.status(401).json({ message: 'Authentication required' });
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { mockupId } = req.params;
    const rootMockup = await Mockup.findById(mockupId)
      .populate('previousScreens', 'title url')
      .populate('nextScreens', 'title url');

    if (!rootMockup) return res.status(404).json({ message: 'Mockup not found' });
    await validateProjectAccess(user, rootMockup.project);

    const projectMockups = await Mockup.find({ project: rootMockup.project })
      .populate('previousScreens', 'title url')
      .populate('nextScreens', 'title url')
      .populate('storiesLinked', 'title text');

    const mockupMap = {};
    projectMockups.forEach(mockup => {
      mockupMap[mockup._id.toString()] = {
        _id: mockup._id,
        title: mockup.title,
        description: mockup.description,
        url: mockup.url,
        previousScreens: mockup.previousScreens.map(s => s._id.toString()),
        nextScreens: mockup.nextScreens.map(s => s._id.toString()),
        storiesLinked: mockup.storiesLinked
      };
    });

    // Changed to use SYSTEM_USER_ID
    const reviews = await MockupReview.find({
      mockup: { $in: projectMockups.map(m => m._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    reviews.forEach(review => {
      const id = review.mockup.toString();
      if (mockupMap[id]) {
        mockupMap[id].reviewed = true;
        mockupMap[id].rating = review.rating;
        mockupMap[id].comment = review.comment;
        mockupMap[id].isEditable = user.role === 'Admin'; // Only admins can edit
      }
    });

    const navigationTree = {
      current: mockupMap[rootMockup._id.toString()],
      previous: rootMockup.previousScreens.map(s => mockupMap[s._id.toString()]),
      next: rootMockup.nextScreens.map(s => mockupMap[s._id.toString()]),
      all: mockupMap
    };

    res.json(navigationTree);
  } catch (error) {
    console.error('Error fetching mockup navigation tree:', error);
    res.status(500).json({ message: error.message });
  }
};

// Submit bulk reviews
exports.submitBulkReviews = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) return res.status(401).json({ message: 'Authentication required' });
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow admins to submit reviews
    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only administrators can submit reviews' });
    }

    const { reviews } = req.body;
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ message: 'Invalid reviews data' });
    }

    const results = [];

    for (const reviewData of reviews) {
      const { artifactType, artifactId, rating, comment, ...scores } = reviewData;
      if (!artifactType || !artifactId || typeof rating !== 'number') {
        results.push({ artifactId, success: false, message: 'Missing required fields' });
        continue;
      }

      let ReviewModel, artifactField;
      try {
        ReviewModel = require(`../models/${artifactType}-review`);
        artifactField = artifactType;
      } catch {
        results.push({ artifactId, success: false, message: 'Invalid artifact type' });
        continue;
      }

      try {
        const ArtifactModel = mongoose.model(artifactType.charAt(0).toUpperCase() + artifactType.slice(1));
        const artifact = await ArtifactModel.findById(artifactId);
        if (!artifact) {
          results.push({ artifactId, success: false, message: 'Artifact not found' });
          continue;
        }

        await validateProjectAccess(user, artifact.project);

        const reviewPayload = {
          [artifactField]: artifactId,
          reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)
          , // Use system user ID
          rating,
          comment,
          project: artifact.project,
          ...scores
        };

        const existingReview = await ReviewModel.findOne({
          [artifactField]: artifactId,
          reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

        });

        if (existingReview) {
          Object.assign(existingReview, reviewPayload);
          await existingReview.save();
        } else {
          await ReviewModel.create(reviewPayload);
        }

        results.push({ artifactId, success: true });
      } catch (err) {
        console.error(`Error processing review for ${artifactId}:`, err);
        results.push({ artifactId, success: false, message: 'Error processing review' });
      }
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error submitting bulk reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get design patterns review data
exports.getDesignPatternsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get design patterns with deep population
    const designPatterns = await DesignPattern.find({ project: projectId })
      .populate({
        path: 'requirementsLinked',
        select: 'text seq type user_priority system_priority description'
      })
      .populate({
        path: 'classDiagramsLinked',
        select: 'title description url filename mimetype'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await DesignPatternReview.find({
      designPattern: { $in: designPatterns.map(p => p._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.designPattern.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'designPatterns',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'designPatterns',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'designPatterns'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const patternsWithReviews = designPatterns.map(pattern => {
      const review = reviewMap.get(pattern._id.toString());

      return {
        _id: pattern._id,
        title: pattern.title,
        description: pattern.description,
        url: pattern.url,
        handle: pattern.handle,
        filename: pattern.filename,
        mimetype: pattern.mimetype,
        uploadId: pattern.uploadId,
        size: pattern.size,
        seq: pattern.seq,
        requirementsLinked: pattern.requirementsLinked,
        classDiagramsLinked: pattern.classDiagramsLinked,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          patternSelectionScore: review.patternSelectionScore,
          implementationScore: review.implementationScore,
          flexibilityScore: review.flexibilityScore,
          documentationScore: review.documentationScore
        } : null,
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: patternsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching design patterns review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get a linked artifact
exports.getLinkedArtifact = async (req, res) => {
  try {
    const { artifactType, artifactId } = req.params;

    // Determine the model based on artifact type
    let Model;
    switch (artifactType) {
      case 'requirements':
        Model = ProjectRequirement;
        break;
      case 'stories':
        Model = ProjectStory;
        break;
      case 'classDiagrams':
        Model = ClassDiagram;
        break;
      case 'activityDiagrams':
        Model = ActivityDiagram;
        break;
      case 'sequenceDiagrams':
        Model = SequenceDiagram;
        break;
      case 'useCaseDiagrams':
        Model = UseCaseDiagram;
        break;
      case 'designPatterns':
        Model = DesignPattern;
        break;
      case 'mockups':
        Model = Mockup;
        break;
      default:
        return res.status(400).json({ message: 'Invalid artifact type' });
    }

    // Fetch the artifact
    const artifact = await Model.findById(artifactId);

    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }

    return res.json({ artifact });
  } catch (error) {
    console.error('Error fetching linked artifact:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get activity diagrams review data
exports.getActivityDiagramsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get activity diagrams with deep population
    const activityDiagrams = await ActivityDiagram.find({ project: projectId })
      .populate({
        path: 'storiesLinked',
        select: 'title text seq'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await ActivityDiagramReview.find({
      activityDiagram: { $in: activityDiagrams.map(d => d._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.activityDiagram.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'activityDiagrams',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'activityDiagrams',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'activityDiagrams'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const diagramsWithReviews = activityDiagrams.map(diagram => {
      const review = reviewMap.get(diagram._id.toString());

      return {
        _id: diagram._id,
        title: diagram.title,
        description: diagram.description,
        url: diagram.url,
        handle: diagram.handle,
        filename: diagram.filename,
        mimetype: diagram.mimetype,
        uploadId: diagram.uploadId,
        size: diagram.size,
        seq: diagram.seq,
        storiesLinked: diagram.storiesLinked,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          umlSyntaxScore: review.umlSyntaxScore,
          scenarioComprehensiveScore: review.scenarioComprehensiveScore,
          gherkinAlignmentScore: review.gherkinAlignmentScore
        } : {},
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: diagramsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching activity diagrams review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get class diagrams review data
exports.getClassDiagramsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get class diagrams with deep population
    const classDiagrams = await ClassDiagram.find({ project: projectId })
      .populate({
        path: 'requirementsLinked',
        select: 'text seq type user_priority system_priority description'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await ClassDiagramReview.find({
      classDiagram: { $in: classDiagrams.map(d => d._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.classDiagram.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'classDiagrams',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'classDiagrams',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'classDiagrams'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const diagramsWithReviews = classDiagrams.map(diagram => {
      const review = reviewMap.get(diagram._id.toString());

      return {
        _id: diagram._id,
        title: diagram.title,
        description: diagram.description,
        url: diagram.url,
        handle: diagram.handle,
        filename: diagram.filename,
        mimetype: diagram.mimetype,
        uploadId: diagram.uploadId,
        size: diagram.size,
        seq: diagram.seq,
        requirementsLinked: diagram.requirementsLinked,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          classStructureScore: review.classStructureScore,
          relationshipModelingScore: review.relationshipModelingScore,
          completenessScore: review.completenessScore,
          clarityScore: review.clarityScore,
          designPrinciplesScore: review.designPrinciplesScore
        } : null,
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: diagramsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching class diagrams review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get sequence diagrams review data
exports.getSequenceDiagramsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get sequence diagrams with deep population
    const sequenceDiagrams = await SequenceDiagram.find({ project: projectId })
      .populate({
        path: 'storiesLinked',
        select: 'title text'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await SequenceDiagramReview.find({
      sequenceDiagram: { $in: sequenceDiagrams.map(d => d._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.sequenceDiagram.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'sequenceDiagrams',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'sequenceDiagrams',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'sequenceDiagrams'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const diagramsWithReviews = sequenceDiagrams.map(diagram => {
      const review = reviewMap.get(diagram._id.toString());

      return {
        _id: diagram._id,
        title: diagram.title,
        description: diagram.description,
        url: diagram.url,
        handle: diagram.handle,
        filename: diagram.filename,
        mimetype: diagram.mimetype,
        uploadId: diagram.uploadId,
        size: diagram.size,
        seq: diagram.seq,
        storiesLinked: diagram.storiesLinked,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          umlCorrectnessScore: review.umlCorrectnessScore,
          messageFlowScore: review.messageFlowScore,
          returnValuesScore: review.returnValuesScore,
          completenessScore: review.completenessScore
        } : {},
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: diagramsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching sequence diagrams review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get use case diagrams review data
exports.getUseCaseDiagramsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get use case diagrams with deep population
    const useCaseDiagrams = await UseCaseDiagram.find({ project: projectId })
      .populate({
        path: 'requirementsLinked',
        select: 'text seq type user_priority system_priority description'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await UseCaseDiagramReview.find({
      useCaseDiagram: { $in: useCaseDiagrams.map(d => d._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.useCaseDiagram.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'useCaseDiagrams',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'useCaseDiagrams',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'useCaseDiagrams'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const diagramsWithReviews = useCaseDiagrams.map(diagram => {
      const review = reviewMap.get(diagram._id.toString());

      return {
        _id: diagram._id,
        title: diagram.title,
        description: diagram.description,
        url: diagram.url,
        handle: diagram.handle,
        filename: diagram.filename,
        mimetype: diagram.mimetype,
        uploadId: diagram.uploadId,
        size: diagram.size,
        seq: diagram.seq,
        requirementsLinked: diagram.requirementsLinked,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          umlSyntaxScore: review.umlSyntaxScore,
          useCasePackageScore: review.useCasePackageScore,
          gherkinSpecificationScore: review.gherkinSpecificationScore
        } : {},
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: diagramsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching use case diagrams review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get mockups review data
exports.getMockupsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get mockups with deep population
    const mockups = await Mockup.find({ project: projectId })
      .populate({
        path: 'storiesLinked',
        select: 'title text'
      })
      .populate({
        path: 'previousScreens',
        select: 'title url'
      })
      .populate({
        path: 'nextScreens',
        select: 'title url'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await MockupReview.find({
      mockup: { $in: mockups.map(m => m._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.mockup.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'mockups',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'mockups',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'mockups'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const mockupsWithReviews = mockups.map(mockup => {
      const review = reviewMap.get(mockup._id.toString());

      return {
        _id: mockup._id,
        title: mockup.title,
        description: mockup.description,
        url: mockup.url,
        handle: mockup.handle,
        filename: mockup.filename,
        mimetype: mockup.mimetype,
        uploadId: mockup.uploadId,
        size: mockup.size,
        seq: mockup.seq,
        storiesLinked: mockup.storiesLinked,
        previousScreens: mockup.previousScreens,
        nextScreens: mockup.nextScreens,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          uiUxDesignScore: review.uiUxDesignScore,
          consistencyScore: review.consistencyScore,
          flowScore: review.flowScore,
          completenessScore: review.completenessScore,
          userFriendlinessScore: review.userFriendlinessScore
        } : null,
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: mockupsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching mockups review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get requirements review data
exports.getRequirementsReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get requirements
    const requirements = await ProjectRequirement.find({ project: projectId }).sort({ seq: 1 });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await RequirementReview.find({
      requirement: { $in: requirements.map(r => r._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.requirement.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'requirements',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'requirements',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'requirements'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const requirementsWithReviews = requirements.map(req => {
      const review = reviewMap.get(req._id.toString());

      return {
        _id: req._id,
        text: req.text,
        description: req.description,
        type: req.type,
        user_priority: req.user_priority,
        system_priority: req.system_priority,
        seq: req.seq,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          syntaxScore: review.syntaxScore,
          categorizationScore: review.categorizationScore,
          scopeDefinitionScore: review.scopeDefinitionScore,
          quantificationScore: review.quantificationScore
        } : {},
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: requirementsWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching requirements review data:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get stories review data
exports.getStoriesReviewData = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { projectId } = req.params;

    // This function will handle admin vs regular user access differently
    const project = await validateProjectAccess(user, projectId);

    // Get stories with linked requirements
    const stories = await ProjectStory.find({ project: projectId })
      .sort({ seq: 1 })
      .populate({
        path: 'requirementsLinked',
        select: 'text seq type user_priority system_priority'
      });

    // Get SYSTEM USER's reviews (not the current user's)
    const reviews = await StoryReview.find({
      story: { $in: stories.map(s => s._id) },
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)

    });

    const reviewMap = new Map();
    reviews.forEach(review => {
      reviewMap.set(review.story.toString(), review);
    });

    // Get rubric data, general comments, etc.
    const [rubricEvaluation, generalComment, aggregateRubric] = await Promise.all([
      RubricEvaluation.findOne({
        project: projectId,
        rubricType: 'stories',
        evaluator: user._id
      }),
      GeneralComment.findOne({
        project: projectId,
        artifactType: 'stories',
        user: user._id
      }),
      AggregateRubric.findOne({
        project: projectId,
        artifactType: 'stories'
      })
    ]);

    // Prepare aggregate data
    let aggregateData = {
      criteriaAverages: {},
      overallScore: 0,
      reviewCount: 0
    };

    if (aggregateRubric) {
      const criteriaAverages = {};
      aggregateRubric.criteriaAverages.forEach((value, key) => {
        criteriaAverages[key] = value;
      });

      aggregateData = {
        criteriaAverages,
        overallScore: aggregateRubric.overallScore,
        reviewCount: aggregateRubric.reviewCount
      };
    }

    // Build response data with isEditable flag
    const storiesWithReviews = stories.map(story => {
      const review = reviewMap.get(story._id.toString());

      return {
        _id: story._id,
        title: story.title,
        text: story.text,
        seq: story.seq,
        requirementsLinked: story.requirementsLinked,
        reviewed: !!review,
        rating: review?.rating || 0,
        comment: review?.comment || '',
        scores: review ? {
          storyFormatScore: review.storyFormatScore,
          featureCompletionScore: review.featureCompletionScore,
          acceptanceCriteriaScore: review.acceptanceCriteriaScore
        } : {},
        isEditable: user.role === 'Admin' // Only admins can edit
      };
    });

    return res.json({
      artifacts: storiesWithReviews,
      rubric: rubricEvaluation?.criteria || [],
      generalComment: generalComment?.comment || '',
      aggregateRubric: aggregateData,
      projectName: project.name
    });

  } catch (error) {
    console.error('Error fetching stories review data:', error);
    return res.status(500).json({ message: error.message });
  }
};