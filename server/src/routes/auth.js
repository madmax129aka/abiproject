const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map(e => e.msg) });
    }

    const { fullName, email, password, dob, gender, mobile, preferredLanguage, location } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ fullName, email, passwordHash, dob, gender, mobile, preferredLanguage: preferredLanguage || 'en', location });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true, message: 'Registration successful', token,
      user: { _id: user.id, fullName: user.fullName, email: user.email, role: user.role, preferredLanguage: user.preferredLanguage, skillSetupComplete: user.skillSetupComplete }
    });
  } catch (error) { next(error); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map(e => e.msg) });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account suspended.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true, message: 'Login successful', token,
      user: { _id: user.id, fullName: user.fullName, email: user.email, role: user.role, preferredLanguage: user.preferredLanguage, reputationScore: user.reputationScore, skillSetupComplete: user.skillSetupComplete, location: user.location }
    });
  } catch (error) { next(error); }
});

router.post('/logout', auth, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['passwordHash'] } });
    res.json({ success: true, user: { ...user.toJSON(), _id: user.id } });
  } catch (error) { next(error); }
});

module.exports = router;
