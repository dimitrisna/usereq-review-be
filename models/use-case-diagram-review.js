// models/use-case-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const UseCaseDiagramReview = createReviewModel('UseCaseDiagramReview', 'useCaseDiagram', {
  useCaseDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UseCaseDiagram',
    required: true,
  },
  actorIdentificationScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  useCaseDefinitionScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  relationshipsScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  systemBoundaryScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = UseCaseDiagramReview;