// routes/composite.js
const express = require('express');
const { auth } = require('../middlewares/auth');
const compositeController = require('../controllers/composite-controller');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Composite
 *   description: Composite endpoints for optimized data fetching
 */

/**
 * @swagger
 * /api/composite/projects/{projectId}/dashboard:
 *   get:
 *     summary: Get project dashboard data with statistics
 *     tags: [Composite]
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
 *         description: Project data with statistics for all artifact types
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 *       404:
 *         description: Project not found
 */
router.get('/projects/:projectId/dashboard', auth, compositeController.getProjectDashboard);

/**
 * @swagger
 * /api/composite/design-patterns/project/{projectId}/review-data:
 *   get:
 *     summary: Get design patterns review data
 *     tags: [Composite]
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
 *         description: Design patterns with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this project
 *       404:
 *         description: Project not found
 */
router.get('/design-patterns/project/:projectId/review-data', auth, compositeController.getDesignPatternsReviewData);

/**
 * @swagger
 * /api/composite/activity-diagrams/project/{projectId}/review-data:
 *   get:
 *     summary: Get activity diagrams review data
 *     tags: [Composite]
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
 *         description: Activity diagrams with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/activity-diagrams/project/:projectId/review-data', auth, compositeController.getActivityDiagramsReviewData);

/**
 * @swagger
 * /api/composite/class-diagrams/project/{projectId}/review-data:
 *   get:
 *     summary: Get class diagrams review data
 *     tags: [Composite]
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
 *         description: Class diagrams with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/class-diagrams/project/:projectId/review-data', auth, compositeController.getClassDiagramsReviewData);

/**
 * @swagger
 * /api/composite/sequence-diagrams/project/{projectId}/review-data:
 *   get:
 *     summary: Get sequence diagrams review data
 *     tags: [Composite]
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
 *         description: Sequence diagrams with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/sequence-diagrams/project/:projectId/review-data', auth, compositeController.getSequenceDiagramsReviewData);

/**
 * @swagger
 * /api/composite/use-case-diagrams/project/{projectId}/review-data:
 *   get:
 *     summary: Get use case diagrams review data
 *     tags: [Composite]
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
 *         description: Use case diagrams with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/use-case-diagrams/project/:projectId/review-data', auth, compositeController.getUseCaseDiagramsReviewData);

/**
 * @swagger
 * /api/composite/mockups/project/{projectId}/review-data:
 *   get:
 *     summary: Get mockups review data
 *     tags: [Composite]
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
 *         description: Mockups with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/mockups/project/:projectId/review-data', auth, compositeController.getMockupsReviewData);

/**
 * @swagger
 * /api/composite/requirements/project/{projectId}/review-data:
 *   get:
 *     summary: Get requirements review data
 *     tags: [Composite]
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
 *         description: Requirements with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/requirements/project/:projectId/review-data', auth, compositeController.getRequirementsReviewData);

/**
 * @swagger
 * /api/composite/stories/project/{projectId}/review-data:
 *   get:
 *     summary: Get stories review data
 *     tags: [Composite]
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
 *         description: Stories with reviews, rubric and general comment
 *       401:
 *         description: Unauthorized
 */
router.get('/stories/project/:projectId/review-data', auth, compositeController.getStoriesReviewData);

/**
 * @swagger
 * /api/composite/mockups/{mockupId}/navigation-tree:
 *   get:
 *     summary: Get mockup navigation tree
 *     tags: [Composite]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mockupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mockup ID
 *     responses:
 *       200:
 *         description: Navigation tree for mockups with review status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to access this mockup
 *       404:
 *         description: Mockup not found
 */
router.get('/mockups/:mockupId/navigation-tree', auth, compositeController.getMockupNavigationTree);


/**
 * @swagger
 * /api/composite/reviews/bulk:
 *   post:
 *     summary: Submit multiple reviews at once
 *     tags: [Composite]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviews
 *             properties:
 *               reviews:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - artifactType
 *                     - artifactId
 *                     - rating
 *                   properties:
 *                     artifactType:
 *                       type: string
 *                       enum: [requirement, story, activityDiagram, useCaseDiagram, sequenceDiagram, classDiagram, designPattern, mockup]
 *                     artifactId:
 *                       type: string
 *                     rating:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 5
 *                     comment:
 *                       type: string
 *     responses:
 *       200:
 *         description: Results of bulk review submission
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/reviews/bulk', auth, compositeController.submitBulkReviews);

/**
 * @swagger
 * /api/composite/linked-artifact/{artifactType}/{artifactId}:
 *   get:
 *     summary: Get linked artifact details
 *     tags: [Composite]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [requirements, stories, classDiagrams, activityDiagrams, sequenceDiagrams, useCaseDiagrams, designPatterns, mockups]
 *         description: Type of artifact
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of artifact
 *     responses:
 *       200:
 *         description: Details of the linked artifact
 *       400:
 *         description: Invalid artifact type
 *       404:
 *         description: Artifact not found
 */
router.get('/linked-artifact/:artifactType/:artifactId', auth, compositeController.getLinkedArtifact);

module.exports = router;