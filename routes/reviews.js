// routes/reviews.js
const express = require('express');
const { auth } = require('../middlewares/auth');
const reviewsController = require('../controllers/reviews-controller');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management endpoints
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit or update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artifactType
 *               - artifactId
 *               - rating
 *             properties:
 *               artifactType:
 *                 type: string
 *                 enum: [requirement, story, activityDiagram, useCaseDiagram, sequenceDiagram, classDiagram, designPattern, mockup]
 *               artifactId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Invalid artifact type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to review this artifact
 *       404:
 *         description: Artifact not found
 */
router.post('/', auth, reviewsController.submitReview);

/**
 * @swagger
 * /api/reviews/my/{artifactType}/{artifactId}:
 *   get:
 *     summary: Get current user's review for an artifact
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [requirement, story, activityDiagram, useCaseDiagram, sequenceDiagram, classDiagram, designPattern, mockup]
 *         description: Type of artifact
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the artifact
 *     responses:
 *       200:
 *         description: User's review for the artifact
 *       400:
 *         description: Invalid artifact type
 *       401:
 *         description: Unauthorized
 */
router.get('/my/:artifactType/:artifactId', auth, reviewsController.getMyReview);

/**
 * @swagger
 * /api/reviews/{artifactType}/{artifactId}:
 *   get:
 *     summary: Get all reviews for an artifact
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [requirement, story, activityDiagram, useCaseDiagram, sequenceDiagram, classDiagram, designPattern, mockup]
 *         description: Type of artifact
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the artifact
 *     responses:
 *       200:
 *         description: All reviews for the artifact
 *       400:
 *         description: Invalid artifact type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view reviews for this artifact
 *       404:
 *         description: Artifact not found
 */
router.get('/:artifactType/:artifactId', auth, reviewsController.getArtifactReviews);

/**
 * @swagger
 * /api/reviews/general-comment:
 *   post:
 *     summary: Save general comment for artifact type
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - artifactType
 *               - comment
 *             properties:
 *               projectId:
 *                 type: string
 *               artifactType:
 *                 type: string
 *                 enum: [requirements, stories, activityDiagrams, useCaseDiagrams, sequenceDiagrams, classDiagrams, designPatterns, mockups]
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment saved successfully
 *       400:
 *         description: Invalid artifact type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to comment on this project
 */
router.post('/general-comment', auth, reviewsController.saveGeneralComment);

/**
 * @swagger
 * /api/reviews/general-comment/{projectId}/{artifactType}:
 *   get:
 *     summary: Get general comment for artifact type
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: artifactType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [requirements, stories, activityDiagrams, useCaseDiagrams, sequenceDiagrams, classDiagrams, designPatterns, mockups]
 *         description: Type of artifact category
 *     responses:
 *       200:
 *         description: General comment for the artifact type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view comments for this project
 */
router.get('/general-comment/:projectId/:artifactType', auth, reviewsController.getGeneralComment);

module.exports = router;