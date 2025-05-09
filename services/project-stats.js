// services/project-stats.js
const mongoose = require('mongoose');
const Project = require('../models/project');
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

// Get project review statistics
exports.getProjectStats = async (projectId) => {
  const project = await Project.findById(projectId);
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Get counts from each artifact collection
  const requirementsCount = project.requirements.length;
  const storiesCount = project.stories.length;
  const activityDiagramsCount = project.activityDiagrams.length;
  const useCaseDiagramsCount = project.useCaseDiagrams.length;
  const sequenceDiagramsCount = project.sequenceDiagrams.length; 
  const classDiagramsCount = project.classDiagrams.length;
  const designPatternsCount = project.designPatterns.length;
  const mockupsCount = project.mockups_ref.length;
  
  // Get unique reviewed counts by aggregating each review model
  const requirementsReviewed = await getUniqueReviewedCount(RequirementReview, 'requirement', project.requirements);
  const storiesReviewed = await getUniqueReviewedCount(StoryReview, 'story', project.stories);
  const activityDiagramsReviewed = await getUniqueReviewedCount(ActivityDiagramReview, 'activityDiagram', project.activityDiagrams);
  const useCaseDiagramsReviewed = await getUniqueReviewedCount(UseCaseDiagramReview, 'useCaseDiagram', project.useCaseDiagrams);
  const sequenceDiagramsReviewed = await getUniqueReviewedCount(SequenceDiagramReview, 'sequenceDiagram', project.sequenceDiagrams);
  const classDiagramsReviewed = await getUniqueReviewedCount(ClassDiagramReview, 'classDiagram', project.classDiagrams);
  const designPatternsReviewed = await getUniqueReviewedCount(DesignPatternReview, 'designPattern', project.designPatterns);
  const mockupsReviewed = await getUniqueReviewedCount(MockupReview, 'mockup', project.mockups_ref);
  
  // Return statistics
  return {
    requirements: {
      total: requirementsCount,
      reviewed: requirementsReviewed
    },
    stories: {
      total: storiesCount,
      reviewed: storiesReviewed
    },
    activityDiagrams: {
      total: activityDiagramsCount,
      reviewed: activityDiagramsReviewed
    },
    useCaseDiagrams: {
      total: useCaseDiagramsCount,
      reviewed: useCaseDiagramsReviewed
    },
    sequenceDiagrams: {
      total: sequenceDiagramsCount,
      reviewed: sequenceDiagramsReviewed
    },
    classDiagrams: {
      total: classDiagramsCount,
      reviewed: classDiagramsReviewed
    },
    designPatterns: {
      total: designPatternsCount,
      reviewed: designPatternsReviewed
    },
    mockups: {
      total: mockupsCount,
      reviewed: mockupsReviewed
    }
  };
};

// Count unique artifacts that have been reviewed
async function getUniqueReviewedCount(ReviewModel, refField, artifactIds) {
  if (!artifactIds || artifactIds.length === 0) {
    return 0;
  }
  
  // Use aggregation to count unique artifacts that have been reviewed
  const result = await ReviewModel.aggregate([
    { 
      $match: { 
        [refField]: { $in: artifactIds } 
      } 
    },
    {
      $group: {
        _id: `$${refField}`,
        count: { $sum: 1 }
      }
    },
    {
      $count: 'total'
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
}