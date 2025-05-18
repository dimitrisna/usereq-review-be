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

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Determine which projects to query
    let projectQuery = {};
    if (user.role !== 'Admin') {
      projectQuery = { users: { $in: [user._id] } };
    }

    // Get total count for pagination metadata
    const totalCount = await Project.countDocuments(projectQuery);

    // Get paginated projects with basic info
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
    .sort({ createdAt: -1 }); // Sort by creation date, newest first

    // Get project IDs
    const projectIds = projects.map(p => p._id);
    
    // If no projects are found, return empty result with pagination info
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

    // Convert SYSTEM_USER_ID to ObjectId for comparison in aggregation
    const systemUserId = new mongoose.Types.ObjectId(SYSTEM_USER_ID);

    // Create a base stats object for each project
    const statsMap = projectIds.reduce((acc, projectId) => {
      acc[projectId.toString()] = {
        requirements: { total: 0, reviewed: 0 },
        stories: { total: 0, reviewed: 0 },
        activityDiagrams: { total: 0, reviewed: 0 },
        useCaseDiagrams: { total: 0, reviewed: 0 },
        sequenceDiagrams: { total: 0, reviewed: 0 },
        classDiagrams: { total: 0, reviewed: 0 },
        designPatterns: { total: 0, reviewed: 0 },
        mockups: { total: 0, reviewed: 0 }
      };
      return acc;
    }, {});

    // Run all aggregations in parallel for better performance
    const [
      requirementsCounts,
      storiesCounts,
      activityDiagramsCounts,
      useCaseDiagramsCounts,
      sequenceDiagramsCounts,
      classDiagramsCounts,
      designPatternsCounts,
      mockupsCounts,
      requirementReviewCounts,
      storyReviewCounts,
      activityDiagramReviewCounts,
      useCaseDiagramReviewCounts,
      sequenceDiagramReviewCounts,
      classDiagramReviewCounts,
      designPatternReviewCounts,
      mockupReviewCounts
    ] = await Promise.all([
      // Artifact counts
      ProjectRequirement.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      ProjectStory.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      ActivityDiagram.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      UseCaseDiagram.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      SequenceDiagram.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      ClassDiagram.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      DesignPattern.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),
      Mockup.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", total: { $sum: 1 } } }
      ]),

      // Review counts - only count reviews by the system user
      RequirementReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", requirement: "$requirement" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      StoryReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", story: "$story" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      ActivityDiagramReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", diagram: "$activityDiagram" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      UseCaseDiagramReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", diagram: "$useCaseDiagram" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      SequenceDiagramReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", diagram: "$sequenceDiagram" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      ClassDiagramReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", diagram: "$classDiagram" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      DesignPatternReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", pattern: "$designPattern" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ]),
      MockupReview.aggregate([
        { 
          $match: { 
            project: { $in: projectIds },
            reviewer: systemUserId
          } 
        },
        { $group: { _id: { project: "$project", mockup: "$mockup" } } },
        { $group: { _id: "$_id.project", reviewed: { $sum: 1 } } }
      ])
    ]);

    // Helper function to update the stats map
    const updateStats = (counts, projectKey, statKey) => {
      counts.forEach(item => {
        const projectId = item._id.toString();
        if (statsMap[projectId]) {
          statsMap[projectId][projectKey].total = item.total;
        }
      });
    };

    const updateReviewStats = (counts, projectKey) => {
      counts.forEach(item => {
        const projectId = item._id.toString();
        if (statsMap[projectId]) {
          statsMap[projectId][projectKey].reviewed = item.reviewed;
        }
      });
    };

    // Update totals
    updateStats(requirementsCounts, 'requirements', 'total');
    updateStats(storiesCounts, 'stories', 'total');
    updateStats(activityDiagramsCounts, 'activityDiagrams', 'total');
    updateStats(useCaseDiagramsCounts, 'useCaseDiagrams', 'total');
    updateStats(sequenceDiagramsCounts, 'sequenceDiagrams', 'total');
    updateStats(classDiagramsCounts, 'classDiagrams', 'total');
    updateStats(designPatternsCounts, 'designPatterns', 'total');
    updateStats(mockupsCounts, 'mockups', 'total');

    // Update review counts
    updateReviewStats(requirementReviewCounts, 'requirements');
    updateReviewStats(storyReviewCounts, 'stories');
    updateReviewStats(activityDiagramReviewCounts, 'activityDiagrams');
    updateReviewStats(useCaseDiagramReviewCounts, 'useCaseDiagrams');
    updateReviewStats(sequenceDiagramReviewCounts, 'sequenceDiagrams');
    updateReviewStats(classDiagramReviewCounts, 'classDiagrams');
    updateReviewStats(designPatternReviewCounts, 'designPatterns');
    updateReviewStats(mockupReviewCounts, 'mockups');

    // Construct the final response
    const projectsStats = projects.map(project => {
      const projectId = project._id.toString();
      const stats = statsMap[projectId];
      
      // Calculate totals
      const totalArtifacts = Object.values(stats).reduce(
        (sum, stat) => sum + (stat.total || 0), 0
      );
      
      const totalReviews = Object.values(stats).reduce(
        (sum, stat) => sum + (stat.reviewed || 0), 0
      );

      return {
        id: project._id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        stats,
        totalArtifacts,
        totalReviews,
        tags: project.tags || [],
        motto: project.motto || '',
        creatorId: project.creatorId
      };
    });

    // Return the response with pagination metadata
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
    console.log('Project data:', projectData);
    console.log('Project stats:', stats);
    res.json({
      project: projectData,
      stats
    });
  } catch (error) {
    console.error('Get project error:', error);
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