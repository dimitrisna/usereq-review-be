// models/class-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const ClassDiagramReview = createReviewModel('ClassDiagramReview', 'classDiagram', {
  classDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassDiagram',
    required: true,
  },
  classStructureScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  relationshipModelingScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  clarityScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  designPrinciplesScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = ClassDiagramReview;