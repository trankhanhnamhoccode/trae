const mongoose = require('mongoose');

const QUEST_STATUSES = ['available', 'accepted', 'in_progress', 'review_pending', 'completed'];

const questSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Quest id is required'],
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Quest title is required'],
      trim: true,
      maxlength: [160, 'Quest title cannot exceed 160 characters']
    },
    description: {
      type: String,
      default: ''
    },
    assignedTo: {
      type: String,
      default: null
    },
    suggestedRole: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      default: 'Normal'
    },
    status: {
      type: String,
      enum: QUEST_STATUSES,
      default: 'available'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    monster: {
      type: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      },
      hp: {
        type: Number,
        default: 0,
        min: 0
      },
      maxHp: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    reward: {
      exp: {
        type: Number,
        default: 0,
        min: 0
      },
      gold: {
        type: Number,
        default: 0,
        min: 0
      },
      item: {
        type: String,
        default: ''
      }
    },
    requirements: {
      type: [String],
      default: []
    },
    acceptanceCriteria: {
      type: [String],
      default: []
    },
    evidence: {
      summary: {
        type: String,
        default: ''
      },
      links: {
        type: [String],
        default: []
      },
      time: {
        type: String,
        default: ''
      }
    },
    history: {
      type: [
        {
          action: { type: String, required: true },
          by: { type: String, default: '' },
          time: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quest', questSchema);
module.exports.QUEST_STATUSES = QUEST_STATUSES;
