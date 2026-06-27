const express = require('express');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Rating = require('../models/Rating');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -blockedUsers');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const teachSkills = await UserSkill.find({ userId: user._id, type: 'teach' });
    const learnSkills = await UserSkill.find({ userId: user._id, type: 'learn' });
    const ratings = await Rating.find({ rateeId: user._id })
      .populate('raterId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        teachSkills,
        learnSkills,
        ratings
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const allowedUpdates = ['fullName', 'mobile', 'preferredLanguage', 'location', 'dob', 'gender'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/block
router.post('/:id/block', auth, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const userId = req.user._id;

    if (targetId === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    // Add to blocked list
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: targetId }
    });

    // Update any active matches to blocked status
    await Match.updateMany(
      {
        $or: [
          { userA: userId, userB: targetId },
          { userA: targetId, userB: userId }
        ],
        status: 'active'
      },
      { status: 'blocked' }
    );

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/report
router.post('/:id/report', auth, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    await User.findByIdAndUpdate(targetId, {
      $push: {
        reportedBy: {
          userId: req.user._id,
          reason,
          date: new Date()
        }
      }
    });

    res.json({ success: true, message: 'User reported successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id/skills
router.get('/:id/skills', auth, async (req, res, next) => {
  try {
    const teachSkills = await UserSkill.find({ userId: req.params.id, type: 'teach' });
    const learnSkills = await UserSkill.find({ userId: req.params.id, type: 'learn' });

    res.json({
      success: true,
      teachSkills,
      learnSkills
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
