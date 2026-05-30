const mongoose = require('mongoose');

const PROJECT_STATUSES = ['pending', 'planning', 'building', 'ready', 'deployed', 'failed'];

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Project title cannot exceed 120 characters']
    },
    prompt: {
      type: String,
      required: [true, 'Project prompt is required'],
      trim: true,
      maxlength: [5000, 'Project prompt cannot exceed 5000 characters']
    },
    appType: {
      type: String,
      trim: true,
      default: 'web-app'
    },
    modelType: {
      type: String,
      trim: true,
      default: 'balanced'
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'pending'
    },
    plan: {
      type: [String],
      default: []
    },
    previewDescription: {
      type: String,
      default: ''
    },
    previewUrl: {
      type: String,
      default: ''
    },
    liveUrl: {
      type: String,
      default: ''
    },
    errorMessage: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
