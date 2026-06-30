const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Rating = require('../models/Rating');
const Match = require('../models/Match');
const BlockedUser = require('../models/BlockedUser');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const teachSkills = await UserSkill.findAll({ where: { userId: user.id, type: 'teach' } });
    const learnSkills = await UserSkill.findAll({ where: { userId: user.id, type: 'learn' } });
    const ratings = await Rating.findAll({ where: { rateeId: user.id }, include: [{ model: User, as: 'rater', attributes: ['fullName'] }], order: [['createdAt', 'DESC']], limit: 10 });

    res.json({ success: true, user: { ...user.toJSON(), _id: user.id, teachSkills, learnSkills, ratings } });
  } catch (error) { next(error); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const allowedUpdates = ['fullName', 'mobile', 'preferredLanguage', 'location', 'dob', 'gender'];
    const updates = {};
    allowedUpdates.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    await User.update(updates, { where: { id: req.params.id } });
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['passwordHash'] } });
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

router.post('/:id/block', auth, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) return res.status(400).json({ success: false, message: 'Cannot block yourself' });

    await BlockedUser.findOrCreate({ where: { userId: req.user.id, blockedUserId: targetId } });
    await Match.update({ status: 'blocked' }, { where: { [Op.or]: [{ userA: req.user.id, userB: targetId }, { userA: targetId, userB: req.user.id }], status: 'active' } });
    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) { next(error); }
});

router.post('/:id/report', auth, async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason is required' });
    await Report.create({ reporterId: req.user.id, reportedUserId: parseInt(req.params.id), reason });
    res.json({ success: true, message: 'User reported successfully' });
  } catch (error) { next(error); }
});

router.get('/:id/skills', auth, async (req, res, next) => {
  try {
    const teachSkills = await UserSkill.findAll({ where: { userId: req.params.id, type: 'teach' } });
    const learnSkills = await UserSkill.findAll({ where: { userId: req.params.id, type: 'learn' } });
    res.json({ success: true, teachSkills, learnSkills });
  } catch (error) { next(error); }
});

module.exports = router;
