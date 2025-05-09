const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const StoryReview = createReviewModel('StoryReview', 'story', {
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectStory',
    required: true,
  },
  userFocusScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  valuePropositionScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  acceptanceCriteriaScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  sizeScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  independenceScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = StoryReview;