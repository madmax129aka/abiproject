const express = require('express');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    const unreadCount = await Notification.count({
      where: { userId: req.user.id, read: false }
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) { next(error); }
});

router.put('/read-all', auth, async (req, res, next) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
});

module.exports = router;
