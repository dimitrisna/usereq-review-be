// controllers/requirements.js
const ProjectRequirement = require('../models/project-requirement');
const Project = require('../models/project');
const User = require('../models/user');

// Get all requirements for a project
exports.getRequirementsForProject = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { projectId } = req.params;
        const project = await Project.findOne({
            _id: projectId,
            users: { $in: [user._id] }
        });
        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to access this project' });
        }

        const requirements = await ProjectRequirement.find({ project: projectId }).sort({ seq: 1 });
        res.json({ requirements });
    } catch (error) {
        console.error('Get requirements error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Get a single requirement
exports.getRequirement = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const requirement = await ProjectRequirement.findById(req.params.id);
        if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

        const project = await Project.findOne({
            _id: requirement.project,
            users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) return res.status(403).json({ error: 'Not authorized to access this requirement' });

        res.json({ requirement });
    } catch (error) {
        console.error('Get requirement error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Create a new requirement
exports.createRequirement = async (req, res) => {
    try {
        const { text, description, type, user_priority, system_priority, projectId } = req.body;

        // Validate project access
        const project = await Project.findOne({
            _id: projectId,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to access this project' });
        }

        // Create requirement
        const requirement = new ProjectRequirement({
            text,
            description,
            type,
            user_priority,
            system_priority,
            project: projectId
        });

        await requirement.save();

        // Add requirement to project
        project.requirements.push(requirement._id);
        await project.save();

        res.status(201).json({ requirement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Update a requirement
exports.updateRequirement = async (req, res) => {
    try {
        // Find requirement
        const requirement = await ProjectRequirement.findById(req.params.id);

        if (!requirement) {
            return res.status(404).json({ error: 'Requirement not found' });
        }

        // Validate project access
        const project = await Project.findOne({
            _id: requirement.project,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to update this requirement' });
        }

        // Update fields
        const allowedUpdates = ['text', 'description', 'type', 'user_priority', 'system_priority'];
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                requirement[update] = req.body[update];
            }
        });

        await requirement.save();

        res.json({ requirement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a requirement
exports.deleteRequirement = async (req, res) => {
    try {
        // Find requirement
        const requirement = await ProjectRequirement.findById(req.params.id);

        if (!requirement) {
            return res.status(404).json({ error: 'Requirement not found' });
        }

        // Validate project access
        const project = await Project.findOne({
            _id: requirement.project,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to delete this requirement' });
        }

        // Remove requirement from project
        project.requirements = project.requirements.filter(
            reqId => reqId.toString() !== req.params.id
        );
        await project.save();

        // Delete requirement
        await ProjectRequirement.findByIdAndDelete(req.params.id);

        res.json({ message: 'Requirement deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};