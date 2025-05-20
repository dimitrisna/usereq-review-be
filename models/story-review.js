const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const StoryReview = createReviewModel('StoryReview', 'story', {
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectStory',
    required: true,
  },
  storyFormatScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  featureCompletionScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  acceptanceCriteriaScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = StoryReview;