// routes/activity-diagrams.js
/**
 * @swagger
 * /api/activity-diagrams/project/{projectId}:
 *   get:
 *     summary: Get all activity diagrams for a project
 *     tags: [Activity Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/projectIdParam'
 *     responses:
 *       200:
 *         description: List of activity diagrams
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/activity-diagrams/{id}:
 *   get:
 *     summary: Get a single activity diagram
 *     tags: [Activity Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/diagramIdParam'
 *     responses:
 *       200:
 *         description: Activity diagram details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/activity-diagrams:
 *   post:
 *     summary: Create a new activity diagram
 *     tags: [Activity Diagrams]
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
 *     responses:
 *       201:
 *         description: Activity diagram created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/activity-diagrams/{id}:
 *   put:
 *     summary: Update an activity diagram
 *     tags: [Activity Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/diagramIdParam'
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
 *     responses:
 *       200:
 *         description: Activity diagram updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Diagram not found
 */

/**
 * @swagger
 * /api/activity-diagrams/{id}:
 *   delete:
 *     summary: Delete an activity diagram
 *     tags: [Activity Diagrams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/diagramIdParam'
 *     responses:
 *       200:
 *         description: Activity diagram deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Diagram not found
 */
const activityDiagramController = require('../controllers/diagrams/activity-diagram');
const createDiagramRoutes = require('./diagrams/diagram-routes-factory');

module.exports = createDiagramRoutes(activityDiagramController);