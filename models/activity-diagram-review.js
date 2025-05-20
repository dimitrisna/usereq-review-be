// models/activity-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const ActivityDiagramReview = createReviewModel('ActivityDiagramReview', 'activityDiagram', {
  activityDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityDiagram',
    required: true,
  },
  umlSyntaxScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  scenarioComprehensiveScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  gherkinAlignmentScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = ActivityDiagramReview;