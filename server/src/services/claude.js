const Anthropic = require('@anthropic-ai/sdk');

let client = null;

const getClient = () => {
  if (!client && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

const generateQuestions = async (skillName, experienceLevel) => {
  const anthropic = getClient();
  
  if (!anthropic) {
    // Return fallback questions if no API key
    return generateFallbackQuestions(skillName, experienceLevel);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an expert skill assessor. Generate exactly 10 multiple-choice questions to assess a user's knowledge of "${skillName}" at "${experienceLevel}" level. Return ONLY a JSON array with this structure: [{ "question": "...", "options": ["A)...", "B)...", "C)...", "D)..."], "correctAnswer": "A" }]. No preamble, no markdown.`
      }]
    });

    const text = response.content[0].text;
    const questions = JSON.parse(text);
    return questions;
  } catch (error) {
    console.error('Claude question generation error:', error.message);
    return generateFallbackQuestions(skillName, experienceLevel);
  }
};

const evaluateAnswers = async (skillName, questionsWithAnswers) => {
  const anthropic = getClient();
  
  if (!anthropic) {
    return evaluateFallbackAnswers(questionsWithAnswers);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an expert evaluator. The user was assessed on "${skillName}". Here are the questions and their answers: ${JSON.stringify(questionsWithAnswers)}. Grade each answer. Return ONLY JSON: { "score": <0-100>, "passed": <boolean>, "feedback": "<2-3 sentence summary>", "perQuestion": [{ "correct": true/false, "explanation": "..." }] }`
      }]
    });

    const text = response.content[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error('Claude evaluation error:', error.message);
    return evaluateFallbackAnswers(questionsWithAnswers);
  }
};

const verifyCertificate = async (skillName, certificateText) => {
  const anthropic = getClient();
  
  if (!anthropic) {
    return { valid: true, confidence: 75, reason: 'Certificate accepted (AI verification unavailable - manual review pending)' };
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a certificate verification assistant. The user claims this certificate proves their skill in "${skillName}". Certificate text/description: "${certificateText}". Determine if this certificate is likely valid and relevant. Return ONLY JSON: { "valid": true/false, "confidence": <0-100>, "reason": "..." }`
      }]
    });

    const text = response.content[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error('Claude certificate verification error:', error.message);
    return { valid: true, confidence: 60, reason: 'Certificate pending manual review' };
  }
};

const chatbotReply = async (messages) => {
  const anthropic = getClient();
  
  if (!anthropic) {
    return getFallbackChatbotReply(messages);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are SkillBot, the friendly AI assistant for SkillSwap — a peer-to-peer skill exchange platform. Help users find learning paths, recommend free resources, explain platform features, and encourage skill sharing. Be concise, warm, and practical. Always suggest free resources (YouTube, freeCodeCamp, Khan Academy, MDN, etc.).`,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude chatbot error:', error.message);
    return getFallbackChatbotReply(messages);
  }
};

// Fallback functions when API is unavailable
function generateFallbackQuestions(skillName, experienceLevel) {
  const difficulties = {
    'Beginner': 'fundamental',
    'Intermediate': 'intermediate',
    'Expert': 'advanced'
  };
  const diff = difficulties[experienceLevel] || 'general';
  
  const questions = [];
  for (let i = 1; i <= 10; i++) {
    questions.push({
      question: `${diff.charAt(0).toUpperCase() + diff.slice(1)} question ${i} about ${skillName}: What is a key concept in ${skillName}?`,
      options: [
        `A) Core principle ${i} of ${skillName}`,
        `B) Unrelated concept ${i}`,
        `C) Partially correct concept ${i}`,
        `D) Common misconception ${i}`
      ],
      correctAnswer: 'A'
    });
  }
  return questions;
}

function evaluateFallbackAnswers(questionsWithAnswers) {
  let correct = 0;
  const perQuestion = [];
  
  questionsWithAnswers.forEach((qa, index) => {
    const isCorrect = qa.userAnswer === qa.correctAnswer;
    if (isCorrect) correct++;
    perQuestion.push({
      correct: isCorrect,
      explanation: isCorrect ? 'Correct answer!' : `The correct answer was ${qa.correctAnswer}.`
    });
  });
  
  const score = Math.round((correct / questionsWithAnswers.length) * 100);
  return {
    score,
    passed: score >= 70,
    feedback: `You scored ${score}%. You got ${correct} out of ${questionsWithAnswers.length} questions correct.`,
    perQuestion
  };
}

function getFallbackChatbotReply(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  if (lastMessage.includes('learn') || lastMessage.includes('path')) {
    return "Great question! Here's what I suggest:\n\n1. **Start with fundamentals** - Check out freeCodeCamp or Khan Academy for structured learning\n2. **Practice regularly** - Use platforms like Exercism or HackerRank\n3. **Find a skill swap partner** - Use our matching feature to find someone who can teach you!\n4. **Build projects** - Apply what you learn in real projects\n\nWould you like more specific recommendations?";
  }
  
  if (lastMessage.includes('match') || lastMessage.includes('partner')) {
    return "To find a skill swap partner:\n\n1. Make sure your skill profile is complete\n2. Go to the **Matches** page\n3. Click **Find Matches** to run our matching algorithm\n4. Review your matches and start chatting!\n\nThe better your profile, the better matches you'll get!";
  }
  
  if (lastMessage.includes('hello') || lastMessage.includes('hi') || lastMessage.includes('hey')) {
    return "Hello! I'm SkillBot, your learning assistant. I can help you with:\n\n- **Learning paths** - I'll suggest resources for any skill\n- **Platform help** - How to use SkillSwap features\n- **Skill recommendations** - What to learn next\n\nWhat would you like help with today?";
  }
  
  return "I'm here to help you on your learning journey! I can:\n\n- Suggest learning paths and free resources\n- Help you navigate SkillSwap\n- Recommend complementary skills\n- Answer questions about skill exchange\n\nFeel free to ask me anything!";
}

module.exports = {
  generateQuestions,
  evaluateAnswers,
  verifyCertificate,
  chatbotReply
};
