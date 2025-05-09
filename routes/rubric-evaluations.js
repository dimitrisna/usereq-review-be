// routes/rubric-evaluations.js
const express = require('express');
const { auth, requireAuth } = require('../middlewares/auth');
const rubricController = require('../controllers/rubric-evaluations');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rubric Evaluations
 *   description: Endpoints related to project rubric evaluations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RubricCriteria:
 *       type: object
 *       required:
 *         - name
 *         - score
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the criteria
 *         description:
 *           type: string
 *           description: Description of the criteria
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Score for the criteria
 *         comment:
 *           type: string
 *           description: Optional comment for the criteria
 *     RubricEvaluation:
 *       type: object
 *       required:
 *         - rubricType
 *         - project
 *         - evaluator
 *       properties:
 *         rubricType:
 *           type: string
 *           enum:
 *             - requirements
 *             - stories
 *             - activityDiagrams
 *             - useCaseDiagrams
 *             - sequenceDiagrams
 *             - classDiagrams
 *             - designPatterns
 *             - mockups
 *         criteria:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RubricCriteria'
 *         overallScore:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         generalComment:
 *           type: string
 *         project:
 *           type: string
 *           description: Project ID
 *         evaluator:
 *           type: string
 *           description: Evaluator ID
 */

/**
 * @swagger
 * /api/rubric-evaluations/{projectId}/{rubricType}:
 *   get:
 *     summary: Get rubric evaluation for a project
 *     tags: [Rubric Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: rubricType
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - requirements
 *             - stories
 *             - activityDiagrams
 *             - useCaseDiagrams
 *             - sequenceDiagrams
 *             - classDiagrams
 *             - designPatterns
 *             - mockups
 *     responses:
 *       200:
 *         description: Retrieved rubric evaluation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RubricEvaluation'
 *       401:
 *         description: Unauthorized
 */
router.get('/:projectId/:rubricType', auth, requireAuth, rubricController.getRubricEvaluation);

/**
 * @swagger
 * /api/rubric-evaluations:
 *   post:
 *     summary: Save a complete rubric evaluation
 *     tags: [Rubric Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RubricEvaluation'
 *     responses:
 *       201:
 *         description: Evaluation saved
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, requireAuth, rubricController.saveRubricEvaluation);

/**
 * @swagger
 * /api/rubric-evaluations/general-comment:
 *   post:
 *     summary: Save a general comment on a rubric evaluation
 *     tags: [Rubric Evaluations]
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
 *               - rubricType
 *               - comment
 *             properties:
 *               projectId:
 *                 type: string
 *               rubricType:
 *                 type: string
 *                 enum:
 *                   - requirements
 *                   - stories
 *                   - activityDiagrams
 *                   - useCaseDiagrams
 *                   - sequenceDiagrams
 *                   - classDiagrams
 *                   - designPatterns
 *                   - mockups
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment saved
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/general-comment', auth, requireAuth, rubricController.saveGeneralComment);

/**
 * @swagger
 * /api/rubric-evaluations/{projectId}/{rubricType}/calculate-score:
 *   get:
 *     summary: Calculate overall score for a rubric evaluation
 *     tags: [Rubric Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: rubricType
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - requirements
 *             - stories
 *             - activityDiagrams
 *             - useCaseDiagrams
 *             - sequenceDiagrams
 *             - classDiagrams
 *             - designPatterns
 *             - mockups
 *     responses:
 *       200:
 *         description: Calculated score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overallScore:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/:projectId/:rubricType/calculate-score', auth, requireAuth, rubricController.calculateOverallScore);

module.exports = router;
