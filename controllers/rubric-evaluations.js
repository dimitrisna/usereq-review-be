// controllers/rubric-evaluations.js
const RubricEvaluation = require('../models/rubric-evaluation');
const Project = require('../models/project');
const User = require('../models/user');

// Default criteria templates for each artifact type
const DEFAULT_CRITERIA = {
    'requirements': [
        { name: 'Clarity', description: 'Requirements are clear and unambiguous', score: 0 },
        { name: 'Testability', description: 'Requirements can be verified through testing', score: 0 },
        { name: 'Feasibility', description: 'Requirements are technically and operationally feasible', score: 0 },
        { name: 'Necessity', description: 'Each requirement is essential to the system', score: 0 },
        { name: 'Prioritization', description: 'Requirements are properly prioritized', score: 0 }
    ],
    'stories': [
        { name: 'User Focus', description: 'Story clearly identifies the user role', score: 0 },
        { name: 'Value Proposition', description: 'Story clearly states the benefit to the user', score: 0 },
        { name: 'Acceptance Criteria', description: 'Clear criteria for when the story is complete', score: 0 },
        { name: 'Size/Scope', description: 'Story is appropriately sized for implementation', score: 0 },
        { name: 'Independence', description: 'Story can be implemented independently', score: 0 }
    ],
    'activityDiagrams': [
        { name: 'Flow Logic', description: 'Correctly shows the flow of activities', score: 0 },
        { name: 'Decision Points', description: 'Properly represents decision points and conditions', score: 0 },
        { name: 'Parallel Activities', description: 'Correctly shows concurrent activities', score: 0 },
        { name: 'Start/End Points', description: 'Clear entry and exit points', score: 0 },
        { name: 'Clarity', description: 'Easy to follow and understand', score: 0 }
    ],
    'useCaseDiagrams': [
        { name: 'Actor Identification', description: 'Correctly identifies external actors', score: 0 },
        { name: 'Use Case Definition', description: 'Use cases represent valuable user goals', score: 0 },
        { name: 'Relationships', description: 'Proper use of include/extend relationships', score: 0 },
        { name: 'System Boundary', description: 'Clear system boundaries', score: 0 },
        { name: 'Completeness', description: 'Covers all user interactions with the system', score: 0 }
    ],
    'sequenceDiagrams': [
        { name: 'Object Interaction', description: 'Correctly shows interaction between objects', score: 0 },
        { name: 'Message Flow', description: 'Proper sequence of messages', score: 0 },
        { name: 'Return Values', description: 'Properly shows return values and responses', score: 0 },
        { name: 'Exception Handling', description: 'Includes error scenarios', score: 0 },
        { name: 'Completeness', description: 'Covers all necessary interactions', score: 0 }
    ],
    'classDiagrams': [
        { name: 'Class Structure', description: 'Appropriate use of classes, attributes, methods', score: 0 },
        { name: 'Relationship Modeling', description: 'Appropriate associations, inheritance, composition', score: 0 },
        { name: 'Completeness', description: 'Covers all required functionality', score: 0 },
        { name: 'Clarity', description: 'Naming and organization are clear and consistent', score: 0 },
        { name: 'Design Principles', description: 'Follows OOP principles (encapsulation, etc.)', score: 0 }
    ],
    'designPatterns': [
        { name: 'Pattern Selection', description: 'Appropriate pattern for the problem', score: 0 },
        { name: 'Implementation', description: 'Correctly implements the pattern', score: 0 },
        { name: 'Flexibility', description: 'Solution is flexible and extensible', score: 0 },
        { name: 'Complexity', description: 'Appropriate level of complexity', score: 0 },
        { name: 'Documentation', description: 'Well-documented rationale for pattern use', score: 0 }
    ],
    'mockups': [
        { name: 'UI/UX Design', description: 'Follows UI/UX best practices', score: 0 },
        { name: 'Consistency', description: 'Consistent design patterns and elements', score: 0 },
        { name: 'Flow', description: 'Logical flow between screens', score: 0 },
        { name: 'Completeness', description: 'Covers all required functionality', score: 0 },
        { name: 'User-Friendliness', description: 'Intuitive and easy to use', score: 0 }
    ]
};

const validateProjectAccess = async (user, projectId) => {
    const project = await Project.findOne({
        _id: projectId,
        users: { $in: [user._id] }
    });
    if (!project && (user.role !== 'Admin')) throw new Error('Not authorized to access this project');
    return project;
};

// Get or create rubric evaluation
exports.getRubricEvaluation = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { projectId, rubricType } = req.params;

        try {
            await validateProjectAccess(user, projectId);
        } catch (error) {
            return res.status(403).json({ error: error.message });
        }

        let evaluation = await RubricEvaluation.findOne({
            project: projectId,
            rubricType,
            evaluator: user._id
        });

        if (!evaluation) {
            evaluation = new RubricEvaluation({
                rubricType,
                criteria: DEFAULT_CRITERIA[rubricType] || [],
                overallScore: 0,
                generalComment: '',
                project: projectId,
                evaluator: user._id
            });

            await evaluation.save();
        }

        res.json({ evaluation });
    } catch (error) {
        console.error('Get rubric evaluation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Save rubric evaluation
exports.saveRubricEvaluation = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { rubricType, criteria, overallScore, generalComment, project } = req.body;

        try {
            await validateProjectAccess(user, project);
        } catch (error) {
            return res.status(403).json({ error: error.message });
        }
        
        let evaluation = await RubricEvaluation.findOne({
            project: project,
            rubricType,
            evaluator: user._id
        });

        if (evaluation) {
            if (criteria !== undefined) evaluation.criteria = criteria;
            if (overallScore !== undefined) evaluation.overallScore = overallScore;
            if (generalComment !== undefined) evaluation.generalComment = generalComment;
        } else {
            evaluation = new RubricEvaluation({
                rubricType,
                criteria: criteria || DEFAULT_CRITERIA[rubricType] || [],
                overallScore: overallScore || 0,
                generalComment: generalComment || '',
                project: projectId,
                evaluator: user._id
            });
        }

        await evaluation.save();
        res.status(201).json({ evaluation });
    } catch (error) {
        console.error('Save rubric evaluation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Save general comment only
exports.saveGeneralComment = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { projectId, rubricType, generalComment } = req.body;

        if (!generalComment) {
            return res.status(400).json({ error: 'General comment is required' });
        }

        try {
            await validateProjectAccess(user, projectId);
        } catch (error) {
            return res.status(403).json({ error: error.message });
        }

        let evaluation = await RubricEvaluation.findOne({
            project: projectId,
            rubricType,
            evaluator: user._id
        });

        if (evaluation) {
            evaluation.generalComment = generalComment;
        } else {
            evaluation = new RubricEvaluation({
                rubricType,
                criteria: DEFAULT_CRITERIA[rubricType] || [],
                overallScore: 0,
                generalComment,
                project: projectId,
                evaluator: user._id
            });
        }

        await evaluation.save();

        res.status(201).json({
            success: true,
            message: 'General comment saved successfully'
        });
    } catch (error) {
        console.error('Save general comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Calculate overall score
exports.calculateOverallScore = async (req, res) => {
    try {
        if (!req.auth?.isAuthenticated || !req.auth.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.auth.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { projectId, rubricType } = req.params;

        try {
            await validateProjectAccess(user, projectId);
        } catch (error) {
            return res.status(403).json({ error: error.message });
        }

        const evaluation = await RubricEvaluation.findOne({
            project: projectId,
            rubricType,
            evaluator: user._id
        });

        if (!evaluation) {
            return res.status(404).json({ error: 'Rubric evaluation not found' });
        }

        const totalScore = evaluation.criteria.reduce((sum, c) => sum + c.score, 0);
        const overallScore = evaluation.criteria.length > 0
            ? parseFloat((totalScore / evaluation.criteria.length).toFixed(1))
            : 0;

        evaluation.overallScore = overallScore;
        await evaluation.save();

        res.json({ overallScore });
    } catch (error) {
        console.error('Calculate overall score error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};