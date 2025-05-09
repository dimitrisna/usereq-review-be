// controllers/mockups.js
const Mockup = require('../models/mockup');
const Project = require('../models/project');
const User = require('../models/user');

// Get all mockups for a project
exports.getMockupsForProject = async (req, res) => {
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

        const mockups = await Mockup.find({ project: projectId }).sort({ seq: 1 });
        res.json({ mockups });
    } catch (error) {
        console.error('Get mockups error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Get a single mockup
exports.getMockup = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const mockup = await Mockup.findById(req.params.id)
            .populate('storiesLinked', 'title')
            .populate('previousScreens', 'title')
            .populate('nextScreens', 'title');

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        const project = await Project.findOne({
            _id: mockup.project,
            users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to access this mockup' });
        }

        res.json({ mockup });
    } catch (error) {
        console.error('Get mockup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Create a new mockup
exports.createMockup = async (req, res) => {
    try {
        const {
            title, description, url, handle, filename, mimetype, size,
            projectId, storiesLinked, previousScreens, nextScreens
        } = req.body;

        // Validate project access
        const project = await Project.findOne({
            _id: projectId,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to access this project' });
        }

        // Create mockup
        const mockup = new Mockup({
            title,
            description,
            url,
            handle,
            filename,
            mimetype,
            size,
            project: projectId,
            storiesLinked,
            previousScreens,
            nextScreens
        });

        await mockup.save();

        // Add mockup to project
        project.mockups_ref.push(mockup._id);
        await project.save();

        res.status(201).json({ mockup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Update a mockup
exports.updateMockup = async (req, res) => {
    try {
        // Find mockup
        const mockup = await Mockup.findById(req.params.id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        // Validate project access
        const project = await Project.findOne({
            _id: mockup.project,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to update this mockup' });
        }

        // Update fields
        const allowedUpdates = [
            'title', 'description', 'storiesLinked', 'previousScreens', 'nextScreens'
        ];
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                mockup[update] = req.body[update];
            }
        });

        await mockup.save();

        res.json({ mockup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a mockup
exports.deleteMockup = async (req, res) => {
    try {
        // Find mockup
        const mockup = await Mockup.findById(req.params.id);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        // Validate project access
        const project = await Project.findOne({
            _id: mockup.project,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to delete this mockup' });
        }

        // Remove mockup from project
        project.mockups_ref = project.mockups_ref.filter(
            mockupId => mockupId.toString() !== req.params.id
        );
        await project.save();

        // Remove this mockup from other mockups' navigation
        await Mockup.updateMany(
            { previousScreens: mockup._id },
            { $pull: { previousScreens: mockup._id } }
        );

        await Mockup.updateMany(
            { nextScreens: mockup._id },
            { $pull: { nextScreens: mockup._id } }
        );

        // Delete mockup
        await Mockup.findByIdAndDelete(req.params.id);

        res.json({ message: 'Mockup deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Update mockup navigation
exports.updateNavigation = async (req, res) => {
    try {
        const { mockupId } = req.params;
        const { previousScreens, nextScreens } = req.body;

        // Find mockup
        const mockup = await Mockup.findById(mockupId);

        if (!mockup) {
            return res.status(404).json({ error: 'Mockup not found' });
        }

        // Validate project access
        const project = await Project.findOne({
            _id: mockup.project,
            users: { $in: [req.user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
            return res.status(403).json({ error: 'Not authorized to update this mockup' });
        }

        // Update navigation
        if (previousScreens !== undefined) {
            mockup.previousScreens = previousScreens;
        }

        if (nextScreens !== undefined) {
            mockup.nextScreens = nextScreens;
        }

        await mockup.save();

        res.json({ mockup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};