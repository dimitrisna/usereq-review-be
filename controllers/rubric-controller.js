// controllers/rubric-controller.js
const mongoose = require('mongoose');
const AggregateRubric = require('../models/aggregate-rubric');
const Project = require('../models/project');
const User = require('../models/user');
const RubricEvaluation = require('../models/rubric-evaluation');
const { reviewModelMap } = require('./reviews-controller');
const { SYSTEM_USER_ID } = require('../utilities/constants');

// Helper function to validate project access
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

// Define criteria fields for each artifact type
const criteriaFieldsMap = {
  'requirements': ['syntaxScore', 'categorizationScore', 'scopeDefinitionScore', 'quantificationScore'],
  'storys': ['storyFormatScore', 'featureCompletionScore', 'acceptanceCriteriaScore'],
  'activityDiagrams': ['umlSyntaxScore', 'scenarioComprehensiveScore', 'gherkinAlignmentScore'],
  'useCaseDiagrams': ['umlSyntaxScore', 'useCasePackageScore', 'gherkinSpecificationScore'],
  'sequenceDiagrams': ['umlCorrectnessScore', 'messageFlowScore', 'completenessScore'],
  'classDiagrams': ['boundaryObjectsScore', 'controlObjectsScore', 'entityObjectsScore', 
                   'umlNotationScore', 'architecturalDesignScore'],
  'designPatterns': ['patternSelectionScore', 'implementationScore', 'flexibilityScore', 'complexityScore', 'documentationScore'],
  'mockups': ['uiUxDesignScore', 'consistencyScore', 'flowScore', 'completenessScore', 'userFriendlinessScore']
};

exports.updateAggregateRubric = async (projectId, artifactType) => {
  try {    
    // Validate artifact type
    if (!criteriaFieldsMap[artifactType]) {
      throw new Error(`Invalid artifact type: ${artifactType}`);
    }
    
    // Get the review model for this artifact type
    const singularType = artifactType.endsWith('s') ? artifactType.slice(0, -1) : artifactType;
    
    const entry = reviewModelMap[singularType];
    if (!entry) {
      throw new Error(`No review model found for artifact type: ${singularType}`);
    }
    
    const { model: ReviewModel } = entry;
    const criteriaFields = criteriaFieldsMap[artifactType];
    
    // Find all reviews for this artifact type in the project
    const reviews = await ReviewModel.find({ 
      project: projectId,
      reviewer: new mongoose.Types.ObjectId(SYSTEM_USER_ID)
    });
    
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
    
    // Initialize variables for aggregate calculation
    const criteriaAverages = new Map();
    let totalScore = 0;
    let criteriaCount = 0;
    
    // Special handling for requirements to properly handle quantificationScore
    if (artifactType === 'requirements') {
      // Get requirement types to identify which are non-functional
      const ProjectRequirement = require('../models/project-requirement');
      const requirementIds = reviews.map(r => r.requirement);
      
      const requirements = await ProjectRequirement.find({ 
        _id: { $in: requirementIds } 
      });
      
      // Create a map of requirement ID to type
      const requirementTypeMap = new Map();
      requirements.forEach(req => {
        requirementTypeMap.set(req._id.toString(), (req.type || '').toLowerCase());
      });
      
      // Process each criteria field
      for (const field of criteriaFields) {
        if (field === 'quantificationScore') {
          // For quantificationScore, only include non-functional requirements
          const nonFunctionalReviews = reviews.filter(r => {
            const reqId = r.requirement.toString();
            const reqType = requirementTypeMap.get(reqId);
            return r[field] !== undefined && 
                   r[field] !== null && 
                   reqType === 'nonfunctional';
          });
          
          if (nonFunctionalReviews.length > 0) {
            const sum = nonFunctionalReviews.reduce((acc, r) => acc + r[field], 0);
            const avg = sum / nonFunctionalReviews.length;
            criteriaAverages.set(field, avg);
            totalScore += avg;
            criteriaCount++;
          } else {
            criteriaAverages.set(field, 0);
          }
                  } else {
          // Standard processing for other criteria (apply to all requirements)
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
                  }
      }
    } else {
      // Standard processing for other artifact types
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
    }
    
    // Calculate overall score
    const overallScore = criteriaCount > 0 ? totalScore / criteriaCount : 0;
    
    // Fix artifact type spelling issue
    if (artifactType === 'storys') {
      artifactType = 'stories';
    }
    
    // Update the aggregate record in the database
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
    
    // Return the updated aggregate data
    return {
      criteriaAverages: Object.fromEntries(criteriaAverages),
      overallScore,
      reviewCount: reviews.length
    };
  } catch (error) {
    console.error(`[RubricController] Error updating aggregate rubric for ${artifactType}:`, error);
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

    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, projectId);
    
    const aggregateRubric = await AggregateRubric.findOne({
      project: projectId,
      artifactType
    });
    
    if (!aggregateRubric) {
      return res.json({
        criteriaAverages: {},
        overallScore: 0,
        reviewCount: 0,
        isEditable: user.role === 'Admin' // Only admins can edit
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
      lastUpdated: aggregateRubric.lastUpdated,
      isEditable: user.role === 'Admin' // Only admins can edit
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

    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, projectId);
    
    const rubricEvaluation = await RubricEvaluation.findOne({
      project: projectId,
      rubricType: artifactType,
      evaluator: user._id
    });
    
    if (!rubricEvaluation) {
      return res.json({
        criteria: [],
        overallScore: 0,
        isEditable: user.role === 'Admin' // Only admins can edit
      });
    }
    
    // Add isEditable flag
    const evaluationResponse = rubricEvaluation.toObject();
    evaluationResponse.isEditable = user.role === 'Admin'; // Only admins can edit
    
    return res.json({
      evaluation: evaluationResponse
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
    
    // Only admins can save rubric evaluations
    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only administrators can create or edit evaluations' });
    }

    const { rubricType, criteria, project: projectId } = req.body;
    
    // Validate rubric type
    const validTypes = Object.keys(criteriaFieldsMap);
    if (!validTypes.includes(rubricType)) {
      return res.status(400).json({ error: 'Invalid rubric type' });
    }

    // This function will handle admin vs regular user access differently
    await validateProjectAccess(user, projectId);
    
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
    
    // Add isEditable flag
    const evaluationResponse = rubricEvaluation.toObject();
    evaluationResponse.isEditable = user.role === 'Admin'; // Only admins can edit
    
    res.status(201).json({ 
      evaluation: evaluationResponse
    });
  } catch (error) {
    console.error('Error saving rubric evaluation:', error);
    return res.status(500).json({ error: error.message });
  }
};