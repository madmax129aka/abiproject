const express = require('express');
const auth = require('../middleware/auth');
const Match = require('../models/Match');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const { runMatchingForUser } = require('../services/matching');

const router = express.Router();

// POST /api/matches/run - Run matching algorithm for current user
router.post('/run', auth, async (req, res, next) => {
  try {
    const matches = await runMatchingForUser(req.user._id);
    
    res.json({
      success: true,
      message: `Found ${matches.length} potential skill swap partners!`,
      matchCount: matches.length,
      matches
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/matches - Get user's matches
router.get('/', auth, async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [
        { userA: req.user._id },
        { userB: req.user._id }
      ],
      status: { $ne: 'blocked' }
    })
    .populate('userA', 'fullName email reputationScore location')
    .populate('userB', 'fullName email reputationScore location')
    .sort({ matchPercentage: -1 });

    // Enrich with skill details
    const enrichedMatches = await Promise.all(matches.map(async (match) => {
      const otherUser = match.userA._id.toString() === req.user._id.toString() 
        ? match.userB 
        : match.userA;
      
      const otherTeachSkills = await UserSkill.find({ 
        userId: otherUser._id, 
        type: 'teach' 
      });
      const otherLearnSkills = await UserSkill.find({ 
        userId: otherUser._id, 
        type: 'learn' 
      });

      return {
        ...match.toObject(),
        otherUser,
        otherTeachSkills,
        otherLearnSkills
      };
    }));

    res.json({ success: true, matches: enrichedMatches });
  } catch (error) {
    next(error);
  }
});

// GET /api/matches/:matchId
router.get('/:matchId', auth, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate('userA', 'fullName email reputationScore location')
      .populate('userB', 'fullName email reputationScore location');

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Verify user is part of this match
    if (match.userA._id.toString() !== req.user._id.toString() && 
        match.userB._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
