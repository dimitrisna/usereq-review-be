// routes/class-diagrams.js
// routes/class-diagrams.js

/**
 * @swagger
 * components:
 *   parameters:
 *     classDiagramProjectIdParam:
 *       name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
 *     classDiagramIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Class Diagram ID
 */

/**
 * @swagger
 * tags:
 *   name: Class Diagrams
 *   description: Class diagrams management
 */

/**
 * @swagger
 * /api/class-diagrams/project/{projectId}:
 *   get:
 *     summary: Get all class diagrams for a project
 *     tags: [Class Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/classDiagramProjectIdParam'
 *     responses:
 *       200:
 *         description: List of class diagrams
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */

/**
 * @swagger
 * /api/class-diagrams/{id}:
 *   get:
 *     summary: Get a single class diagram
 *     tags: [Class Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/classDiagramIdParam'
 *     responses:
 *       200:
 *         description: Class diagram details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this diagram
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/class-diagrams:
 *   post:
 *     summary: Create a new class diagram
 *     tags: [Class Diagrams]
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
 *         description: Class diagram created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add diagrams to this project
 */

/**
 * @swagger
 * /api/class-diagrams/{id}:
 *   put:
 *     summary: Update a class diagram
 *     tags: [Class Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/classDiagramIdParam'
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
 *         description: Class diagram updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this diagram
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/class-diagrams/{id}:
 *   delete:
 *     summary: Delete a class diagram
 *     tags: [Class Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/classDiagramIdParam'
 *     responses:
 *       200:
 *         description: Class diagram deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this diagram
 *       404:
 *         description: Diagram not found
 */
const classDiagramController = require('../controllers/diagrams/class-diagram');
const createDiagramRoutes = require('./diagrams/diagram-routes-factory');

module.exports = createDiagramRoutes(classDiagramController);