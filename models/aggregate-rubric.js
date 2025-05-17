// models/aggregate-rubric.js
const mongoose = require('mongoose');

const AggregateRubricSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    artifactType: {
      type: String,
      enum: ['requirements', 'stories', 'activityDiagrams', 'useCaseDiagrams', 
             'sequenceDiagrams', 'classDiagrams', 'designPatterns', 'mockups'],
      required: true
    },
    criteriaAverages: {
      type: Map,
      of: Number,
      default: new Map()
    },
    overallScore: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index for project + artifactType
AggregateRubricSchema.index({ project: 1, artifactType: 1 }, { unique: true });

module.exports = mongoose.model('AggregateRubric', AggregateRubricSchema);