// models/base-review.js
const mongoose = require('mongoose');

const baseReviewSchema = {
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    trim: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  }
};

const createReviewModel = (name, refField, additionalSchema) => {
  const schema = new mongoose.Schema(
    {
      ...baseReviewSchema,
      ...additionalSchema
    },
    { timestamps: true }
  );
  
  // Add a compound index for artifact + reviewer
  schema.index({ [refField]: 1, reviewer: 1 }, { unique: true });
  
  return mongoose.model(name, schema);
};

module.exports = { baseReviewSchema, createReviewModel };