// controllers/projects.js
const mongoose = require('mongoose');
const Project = require('../models/project');
const projectStatsService = require('../services/project-stats');
const User = require('../models/user');
// Add these imports at the top of controllers/projects.js
const ProjectRequirement = require('../models/project-requirement');
const ProjectStory = require('../models/project-story');
const ActivityDiagram = require('../models/activity-diagram');
const ClassDiagram = require('../models/class-diagram');
const SequenceDiagram = require('../models/sequence-diagram');
const UseCaseDiagram = require('../models/use-case-diagram');
const DesignPattern = require('../models/design-pattern');
const Mockup = require('../models/mockup');
const { SYSTEM_USER_ID } = require('../utilities/constants');

// Import review models
const RequirementReview = require('../models/requirement-review');
const StoryReview = require('../models/story-review');
const ActivityDiagramReview = require('../models/activity-diagram-review');
const UseCaseDiagramReview = require('../models/use-case-diagram-review');
const SequenceDiagramReview = require('../models/sequence-diagram-review');
const ClassDiagramReview = require('../models/class-diagram-review');
const DesignPatternReview = require('../models/design-pattern-review');
const MockupReview = require('../models/mockup-review');
const {
  initStatsMap,
  updateStats,
  updateReviewStats,
  updateRatingStats,
  computeOverallStats
} = require('../services/project-stats');

// Get projects for current user
exports.getProjects = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let projects;

    // Admin sees all projects
    if (user.role === 'Admin') {
      projects = await Project.find();
    } else {
      // Regular users only see projects they're part of
      await user.populate('projects');
      projects = user.projects || [];
    }

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectsStats = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || 'createdAt';
    const sortDirection = req.query.sortDirection === 'descending' ? -1 : 1;
    const search = req.query.search || '';
    const sort = {};

    if (['name', 'description', 'createdAt'].includes(sortField)) {
      sort[sortField] = sortDirection;
    }

    let projectQuery = {};
    if (user.role !== 'Admin') {
      projectQuery = { users: { $in: [user._id] } };
    }

    if (search) {
      projectQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await Project.countDocuments(projectQuery);

    const projects = await Project.find(projectQuery, {
      name: 1,
      description: 1,
      createdAt: 1,
      tags: 1,
      motto: 1,
      creatorId: 1
    })
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const projectIds = projects.map(p => p._id);
    if (projectIds.length === 0) {
      return res.json({
        projects: [],
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      });
    }

    const systemUserId = new mongoose.Types.ObjectId(SYSTEM_USER_ID);
    const statsMap = initStatsMap(projectIds);

    // === Aggregation logic ===

    // Artifact counts
    const artifactCountAgg = (Model, key) =>
      Model.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$project', total: { $sum: 1 } } }
      ]).then(res => updateStats(res, key, statsMap));

    await Promise.all([
      artifactCountAgg(ProjectRequirement, 'requirements'),
      artifactCountAgg(ProjectStory, 'stories'),
      artifactCountAgg(ActivityDiagram, 'activityDiagrams'),
      artifactCountAgg(UseCaseDiagram, 'useCaseDiagrams'),
      artifactCountAgg(SequenceDiagram, 'sequenceDiagrams'),
      artifactCountAgg(ClassDiagram, 'classDiagrams'),
      artifactCountAgg(DesignPattern, 'designPatterns'),
      artifactCountAgg(Mockup, 'mockups')
    ]);

    // Review counts
    const reviewCountAgg = (Model, key, field) =>
      Model.aggregate([
        { $match: { project: { $in: projectIds }, reviewer: systemUserId } },
        { $group: { _id: { project: '$project', item: `$${field}` } } },
        { $group: { _id: '$_id.project', reviewed: { $sum: 1 } } }
      ]).then(res => updateReviewStats(res, key, statsMap));

    await Promise.all([
      reviewCountAgg(RequirementReview, 'requirements', 'requirement'),
      reviewCountAgg(StoryReview, 'stories', 'story'),
      reviewCountAgg(ActivityDiagramReview, 'activityDiagrams', 'activityDiagram'),
      reviewCountAgg(UseCaseDiagramReview, 'useCaseDiagrams', 'useCaseDiagram'),
      reviewCountAgg(SequenceDiagramReview, 'sequenceDiagrams', 'sequenceDiagram'),
      reviewCountAgg(ClassDiagramReview, 'classDiagrams', 'classDiagram'),
      reviewCountAgg(DesignPatternReview, 'designPatterns', 'designPattern'),
      reviewCountAgg(MockupReview, 'mockups', 'mockup')
    ]);

    // Rating averages
    const ratingAgg = (Model, key) =>
      Model.aggregate([
        { $match: { project: { $in: projectIds }, reviewer: systemUserId } },
        { $group: { _id: '$project', averageRating: { $avg: '$rating' } } }
      ]).then(res => updateRatingStats(res, key, statsMap));

    await Promise.all([
      ratingAgg(RequirementReview, 'requirements'),
      ratingAgg(StoryReview, 'stories'),
      ratingAgg(ActivityDiagramReview, 'activityDiagrams'),
      ratingAgg(UseCaseDiagramReview, 'useCaseDiagrams'),
      ratingAgg(SequenceDiagramReview, 'sequenceDiagrams'),
      ratingAgg(ClassDiagramReview, 'classDiagrams'),
      ratingAgg(DesignPatternReview, 'designPatterns'),
      ratingAgg(MockupReview, 'mockups')
    ]);

    // === Build response ===

    let projectsStats = projects.map(project => {
      const projectId = project._id.toString();
      const stats = statsMap[projectId];
      const {
        totalArtifacts,
        totalReviews,
        overallAverageGrade
      } = computeOverallStats(stats);

      return {
        id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        stats,
        totalArtifacts,
        totalReviews,
        overallAverageGrade,
        tags: project.tags || [],
        motto: project.motto || '',
        creatorId: project.creatorId
      };
    });

    // Sort by computed field if required
    if (sortField === 'overallAverageGrade') {
      projectsStats.sort((a, b) => {
        const valueA = a.overallAverageGrade || 0;
        const valueB = b.overallAverageGrade || 0;
        return (valueA - valueB) * sortDirection;
      });
    }

    res.json({
      projects: projectsStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get projects stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Get project by ID with statistics
exports.getProject = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let project;
    // Admin can access any project
    if (user.role === 'Admin') {
      project = await Project.findById(req.params.id);
    } else {
      // Regular users can only access projects they're part of
      project = await Project.findOne({
        _id: req.params.id,
        users: { $in: [user._id] }
      });
    }
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stats = await projectStatsService.getProjectStats(project._id);

    // Add isEditable flag
    const projectData = project.toObject();
    projectData.isEditable = user.role === 'Admin' || project.creatorId.toString() === user._id.toString();

    res.json({
      project: projectData,
      stats
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectStats = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { projectId } = req.params;
    const systemUserId = new mongoose.Types.ObjectId(SYSTEM_USER_ID);

    // Access control
    let projectQuery = { _id: projectId };
    if (user.role !== 'Admin') {
      projectQuery.users = { $in: [user._id] };
    }

    const project = await Project.findOne(projectQuery);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }

    // Initialize statsMap using same format
    const statsMap = initStatsMap([projectId]);
    const stats = statsMap[projectId];

    const [
      // Artifact counts
      requirementsCount,
      storiesCount,
      activityDiagramsCount,
      useCaseDiagramsCount,
      sequenceDiagramsCount,
      classDiagramsCount,
      designPatternsCount,
      mockupsCount,

      // Review counts
      requirementReviewCount,
      storyReviewCount,
      activityDiagramReviewCount,
      useCaseDiagramReviewCount,
      sequenceDiagramReviewCount,
      classDiagramReviewCount,
      designPatternReviewCount,
      mockupReviewCount,

      // Ratings
      requirementRating,
      storyRating,
      activityDiagramRating,
      useCaseDiagramRating,
      sequenceDiagramRating,
      classDiagramRating,
      designPatternRating,
      mockupRating
    ] = await Promise.all([
      ProjectRequirement.countDocuments({ project: projectId }),
      ProjectStory.countDocuments({ project: projectId }),
      ActivityDiagram.countDocuments({ project: projectId }),
      UseCaseDiagram.countDocuments({ project: projectId }),
      SequenceDiagram.countDocuments({ project: projectId }),
      ClassDiagram.countDocuments({ project: projectId }),
      DesignPattern.countDocuments({ project: projectId }),
      Mockup.countDocuments({ project: projectId }),

      RequirementReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$requirement" } },
        { $count: "reviewed" }
      ]),
      StoryReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$story" } },
        { $count: "reviewed" }
      ]),
      ActivityDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$activityDiagram" } },
        { $count: "reviewed" }
      ]),
      UseCaseDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$useCaseDiagram" } },
        { $count: "reviewed" }
      ]),
      SequenceDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$sequenceDiagram" } },
        { $count: "reviewed" }
      ]),
      ClassDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$classDiagram" } },
        { $count: "reviewed" }
      ]),
      DesignPatternReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$designPattern" } },
        { $count: "reviewed" }
      ]),
      MockupReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: "$mockup" } },
        { $count: "reviewed" }
      ]),

      // Average ratings
      RequirementReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      StoryReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      ActivityDiagramReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      UseCaseDiagramReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      SequenceDiagramReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      ClassDiagramReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      DesignPatternReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }]),
      MockupReview.aggregate([{ $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } }, { $group: { _id: null, averageRating: { $avg: "$rating" } } }])
    ]);

    // Set totals
    stats.requirements.total = requirementsCount;
    stats.stories.total = storiesCount;
    stats.activityDiagrams.total = activityDiagramsCount;
    stats.useCaseDiagrams.total = useCaseDiagramsCount;
    stats.sequenceDiagrams.total = sequenceDiagramsCount;
    stats.classDiagrams.total = classDiagramsCount;
    stats.designPatterns.total = designPatternsCount;
    stats.mockups.total = mockupsCount;

    // Set reviewed counts
    stats.requirements.reviewed = requirementReviewCount[0]?.reviewed || 0;
    stats.stories.reviewed = storyReviewCount[0]?.reviewed || 0;
    stats.activityDiagrams.reviewed = activityDiagramReviewCount[0]?.reviewed || 0;
    stats.useCaseDiagrams.reviewed = useCaseDiagramReviewCount[0]?.reviewed || 0;
    stats.sequenceDiagrams.reviewed = sequenceDiagramReviewCount[0]?.reviewed || 0;
    stats.classDiagrams.reviewed = classDiagramReviewCount[0]?.reviewed || 0;
    stats.designPatterns.reviewed = designPatternReviewCount[0]?.reviewed || 0;
    stats.mockups.reviewed = mockupReviewCount[0]?.reviewed || 0;

    // Set ratings
    stats.requirements.averageRating = parseFloat((requirementRating[0]?.averageRating || 0).toFixed(2));
    stats.stories.averageRating = parseFloat((storyRating[0]?.averageRating || 0).toFixed(2));
    stats.activityDiagrams.averageRating = parseFloat((activityDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.useCaseDiagrams.averageRating = parseFloat((useCaseDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.sequenceDiagrams.averageRating = parseFloat((sequenceDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.classDiagrams.averageRating = parseFloat((classDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.designPatterns.averageRating = parseFloat((designPatternRating[0]?.averageRating || 0).toFixed(2));
    stats.mockups.averageRating = parseFloat((mockupRating[0]?.averageRating || 0).toFixed(2));
    // Compute global stats
    const {
      totalArtifacts,
      totalReviews,
      overallAverageGrade,
      completionPercentage
    } = computeOverallStats(stats);
    res.json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        tags: project.tags || [],
        motto: project.motto || '',
        creatorId: project.creatorId
      },
      stats,
      totalArtifacts,
      totalReviews,
      overallAverageGrade,
      completionPercentage
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const project = new Project({
      ...req.body,
      users: [user._id],
      creatorId: user._id
    });

    await project.save();

    // Add project to user's projects
    if (user.projects) {
      user.projects.push(project._id);
    } else {
      user.projects = [project._id];
    }
    await user.save();

    // Add isEditable flag
    const projectData = project.toObject();
    projectData.isEditable = true; // Creator can always edit their new project

    res.status(201).json({ project: projectData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectStats = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const systemUserId = new mongoose.Types.ObjectId(SYSTEM_USER_ID);
    const { projectId } = req.params;

    // Check if user has access to this project
    let projectQuery = { _id: projectId };
    if (user.role !== 'Admin') {
      projectQuery.users = { $in: [user._id] };
    }

    const project = await Project.findOne(projectQuery);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }

    // Prepare base stats object
    const stats = {
      requirements: { total: 0, reviewed: 0, averageRating: 0 },
      stories: { total: 0, reviewed: 0, averageRating: 0 },
      activityDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      useCaseDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      sequenceDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      classDiagrams: { total: 0, reviewed: 0, averageRating: 0 },
      designPatterns: { total: 0, reviewed: 0, averageRating: 0 },
      mockups: { total: 0, reviewed: 0, averageRating: 0 }
    };

    // Run all aggregations in parallel for better performance
    const [
      // Artifact counts
      requirementsCount,
      storiesCount,
      activityDiagramsCount,
      useCaseDiagramsCount,
      sequenceDiagramsCount,
      classDiagramsCount,
      designPatternsCount,
      mockupsCount,

      // Review counts
      requirementReviewsCount,
      storyReviewsCount,
      activityDiagramReviewsCount,
      useCaseDiagramReviewsCount,
      sequenceDiagramReviewsCount,
      classDiagramReviewsCount,
      designPatternReviewsCount,
      mockupReviewsCount,

      // Average ratings
      requirementRating,
      storyRating,
      activityDiagramRating,
      useCaseDiagramRating,
      sequenceDiagramRating,
      classDiagramRating,
      designPatternRating,
      mockupRating
    ] = await Promise.all([
      // Count artifacts
      ProjectRequirement.countDocuments({ project: projectId }),
      ProjectStory.countDocuments({ project: projectId }),
      ActivityDiagram.countDocuments({ project: projectId }),
      UseCaseDiagram.countDocuments({ project: projectId }),
      SequenceDiagram.countDocuments({ project: projectId }),
      ClassDiagram.countDocuments({ project: projectId }),
      DesignPattern.countDocuments({ project: projectId }),
      Mockup.countDocuments({ project: projectId }),

      // Count reviews by system user
      RequirementReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { requirement: "$requirement" } } },
        { $count: "reviewed" }
      ]),
      StoryReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { story: "$story" } } },
        { $count: "reviewed" }
      ]),
      ActivityDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { diagram: "$activityDiagram" } } },
        { $count: "reviewed" }
      ]),
      UseCaseDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { diagram: "$useCaseDiagram" } } },
        { $count: "reviewed" }
      ]),
      SequenceDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { diagram: "$sequenceDiagram" } } },
        { $count: "reviewed" }
      ]),
      ClassDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { diagram: "$classDiagram" } } },
        { $count: "reviewed" }
      ]),
      DesignPatternReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { pattern: "$designPattern" } } },
        { $count: "reviewed" }
      ]),
      MockupReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: { mockup: "$mockup" } } },
        { $count: "reviewed" }
      ]),

      // Get average ratings for each artifact type
      RequirementReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      StoryReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      ActivityDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      UseCaseDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      SequenceDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      ClassDiagramReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      DesignPatternReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ]),
      MockupReview.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId), reviewer: systemUserId } },
        { $group: { _id: null, averageRating: { $avg: "$rating" } } }
      ])
    ]);

    // Update stats object with counts
    stats.requirements.total = requirementsCount;
    stats.stories.total = storiesCount;
    stats.activityDiagrams.total = activityDiagramsCount;
    stats.useCaseDiagrams.total = useCaseDiagramsCount;
    stats.sequenceDiagrams.total = sequenceDiagramsCount;
    stats.classDiagrams.total = classDiagramsCount;
    stats.designPatterns.total = designPatternsCount;
    stats.mockups.total = mockupsCount;

    // Update review counts (handle empty array case)
    stats.requirements.reviewed = requirementReviewsCount[0]?.reviewed || 0;
    stats.stories.reviewed = storyReviewsCount[0]?.reviewed || 0;
    stats.activityDiagrams.reviewed = activityDiagramReviewsCount[0]?.reviewed || 0;
    stats.useCaseDiagrams.reviewed = useCaseDiagramReviewsCount[0]?.reviewed || 0;
    stats.sequenceDiagrams.reviewed = sequenceDiagramReviewsCount[0]?.reviewed || 0;
    stats.classDiagrams.reviewed = classDiagramReviewsCount[0]?.reviewed || 0;
    stats.designPatterns.reviewed = designPatternReviewsCount[0]?.reviewed || 0;
    stats.mockups.reviewed = mockupReviewsCount[0]?.reviewed || 0;

    // Update average ratings (handle empty array case)
    stats.requirements.averageRating = parseFloat((requirementRating[0]?.averageRating || 0).toFixed(2));
    stats.stories.averageRating = parseFloat((storyRating[0]?.averageRating || 0).toFixed(2));
    stats.activityDiagrams.averageRating = parseFloat((activityDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.useCaseDiagrams.averageRating = parseFloat((useCaseDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.sequenceDiagrams.averageRating = parseFloat((sequenceDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.classDiagrams.averageRating = parseFloat((classDiagramRating[0]?.averageRating || 0).toFixed(2));
    stats.designPatterns.averageRating = parseFloat((designPatternRating[0]?.averageRating || 0).toFixed(2));
    stats.mockups.averageRating = parseFloat((mockupRating[0]?.averageRating || 0).toFixed(2));

    // Calculate overall stats
    const totalArtifacts = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
    const totalReviews = Object.values(stats).reduce((sum, stat) => sum + stat.reviewed, 0);

    // Calculate overall average grade
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

    // Return project stats
    res.json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        tags: project.tags || [],
        motto: project.motto || '',
        creatorId: project.creatorId
      },
      stats,
      totalArtifacts,
      totalReviews,
      overallAverageGrade,
      completionPercentage: totalArtifacts > 0
        ? parseFloat(((totalReviews / totalArtifacts) * 100).toFixed(2))
        : 0
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let project;

    // Admin can update any project
    if (user.role === 'Admin') {
      project = await Project.findById(req.params.id);
    } else {
      // Regular users can only update projects they're part of and created
      project = await Project.findOne({
        _id: req.params.id,
        users: { $in: [user._id] },
        creatorId: user._id // Only creator can update
      });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found or you do not have permission to update it' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'tags', 'motto'];
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        project[update] = req.body[update];
      }
    });

    await project.save();

    // Add isEditable flag
    const projectData = project.toObject();
    projectData.isEditable = user.role === 'Admin' || project.creatorId.toString() === user._id.toString();

    res.json({ project: projectData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let project;

    // Admin can delete any project
    if (user.role === 'Admin') {
      project = await Project.findByIdAndDelete(req.params.id);
    } else {
      // Regular users can only delete projects they created
      project = await Project.findOneAndDelete({
        _id: req.params.id,
        creatorId: user._id // Only creator can delete
      });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found or you do not have permission to delete it' });
    }

    // Remove project from user's projects
    if (user.projects) {
      user.projects = user.projects.filter(
        projectId => projectId.toString() !== req.params.id
      );
      await user.save();
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Invite user to project
exports.inviteUser = async (req, res) => {
  try {
    if (!req.auth?.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.auth.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { email, projectId } = req.body;

    // Find project
    let project;

    // Admin can invite to any project
    if (user.role === 'Admin') {
      project = await Project.findById(projectId);
    } else {
      // Regular users can only invite to projects they created
      project = await Project.findOne({
        _id: projectId,
        creatorId: user._id // Only creator can invite
      });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found or you do not have permission to invite users' });
    }

    // Check if user is already invited
    if (project.invitedUsers && project.invitedUsers.includes(email.toLowerCase())) {
      return res.status(400).json({ error: 'User already invited' });
    }

    // Add to invited users
    if (!project.invitedUsers) {
      project.invitedUsers = [];
    }
    project.invitedUsers.push(email.toLowerCase());
    await project.save();

    // Create invitation record
    const InvitedUsersToProject = require('../models/invited-users-to-project');
    const invitation = new InvitedUsersToProject({
      projectId: project._id.toString(),
      userEmail: email.toLowerCase(),
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await invitation.save();

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};