// routes/sequence-diagrams.js
// routes/sequence-diagrams.js

/**
 * @swagger
 * components:
 *   parameters:
 *     sequenceDiagramProjectIdParam:
 *       name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
 *     sequenceDiagramIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Sequence Diagram ID
 */

/**
 * @swagger
 * tags:
 *   name: Sequence Diagrams
 *   description: Sequence diagrams management
 */

/**
 * @swagger
 * /api/sequence-diagrams/project/{projectId}:
 *   get:
 *     summary: Get all sequence diagrams for a project
 *     tags: [Sequence Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sequenceDiagramProjectIdParam'
 *     responses:
 *       200:
 *         description: List of sequence diagrams
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */

/**
 * @swagger
 * /api/sequence-diagrams/{id}:
 *   get:
 *     summary: Get a single sequence diagram
 *     tags: [Sequence Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sequenceDiagramIdParam'
 *     responses:
 *       200:
 *         description: Sequence diagram details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this diagram
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/sequence-diagrams:
 *   post:
 *     summary: Create a new sequence diagram
 *     tags: [Sequence Diagrams]
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
 *                   stories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of story IDs
 *     responses:
 *       201:
 *         description: Sequence diagram created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add diagrams to this project
 */

/**
 * @swagger
 * /api/sequence-diagrams/{id}:
 *   put:
 *     summary: Update a sequence diagram
 *     tags: [Sequence Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sequenceDiagramIdParam'
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
 *                   stories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of story IDs
 *     responses:
 *       200:
 *         description: Sequence diagram updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this diagram
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/sequence-diagrams/{id}:
 *   delete:
 *     summary: Delete a sequence diagram
 *     tags: [Sequence Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/sequenceDiagramIdParam'
 *     responses:
 *       200:
 *         description: Sequence diagram deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this diagram
 *       404:
 *         description: Diagram not found
 */
const sequenceDiagramController = require('../controllers/diagrams/sequence-diagram');
const createDiagramRoutes = require('./diagrams/diagram-routes-factory');

module.exports = createDiagramRoutes(sequenceDiagramController);