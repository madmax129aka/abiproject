const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

router.get('/:matchId/messages', auth, async (req, res, next) => {
  try {
    const match = await Match.findByPk(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (match.userA !== req.user.id && match.userB !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { matchId: req.params.matchId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'fullName'] },
        { model: User, as: 'receiver', attributes: ['id', 'fullName'] }
      ],
      order: [['createdAt', 'ASC']],
      offset, limit
    });

    const formatted = messages.map(m => {
      const mj = m.toJSON();
      return { ...mj, _id: mj.id, senderId: { _id: mj.sender?.id, fullName: mj.sender?.fullName }, receiverId: { _id: mj.receiver?.id, fullName: mj.receiver?.fullName } };
    });

    res.json({ success: true, messages: formatted, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (error) { next(error); }
});

router.post('/:matchId/messages', auth, async (req, res, next) => {
  try {
    const { content, type, resourceUrl } = req.body;
    const match = await Match.findByPk(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const receiverId = match.userA === req.user.id ? match.userB : match.userA;
    const message = await Message.create({ matchId: parseInt(req.params.matchId), senderId: req.user.id, receiverId, content, type: type || 'text', resourceUrl });

    await Notification.create({ userId: receiverId, type: 'message', message: `New message from ${req.user.fullName}`, link: `/chat/${req.params.matchId}` });
    res.status(201).json({ success: true, message: { ...message.toJSON(), _id: message.id } });
  } catch (error) { next(error); }
});

router.post('/:matchId/session', auth, async (req, res, next) => {
  try {
    const { skillName, scheduledAt, teacherId, learnerId } = req.body;
    const match = await Match.findByPk(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    if (!skillName || !scheduledAt) return res.status(400).json({ success: false, message: 'Skill name and scheduled time are required' });

    const session = await Session.create({
      matchId: parseInt(req.params.matchId), teacherId: teacherId || req.user.id,
      learnerId: learnerId || (match.userA === req.user.id ? match.userB : match.userA),
      skillName, scheduledAt: new Date(scheduledAt)
    });

    const otherUserId = match.userA === req.user.id ? match.userB : match.userA;
    await Notification.create({ userId: otherUserId, type: 'session', message: `${req.user.fullName} scheduled a ${skillName} session!`, link: `/chat/${req.params.matchId}` });
    await Message.create({ matchId: parseInt(req.params.matchId), senderId: req.user.id, receiverId: otherUserId, content: `Session scheduled: ${skillName} on ${new Date(scheduledAt).toLocaleString()}`, type: 'system' });

    res.status(201).json({ success: true, session });
  } catch (error) { next(error); }
});

router.get('/:matchId/sessions', auth, async (req, res, next) => {
  try {
    const sessions = await Session.findAll({
      where: { matchId: req.params.matchId },
      include: [{ model: User, as: 'teacher', attributes: ['id', 'fullName'] }, { model: User, as: 'learner', attributes: ['id', 'fullName'] }],
      order: [['scheduledAt', 'DESC']]
    });
    res.json({ success: true, sessions });
  } catch (error) { next(error); }
});

module.exports = router;
