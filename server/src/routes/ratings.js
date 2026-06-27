const express = require('express');
const auth = require('../middleware/auth');
const Rating = require('../models/Rating');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// POST /api/ratings
router.post('/', auth, async (req, res, next) => {
  try {
    const { sessionId, rateeId, role, stars, feedback } = req.body;

    if (!sessionId || !rateeId || !role || !stars) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID, ratee ID, role, and stars are required' 
      });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stars must be between 1 and 5' 
      });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({
      sessionId,
      raterId: req.user._id,
      rateeId
    });

    if (existingRating) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already rated this session' 
      });
    }

    const rating = await Rating.create({
      sessionId,
      matchId: session.matchId,
      raterId: req.user._id,
      rateeId,
      role,
      stars,
      feedback
    });

    // Update ratee's reputation score
    const allRatings = await Rating.find({ rateeId });
    const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0);
    const avgRating = totalStars / allRatings.length;

    await User.findByIdAndUpdate(rateeId, {
      reputationScore: Math.round(avgRating * 10) / 10,
      $inc: {
        [role === 'teacher' ? 'teachRatingsCount' : 'learnRatingsCount']: 1,
        totalRatingSum: stars
      }
    });

    // Mark session as rated
    await Session.findByIdAndUpdate(sessionId, { rated: true, status: 'completed' });

    // Notify ratee
    await Notification.create({
      userId: rateeId,
      type: 'rating',
      message: `${req.user.fullName} rated you ${stars} stars!`,
      link: `/profile/${rateeId}`
    });

    res.status(201).json({ success: true, rating });
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/session/:sessionId
router.get('/session/:sessionId', auth, async (req, res, next) => {
  try {
    const ratings = await Rating.find({ sessionId: req.params.sessionId })
      .populate('raterId', 'fullName')
      .populate('rateeId', 'fullName');

    res.json({ success: true, ratings });
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/user/:userId
router.get('/user/:userId', auth, async (req, res, next) => {
  try {
    const ratings = await Rating.find({ rateeId: req.params.userId })
      .populate('raterId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, ratings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
