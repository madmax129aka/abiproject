const express = require('express');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const skills = await Skill.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});
    res.json({ success: true, skills, grouped });
  } catch (error) { next(error); }
});

router.post('/user', auth, async (req, res, next) => {
  try {
    const { skillName, type, experienceLevel, certificateUrl } = req.body;
    if (!skillName || !type) return res.status(400).json({ success: false, message: 'Skill name and type are required' });
    if (!['teach', 'learn'].includes(type)) return res.status(400).json({ success: false, message: 'Type must be teach or learn' });

    const existing = await UserSkill.findOne({ where: { userId: req.user.id, skillName, type } });
    if (existing) return res.status(400).json({ success: false, message: `You already have "${skillName}" as a ${type} skill` });

    const skill = await Skill.findOne({ where: { name: skillName } });
    const userSkill = await UserSkill.create({
      userId: req.user.id, skillId: skill ? skill.id : null, skillName, type,
      experienceLevel: type === 'teach' ? (experienceLevel || 'Beginner') : 'Beginner', certificateUrl
    });
    res.status(201).json({ success: true, userSkill });
  } catch (error) { next(error); }
});

router.post('/user/batch', auth, async (req, res, next) => {
  try {
    const { teachSkills, learnSkills } = req.body;
    const results = { teach: [], learn: [] };

    if (teachSkills && Array.isArray(teachSkills)) {
      for (const skill of teachSkills) {
        const existing = await UserSkill.findOne({ where: { userId: req.user.id, skillName: skill.name, type: 'teach' } });
        if (!existing) {
          const masterSkill = await Skill.findOne({ where: { name: skill.name } });
          const userSkill = await UserSkill.create({ userId: req.user.id, skillId: masterSkill ? masterSkill.id : null, skillName: skill.name, type: 'teach', experienceLevel: skill.level || 'Beginner', certificateUrl: skill.certificateUrl });
          results.teach.push(userSkill);
        }
      }
    }

    if (learnSkills && Array.isArray(learnSkills)) {
      for (const skillName of learnSkills) {
        const name = typeof skillName === 'string' ? skillName : skillName.name;
        const existing = await UserSkill.findOne({ where: { userId: req.user.id, skillName: name, type: 'learn' } });
        if (!existing) {
          const masterSkill = await Skill.findOne({ where: { name } });
          const userSkill = await UserSkill.create({ userId: req.user.id, skillId: masterSkill ? masterSkill.id : null, skillName: name, type: 'learn', experienceLevel: 'Beginner' });
          results.learn.push(userSkill);
        }
      }
    }

    await User.update({ skillSetupComplete: true }, { where: { id: req.user.id } });
    res.status(201).json({ success: true, results });
  } catch (error) { next(error); }
});

router.delete('/user/:userSkillId', auth, async (req, res, next) => {
  try {
    const deleted = await UserSkill.destroy({ where: { id: req.params.userSkillId, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Skill not found' });
    res.json({ success: true, message: 'Skill removed' });
  } catch (error) { next(error); }
});

module.exports = router;
