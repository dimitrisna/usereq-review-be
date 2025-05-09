// controllers/stories.js
const ProjectStory = require('../models/project-story');
const Project = require('../models/project');
const User = require('../models/user');

// Get all stories for a project
exports.getStoriesForProject = async (req, res) => {
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

        const stories = await ProjectStory.find({ project: projectId }).sort({ seq: 1 });
        res.json({ stories });
    } catch (error) {
        console.error('Get stories error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Get a single story
exports.getStory = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const story = await ProjectStory.findById(req.params.id)
            .populate('requirementsLinked', 'text seq');

        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        const project = await Project.findOne({
            _id: story.project,
            users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to access this story' });
        }

        res.json({ story });
    } catch (error) {
        console.error('Get story error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Create a new story
exports.createStory = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { title, text, requirementsLinked, projectId } = req.body;

        const project = await Project.findOne({
            _id: projectId,
            users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to access this project' });
        }

        const story = new ProjectStory({
            title,
            text,
            requirementsLinked,
            project: projectId
        });

        await story.save();

        project.stories.push(story._id);
        await project.save();

        res.status(201).json({ story });
    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Update a story
exports.updateStory = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const story = await ProjectStory.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        const project = await Project.findOne({
            _id: story.project,
            users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to update this story' });
        }

        const allowedUpdates = ['title', 'text', 'requirementsLinked'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                story[field] = req.body[field];
            }
        });

        await story.save();
        res.json({ story });
    } catch (error) {
        console.error('Update story error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete a story
exports.deleteStory = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const story = await ProjectStory.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        const project = await Project.findOne({
            _id: story.project,
            users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to delete this story' });
        }

        project.stories = project.stories.filter(
            storyId => storyId.toString() !== req.params.id
        );
        await project.save();

        await ProjectStory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
