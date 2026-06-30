const express = require('express');
const auth = require('../middleware/auth');
const Rating = require('../models/Rating');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

router.post('/', auth, async (req, res, next) => {
  try {
    const { sessionId, rateeId, role, stars, feedback } = req.body;
    if (!sessionId || !rateeId || !role || !stars) return res.status(400).json({ success: false, message: 'Session ID, ratee ID, role, and stars are required' });
    if (stars < 1 || stars > 5) return res.status(400).json({ success: false, message: 'Stars must be between 1 and 5' });

    const session = await Session.findByPk(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const existingRating = await Rating.findOne({ where: { sessionId, raterId: req.user.id, rateeId } });
    if (existingRating) return res.status(400).json({ success: false, message: 'Already rated' });

    const rating = await Rating.create({ sessionId, matchId: session.matchId, raterId: req.user.id, rateeId, role, stars, feedback });

    // Update reputation
    const allRatings = await Rating.findAll({ where: { rateeId } });
    const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0);
    const avgRating = totalStars / allRatings.length;

    await User.update({ reputationScore: Math.round(avgRating * 10) / 10 }, { where: { id: rateeId } });
    await Session.update({ rated: true, status: 'completed' }, { where: { id: sessionId } });
    await Notification.create({ userId: rateeId, type: 'rating', message: `${req.user.fullName} rated you ${stars} stars!`, link: `/profile/${rateeId}` });

    res.status(201).json({ success: true, rating });
  } catch (error) { next(error); }
});

router.get('/session/:sessionId', auth, async (req, res, next) => {
  try {
    const ratings = await Rating.findAll({ where: { sessionId: req.params.sessionId }, include: [{ model: User, as: 'rater', attributes: ['id', 'fullName'] }, { model: User, as: 'ratee', attributes: ['id', 'fullName'] }] });
    res.json({ success: true, ratings });
  } catch (error) { next(error); }
});

router.get('/user/:userId', auth, async (req, res, next) => {
  try {
    const ratings = await Rating.findAll({ where: { rateeId: req.params.userId }, include: [{ model: User, as: 'rater', attributes: ['id', 'fullName'] }], order: [['createdAt', 'DESC']], limit: 20 });
    res.json({ success: true, ratings });
  } catch (error) { next(error); }
});

module.exports = router;
