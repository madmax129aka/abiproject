const express = require('express');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Skill = require('../models/Skill');
const Notification = require('../models/Notification');

const router = express.Router();

// All admin routes require auth + admin
router.use(auth, adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeMatches = await Match.countDocuments({ status: 'active' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionsToday = await Session.countDocuments({ 
      scheduledAt: { $gte: today } 
    });
    
    const pendingCertificates = await UserSkill.countDocuments({ 
      certificateUrl: { $exists: true, $ne: '' },
      certificateVerified: false 
    });
    
    const openReports = await User.countDocuments({ 
      'reportedBy.0': { $exists: true } 
    });

    // New users last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
        role: 'user'
      });
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Top skills
    const topTeachSkills = await UserSkill.aggregate([
      { $match: { type: 'teach' } },
      { $group: { _id: '$skillName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topLearnSkills = await UserSkill.aggregate([
      { $match: { type: 'learn' } },
      { $group: { _id: '$skillName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeMatches,
        sessionsToday,
        pendingCertificates,
        openReports,
        newUsersLast7Days: last7Days,
        topTeachSkills,
        topLearnSkills
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status;

    const filter = { role: 'user' };
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'banned') filter.isBanned = true;
    if (status === 'active') filter.isBanned = false;

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    // Notify user
    await Notification.create({
      userId: user._id,
      type: 'system',
      message: user.isBanned 
        ? 'Your account has been suspended due to policy violations.' 
        : 'Your account has been reactivated.'
    });

    res.json({ 
      success: true, 
      message: user.isBanned ? 'User banned' : 'User unbanned',
      isBanned: user.isBanned
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/certificates
router.get('/certificates', async (req, res, next) => {
  try {
    const certificates = await UserSkill.find({
      certificateUrl: { $exists: true, $ne: '' }
    })
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });

    res.json({ success: true, certificates });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/certificates/:id/verify
router.put('/certificates/:id/verify', async (req, res, next) => {
  try {
    const { approved } = req.body;
    
    const userSkill = await UserSkill.findById(req.params.id);
    if (!userSkill) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    userSkill.certificateVerified = approved;
    if (approved) {
      userSkill.isVerified = true;
    }
    await userSkill.save();

    // Notify user
    await Notification.create({
      userId: userSkill.userId,
      type: 'system',
      message: approved 
        ? `Your certificate for ${userSkill.skillName} has been verified!`
        : `Your certificate for ${userSkill.skillName} was not approved. Please upload a valid certificate.`
    });

    res.json({ success: true, message: approved ? 'Certificate approved' : 'Certificate rejected' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res, next) => {
  try {
    const reportedUsers = await User.find({
      'reportedBy.0': { $exists: true }
    })
    .select('fullName email reportedBy isBanned createdAt')
    .populate('reportedBy.userId', 'fullName email')
    .sort({ 'reportedBy.date': -1 });

    res.json({ success: true, reports: reportedUsers });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/reports/:id/action
router.put('/reports/:id/action', async (req, res, next) => {
  try {
    const { action } = req.body; // 'warn', 'ban', 'dismiss'
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (action === 'ban') {
      user.isBanned = true;
      await user.save();
    } else if (action === 'dismiss') {
      user.reportedBy = [];
      await user.save();
    } else if (action === 'warn') {
      await Notification.create({
        userId: user._id,
        type: 'system',
        message: 'Warning: Your account has been flagged for policy violations. Please review our community guidelines.'
      });
    }

    res.json({ success: true, message: `Action "${action}" applied successfully` });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/skills - Add new skill to master list
router.post('/skills', async (req, res, next) => {
  try {
    const { name, category } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const skill = await Skill.create({ name, category });
    res.status(201).json({ success: true, skill });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/skills/:id
router.delete('/skills/:id', async (req, res, next) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Skill removed from master list' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
