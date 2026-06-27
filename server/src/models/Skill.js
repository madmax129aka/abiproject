const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

skillSchema.index({ name: 1 }, { unique: true });
skillSchema.index({ category: 1 });

module.exports = mongoose.model('Skill', skillSchema);
