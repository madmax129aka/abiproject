const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userATeaches: [{
    type: String
  }],
  userBTeaches: [{
    type: String
  }],
  matchPercentage: {
    type: Number,
    default: 0
  },
  commonInterests: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true
});

matchSchema.index({ userA: 1, userB: 1 }, { unique: true });
matchSchema.index({ userA: 1 });
matchSchema.index({ userB: 1 });
matchSchema.index({ status: 1 });

module.exports = mongoose.model('Match', matchSchema);
