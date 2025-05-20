// models/use-case-diagram-review.js
const mongoose = require('mongoose');
const { createReviewModel } = require('./base-review');

const UseCaseDiagramReview = createReviewModel('UseCaseDiagramReview', 'useCaseDiagram', {
  useCaseDiagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UseCaseDiagram',
    required: true,
  },
  umlSyntaxScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  useCasePackageScore: {
    type: Number,
    min: 0,
    max: 5,
  },
  gherkinSpecificationScore: {
    type: Number,
    min: 0,
    max: 5,
  }
});

module.exports = UseCaseDiagramReview;