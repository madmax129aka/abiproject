const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserSkill = sequelize.define('UserSkill', {
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
  type: {
    type: DataTypes.ENUM('teach', 'learn'),
    allowNull: false
  },
  experienceLevel: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Expert'),
    defaultValue: 'Beginner'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  validationScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  certificateUrl: {
    type: DataTypes.STRING(500)
  },
  certificateVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'user_skills',
  timestamps: true
});

module.exports = UserSkill;
