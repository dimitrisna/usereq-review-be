// models/mockup-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const MockupReview = createReviewModel('MockupReview', 'mockup', {
  mockup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mockup',
    required: true,
  },
  uiUxDesignScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  consistencyScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  flowScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  userFriendlinessScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = MockupReview;