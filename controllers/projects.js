// controllers/projects.js
const Project = require('../models/project');
const projectStatsService = require('../services/project-stats');
const User = require('../models/user');

// Get projects for current user
exports.getProjects = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.auth || !req.auth.isAuthenticated || !req.auth.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find user and populate projects
    const user = await User.findById(req.auth.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.populate('projects');
    res.json({ projects: user.projects || [] });
  } catch (error) {
    console.error('Get projects error:', error);
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

    const project = await Project.findOne({
      _id: req.params.id,
      users: { $in: [user._id] }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stats = await projectStatsService.getProjectStats(project._id);
    res.json({ project, stats });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      users: [req.user._id],
      creatorId: req.user.id
    });

    await project.save();

    // Add project to user's projects
    req.user.projects.push(project._id);
    await req.user.save();

    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      users: { $in: [req.user._id] }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'tags', 'motto'];
    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        project[update] = req.body[update];
      }
    });

    await project.save();

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      creatorId: req.user.id // Only creator can delete
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }

    // Remove project from user's projects
    req.user.projects = req.user.projects.filter(
      projectId => projectId.toString() !== req.params.id
    );
    await req.user.save();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Invite user to project
exports.inviteUser = async (req, res) => {
  try {
    const { email, projectId } = req.body;

    // Find project
    const project = await Project.findOne({
      _id: projectId,
      creatorId: req.user.id // Only creator can invite
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }

    // Check if user is already invited
    if (project.invitedUsers.includes(email.toLowerCase())) {
      return res.status(400).json({ error: 'User already invited' });
    }

    // Add to invited users
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