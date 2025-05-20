// models/requirement-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const RequirementReview = createReviewModel('RequirementReview', 'requirement', {
  requirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectRequirement',
    required: true,
  },
  syntaxScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  categorizationScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  scopeDefinitionScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  quantificationScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = RequirementReview;