const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Skill = require('../models/Skill');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

const router = express.Router();
router.use(auth, adminMiddleware);

router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.count({ where: { role: 'user' } });
    const activeMatches = await Match.count({ where: { status: 'active' } });
    const today = new Date(); today.setHours(0,0,0,0);
    const sessionsToday = await Session.count({ where: { scheduledAt: { [Op.gte]: today } } });
    const pendingCertificates = await UserSkill.count({ where: { certificateUrl: { [Op.ne]: null }, certificateVerified: false } });
    const openReports = await Report.count();

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0,0,0,0);
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
      const count = await User.count({ where: { createdAt: { [Op.gte]: date, [Op.lt]: nextDate }, role: 'user' } });
      last7Days.push({ date: date.toISOString().split('T')[0], count });
    }

    const topTeachSkills = await UserSkill.findAll({
      where: { type: 'teach' },
      attributes: ['skillName', [fn('COUNT', col('skillName')), 'count']],
      group: ['skillName'], order: [[literal('count'), 'DESC']], limit: 10, raw: true
    });

    res.json({ success: true, stats: { totalUsers, activeMatches, sessionsToday, pendingCertificates, openReports, newUsersLast7Days: last7Days, topTeachSkills: topTeachSkills.map(s => ({ _id: s.skillName, count: parseInt(s.count) })) } });
  } catch (error) { next(error); }
});

router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status;
    const where = { role: 'user' };
    if (search) where[Op.or] = [{ fullName: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
    if (status === 'banned') where.isBanned = true;
    if (status === 'active') where.isBanned = false;

    const { count, rows } = await User.findAndCountAll({ where, attributes: { exclude: ['passwordHash'] }, order: [['createdAt', 'DESC']], offset: (page-1)*limit, limit });
    res.json({ success: true, users: rows, pagination: { page, limit, total: count, pages: Math.ceil(count/limit) } });
  } catch (error) { next(error); }
});

router.put('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await user.update({ isBanned: !user.isBanned });
    await Notification.create({ userId: user.id, type: 'system', message: user.isBanned ? 'Your account has been suspended.' : 'Your account has been reactivated.' });
    res.json({ success: true, message: user.isBanned ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
  } catch (error) { next(error); }
});


router.get('/certificates', async (req, res, next) => {
  try {
    const certificates = await UserSkill.findAll({
      where: { certificateUrl: { [Op.ne]: null } },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    const formatted = certificates.map(c => ({ ...c.toJSON(), _id: c.id, userId: c.user }));
    res.json({ success: true, certificates: formatted });
  } catch (error) { next(error); }
});

router.put('/certificates/:id/verify', async (req, res, next) => {
  try {
    const { approved } = req.body;
    const userSkill = await UserSkill.findByPk(req.params.id);
    if (!userSkill) return res.status(404).json({ success: false, message: 'Not found' });
    await userSkill.update({ certificateVerified: approved, isVerified: approved ? true : userSkill.isVerified });
    await Notification.create({ userId: userSkill.userId, type: 'system', message: approved ? `Your certificate for ${userSkill.skillName} has been verified!` : `Your certificate for ${userSkill.skillName} was not approved.` });
    res.json({ success: true, message: approved ? 'Approved' : 'Rejected' });
  } catch (error) { next(error); }
});

router.get('/reports', async (req, res, next) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'reportedUser', attributes: ['id', 'fullName', 'email', 'isBanned'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, reports });
  } catch (error) { next(error); }
});

router.put('/reports/:id/action', async (req, res, next) => {
  try {
    const { action } = req.body;
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (action === 'ban') await User.update({ isBanned: true }, { where: { id: report.reportedUserId } });
    else if (action === 'dismiss') await report.destroy();
    else if (action === 'warn') await Notification.create({ userId: report.reportedUserId, type: 'system', message: 'Warning: Your account has been flagged.' });
    res.json({ success: true, message: `Action "${action}" applied` });
  } catch (error) { next(error); }
});

router.post('/skills', async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ success: false, message: 'Name and category required' });
    const skill = await Skill.create({ name, category });
    res.status(201).json({ success: true, skill });
  } catch (error) { next(error); }
});

router.delete('/skills/:id', async (req, res, next) => {
  try {
    await Skill.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Skill removed' });
  } catch (error) { next(error); }
});

module.exports = router;
