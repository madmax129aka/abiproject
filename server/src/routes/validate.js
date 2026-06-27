const express = require('express');
const auth = require('../middleware/auth');
const ValidationSession = require('../models/ValidationSession');
const UserSkill = require('../models/UserSkill');
const Notification = require('../models/Notification');
const { generateQuestions, evaluateAnswers, verifyCertificate } = require('../services/claude');

const router = express.Router();

// POST /api/validate/questions - Generate validation questions
router.post('/questions', auth, async (req, res, next) => {
  try {
    const { skillName, experienceLevel } = req.body;

    if (!skillName) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const level = experienceLevel || 'Intermediate';
    
    // Generate questions using Claude AI
    const questions = await generateQuestions(skillName, level);

    // Save validation session
    const session = await ValidationSession.create({
      userId: req.user._id,
      skillName,
      experienceLevel: level,
      questions
    });

    // Return questions without correct answers
    const questionsForUser = questions.map(q => ({
      question: q.question,
      options: q.options
    }));

    res.json({
      success: true,
      sessionId: session._id,
      questions: questionsForUser
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/validate/submit - Submit answers for evaluation
router.post('/submit', auth, async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID and answers array are required' 
      });
    }

    const session = await ValidationSession.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Validation session not found' });
    }

    // Combine questions with user answers for evaluation
    const questionsWithAnswers = session.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: answers[i] || ''
    }));

    // Evaluate using Claude AI
    const result = await evaluateAnswers(session.skillName, questionsWithAnswers);

    // Update session
    session.userAnswers = answers;
    session.score = result.score;
    session.passed = result.passed;
    session.aiFeedback = result.feedback;
    session.perQuestionFeedback = result.perQuestion;
    await session.save();

    // If passed, update user skill as verified
    if (result.passed) {
      await UserSkill.findOneAndUpdate(
        { userId: req.user._id, skillName: session.skillName, type: 'teach' },
        { isVerified: true, validationScore: result.score }
      );

      // Create notification
      await Notification.create({
        userId: req.user._id,
        type: 'system',
        message: `Congratulations! You're now a Verified Teacher for ${session.skillName}!`,
        link: '/profile/' + req.user._id
      });
    }

    res.json({
      success: true,
      result: {
        score: result.score,
        passed: result.passed,
        feedback: result.feedback,
        perQuestion: result.perQuestion
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/validate/certificate - Verify certificate
router.post('/certificate', auth, async (req, res, next) => {
  try {
    const { skillName, certificateUrl, certificateText } = req.body;

    if (!skillName) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }

    const text = certificateText || `Certificate file: ${certificateUrl} for skill: ${skillName}`;
    
    // Verify using Claude AI
    const result = await verifyCertificate(skillName, text);

    // Update user skill
    if (result.valid) {
      await UserSkill.findOneAndUpdate(
        { userId: req.user._id, skillName, type: 'teach' },
        { certificateVerified: true, certificateUrl }
      );
    }

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
