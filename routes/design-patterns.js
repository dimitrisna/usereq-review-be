// routes/design-patterns.js
// routes/design-patterns.js

/**
 * @swagger
 * components:
 *   parameters:
 *     designPatternProjectIdParam:
 *       name: projectId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Project ID
 *     designPatternIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *       description: Design Pattern ID
 */

/**
 * @swagger
 * tags:
 *   name: Design Patterns
 *   description: Design patterns management
 */

/**
 * @swagger
 * /api/design-patterns/project/{projectId}:
 *   get:
 *     summary: Get all design patterns for a project
 *     tags: [Design Patterns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/designPatternProjectIdParam'
 *     responses:
 *       200:
 *         description: List of design patterns
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */

/**
 * @swagger
 * /api/design-patterns/{id}:
 *   get:
 *     summary: Get a single design pattern
 *     tags: [Design Patterns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/designPatternIdParam'
 *     responses:
 *       200:
 *         description: Design pattern details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this design pattern
 *       404:
 *         description: Design pattern not found
 */

/**
 * @swagger
 * /api/design-patterns:
 *   post:
 *     summary: Create a new design pattern
 *     tags: [Design Patterns]
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
 *                   classDiagrams:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of class diagram IDs
 *     responses:
 *       201:
 *         description: Design pattern created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add design patterns to this project
 */

/**
 * @swagger
 * /api/design-patterns/{id}:
 *   put:
 *     summary: Update a design pattern
 *     tags: [Design Patterns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/designPatternIdParam'
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
 *                   classDiagrams:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of class diagram IDs
 *     responses:
 *       200:
 *         description: Design pattern updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this design pattern
 *       404:
 *         description: Design pattern not found
 */

/**
 * @swagger
 * /api/design-patterns/{id}:
 *   delete:
 *     summary: Delete a design pattern
 *     tags: [Design Patterns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/designPatternIdParam'
 *     responses:
 *       200:
 *         description: Design pattern deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this design pattern
 *       404:
 *         description: Design pattern not found
 */
const designPatternController = require('../controllers/diagrams/design-pattern');
const createDiagramRoutes = require('./diagrams/diagram-routes-factory');

module.exports = createDiagramRoutes(designPatternController);