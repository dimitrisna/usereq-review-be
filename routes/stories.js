// routes/stories.js
const express = require('express');
const { auth } = require('../middlewares/auth');
const storiesController = require('../controllers/stories');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: User stories management
 */

/**
 * @swagger
 * /api/stories/project/{projectId}:
 *   get:
 *     summary: Get all stories for a project
 *     tags: [Stories]
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
 *         description: List of stories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 */
router.get('/project/:projectId', auth, storiesController.getStoriesForProject);

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     summary: Get a single story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story details with linked requirements
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this story
 *       404:
 *         description: Story not found
 */
router.get('/:id', auth, storiesController.getStory);

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Create a new story
 *     tags: [Stories]
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
 *               - text
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *               text:
 *                 type: string
 *                 description: Gherkin code
 *               requirementsLinked:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of requirement IDs
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Story created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to add stories to this project
 */
router.post('/', auth, storiesController.createStory);

/**
 * @swagger
 * /api/stories/{id}:
 *   put:
 *     summary: Update a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               text:
 *                 type: string
 *                 description: Gherkin code
 *               requirementsLinked:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of requirement IDs
 *     responses:
 *       200:
 *         description: Story updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this story
 *       404:
 *         description: Story not found
 */
router.put('/:id', auth, storiesController.updateStory);

/**
 * @swagger
 * /api/stories/{id}:
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to delete this story
 *       404:
 *         description: Story not found
 */
router.delete('/:id', auth, storiesController.deleteStory);

module.exports = router;