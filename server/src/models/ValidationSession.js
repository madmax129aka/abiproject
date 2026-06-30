const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ValidationSession = sequelize.define('ValidationSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  skillId: {
    type: DataTypes.INTEGER
  },
  skillName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  experienceLevel: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Expert')
  },
  questions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  userAnswers: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  passed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiFeedback: {
    type: DataTypes.TEXT
  },
  perQuestionFeedback: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'validation_sessions',
  timestamps: true
});

module.exports = ValidationSession;
