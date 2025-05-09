// routes/test.js
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test if the API is working
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

module.exports = router;