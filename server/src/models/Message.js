const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'resource', 'system'],
    default: 'text'
  },
  resourceUrl: {
    type: String
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

messageSchema.index({ matchId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1, readAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
