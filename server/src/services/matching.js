const { Op } = require('sequelize');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const BlockedUser = require('../models/BlockedUser');

const runMatchingForUser = async (userId) => {
  try {
    const userTeachSkills = await UserSkill.findAll({ where: { userId, type: 'teach' } });
    const userLearnSkills = await UserSkill.findAll({ where: { userId, type: 'learn' } });

    const userTeachNames = userTeachSkills.map(s => s.skillName.toLowerCase());
    const userLearnNames = userLearnSkills.map(s => s.skillName.toLowerCase());

    if (userTeachNames.length === 0 || userLearnNames.length === 0) return [];

    // Get blocked user IDs
    const blockedEntries = await BlockedUser.findAll({ where: { userId } });
    const blockedIds = blockedEntries.map(b => b.blockedUserId);

    const currentUser = await User.findByPk(userId);

    const otherUsers = await User.findAll({
      where: { id: { [Op.ne]: userId, [Op.notIn]: blockedIds.length ? blockedIds : [0] }, isActive: true, isBanned: false, skillSetupComplete: true },
      attributes: ['id', 'fullName', 'reputationScore', 'location']
    });

    const matches = [];

    for (const otherUser of otherUsers) {
      // Check if other user blocked current user
      const otherBlocked = await BlockedUser.findOne({ where: { userId: otherUser.id, blockedUserId: userId } });
      if (otherBlocked) continue;


      const otherTeachSkills = await UserSkill.findAll({ where: { userId: otherUser.id, type: 'teach' } });
      const otherLearnSkills = await UserSkill.findAll({ where: { userId: otherUser.id, type: 'learn' } });

      const otherTeachNames = otherTeachSkills.map(s => s.skillName.toLowerCase());
      const otherLearnNames = otherLearnSkills.map(s => s.skillName.toLowerCase());

      const userCanTeachOther = userTeachNames.filter(s => otherLearnNames.includes(s));
      const otherCanTeachUser = otherTeachNames.filter(s => userLearnNames.includes(s));

      if (userCanTeachOther.length > 0 && otherCanTeachUser.length > 0) {
        const totalUniqueSkills = new Set([...userTeachNames, ...userLearnNames, ...otherTeachNames, ...otherLearnNames]).size;
        const mutualSkillCount = userCanTeachOther.length + otherCanTeachUser.length;
        const matchPercentage = Math.min(Math.round((mutualSkillCount / Math.max(totalUniqueSkills / 2, 1)) * 100), 100);
        const commonInterests = userLearnNames.filter(s => otherLearnNames.includes(s));

        matches.push({ otherUserId: otherUser.id, otherUserName: otherUser.fullName, otherUserReputation: otherUser.reputationScore, otherUserLocation: otherUser.location, userATeaches: userCanTeachOther, userBTeaches: otherCanTeachUser, matchPercentage, commonInterests });
      }
    }

    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    for (const match of matches) {
      const existingMatch = await Match.findOne({
        where: { [Op.or]: [{ userA: userId, userB: match.otherUserId }, { userA: match.otherUserId, userB: userId }] }
      });

      if (!existingMatch) {
        await Match.create({ userA: userId, userB: match.otherUserId, userATeaches: match.userATeaches, userBTeaches: match.userBTeaches, matchPercentage: match.matchPercentage, commonInterests: match.commonInterests, status: 'active' });
        await Notification.create({ userId: match.otherUserId, type: 'match', message: `New skill match found! You and ${currentUser.fullName} can exchange skills.`, link: '/matches' });
        await Notification.create({ userId: userId, type: 'match', message: `New skill match found! You and ${match.otherUserName} can exchange skills.`, link: '/matches' });
      } else {
        await existingMatch.update({ matchPercentage: match.matchPercentage, commonInterests: match.commonInterests });
      }
    }

    return matches;
  } catch (error) {
    console.error('Matching error:', error);
    throw error;
  }
};

module.exports = { runMatchingForUser };


      const otherTeachSkills = await UserSkill.findAll({ where: { userId: otherUser.id, type: 'teach' } });
      const otherLearnSkills = await UserSkill.findAll({ where: { userId: otherUser.id, type: 'learn' } });
      const otherTeachNames = otherTeachSkills.map(s => s.skillName.toLowerCase());
      const otherLearnNames = otherLearnSkills.map(s => s.skillName.toLowerCase());

      const userCanTeachOther = userTeachNames.filter(s => otherLearnNames.includes(s));
      const otherCanTeachUser = otherTeachNames.filter(s => userLearnNames.includes(s));

      if (userCanTeachOther.length > 0 && otherCanTeachUser.length > 0) {
        const totalUniqueSkills = new Set([...userTeachNames, ...userLearnNames, ...otherTeachNames, ...otherLearnNames]).size;
        const mutualSkillCount = userCanTeachOther.length + otherCanTeachUser.length;
        const matchPercentage = Math.min(Math.round((mutualSkillCount / Math.max(totalUniqueSkills / 2, 1)) * 100), 100);
        const commonInterests = userLearnNames.filter(s => otherLearnNames.includes(s));

        matches.push({ otherUserId: otherUser.id, otherUserName: otherUser.fullName, otherUserReputation: otherUser.reputationScore, otherUserLocation: otherUser.location, userATeaches: userCanTeachOther, userBTeaches: otherCanTeachUser, matchPercentage, commonInterests });
      }
    }

    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    for (const match of matches) {
      const existingMatch = await Match.findOne({ where: { [Op.or]: [{ userA: userId, userB: match.otherUserId }, { userA: match.otherUserId, userB: userId }] } });
      if (!existingMatch) {
        await Match.create({ userA: userId, userB: match.otherUserId, userATeaches: match.userATeaches, userBTeaches: match.userBTeaches, matchPercentage: match.matchPercentage, commonInterests: match.commonInterests, status: 'active' });
        await Notification.create({ userId: match.otherUserId, type: 'match', message: `New match! You and ${currentUser.fullName} can exchange skills.`, link: '/matches' });
        await Notification.create({ userId, type: 'match', message: `New match! You and ${match.otherUserName} can exchange skills.`, link: '/matches' });
      } else {
        await existingMatch.update({ matchPercentage: match.matchPercentage, commonInterests: match.commonInterests });
      }
    }
    return matches;
  } catch (error) { console.error('Matching error:', error); throw error; }
};

module.exports = { runMatchingForUser };
