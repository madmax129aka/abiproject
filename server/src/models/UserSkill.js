const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
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
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['teach', 'learn'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert'],
    default: 'Beginner'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  validationScore: {
    type: Number,
    default: 0
  },
  certificateUrl: {
    type: String
  },
  certificateVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSkillSchema.index({ userId: 1 });
userSkillSchema.index({ userId: 1, type: 1 });
userSkillSchema.index({ skillName: 1, type: 1 });

module.exports = mongoose.model('UserSkill', userSkillSchema);
