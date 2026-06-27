const express = require('express');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/skills - get master skill list
router.get('/', async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ category: 1, name: 1 });
    
    // Group by category
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});

    res.json({ success: true, skills, grouped });
  } catch (error) {
    next(error);
  }
});

// POST /api/skills/user - add skill to user
router.post('/user', auth, async (req, res, next) => {
  try {
    const { skillName, type, experienceLevel, certificateUrl } = req.body;

    if (!skillName || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill name and type are required' 
      });
    }

    if (!['teach', 'learn'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be "teach" or "learn"' 
      });
    }

    // Check if already exists
    const existing = await UserSkill.findOne({ 
      userId: req.user._id, 
      skillName: skillName,
      type 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: `You already have "${skillName}" as a ${type} skill` 
      });
    }

    // Find skill in master list
    const skill = await Skill.findOne({ name: skillName });

    const userSkill = await UserSkill.create({
      userId: req.user._id,
      skillId: skill ? skill._id : null,
      skillName,
      type,
      experienceLevel: type === 'teach' ? (experienceLevel || 'Beginner') : 'Beginner',
      certificateUrl
    });

    res.status(201).json({ success: true, userSkill });
  } catch (error) {
    next(error);
  }
});

// POST /api/skills/user/batch - add multiple skills at once
router.post('/user/batch', auth, async (req, res, next) => {
  try {
    const { teachSkills, learnSkills } = req.body;
    const results = { teach: [], learn: [] };

    if (teachSkills && Array.isArray(teachSkills)) {
      for (const skill of teachSkills) {
        const existing = await UserSkill.findOne({
          userId: req.user._id,
          skillName: skill.name,
          type: 'teach'
        });

        if (!existing) {
          const masterSkill = await Skill.findOne({ name: skill.name });
          const userSkill = await UserSkill.create({
            userId: req.user._id,
            skillId: masterSkill ? masterSkill._id : null,
            skillName: skill.name,
            type: 'teach',
            experienceLevel: skill.level || 'Beginner',
            certificateUrl: skill.certificateUrl
          });
          results.teach.push(userSkill);
        }
      }
    }

    if (learnSkills && Array.isArray(learnSkills)) {
      for (const skillName of learnSkills) {
        const name = typeof skillName === 'string' ? skillName : skillName.name;
        const existing = await UserSkill.findOne({
          userId: req.user._id,
          skillName: name,
          type: 'learn'
        });

        if (!existing) {
          const masterSkill = await Skill.findOne({ name });
          const userSkill = await UserSkill.create({
            userId: req.user._id,
            skillId: masterSkill ? masterSkill._id : null,
            skillName: name,
            type: 'learn',
            experienceLevel: 'Beginner'
          });
          results.learn.push(userSkill);
        }
      }
    }

    // Mark skill setup as complete
    await User.findByIdAndUpdate(req.user._id, { skillSetupComplete: true });

    res.status(201).json({ success: true, results });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/skills/user/:userSkillId
router.delete('/user/:userSkillId', auth, async (req, res, next) => {
  try {
    const userSkill = await UserSkill.findOne({
      _id: req.params.userSkillId,
      userId: req.user._id
    });

    if (!userSkill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    await UserSkill.findByIdAndDelete(req.params.userSkillId);

    res.json({ success: true, message: 'Skill removed' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
