const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillName: {
    type: String,
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  rated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

sessionSchema.index({ matchId: 1 });
sessionSchema.index({ teacherId: 1 });
sessionSchema.index({ learnerId: 1 });
sessionSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
