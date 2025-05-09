// models/rubric-evaluation.js
const mongoose = require('mongoose');

const RUBRIC_TYPES = [
  'requirements',
  'stories',
  'activityDiagrams',
  'useCaseDiagrams',
  'sequenceDiagrams',
  'classDiagrams',
  'designPatterns',
  'mockups'
];

const RubricCriteriaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  score: {
    type: Number,
    min: 0,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
  }
});

const RubricEvaluationSchema = new mongoose.Schema(
  {
    rubricType: {
      type: String,
      required: true,
      enum: RUBRIC_TYPES,
    },
    criteria: [RubricCriteriaSchema],
    overallScore: {
      type: Number,
      min: 0,
      max: 5,
    },
    generalComment: {
      type: String,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

// Compound index for efficient queries
RubricEvaluationSchema.index({ project: 1, rubricType: 1, evaluator: 1 }, { unique: true });

module.exports = mongoose.model('RubricEvaluation', RubricEvaluationSchema);