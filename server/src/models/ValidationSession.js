const mongoose = require('mongoose');

const validationSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  },
  skillName: {
    type: String,
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert']
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String
  }],
  userAnswers: [String],
  score: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  aiFeedback: String,
  perQuestionFeedback: [{
    correct: Boolean,
    explanation: String
  }]
}, {
  timestamps: true
});

validationSessionSchema.index({ userId: 1 });
validationSessionSchema.index({ userId: 1, skillName: 1 });

module.exports = mongoose.model('ValidationSession', validationSessionSchema);
