const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rateeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'learner'],
    required: true
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

ratingSchema.index({ sessionId: 1 });
ratingSchema.index({ rateeId: 1 });
ratingSchema.index({ raterId: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
