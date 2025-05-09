// routes/use-case-diagrams.js

// routes/use-case-diagrams.js

/**
 * @swagger
 * components:
 *   parameters:
 *     useCaseDiagramProjectIdParam:
 *       name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
 *     useCaseDiagramIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Use Case Diagram ID
 */

/**
 * @swagger
 * tags:
 *   name: Use Case Diagrams
 *   description: Use case diagrams management
 */

/**
 * @swagger
 * /api/use-case-diagrams/project/{projectId}:
 *   get:
 *     summary: Get all use case diagrams for a project
 *     tags: [Use Case Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/useCaseDiagramProjectIdParam'
 *     responses:
 *       200:
 *         description: List of use case diagrams
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */

/**
 * @swagger
 * /api/use-case-diagrams/{id}:
 *   get:
 *     summary: Get a single use case diagram
 *     tags: [Use Case Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/useCaseDiagramIdParam'
 *     responses:
 *       200:
 *         description: Use case diagram details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this diagram
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/use-case-diagrams:
 *   post:
 *     summary: Create a new use case diagram
 *     tags: [Use Case Diagrams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *               - handle
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               url:
 *                 type: string
 *               handle:
 *                 type: string
 *               filename:
 *                 type: string
 *               mimetype:
 *                 type: string
 *               uploadId:
 *                 type: string
 *               size:
 *                 type: number
 *               projectId:
 *                 type: string
 *               linkedItems:
 *                 type: object
 *                 properties:
 *                   requirements:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of requirement IDs
 *     responses:
 *       201:
 *         description: Use case diagram created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add diagrams to this project
 */

/**
 * @swagger
 * /api/use-case-diagrams/{id}:
 *   put:
 *     summary: Update a use case diagram
 *     tags: [Use Case Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/useCaseDiagramIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               linkedItems:
 *                 type: object
 *                 properties:
 *                   requirements:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of requirement IDs
 *     responses:
 *       200:
 *         description: Use case diagram updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this diagram
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/use-case-diagrams/{id}:
 *   delete:
 *     summary: Delete a use case diagram
 *     tags: [Use Case Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/useCaseDiagramIdParam'
 *     responses:
 *       200:
 *         description: Use case diagram deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this diagram
 *       404:
 *         description: Diagram not found
 */
const useCaseDiagramController = require('../controllers/diagrams/use-case-diagram');
const createDiagramRoutes = require('./diagrams/diagram-routes-factory');

module.exports = createDiagramRoutes(useCaseDiagramController);