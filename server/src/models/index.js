const { sequelize } = require('../config/db');
const User = require('./User');
const Skill = require('./Skill');
const UserSkill = require('./UserSkill');
const Match = require('./Match');
const Message = require('./Message');
const Session = require('./Session');
const Rating = require('./Rating');
const Notification = require('./Notification');
const ValidationSession = require('./ValidationSession');
const BlockedUser = require('./BlockedUser');
const Report = require('./Report');

// ===== Associations =====

// User <-> UserSkill
User.hasMany(UserSkill, { foreignKey: 'userId', as: 'skills' });
UserSkill.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Skill <-> UserSkill
Skill.hasMany(UserSkill, { foreignKey: 'skillId' });
UserSkill.belongsTo(Skill, { foreignKey: 'skillId' });

// Match <-> Users
User.hasMany(Match, { foreignKey: 'userA', as: 'matchesAsA' });
User.hasMany(Match, { foreignKey: 'userB', as: 'matchesAsB' });
Match.belongsTo(User, { foreignKey: 'userA', as: 'userAData' });
Match.belongsTo(User, { foreignKey: 'userB', as: 'userBData' });

// Message <-> Match, Users
Match.hasMany(Message, { foreignKey: 'matchId' });
Message.belongsTo(Match, { foreignKey: 'matchId' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Session <-> Match, Users
Match.hasMany(Session, { foreignKey: 'matchId' });
Session.belongsTo(Match, { foreignKey: 'matchId' });
Session.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
Session.belongsTo(User, { foreignKey: 'learnerId', as: 'learner' });

// Rating <-> Session, Users
Session.hasMany(Rating, { foreignKey: 'sessionId' });
Rating.belongsTo(Session, { foreignKey: 'sessionId' });
Rating.belongsTo(User, { foreignKey: 'raterId', as: 'rater' });
Rating.belongsTo(User, { foreignKey: 'rateeId', as: 'ratee' });

// Notification <-> User
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// ValidationSession <-> User
User.hasMany(ValidationSession, { foreignKey: 'userId' });
ValidationSession.belongsTo(User, { foreignKey: 'userId' });

// BlockedUser - junction table
User.hasMany(BlockedUser, { foreignKey: 'userId', as: 'blockedList' });
BlockedUser.belongsTo(User, { foreignKey: 'userId' });
BlockedUser.belongsTo(User, { foreignKey: 'blockedUserId', as: 'blockedUser' });

// Report
User.hasMany(Report, { foreignKey: 'reportedUserId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reportedUserId', as: 'reportedUser' });

module.exports = {
  sequelize,
  User,
  Skill,
  UserSkill,
  Match,
  Message,
  Session,
  Rating,
  Notification,
  ValidationSession,
  BlockedUser,
  Report
};
