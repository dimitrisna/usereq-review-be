// routes/projects.js
const express = require('express');
const { auth } = require('../middlewares/auth');
const projectsController = require('../controllers/projects');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for current user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's projects
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, projectsController.getProjects);

/**
 * @swagger
 * /api/projects/stats:
 *   get:
 *     summary: Get statistics for all projects with pagination
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: Projects statistics with artifact counts and review progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       stats:
 *                         type: object
 *                       totalArtifacts:
 *                         type: integer
 *                       totalReviews:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/stats', auth, projectsController.getProjectsStats);

/**
 * @swagger
 * /api/projects/{projectId}/stats:
 *   get:
 *     summary: Get detailed statistics for a single project
 *     tags: [Projects]
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
 *         description: Detailed project statistics with artifact counts, review progress and grades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                 stats:
 *                   type: object
 *                 totalArtifacts:
 *                   type: integer
 *                 totalReviews:
 *                   type: integer
 *                 overallAverageGrade:
 *                   type: number
 *                   format: float
 *                 completionPercentage:
 *                   type: number
 *                   format: float
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found or not authorized
 */
router.get('/:projectId/stats', auth, projectsController.getProjectStats);


/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               motto:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, projectsController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID with statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details with statistics
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get('/:id', auth, projectsController.getProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               motto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this project
 *       404:
 *         description: Project not found
 */
router.put('/:id', auth, projectsController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only project creator can delete
 *       404:
 *         description: Project not found
 */
router.delete('/:id', auth, projectsController.deleteProject);

/**
 * @swagger
 * /api/projects/invite:
 *   post:
 *     summary: Invite a user to a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - projectId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: User already invited
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only project creator can invite
 *       404:
 *         description: Project not found
 */
router.post('/invite', auth, projectsController.inviteUser);

module.exports = router;