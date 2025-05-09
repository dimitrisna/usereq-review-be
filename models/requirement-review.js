// models/requirement-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const RequirementReview = createReviewModel('RequirementReview', 'requirement', {
  requirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectRequirement',
    required: true,
  },
  clarityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  testabilityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  feasibilityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  necessityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  prioritizationScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = RequirementReview;