const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  timeout: Number(process.env.OPENAI_TIMEOUT_MS || 12000)
});

router.get('/practice', (req, res) => {
  res.status(405).json({
    error: 'Method not allowed. Use POST /api/ai/practice',
    contract: {
      method: 'POST',
      authRequired: true,
      body: { topic: 'string', role: 'string (optional)' },
      success: { questions: ['string'] }
    }
  });
});

// Generate AI Practice Questions
router.post('/practice', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated', code: 'AUTH_REQUIRED' });
  }

  const { role, topic } = req.body;

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({
      error: 'Topic is required and must be a non-empty string.',
      code: 'INVALID_TOPIC'
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI service is not configured: missing OPENAI_API_KEY.',
      code: 'AI_CONFIG_MISSING'
    });
  }

  try {
    const prompt = `You are an expert interviewer for a ${topic} interview. Provide 5 challenging practice interview questions suitable for a ${role || 'student'} candidate. Format the output as a clean JSON array of strings, where each string is a question. Example: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"]`;

    const completion = await openai.chat.completions.create({
      model: 'deepseek-ai/deepseek-r1',
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 2048
    });

    const responseContent = completion?.choices?.[0]?.message?.content || '';
    if (!responseContent) {
      return res.status(502).json({
        error: 'AI provider returned an empty response.',
        code: 'AI_EMPTY_RESPONSE'
      });
    }

    let questions = [];
    
    try {
       const parsed = JSON.parse(responseContent);
       // Handle cases where the API wraps the array in an object key
       if (Array.isArray(parsed)) {
           questions = parsed;
       } else {
           const keys = Object.keys(parsed);
           questions = parsed[keys[0]];
       }
    } catch(e) {
       // fallback if JSON parsing fails
       questions = responseContent.split('\n').filter(q => q.trim().length > 0);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(502).json({
        error: 'AI provider response could not be parsed into questions.',
        code: 'AI_PARSE_FAILED'
      });
    }

    res.json({ questions });
  } catch (error) {
    console.error('OpenAI Error:', error?.status, error?.message);
    
    const fallbackQuestions = {
      'General HR': [
        'Tell me about yourself and why you want this role?',
        'What are your greatest strengths and weaknesses?',
        'Why should we hire you over other candidates?',
        'Describe a challenging situation you faced and how you handled it.',
        'Where do you see yourself in 5 years?'
      ],
      'BCA Technical': [
        'Explain the difference between SQL and NoSQL databases.',
        'What is the time complexity of quick sort?',
        'Describe the OSI model layers.',
        'What is normalization in databases?',
        'Explain the concept of inheritance in OOP.'
      ],
      'Data Structures & Algorithms': [
        'Implement a function to reverse a linked list.',
        'What is the difference between BFS and DFS?',
        'Explain Big O notation and give examples.',
        'How would you find the middle element of a linked list?',
        'Describe the binary search algorithm.'
      ],
      'React Frontend': [
        'What is the difference between useEffect and useLayoutEffect?',
        'Explain the component lifecycle in React.',
        'What are React hooks and how do they work?',
        'How does the virtual DOM work?',
        'What is the purpose of the useState hook?'
      ]
    };

    const fallback = fallbackQuestions[topic] || fallbackQuestions['General HR'];
    return res.json({ questions: fallback, _fallback: true });
  }
});

module.exports = router;
