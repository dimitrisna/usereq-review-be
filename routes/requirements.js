// routes/requirements.js
const express = require('express');
const { auth } = require('../middlewares/auth');
const requirementsController = require('../controllers/requirements');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Requirements
 *   description: Project requirements management
 */

/**
 * @swagger
 * /api/requirements/project/{projectId}:
 *   get:
 *     summary: Get all requirements for a project
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of requirements
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */
router.get('/project/:projectId', auth, requirementsController.getRequirementsForProject);

/**
 * @swagger
 * /api/requirements/{id}:
 *   get:
 *     summary: Get a single requirement
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Requirement ID
 *     responses:
 *       200:
 *         description: Requirement details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this requirement
 *       404:
 *         description: Requirement not found
 */
router.get('/:id', auth, requirementsController.getRequirement);

/**
 * @swagger
 * /api/requirements:
 *   post:
 *     summary: Create a new requirement
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - projectId
 *             properties:
 *               text:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Functional, Non-Functional, Business, User, System]
 *               user_priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *               system_priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Requirement created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add requirements to this project
 */
router.post('/', auth, requirementsController.createRequirement);

/**
 * @swagger
 * /api/requirements/{id}:
 *   put:
 *     summary: Update a requirement
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Requirement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Functional, Non-Functional, Business, User, System]
 *               user_priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *               system_priority:
 *                 type: string
 *                 enum: [Critical, High, Medium, Low]
 *     responses:
 *       200:
 *         description: Requirement updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this requirement
 *       404:
 *         description: Requirement not found
 */
router.put('/:id', auth, requirementsController.updateRequirement);

/**
 * @swagger
 * /api/requirements/{id}:
 *   delete:
 *     summary: Delete a requirement
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Requirement ID
 *     responses:
 *       200:
 *         description: Requirement deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this requirement
 *       404:
 *         description: Requirement not found
 */
router.delete('/:id', auth, requirementsController.deleteRequirement);

module.exports = router;