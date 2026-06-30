const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  dob: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other', 'Prefer not to say')
  },
  mobile: {
    type: DataTypes.STRING(20)
  },
  preferredLanguage: {
    type: DataTypes.ENUM('en', 'ta', 'hi'),
    defaultValue: 'en'
  },
  location: {
    type: DataTypes.STRING(255)
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reputationScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  teachRatingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  learnRatingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalRatingSum: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  skillSetupComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
