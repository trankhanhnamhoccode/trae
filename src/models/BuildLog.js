const mongoose = require('mongoose');

const buildLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    level: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info'
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

module.exports = mongoose.model('BuildLog', buildLogSchema);
