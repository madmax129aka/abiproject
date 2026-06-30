const express = require('express');
const auth = require('../middleware/auth');
const ValidationSession = require('../models/ValidationSession');
const UserSkill = require('../models/UserSkill');
const Notification = require('../models/Notification');
const { generateQuestions, evaluateAnswers, verifyCertificate } = require('../services/claude');

const router = express.Router();

router.post('/questions', auth, async (req, res, next) => {
  try {
    const { skillName, experienceLevel } = req.body;
    if (!skillName) return res.status(400).json({ success: false, message: 'Skill name is required' });

    const level = experienceLevel || 'Intermediate';
    const questions = await generateQuestions(skillName, level);

    const session = await ValidationSession.create({ userId: req.user.id, skillName, experienceLevel: level, questions });
    const questionsForUser = questions.map(q => ({ question: q.question, options: q.options }));

    res.json({ success: true, sessionId: session.id, questions: questionsForUser });
  } catch (error) { next(error); }
});

router.post('/submit', auth, async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;
    if (!sessionId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Session ID and answers array are required' });
    }

    const session = await ValidationSession.findOne({ where: { id: sessionId, userId: req.user.id } });
    if (!session) return res.status(404).json({ success: false, message: 'Validation session not found' });

    const questionsWithAnswers = session.questions.map((q, i) => ({
      question: q.question, options: q.options, correctAnswer: q.correctAnswer, userAnswer: answers[i] || ''
    }));

    const result = await evaluateAnswers(session.skillName, questionsWithAnswers);

    await session.update({ userAnswers: answers, score: result.score, passed: result.passed, aiFeedback: result.feedback, perQuestionFeedback: result.perQuestion });

    if (result.passed) {
      await UserSkill.update({ isVerified: true, validationScore: result.score }, { where: { userId: req.user.id, skillName: session.skillName, type: 'teach' } });
      await Notification.create({ userId: req.user.id, type: 'system', message: `Congratulations! You're now a Verified Teacher for ${session.skillName}!`, link: '/profile/' + req.user.id });
    }

    res.json({ success: true, result: { score: result.score, passed: result.passed, feedback: result.feedback, perQuestion: result.perQuestion } });
  } catch (error) { next(error); }
});

router.post('/certificate', auth, async (req, res, next) => {
  try {
    const { skillName, certificateUrl, certificateText } = req.body;
    if (!skillName) return res.status(400).json({ success: false, message: 'Skill name is required' });

    const text = certificateText || `Certificate file: ${certificateUrl} for skill: ${skillName}`;
    const result = await verifyCertificate(skillName, text);

    if (result.valid) {
      await UserSkill.update({ certificateVerified: true, certificateUrl }, { where: { userId: req.user.id, skillName, type: 'teach' } });
    }
    res.json({ success: true, result });
  } catch (error) { next(error); }
});

module.exports = router;
