const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const Match = require('../models/Match');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const { runMatchingForUser } = require('../services/matching');

const router = express.Router();

router.post('/run', auth, async (req, res, next) => {
  try {
    const matches = await runMatchingForUser(req.user.id);
    res.json({ success: true, message: `Found ${matches.length} potential skill swap partners!`, matchCount: matches.length, matches });
  } catch (error) { next(error); }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const matches = await Match.findAll({
      where: { [Op.or]: [{ userA: req.user.id }, { userB: req.user.id }], status: { [Op.ne]: 'blocked' } },
      include: [
        { model: User, as: 'userAData', attributes: ['id', 'fullName', 'email', 'reputationScore', 'location'] },
        { model: User, as: 'userBData', attributes: ['id', 'fullName', 'email', 'reputationScore', 'location'] }
      ],
      order: [['matchPercentage', 'DESC']]
    });

    // Format to match frontend expectations
    const formatted = matches.map(m => {
      const mj = m.toJSON();
      return { ...mj, _id: mj.id, userA: { ...mj.userAData, _id: mj.userAData.id }, userB: { ...mj.userBData, _id: mj.userBData.id } };
    });

    res.json({ success: true, matches: formatted });
  } catch (error) { next(error); }
});

router.get('/:matchId', auth, async (req, res, next) => {
  try {
    const match = await Match.findByPk(req.params.matchId, {
      include: [
        { model: User, as: 'userAData', attributes: ['id', 'fullName', 'email', 'reputationScore', 'location'] },
        { model: User, as: 'userBData', attributes: ['id', 'fullName', 'email', 'reputationScore', 'location'] }
      ]
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.userA !== req.user.id && match.userB !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, match: { ...match.toJSON(), _id: match.id } });
  } catch (error) { next(error); }
});

module.exports = router;
