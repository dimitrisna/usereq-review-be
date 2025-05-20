// controllers/rubric-evaluations.js
const RubricEvaluation = require('../models/rubric-evaluation');
const Project = require('../models/project');
const User = require('../models/user');

// Default criteria templates for each artifact type
const DEFAULT_CRITERIA = {
    'requirements': [
        { name: 'Proper Syntax', description: 'Requirements are formulated using strict syntax (e.g., "The system must...")', score: 0 },
        { name: 'Correct Categorization', description: 'Requirements are correctly categorized as functional or non-functional', score: 0 },
        { name: 'Well-defined Scope', description: 'Each requirement describes either a single well-defined function/quality characteristic or a related group of functions', score: 0 },
        { name: 'Quantification', description: 'Quality characteristics described by non-functional requirements are adequately quantified where possible', score: 0 }
    ],
    'storys': [
        { name: 'Story Format', description: 'User stories follow the proper format and structure (As a... I want to... So that...)', score: 0 },
        { name: 'Feature Completion', description: 'Each user story is fully defined and belongs to a complete feature package', score: 0 },
        { name: 'Acceptance Criteria', description: 'Each user story has adequate acceptance criteria with preconditions, triggers, and expected system responses', score: 0 }
    ],
    'activityDiagrams': [
        { name: 'UML Syntax', description: 'Activity diagrams have been created with correct UML syntax', score: 0 },
        { name: 'Scenario Coverage', description: 'The activity diagram for each use case contains all its Gherkin scenarios', score: 0 },
        { name: 'Gherkin Alignment', description: 'The steps of each Gherkin scenario match with the activities in the corresponding flow in the activity diagram', score: 0 }
    ],
    'useCaseDiagrams': [
        { name: 'UML Syntax', description: 'Use case diagrams have been created with correct UML syntax', score: 0 },
        { name: 'Use Case Package Definition', description: 'A complete use case package has been defined for each use case in the diagrams', score: 0 },
        { name: 'Gherkin Specification', description: 'Each use case package adequately defines preconditions, triggers, and system responses for each Gherkin scenario', score: 0 }
    ],
    'sequenceDiagrams': [
        // Remove: { name: 'Object Interaction', description: 'Correctly shows interaction between objects', score: 0 },
        { name: 'UML Correctness', description: 'Follows UML sequence diagram standards and notation', score: 0 },
        { name: 'Message Flow', description: 'Proper sequence of messages', score: 0 },
        { name: 'Completeness', description: 'Covers all necessary interactions', score: 0 }
    ],
    'classDiagrams': [
        { name: 'Boundary Objects', description: 'Correct definition of boundary objects with proper attributes/methods, UI event handlers, and appropriate relationships', score: 0 },
        { name: 'Control Objects', description: 'Correct definition of control objects with business logic methods and no inappropriate attributes/setters/getters', score: 0 },
        { name: 'Entity Objects', description: 'Correct definition of entity objects with appropriate attributes and getter/setter methods', score: 0 },
        { name: 'UML Notation', description: 'Correct use of UML symbols and notation in class diagrams', score: 0 },
        { name: 'Architectural Design', description: 'Correct layer separation with proper connections between boundary, control, and entity classes', score: 0 }
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

// Helper for validating project access
const validateProjectAccess = async (user, projectId) => {
    // For admins, allow access to all projects
    if (user.role === 'Admin') {
        const project = await Project.findById(projectId);
        if (!project) throw new Error('Project not found');
        return project;
    }

    // For regular users, check if they are a member of the project
    const project = await Project.findOne({
        _id: projectId,
        users: { $in: [user._id] }
    });

    if (!project) {
        throw new Error('Not authorized to access this project');
    }

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

        // This function will handle admin vs regular user access differently
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

        // Add isEditable flag
        const evaluationResponse = evaluation.toObject();
        evaluationResponse.isEditable = user.role === 'Admin'; // Only admins can edit

        res.json({ evaluation: evaluationResponse });
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

        // Only admins can save rubric evaluations
        if (user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only administrators can create or edit evaluations' });
        }

        const { rubricType, criteria, overallScore, generalComment, project } = req.body;

        // This function will handle admin vs regular user access differently
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
                project,
                evaluator: user._id
            });
        }

        await evaluation.save();

        // Add isEditable flag
        const evaluationResponse = evaluation.toObject();
        evaluationResponse.isEditable = user.role === 'Admin'; // Only admins can edit

        res.status(201).json({ evaluation: evaluationResponse });
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

        // Only admins can save general comments
        if (user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only administrators can create or edit comments' });
        }

        const { projectId, rubricType, generalComment } = req.body;

        if (!generalComment) {
            return res.status(400).json({ error: 'General comment is required' });
        }

        // This function will handle admin vs regular user access differently
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
            message: 'General comment saved successfully',
            isEditable: user.role === 'Admin' // Only admins can edit
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

        // This function will handle admin vs regular user access differently
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

        res.json({
            overallScore,
            isEditable: user.role === 'Admin' // Only admins can edit
        });
    } catch (error) {
        console.error('Calculate overall score error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};