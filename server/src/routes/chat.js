const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Notification = require('../models/Notification');

const router = express.Router();

// GET /api/chat/:matchId/messages
router.get('/:matchId/messages', auth, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Verify user is part of this match
    if (match.userA.toString() !== req.user._id.toString() && 
        match.userB.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ matchId: req.params.matchId })
      .populate('senderId', 'fullName')
      .populate('receiverId', 'fullName')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ matchId: req.params.matchId });

    res.json({ 
      success: true, 
      messages, 
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/:matchId/messages
router.post('/:matchId/messages', auth, async (req, res, next) => {
  try {
    const { content, type, resourceUrl } = req.body;
    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Determine receiver
    const receiverId = match.userA.toString() === req.user._id.toString() 
      ? match.userB 
      : match.userA;

    const message = await Message.create({
      matchId: req.params.matchId,
      senderId: req.user._id,
      receiverId,
      content,
      type: type || 'text',
      resourceUrl
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'fullName')
      .populate('receiverId', 'fullName');

    // Create notification for receiver
    await Notification.create({
      userId: receiverId,
      type: 'message',
      message: `New message from ${req.user.fullName}`,
      link: `/chat/${req.params.matchId}`
    });

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/:matchId/session - Schedule a session
router.post('/:matchId/session', auth, async (req, res, next) => {
  try {
    const { skillName, scheduledAt, teacherId, learnerId } = req.body;
    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (!skillName || !scheduledAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill name and scheduled time are required' 
      });
    }

    // Check for conflicts
    const conflictingSession = await Session.findOne({
      $or: [
        { teacherId: teacherId || req.user._id },
        { learnerId: learnerId || req.user._id }
      ],
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled'
    });

    if (conflictingSession) {
      return res.status(400).json({ 
        success: false, 
        message: 'Time conflict: you already have a session scheduled at this time' 
      });
    }

    const session = await Session.create({
      matchId: req.params.matchId,
      teacherId: teacherId || req.user._id,
      learnerId: learnerId || (match.userA.toString() === req.user._id.toString() ? match.userB : match.userA),
      skillName,
      scheduledAt: new Date(scheduledAt)
    });

    // Notify both users
    const otherUserId = match.userA.toString() === req.user._id.toString() ? match.userB : match.userA;
    
    await Notification.create({
      userId: otherUserId,
      type: 'session',
      message: `${req.user.fullName} scheduled a ${skillName} session with you!`,
      link: `/chat/${req.params.matchId}`
    });

    // Add system message to chat
    await Message.create({
      matchId: req.params.matchId,
      senderId: req.user._id,
      receiverId: otherUserId,
      content: `📅 Session scheduled: ${skillName} on ${new Date(scheduledAt).toLocaleString()}`,
      type: 'system'
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/:matchId/sessions
router.get('/:matchId/sessions', auth, async (req, res, next) => {
  try {
    const sessions = await Session.find({ matchId: req.params.matchId })
      .populate('teacherId', 'fullName')
      .populate('learnerId', 'fullName')
      .sort({ scheduledAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
