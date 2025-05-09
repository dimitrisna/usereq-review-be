// routes/mockups.js
const express = require('express');
const { auth } = require('../middlewares/auth');
const mockupsController = require('../controllers/mockups');
const router = express.Router();
// routes/mockups.js

/**
 * @swagger
 * tags:
 *   name: Mockups
 *   description: UI mockups management
 */

/**
 * @swagger
 * /api/mockups/project/{projectId}:
 *   get:
 *     summary: Get all mockups for a project
 *     tags: [Mockups]
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
 *         description: List of mockups
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */
router.get('/project/:projectId', auth, mockupsController.getMockupsForProject);

/**
 * @swagger
 * /api/mockups/{id}:
 *   get:
 *     summary: Get a single mockup
 *     tags: [Mockups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mockup ID
 *     responses:
 *       200:
 *         description: Mockup details with linked stories and navigation
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this mockup
 *       404:
 *         description: Mockup not found
 */
router.get('/:id', auth, mockupsController.getMockup);

/**
 * @swagger
 * /api/mockups:
 *   post:
 *     summary: Create a new mockup
 *     tags: [Mockups]
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
 *               storiesLinked:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of story IDs
 *               previousScreens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mockup IDs that come before this screen
 *               nextScreens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mockup IDs that come after this screen
 *     responses:
 *       201:
 *         description: Mockup created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add mockups to this project
 */
router.post('/', auth, mockupsController.createMockup);

/**
 * @swagger
 * /api/mockups/{id}:
 *   put:
 *     summary: Update a mockup
 *     tags: [Mockups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mockup ID
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
 *               storiesLinked:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of story IDs
 *               previousScreens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mockup IDs that come before this screen
 *               nextScreens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mockup IDs that come after this screen
 *     responses:
 *       200:
 *         description: Mockup updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this mockup
 *       404:
 *         description: Mockup not found
 */
router.put('/:id', auth, mockupsController.updateMockup);

/**
 * @swagger
 * /api/mockups/{id}:
 *   delete:
 *     summary: Delete a mockup
 *     tags: [Mockups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mockup ID
 *     responses:
 *       200:
 *         description: Mockup deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this mockup
 *       404:
 *         description: Mockup not found
 */
router.delete('/:id', auth, mockupsController.deleteMockup);

/**
 * @swagger
 * /api/mockups/{mockupId}/navigation:
 *   put:
 *     summary: Update mockup navigation
 *     tags: [Mockups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mockupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mockup ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               previousScreens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mockup IDs that come before this screen
 *               nextScreens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mockup IDs that come after this screen
 *     responses:
 *       200:
 *         description: Mockup navigation updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this mockup
 *       404:
 *         description: Mockup not found
 */
router.put('/:mockupId/navigation', auth, mockupsController.updateNavigation);

module.exports = router;