const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userA: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userB: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userATeaches: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  userBTeaches: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  matchPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commonInterests: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'blocked'),
    defaultValue: 'active'
  }
}, {
  tableName: 'matches',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userA', 'userB'] }
  ]
});

module.exports = Match;
