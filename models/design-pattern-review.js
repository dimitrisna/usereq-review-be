// models/design-pattern-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const DesignPatternReview = createReviewModel('DesignPatternReview', 'designPattern', {
  designPattern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DesignPattern',
    required: true,
  },
  patternSelectionScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  implementationScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  flexibilityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  complexityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  documentationScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = DesignPatternReview;