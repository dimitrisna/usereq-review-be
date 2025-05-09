// models/activity-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const ActivityDiagramReview = createReviewModel('ActivityDiagramReview', 'activityDiagram', {
  activityDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityDiagram',
    required: true,
  },
  flowLogicScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  decisionPointsScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  parallelActivitiesScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  startEndPointsScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  clarityScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = ActivityDiagramReview;