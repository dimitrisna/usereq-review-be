const Project = require('../../models/project');
const User = require('../../models/user');

// Factory function to create diagram controllers for a specific diagram type
const createDiagramController = (DiagramModel, projectField) => {
  return {
    // Get all diagrams for a project
    getDiagramsForProject: async (req, res) => {
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

        const diagrams = await DiagramModel.find({ project: projectId }).sort({ seq: 1 });

        res.json({ diagrams });
      } catch (error) {
        console.error('Get diagrams error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // Get a single diagram
    getDiagram: async (req, res) => {
      try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const diagram = await DiagramModel.findById(req.params.id);
        if (!diagram) return res.status(404).json({ error: 'Diagram not found' });

        const project = await Project.findOne({
          _id: diagram.project,
          users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
          return res.status(403).json({ error: 'Not authorized to access this diagram' });
        }

        res.json({ diagram });
      } catch (error) {
        console.error('Get diagram error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // Create a new diagram
    createDiagram: async (req, res) => {
      try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { title, description, url, handle, filename, mimetype, size, projectId, linkedItems } = req.body;

        const project = await Project.findOne({
          _id: projectId,
          users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
          return res.status(403).json({ error: 'Not authorized to access this project' });
        }

        const diagramData = {
          title,
          description,
          url,
          handle,
          filename,
          mimetype,
          size,
          project: projectId
        };

        // Add linked items if they exist
        if (linkedItems) {
          if (DiagramModel.schema.path('requirementsLinked')) {
            diagramData.requirementsLinked = linkedItems.requirements || [];
          }
          if (DiagramModel.schema.path('storiesLinked')) {
            diagramData.storiesLinked = linkedItems.stories || [];
          }
          if (DiagramModel.schema.path('classDiagramsLinked')) {
            diagramData.classDiagramsLinked = linkedItems.classDiagrams || [];
          }
        }

        const diagram = new DiagramModel(diagramData);
        await diagram.save();

        project[projectField].push(diagram._id);
        await project.save();

        res.status(201).json({ diagram });
      } catch (error) {
        console.error('Create diagram error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // Update a diagram
    updateDiagram: async (req, res) => {
      try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const diagram = await DiagramModel.findById(req.params.id);
        if (!diagram) return res.status(404).json({ error: 'Diagram not found' });

        const project = await Project.findOne({
          _id: diagram.project,
          users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
          return res.status(403).json({ error: 'Not authorized to update this diagram' });
        }

        const allowedUpdates = ['title', 'description'];
        allowedUpdates.forEach(update => {
          if (req.body[update] !== undefined) {
            diagram[update] = req.body[update];
          }
        });

        if (req.body.linkedItems) {
          if (DiagramModel.schema.path('requirementsLinked') && req.body.linkedItems.requirements) {
            diagram.requirementsLinked = req.body.linkedItems.requirements;
          }
          if (DiagramModel.schema.path('storiesLinked') && req.body.linkedItems.stories) {
            diagram.storiesLinked = req.body.linkedItems.stories;
          }
          if (DiagramModel.schema.path('classDiagramsLinked') && req.body.linkedItems.classDiagrams) {
            diagram.classDiagramsLinked = req.body.linkedItems.classDiagrams;
          }
        }

        await diagram.save();
        res.json({ diagram });
      } catch (error) {
        console.error('Update diagram error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // Delete a diagram
    deleteDiagram: async (req, res) => {
      try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const diagram = await DiagramModel.findById(req.params.id);
        if (!diagram) return res.status(404).json({ error: 'Diagram not found' });

        const project = await Project.findOne({
          _id: diagram.project,
          users: { $in: [user._id] }
        });

        if (!project && (user.role !== 'Admin')) {
          return res.status(403).json({ error: 'Not authorized to delete this diagram' });
        }

        project[projectField] = project[projectField].filter(
          diagramId => diagramId.toString() !== req.params.id
        );
        await project.save();

        await DiagramModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Diagram deleted successfully' });
      } catch (error) {
        console.error('Delete diagram error:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  };
};

module.exports = createDiagramController;
