const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');
const { auth } = require('./middlewares/auth');

// Load environment variables
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const usersRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const requirementsRoutes = require('./routes/requirements');
const storiesRoutes = require('./routes/stories');
const activityDiagramsRoutes = require('./routes/activity-diagrams');
const useCaseDiagramsRoutes = require('./routes/use-case-diagrams');
const sequenceDiagramsRoutes = require('./routes/sequence-diagrams');
const classDiagramsRoutes = require('./routes/class-diagrams');
const designPatternsRoutes = require('./routes/design-patterns');
const mockupsRoutes = require('./routes/mockups');
const reviewsRoutes = require('./routes/reviews');
const rubricEvaluationRoutes = require('./routes/rubric-evaluations');
const swagger = require('./swagger');
// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swagger.serve, swagger.setup);
app.use(auth);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/requirements', requirementsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/activity-diagrams', activityDiagramsRoutes);
app.use('/api/use-case-diagrams', useCaseDiagramsRoutes);
app.use('/api/sequence-diagrams', sequenceDiagramsRoutes);
app.use('/api/class-diagrams', classDiagramsRoutes);
app.use('/api/design-patterns', designPatternsRoutes);
app.use('/api/mockups', mockupsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/rubric-evaluations', rubricEvaluationRoutes);
app.use('/api/test', require('./routes/test'));
// Health check route
app.get('/api/health', (req, res) => {
    console.log('Health endpoint hit');
    res.status(200).send('OK');
});
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Review App API is running',
        version: '1.0.0'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Server error'
            : err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;