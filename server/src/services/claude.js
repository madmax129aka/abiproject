const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

const getModel = () => {
  if (!model && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return model;
};

const generateQuestions = async (skillName, experienceLevel) => {
  const gemini = getModel();

  if (!gemini) {
    return generateFallbackQuestions(skillName, experienceLevel);
  }

  try {
    const prompt = `You are an expert skill assessor. Generate exactly 10 multiple-choice questions to assess a user's knowledge of "${skillName}" at "${experienceLevel}" level.

Return ONLY a valid JSON array (no markdown, no code blocks, no extra text) with this exact structure:
[{ "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A" }]

Make the questions specific and relevant to "${skillName}". Each question must have exactly 4 options labeled A), B), C), D) and one correct answer letter.`;

    const result = await gemini.generateContent(prompt);
    const text = result.response.text();


    // Clean the response - remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleaned);
    return questions;
  } catch (error) {
    console.error('Gemini question generation error:', error.message);
    return generateFallbackQuestions(skillName, experienceLevel);
  }
};

const evaluateAnswers = async (skillName, questionsWithAnswers) => {
  const gemini = getModel();

  if (!gemini) {
    return evaluateFallbackAnswers(questionsWithAnswers);
  }

  try {
    const prompt = `You are an expert evaluator. The user was assessed on "${skillName}".
Here are the questions, correct answers, and user's answers:
${JSON.stringify(questionsWithAnswers, null, 2)}

Grade each answer. Return ONLY valid JSON (no markdown, no code blocks):
{ "score": <0-100>, "passed": <true if score >= 70>, "feedback": "<2-3 sentence summary>", "perQuestion": [{ "correct": true/false, "explanation": "brief explanation" }] }`;

    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini evaluation error:', error.message);
    return evaluateFallbackAnswers(questionsWithAnswers);
  }
};


const verifyCertificate = async (skillName, certificateText) => {
  const gemini = getModel();

  if (!gemini) {
    return { valid: true, confidence: 75, reason: 'Certificate accepted (AI verification unavailable - manual review pending)' };
  }

  try {
    const prompt = `You are a certificate verification assistant. The user claims this certificate proves their skill in "${skillName}".
Certificate text/description: "${certificateText}"
Determine if this certificate is likely valid and relevant to the skill.
Return ONLY valid JSON (no markdown, no code blocks):
{ "valid": true/false, "confidence": <0-100>, "reason": "brief explanation" }`;

    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini certificate verification error:', error.message);
    return { valid: true, confidence: 60, reason: 'Certificate pending manual review' };
  }
};


const chatbotReply = async (messages) => {
  const gemini = getModel();

  if (!gemini) {
    return getFallbackChatbotReply(messages);
  }

  try {
    const systemPrompt = `You are SkillBot, the friendly AI assistant for SkillSwap — a peer-to-peer skill exchange platform. Help users find learning paths, recommend free resources, explain platform features, and encourage skill sharing. Be concise, warm, and practical. Always suggest free resources (YouTube, freeCodeCamp, Khan Academy, MDN, etc.). Keep responses under 200 words.`;

    // Build conversation history for Gemini
    const conversationHistory = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'SkillBot'}: ${m.content}`
    ).join('\n');

    const prompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nRespond as SkillBot:`;

    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (error) {
    console.error('Gemini chatbot error:', error.message);
    return getFallbackChatbotReply(messages);
  }
};


// ============ FALLBACK FUNCTIONS (when no API key) ============

const SKILL_QUESTIONS = {
  'JavaScript': [
    { question: 'What is the output of typeof null in JavaScript?', options: ['A) "null"', 'B) "undefined"', 'C) "object"', 'D) "boolean"'], correctAnswer: 'C' },
    { question: 'Which method is used to add an element at the end of an array?', options: ['A) push()', 'B) pop()', 'C) shift()', 'D) unshift()'], correctAnswer: 'A' },
    { question: 'What does "===" operator check in JavaScript?', options: ['A) Only value', 'B) Only type', 'C) Value and type both', 'D) Neither'], correctAnswer: 'C' },
    { question: 'Which keyword is used to declare a constant in JavaScript?', options: ['A) var', 'B) let', 'C) const', 'D) static'], correctAnswer: 'C' },
    { question: 'What is a closure in JavaScript?', options: ['A) A function inside a loop', 'B) A function that has access to its outer scope variables', 'C) A closed function that cannot be called', 'D) A function without parameters'], correctAnswer: 'B' },
    { question: 'Which of these is NOT a JavaScript data type?', options: ['A) undefined', 'B) number', 'C) float', 'D) symbol'], correctAnswer: 'C' },
    { question: 'What does Array.prototype.map() return?', options: ['A) A single value', 'B) A new array', 'C) undefined', 'D) The original array modified'], correctAnswer: 'B' },
    { question: 'What is the purpose of the "use strict" directive?', options: ['A) Enables strict HTML parsing', 'B) Enforces stricter JS parsing and error handling', 'C) Makes code run faster', 'D) Disables console.log'], correctAnswer: 'B' },
    { question: 'Which method converts a JSON string to a JavaScript object?', options: ['A) JSON.stringify()', 'B) JSON.parse()', 'C) JSON.convert()', 'D) JSON.toObject()'], correctAnswer: 'B' },
    { question: 'What is event bubbling in JavaScript?', options: ['A) Events going from parent to child', 'B) Events going from child to parent elements', 'C) Events being cancelled', 'D) Events repeating infinitely'], correctAnswer: 'B' }
  ],
  'Python': [
    { question: 'What is the output of len("Hello")?', options: ['A) 4', 'B) 5', 'C) 6', 'D) Error'], correctAnswer: 'B' },
    { question: 'Which data structure uses key-value pairs in Python?', options: ['A) List', 'B) Tuple', 'C) Dictionary', 'D) Set'], correctAnswer: 'C' },
    { question: 'What does the "self" keyword refer to in a Python class?', options: ['A) The class itself', 'B) The current instance of the class', 'C) The parent class', 'D) A global variable'], correctAnswer: 'B' },
    { question: 'Which of these is immutable in Python?', options: ['A) List', 'B) Dictionary', 'C) Set', 'D) Tuple'], correctAnswer: 'D' },
    { question: 'What is a list comprehension?', options: ['A) A way to compress list data', 'B) A concise way to create lists', 'C) A method to understand lists', 'D) A list documentation tool'], correctAnswer: 'B' },
    { question: 'What does pip stand for?', options: ['A) Python Install Packages', 'B) Pip Installs Packages', 'C) Python Internal Processor', 'D) Package Import Protocol'], correctAnswer: 'B' },
    { question: 'How do you handle exceptions in Python?', options: ['A) if/else', 'B) try/except', 'C) catch/throw', 'D) handle/error'], correctAnswer: 'B' },
    { question: 'What is the difference between a list and a tuple?', options: ['A) Lists are faster', 'B) Tuples can store more data', 'C) Lists are mutable, tuples are immutable', 'D) No difference'], correctAnswer: 'C' },
    { question: 'What does the range(5) function return?', options: ['A) [1,2,3,4,5]', 'B) [0,1,2,3,4]', 'C) [0,1,2,3,4,5]', 'D) (1,2,3,4,5)'], correctAnswer: 'B' },
    { question: 'Which keyword is used to create a function in Python?', options: ['A) function', 'B) func', 'C) def', 'D) create'], correctAnswer: 'C' }
  ],

  'React': [
    { question: 'What is JSX in React?', options: ['A) A database query language', 'B) A syntax extension that looks like HTML in JavaScript', 'C) A CSS framework', 'D) A testing library'], correctAnswer: 'B' },
    { question: 'What hook is used to manage state in functional components?', options: ['A) useEffect', 'B) useContext', 'C) useState', 'D) useReducer'], correctAnswer: 'C' },
    { question: 'What is the Virtual DOM?', options: ['A) A copy of the real DOM kept in memory', 'B) A new HTML standard', 'C) A browser feature', 'D) A CSS rendering engine'], correctAnswer: 'A' },
    { question: 'What is the purpose of useEffect hook?', options: ['A) To create state variables', 'B) To handle side effects in components', 'C) To style components', 'D) To create child components'], correctAnswer: 'B' },
    { question: 'How do you pass data from parent to child component?', options: ['A) Using state', 'B) Using props', 'C) Using context only', 'D) Using localStorage'], correctAnswer: 'B' },
    { question: 'What is the key prop used for in lists?', options: ['A) Styling elements', 'B) Helping React identify which items changed', 'C) Sorting the list', 'D) Encrypting data'], correctAnswer: 'B' },
    { question: 'What does React.Fragment do?', options: ['A) Splits component into pieces', 'B) Groups elements without adding extra DOM node', 'C) Creates a new component', 'D) Fragments the state'], correctAnswer: 'B' },
    { question: 'Which lifecycle method is equivalent to useEffect with empty dependency array?', options: ['A) componentWillUnmount', 'B) componentDidUpdate', 'C) componentDidMount', 'D) constructor'], correctAnswer: 'C' },
    { question: 'What is conditional rendering in React?', options: ['A) Rendering based on screen size', 'B) Rendering components based on conditions', 'C) Rendering only on mobile', 'D) Rendering with animations'], correctAnswer: 'B' },
    { question: 'What is prop drilling?', options: ['A) Creating props dynamically', 'B) Passing props through many levels of components', 'C) Deleting props', 'D) Drilling holes in the DOM'], correctAnswer: 'B' }
  ],
  'Node.js': [
    { question: 'What is Node.js?', options: ['A) A frontend framework', 'B) A JavaScript runtime built on Chrome V8 engine', 'C) A database', 'D) A CSS preprocessor'], correctAnswer: 'B' },
    { question: 'Which module is used to create a web server in Node.js?', options: ['A) fs', 'B) path', 'C) http', 'D) url'], correctAnswer: 'C' },
    { question: 'What is npm?', options: ['A) Node Project Manager', 'B) Node Package Manager', 'C) New Programming Method', 'D) Network Protocol Module'], correctAnswer: 'B' },
    { question: 'What is the event loop in Node.js?', options: ['A) A for loop for events', 'B) A mechanism that handles async operations', 'C) A UI rendering loop', 'D) A database query loop'], correctAnswer: 'B' },
    { question: 'Which method reads a file asynchronously?', options: ['A) fs.readFileSync()', 'B) fs.readFile()', 'C) fs.read()', 'D) fs.open()'], correctAnswer: 'B' },
    { question: 'What does middleware do in Express.js?', options: ['A) Connects to database', 'B) Functions that execute during the request-response cycle', 'C) Renders HTML templates', 'D) Compiles JavaScript'], correctAnswer: 'B' },
    { question: 'What is package.json used for?', options: ['A) Storing user data', 'B) Project metadata and dependency management', 'C) Configuring the database', 'D) Writing tests'], correctAnswer: 'B' },
    { question: 'What does require() do in Node.js?', options: ['A) Installs a package', 'B) Imports/loads a module', 'C) Creates a new file', 'D) Starts the server'], correctAnswer: 'B' },
    { question: 'What is a callback function?', options: ['A) A function that calls itself', 'B) A function passed as argument to another function', 'C) A function that returns a value', 'D) A function without parameters'], correctAnswer: 'B' },
    { question: 'Which of these is a Node.js framework?', options: ['A) Django', 'B) Flask', 'C) Express', 'D) Laravel'], correctAnswer: 'C' }
  ],

  'Guitar': [
    { question: 'How many strings does a standard acoustic guitar have?', options: ['A) 4', 'B) 5', 'C) 6', 'D) 8'], correctAnswer: 'C' },
    { question: 'What is a chord?', options: ['A) A single note', 'B) Three or more notes played together', 'C) A guitar string', 'D) A type of guitar'], correctAnswer: 'B' },
    { question: 'What does a capo do?', options: ['A) Tunes the guitar', 'B) Raises the pitch by clamping across strings', 'C) Adds reverb', 'D) Protects the guitar neck'], correctAnswer: 'B' },
    { question: 'Which chord is typically the first chord beginners learn?', options: ['A) Bm', 'B) F#', 'C) Em or G', 'D) Bb'], correctAnswer: 'C' },
    { question: 'What is strumming?', options: ['A) Pressing frets', 'B) Brushing across strings rhythmically', 'C) Tuning strings', 'D) Bending notes'], correctAnswer: 'B' },
    { question: 'What is a fret on a guitar?', options: ['A) A type of string', 'B) Metal strips on the neck that divide it into intervals', 'C) The body of the guitar', 'D) A tuning peg'], correctAnswer: 'B' },
    { question: 'What is fingerpicking?', options: ['A) Using a pick to play', 'B) Plucking individual strings with fingers', 'C) Choosing which fret to press', 'D) A guitar brand'], correctAnswer: 'B' },
    { question: 'What is standard tuning for a guitar (thickest to thinnest)?', options: ['A) A D G B E A', 'B) E A D G B E', 'C) D A E G B E', 'D) E B G D A E'], correctAnswer: 'B' },
    { question: 'What is a barre chord?', options: ['A) A chord played in a bar', 'B) A chord where one finger presses all strings across a fret', 'C) A chord using open strings only', 'D) A chord with two notes'], correctAnswer: 'B' },
    { question: 'What is tablature (tabs)?', options: ['A) Sheet music for piano', 'B) A simplified notation showing finger positions on strings', 'C) A guitar tuning method', 'D) A type of guitar effect'], correctAnswer: 'B' }
  ],
  'Photography': [
    { question: 'What does ISO control in a camera?', options: ['A) Focus distance', 'B) Sensor sensitivity to light', 'C) Shutter speed', 'D) Color temperature'], correctAnswer: 'B' },
    { question: 'What is aperture?', options: ['A) The camera lens brand', 'B) The opening that controls how much light enters', 'C) The shutter mechanism', 'D) The sensor size'], correctAnswer: 'B' },
    { question: 'What does a lower f-stop number mean?', options: ['A) Less light, more depth of field', 'B) Wider opening, more light, shallower depth of field', 'C) Faster shutter speed', 'D) Higher ISO'], correctAnswer: 'B' },
    { question: 'What is the rule of thirds?', options: ['A) Using three lenses', 'B) Dividing frame into 9 parts for better composition', 'C) Taking three shots of everything', 'D) Using three light sources'], correctAnswer: 'B' },
    { question: 'What is shutter speed?', options: ['A) How fast the camera focuses', 'B) How long the sensor is exposed to light', 'C) How fast images are processed', 'D) The frame rate of video'], correctAnswer: 'B' },
    { question: 'What causes motion blur?', options: ['A) High ISO', 'B) Slow shutter speed', 'C) Wide aperture', 'D) Small sensor'], correctAnswer: 'B' },
    { question: 'What is white balance?', options: ['A) Making photos black and white', 'B) Adjusting colors so whites appear white under different lighting', 'C) Balancing the camera on a tripod', 'D) Exposure compensation'], correctAnswer: 'B' },
    { question: 'What is depth of field?', options: ['A) How deep the lens is', 'B) The range of distance that appears sharp in focus', 'C) The depth of the camera sensor', 'D) The distance to the subject'], correctAnswer: 'B' },
    { question: 'What file format is best for post-processing?', options: ['A) JPEG', 'B) RAW', 'C) PNG', 'D) BMP'], correctAnswer: 'B' },
    { question: 'What is bokeh?', options: ['A) A camera brand', 'B) The aesthetic quality of out-of-focus blur', 'C) A type of lens', 'D) A lighting technique'], correctAnswer: 'B' }
  ],

  'Yoga': [
    { question: 'What does "yoga" mean in Sanskrit?', options: ['A) Strength', 'B) Union or to join', 'C) Flexibility', 'D) Peace'], correctAnswer: 'B' },
    { question: 'What is Savasana?', options: ['A) A standing pose', 'B) Corpse pose - final relaxation', 'C) A breathing technique', 'D) A type of meditation'], correctAnswer: 'B' },
    { question: 'What is Pranayama?', options: ['A) A yoga pose', 'B) Breath control exercises', 'C) A meditation technique', 'D) A yoga style'], correctAnswer: 'B' },
    { question: 'Which yoga pose is known as Downward-Facing Dog?', options: ['A) Uttanasana', 'B) Adho Mukha Svanasana', 'C) Virabhadrasana', 'D) Balasana'], correctAnswer: 'B' },
    { question: 'What is Vinyasa yoga?', options: ['A) Static holding of poses', 'B) Flowing movement synchronized with breath', 'C) Hot yoga in a heated room', 'D) Partner yoga'], correctAnswer: 'B' },
    { question: 'What is the purpose of Surya Namaskar (Sun Salutation)?', options: ['A) Only flexibility', 'B) A sequence of poses that warms up the entire body', 'C) Only meditation', 'D) Only for advanced practitioners'], correctAnswer: 'B' },
    { question: 'What is a yoga mantra?', options: ['A) A yoga mat brand', 'B) A repeated word or phrase used in meditation', 'C) A type of pose', 'D) A breathing technique'], correctAnswer: 'B' },
    { question: 'What is Tree Pose (Vrksasana) primarily about?', options: ['A) Flexibility', 'B) Balance', 'C) Strength', 'D) Breathing'], correctAnswer: 'B' },
    { question: 'What should you NOT do during yoga practice?', options: ['A) Breathe deeply', 'B) Push through sharp pain', 'C) Use props', 'D) Modify poses for your level'], correctAnswer: 'B' },
    { question: 'What are the 8 limbs of yoga from Patanjali Yoga Sutras?', options: ['A) 8 different poses', 'B) 8 aspects including ethical rules, postures, breath control, and meditation', 'C) 8 types of yoga', 'D) 8 breathing techniques'], correctAnswer: 'B' }
  ],
  'SQL': [
    { question: 'What does SQL stand for?', options: ['A) Strong Query Language', 'B) Structured Query Language', 'C) Simple Query Logic', 'D) System Query Language'], correctAnswer: 'B' },
    { question: 'Which SQL command is used to retrieve data?', options: ['A) GET', 'B) FETCH', 'C) SELECT', 'D) RETRIEVE'], correctAnswer: 'C' },
    { question: 'What does the WHERE clause do?', options: ['A) Sorts results', 'B) Filters rows based on conditions', 'C) Groups data', 'D) Joins tables'], correctAnswer: 'B' },
    { question: 'What is a PRIMARY KEY?', options: ['A) The first column in a table', 'B) A unique identifier for each row', 'C) The most important data', 'D) A password field'], correctAnswer: 'B' },
    { question: 'What type of JOIN returns only matching rows from both tables?', options: ['A) LEFT JOIN', 'B) RIGHT JOIN', 'C) INNER JOIN', 'D) FULL JOIN'], correctAnswer: 'C' },
    { question: 'What does GROUP BY do?', options: ['A) Sorts data alphabetically', 'B) Groups rows with same values for aggregate functions', 'C) Groups tables together', 'D) Creates groups of users'], correctAnswer: 'B' },
    { question: 'Which command adds new data to a table?', options: ['A) ADD', 'B) INSERT INTO', 'C) CREATE', 'D) PUT'], correctAnswer: 'B' },
    { question: 'What is normalization?', options: ['A) Making data normal', 'B) Organizing data to reduce redundancy', 'C) Standardizing column names', 'D) Converting data types'], correctAnswer: 'B' },
    { question: 'What does DELETE FROM do?', options: ['A) Removes the entire table', 'B) Removes specific rows from a table', 'C) Deletes the database', 'D) Removes columns'], correctAnswer: 'B' },
    { question: 'What is an INDEX used for?', options: ['A) Numbering rows', 'B) Speeding up data retrieval queries', 'C) Creating primary keys', 'D) Sorting tables permanently'], correctAnswer: 'B' }
  ]
};

function generateFallbackQuestions(skillName, experienceLevel) {
  // Check if we have pre-made questions for this skill
  if (SKILL_QUESTIONS[skillName]) {
    return SKILL_QUESTIONS[skillName];
  }

  // Generate generic but skill-specific questions
  const questions = [
    { question: `What is the most fundamental concept in ${skillName}?`, options: [`A) The core principles and foundations`, `B) Advanced optimization techniques`, `C) Unrelated theory from another field`, `D) Marketing strategies`], correctAnswer: 'A' },
    { question: `Which learning approach is best for mastering ${skillName}?`, options: [`A) Only reading about it`, `B) Consistent practice combined with theory`, `C) Watching without doing`, `D) Memorizing without understanding`], correctAnswer: 'B' },

    { question: `What is a common beginner mistake when learning ${skillName}?`, options: [`A) Starting with fundamentals`, `B) Trying to learn everything at once without building foundations`, `C) Practicing regularly`, `D) Asking questions`], correctAnswer: 'B' },
    { question: `How would you explain ${skillName} to someone who has never heard of it?`, options: [`A) Use complex jargon and technical terms`, `B) Use simple analogies and real-world examples`, `C) Tell them it is too hard to explain`, `D) Show them unrelated content`], correctAnswer: 'B' },
    { question: `What distinguishes an expert in ${skillName} from a beginner?`, options: [`A) Years of experience only`, `B) Deep understanding, problem-solving ability, and practical application`, `C) Having expensive tools`, `D) Knowing many unrelated skills`], correctAnswer: 'B' },
    { question: `Which resource is most valuable when learning ${skillName}?`, options: [`A) Outdated textbooks only`, `B) Structured courses with hands-on projects`, `C) Random social media posts`, `D) Only watching others without practicing`], correctAnswer: 'B' },
    { question: `What role does feedback play in improving at ${skillName}?`, options: [`A) It is not important`, `B) It helps identify blind spots and areas for improvement`, `C) Only negative feedback helps`, `D) Feedback should be ignored`], correctAnswer: 'B' },
    { question: `How can you measure your progress in ${skillName}?`, options: [`A) By comparing only to others`, `B) By setting milestones and tracking practical achievements`, `C) Progress cannot be measured`, `D) Only through formal testing`], correctAnswer: 'B' },
    { question: `What is the relationship between theory and practice in ${skillName}?`, options: [`A) Theory is unnecessary`, `B) Both theory and practice are essential and complement each other`, `C) Practice is unnecessary if you know theory`, `D) They are completely separate`], correctAnswer: 'B' },
    { question: `What mindset helps most when facing challenges in ${skillName}?`, options: [`A) Giving up quickly`, `B) Growth mindset - seeing challenges as learning opportunities`, `C) Avoiding all difficult problems`, `D) Only doing what you already know`], correctAnswer: 'B' }
  ];

  return questions;
}


function evaluateFallbackAnswers(questionsWithAnswers) {
  let correct = 0;
  const perQuestion = [];

  questionsWithAnswers.forEach((qa) => {
    const isCorrect = qa.userAnswer === qa.correctAnswer;
    if (isCorrect) correct++;
    perQuestion.push({
      correct: isCorrect,
      explanation: isCorrect
        ? 'Correct! Well done.'
        : `Incorrect. The correct answer was ${qa.correctAnswer}.`
    });
  });

  const score = Math.round((correct / questionsWithAnswers.length) * 100);
  return {
    score,
    passed: score >= 70,
    feedback: score >= 70
      ? `Great job! You scored ${score}% (${correct}/${questionsWithAnswers.length}). You have demonstrated solid knowledge.`
      : `You scored ${score}% (${correct}/${questionsWithAnswers.length}). You need 70% to pass. Keep learning and try again!`,
    perQuestion
  };
}

function getFallbackChatbotReply(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (lastMessage.includes('python')) {
    return "Here's a great learning path for Python:\n\n1. **Start free**: Python.org official tutorial\n2. **Practice**: freeCodeCamp's Python course (YouTube - 4.5 hours)\n3. **Projects**: Automate the Boring Stuff (free online book)\n4. **Challenge**: Try HackerRank or LeetCode Python problems\n5. **Find a partner**: Use SkillSwap matching to find a Python teacher!\n\nWould you like recommendations for a specific Python topic?";
  }

  if (lastMessage.includes('javascript') || lastMessage.includes('js')) {
    return "JavaScript is a great skill! Here's how to learn it:\n\n1. **Basics**: MDN Web Docs (free, official)\n2. **Interactive**: freeCodeCamp JavaScript course\n3. **Video**: Traversy Media on YouTube\n4. **Practice**: JavaScript30.com (30 projects in 30 days)\n5. **Advanced**: You Don't Know JS (free book series)\n\nWant me to suggest resources for a specific JS framework?";
  }

  if (lastMessage.includes('react')) {
    return "React is in high demand! Here's your path:\n\n1. **Official docs**: react.dev (new official tutorial)\n2. **Free course**: Scrimba's React course\n3. **YouTube**: Net Ninja or Codevolution React series\n4. **Practice**: Build a todo app, then a weather app\n5. **Advanced**: Learn React Router, Context API, then Redux\n\nPro tip: Master JavaScript fundamentals first!";
  }

  if (lastMessage.includes('guitar') || lastMessage.includes('music')) {
    return "Learning guitar is rewarding! Here's how to start:\n\n1. **YouTube**: JustinGuitar.com (best free course)\n2. **Apps**: Yousician or Fender Play (free trials)\n3. **Start with**: Open chords (Em, G, C, D, Am)\n4. **Practice**: 15-20 minutes daily is better than 2 hours weekly\n5. **Songs**: Learn simple songs you love for motivation\n\nFind a guitar teacher on SkillSwap for personalized guidance!";
  }

  if (lastMessage.includes('learn') || lastMessage.includes('path') || lastMessage.includes('how')) {
    return "I'd love to help you learn! Here's my general advice:\n\n1. **Set clear goals** - What do you want to build/achieve?\n2. **Start free** - freeCodeCamp, Khan Academy, YouTube tutorials\n3. **Practice daily** - Even 20 minutes helps\n4. **Build projects** - Apply what you learn immediately\n5. **Find a partner** - Use SkillSwap to exchange skills!\n\nWhat specific skill are you interested in? I can give tailored recommendations!";
  }

  if (lastMessage.includes('match') || lastMessage.includes('partner') || lastMessage.includes('find')) {
    return "To find a skill swap partner:\n\n1. Make sure your **skill profile** is complete (both teach and learn skills)\n2. Go to the **Matches** page\n3. Click **Find My Matches** to run our algorithm\n4. Review matches - they're sorted by compatibility %\n5. Click **Chat Now** to start a conversation!\n\nTip: The more skills you add, the better matches you'll get!";
  }

  if (lastMessage.includes('hello') || lastMessage.includes('hi') || lastMessage.includes('hey')) {
    return "Hey there! I'm SkillBot, your AI learning assistant. I can help you with:\n\n- **Learning paths** for any skill (just tell me what you want to learn!)\n- **Free resources** - courses, YouTube channels, books\n- **Platform tips** - how to use SkillSwap features\n- **Skill advice** - what to learn next based on your goals\n\nWhat would you like help with today?";
  }

  if (lastMessage.includes('thank') || lastMessage.includes('thanks')) {
    return "You're welcome! Happy to help. Remember:\n\n- Consistency beats intensity in learning\n- Don't hesitate to ask your skill swap partners for help\n- I'm always here if you need more recommendations\n\nGood luck on your learning journey! Feel free to ask anything else.";
  }

  return "I'm SkillBot, your learning companion! I can help with:\n\n- **Suggest learning paths** - Tell me a skill (e.g., 'How do I learn Python?')\n- **Free resources** - Courses, videos, books for any skill\n- **Platform help** - How to find matches, use chat, get verified\n- **Career advice** - What skills complement each other\n\nTry asking me something like:\n- 'How do I learn JavaScript?'\n- 'Suggest resources for guitar'\n- 'How do I find a match?'";
}

module.exports = {
  generateQuestions,
  evaluateAnswers,
  verifyCertificate,
  chatbotReply
};
