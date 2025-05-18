// services/project-stats.js
const mongoose = require('mongoose');
const Project = require('../models/project');
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
exports.initStatsMap = (projectIds) => {
  return projectIds.reduce((acc, projectId) => {
    acc[projectId.toString()] = {
      requirements: { total: 0, reviewed: 0, averageRating: 0 },
      stories: { total: 0, reviewed: 0, averageRating: 0 },
      activityDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      useCaseDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      sequenceDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      classDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      designPatterns: { total: 0, reviewed: 0, averageRating: 0 },
      mockups: { total: 0, reviewed: 0, averageRating: 0 }
    };
    return acc;
  }, {});
};

exports.updateStats = (counts, projectKey, statsMap) => {
  counts.forEach(item => {
    const projectId = item._id.toString();
    if (statsMap[projectId]) {
      statsMap[projectId][projectKey].total = item.total;
    }
  });
};

exports.updateReviewStats = (counts, projectKey, statsMap) => {
  counts.forEach(item => {
    const projectId = item._id.toString();
    if (statsMap[projectId]) {
      statsMap[projectId][projectKey].reviewed = item.reviewed;
    }
  });
};

exports.updateRatingStats = (ratings, projectKey, statsMap) => {
  ratings.forEach(item => {
    const projectId = item._id.toString();
    if (statsMap[projectId]) {
      statsMap[projectId][projectKey].averageRating = parseFloat(item.averageRating?.toFixed(2)) || 0;
    }
  });
};

exports.computeOverallStats = (stats) => {
  const totalArtifacts = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
  const totalReviews = Object.values(stats).reduce((sum, stat) => sum + stat.reviewed, 0);

  let totalRating = 0;
  let ratedArtifactsCount = 0;
  Object.values(stats).forEach(stat => {
    if (stat.averageRating > 0) {
      totalRating += stat.averageRating;
      ratedArtifactsCount++;
    }
  });

  const overallAverageGrade = ratedArtifactsCount > 0
    ? parseFloat((totalRating / ratedArtifactsCount).toFixed(2))
    : 0;

  const completionPercentage = totalArtifacts > 0
    ? parseFloat(((totalReviews / totalArtifacts) * 100).toFixed(2))
    : 0;

  return { totalArtifacts, totalReviews, overallAverageGrade, completionPercentage };
};

// Count unique artifacts that have been reviewed
async function getUniqueReviewedCount(ReviewModel, refField, artifactIds) {
  if (!artifactIds || artifactIds.length === 0) {
    return 0;
  }
  
  // Create the system user ObjectId
  const systemUserId = new mongoose.Types.ObjectId(SYSTEM_USER_ID);
  
  // Use aggregation to count unique artifacts that have been reviewed by the system user (admin reviews)
  const result = await ReviewModel.aggregate([
    { 
      $match: { 
        [refField]: { $in: artifactIds },
        reviewer: systemUserId // Only count reviews by system user
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