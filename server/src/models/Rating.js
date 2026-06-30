const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  matchId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  raterId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rateeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('teacher', 'learner'),
    allowNull: false
  },
  stars: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  feedback: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'ratings',
  timestamps: true
});

module.exports = Rating;
