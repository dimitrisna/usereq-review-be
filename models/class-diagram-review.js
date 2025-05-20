// models/class-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const ClassDiagramReview = createReviewModel('ClassDiagramReview', 'classDiagram', {
  classDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassDiagram',
    required: true,
  },
  boundaryObjectsScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  controlObjectsScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  entityObjectsScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  umlNotationScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  architecturalDesignScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = ClassDiagramReview;