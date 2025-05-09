// models/general-comment.js
const mongoose = require('mongoose');

const ARTIFACT_TYPES = [
  'requirements',
  'stories',
  'activityDiagrams',
  'useCaseDiagrams',
  'sequenceDiagrams',
  'classDiagrams',
  'designPatterns',
  'mockups'
];

const GeneralCommentSchema = new mongoose.Schema(
  {
    artifactType: {
      type: String,
      required: true,
      enum: ARTIFACT_TYPES,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

// Compound index for user + project + artifactType
GeneralCommentSchema.index({ user: 1, project: 1, artifactType: 1 }, { unique: true });

module.exports = mongoose.model('GeneralComment', GeneralCommentSchema);