// controllers/rubric-controller.js
const mongoose = require('mongoose');
const AggregateRubric = require('../models/aggregate-rubric');
const Project = require('../models/project');
const User = require('../models/user');
const RubricEvaluation = require('../models/rubric-evaluation');
const { reviewModelMap } = require('./reviews-controller');

// Helper function to validate project access
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

// Define criteria fields for each artifact type
const criteriaFieldsMap = {
  'requirements': ['clarityScore', 'testabilityScore', 'feasibilityScore', 'necessityScore', 'prioritizationScore'],
  'storys': ['userFocusScore', 'valuePropositionScore', 'acceptanceCriteriaScore', 'sizeScore', 'independenceScore'],
  'activityDiagrams': ['flowLogicScore', 'decisionPointsScore', 'parallelActivitiesScore', 'startEndPointsScore', 'clarityScore'],
  'useCaseDiagrams': ['actorIdentificationScore', 'useCaseDefinitionScore', 'relationshipsScore', 'systemBoundaryScore', 'completenessScore'],
  'sequenceDiagrams': ['objectInteractionScore', 'messageFlowScore', 'returnValuesScore', 'exceptionHandlingScore', 'completenessScore'],
  'classDiagrams': ['classStructureScore', 'relationshipModelingScore', 'completenessScore', 'clarityScore', 'designPrinciplesScore'],
  'designPatterns': ['patternSelectionScore', 'implementationScore', 'flexibilityScore', 'complexityScore', 'documentationScore'],
  'mockups': ['uiUxDesignScore', 'consistencyScore', 'flowScore', 'completenessScore', 'userFriendlinessScore']
};

exports.updateAggregateRubric = async (projectId, artifactType) => {
  try {
    console.log('[RubricController] Updating rubric for:', projectId, artifactType);
    // Validate artifact type
    if (!criteriaFieldsMap[artifactType]) {
      
      throw new Error(`Invalid artifact type: ${artifactType}`);
    }
    console.log('HIIIIIIIIIII');
    // Get the review model for this artifact type
    const singularType = artifactType.endsWith('s') ? artifactType.slice(0, -1) : artifactType;
    console.log('Singular type:', singularType);
    const entry = reviewModelMap[singularType];
    console.log(entry);
    if (!entry) {
      throw new Error(`No review model found for artifact type: ${singularType}`);
    }
    
    const { model: ReviewModel } = entry;
    const criteriaFields = criteriaFieldsMap[artifactType];
    
    // Find all reviews for this artifact type in the project
    const reviews = await ReviewModel.find({ project: projectId });
    
    if (!reviews || reviews.length === 0) {
      // No reviews yet, set defaults
      await AggregateRubric.findOneAndUpdate(
        { project: projectId, artifactType },
        { 
          criteriaAverages: new Map(),
          overallScore: 0,
          reviewCount: 0,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
      return;
    }
    
    // Calculate averages for each criteria
    const criteriaAverages = new Map();
    let totalScore = 0;
    let criteriaCount = 0;
    
    criteriaFields.forEach(field => {
      const validReviews = reviews.filter(r => r[field] !== undefined && r[field] !== null);
      if (validReviews.length > 0) {
        const sum = validReviews.reduce((acc, r) => acc + r[field], 0);
        const avg = sum / validReviews.length;
        criteriaAverages.set(field, avg);
        totalScore += avg;
        criteriaCount++;
      } else {
        criteriaAverages.set(field, 0);
      }
    });
    
    // Calculate overall score
    const overallScore = criteriaCount > 0 ? totalScore / criteriaCount : 0;
    console.log('Overall score:', overallScore);
    if (artifactType === 'storys') {
        artifactType = 'stories';
    }
    // Update the aggregate record
    await AggregateRubric.findOneAndUpdate(
      { project: projectId, artifactType },
      { 
        criteriaAverages,
        overallScore,
        reviewCount: reviews.length,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(AggregateRubric)
    return {
      criteriaAverages: Object.fromEntries(criteriaAverages),
      overallScore,
      reviewCount: reviews.length
    };
  } catch (error) {
    console.error(`Error updating aggregate rubric for ${artifactType}:`, error);
    throw error;
  }
};

exports.getAggregateRubric = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { projectId, artifactType } = req.params;
    
    // Validate artifact type
    const validTypes = Object.keys(criteriaFieldsMap);
    if (!validTypes.includes(artifactType)) {
      return res.status(400).json({ error: 'Invalid artifact type' });
    }

    // Validate project access
    await validateProjectAccess(user._id, projectId, user.role);
    
    const aggregateRubric = await AggregateRubric.findOne({
      project: projectId,
      artifactType
    });
    
    if (!aggregateRubric) {
      return res.json({
        criteriaAverages: {},
        overallScore: 0,
        reviewCount: 0
      });
    }
    
    // Convert Map to plain object for JSON serialization
    const criteriaAverages = {};
    aggregateRubric.criteriaAverages.forEach((value, key) => {
      criteriaAverages[key] = value;
    });
    
    return res.json({
      criteriaAverages,
      overallScore: aggregateRubric.overallScore,
      reviewCount: aggregateRubric.reviewCount,
      lastUpdated: aggregateRubric.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching aggregate rubric:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get rubric evaluation (personal preferences)
exports.getRubricEvaluation = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { projectId, artifactType } = req.params;
    
    // Validate artifact type
    const validTypes = Object.keys(criteriaFieldsMap);
    if (!validTypes.includes(artifactType)) {
      return res.status(400).json({ error: 'Invalid artifact type' });
    }

    // Validate project access
    await validateProjectAccess(user._id, projectId, user.role);
    
    const rubricEvaluation = await RubricEvaluation.findOne({
      project: projectId,
      rubricType: artifactType,
      evaluator: user._id
    });
    
    if (!rubricEvaluation) {
      return res.json({
        criteria: [],
        overallScore: 0
      });
    }
    
    return res.json({
      evaluation: rubricEvaluation
    });
  } catch (error) {
    console.error('Error fetching rubric evaluation:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Save rubric evaluation
exports.saveRubricEvaluation = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { rubricType, criteria, project: projectId } = req.body;
    
    // Validate rubric type
    const validTypes = Object.keys(criteriaFieldsMap);
    if (!validTypes.includes(rubricType)) {
      return res.status(400).json({ error: 'Invalid rubric type' });
    }

    // Validate project access
    await validateProjectAccess(user._id, projectId, user.role);
    
    let rubricEvaluation = await RubricEvaluation.findOne({
      project: projectId,
      rubricType,
      evaluator: user._id
    });
    
    if (rubricEvaluation) {
      rubricEvaluation.criteria = criteria;
      
      // Calculate overall score
      const validScores = criteria.filter(c => c.score !== undefined && c.score !== null);
      const overallScore = validScores.length > 0 
        ? validScores.reduce((sum, c) => sum + c.score, 0) / validScores.length 
        : 0;
      
      rubricEvaluation.overallScore = overallScore;
    } else {
      // Calculate overall score
      const validScores = criteria.filter(c => c.score !== undefined && c.score !== null);
      const overallScore = validScores.length > 0 
        ? validScores.reduce((sum, c) => sum + c.score, 0) / validScores.length 
        : 0;
      
      rubricEvaluation = new RubricEvaluation({
        rubricType,
        criteria,
        overallScore,
        project: projectId,
        evaluator: user._id
      });
    }
    
    await rubricEvaluation.save();
    
    res.status(201).json({ evaluation: rubricEvaluation });
  } catch (error) {
    console.error('Error saving rubric evaluation:', error);
    return res.status(500).json({ error: error.message });
  }
};