// routes/diagrams/diagram-routes-factory.js
const express = require('express');
const { auth } = require('../../middlewares/auth');
/**
 * @swagger
 * components:
 *   parameters:
 *     projectIdParam:
 *       name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
 *     diagramIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Diagram ID
 */

/**
 * Factory function that creates routes for diagram types
 */
// Factory function to create diagram routes
const createDiagramRoutes = (controller) => {
  const router = express.Router();

  // Get all diagrams for a project
  router.get('/project/:projectId', auth, controller.getDiagramsForProject);

  // Get a single diagram
  router.get('/:id', auth, controller.getDiagram);

  // Create a new diagram
  router.post('/', auth, controller.createDiagram);

  // Update a diagram
  router.put('/:id', auth, controller.updateDiagram);

  // Delete a diagram
  router.delete('/:id', auth, controller.deleteDiagram);

  return router;
};

module.exports = createDiagramRoutes;