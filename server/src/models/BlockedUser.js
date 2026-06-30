const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BlockedUser = sequelize.define('BlockedUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  blockedUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'blocked_users',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'blockedUserId'] }
  ]
});

module.exports = BlockedUser;
