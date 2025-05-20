// models/sequence-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const SequenceDiagramReview = createReviewModel('SequenceDiagramReview', 'sequenceDiagram', {
  sequenceDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SequenceDiagram',
    required: true,
  },
  messageFlowScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  umlCorrectnessScore: {
    type: Number,
    min: 0,
    max: 5,
  },
});

module.exports = SequenceDiagramReview;