import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import child_process from 'child_process';
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());

// Gemini model name used by backend proxy
const MODEL_NAME = "gemini-3-flash-preview";

// Initialize Gemini client if API key present
const GEMINI_KEY = process.env.GEMINI_API_KEY;
let genaiClient: any = null;
if (GEMINI_KEY) {
  genaiClient = new GoogleGenAI({ apiKey: GEMINI_KEY });
}

// Helper: call Gemini safely with fallback
async function callGemini(prompt: string, fallback: any = null) {
  if (!genaiClient) {
    return { success: false, data: fallback };
  }
  try {
    const resp: any = await genaiClient.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // keep default config; callers may JSON.parse resp.text when expecting JSON
    });
    return { success: true, data: resp };
  } catch (e) {
    console.error("Gemini error:", e);
    return { success: false, data: fallback };
  }
}

function parseJsonFromModelText(text: string) {
  if (!text) return null;
  const cleaned = text.trim();
  const candidates: string[] = [cleaned];

  // Handle markdown fenced JSON blocks
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) candidates.push(fenceMatch[1].trim());

  // Handle prose + inline JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch (e) {
      // try next
    }
  }
  return null;
}

function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function appendJsonLine(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  const line = JSON.stringify(data) + "\n";
  fs.appendFileSync(filePath, line);
}

function runPythonPredict(payload: any) {
  try {
    const script = path.join(process.cwd(), 'backend', 'ml', 'predict.py');
    const candidates = [
      path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
      'python',
      'python3'
    ];
    for (const cmd of candidates) {
      try {
        const command = `"${cmd}" "${script}" '${JSON.stringify(payload).replace(/'/g, "\\'")}'`;
        const out = child_process.execSync(command, { encoding: 'utf-8', timeout: 10000, stdio: ['ignore','pipe','pipe'] });
        try { return JSON.parse(out || '{}'); } catch (e) { continue; }
      } catch (e) {
        // try next candidate
        continue;
      }
    }
    console.error('runPythonPredict: no working python candidate found');
    return null;
  } catch (e) {
    console.error('runPythonPredict error', e);
    return null;
  }
}

// Helper to read/write JSON data
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const readData = (filename: string) => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return [];
  }
};

const writeData = (filename: string, data: any) => {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
};

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", project: "Ekalavya" });
});

app.get("/api/students", (req, res) => {
  res.json(readData("students.json"));
});

app.get("/api/student/:id", (req, res) => {
  const students = readData("students.json");
  const student = students.find((s: any) => s.id === req.params.id);
  const dnaData = readData("learning_dna.json");
  const dna = Array.isArray(dnaData) ? dnaData.find((d: any) => d.student_id === req.params.id) : null;
  const fingerprints = readData("cognitive_fingerprints.json");
  const fingerprint = Array.isArray(fingerprints) ? fingerprints.find((f: any) => f.student_id === req.params.id) : null;
  res.json({ ...student, dna, fingerprint });
});

app.get("/api/assignments", (req, res) => {
  res.json(readData("assignments.json"));
});

// End of API routes

// --- New API endpoints ---

app.get('/api/sample', (req, res) => {
  res.json({ project: 'Ekalavya', tagline: 'Learning Beyond Limits', demo: true });
});

app.get('/api/sample-data', (req, res) => {
  res.json({ students: readData('students.json'), assignments: readData('assignments.json') });
});

app.post('/api/simplify', async (req, res) => {
  const { text } = req.body || {};
  const fallback = {
    easy_version: 'Simple explanation placeholder.',
    bullet_points: ['Keep equations balanced', 'Isolate variables'],
    summary: 'Simplified summary.',
    key_terms: ['Variable', 'Coefficient'],
    simple_example: 'If you add to one side, add to the other.',
    suggested_questions: ['What happens if...']
  };
  if (!text) return res.json({ ok: false, data: fallback });
  const prompt = `Rewrite the following lesson in simple student-friendly language and return ONLY valid JSON with keys: easy_version, bullet_points, summary, key_terms, simple_example, suggested_questions. Do not add markdown or extra text.\n\nText: ${text}`;
  const r = await callGemini(prompt, fallback);
  if (!r.success) return res.json({ ok: true, data: fallback });
  const txt = r.data.text || r.data.output?.[0]?.content?.[0]?.text || '';
  const parsed = parseJsonFromModelText(txt);
  if (parsed) return res.json({ ok: true, data: parsed });
  return res.json({ ok: true, data: fallback });
});

app.post('/api/micro-lesson', async (req, res) => {
  const { topic, student_id } = req.body || {};
  const fallback = { title: `Micro-lesson: ${topic}`, content: `Short micro lesson for ${topic}` };
  const prompt = `Create a very short micro-lesson for topic: ${topic}. Return JSON {title, content}`;
  const r = await callGemini(prompt, fallback);
  if (!r.success) return res.json({ ok: true, data: fallback });
  const txt = r.data.text || '';
  try {
    const parsed = JSON.parse(txt || '{}');
    return res.json({ ok: true, data: parsed });
  } catch (e) {
    return res.json({ ok: true, data: fallback });
  }
});

app.post('/api/tutor', async (req, res) => {
  const { student_id, message } = req.body || {};
  const dna = readData('learning_dna.json');
  const studentDna = Array.isArray(dna) ? dna.find((d: any) => d.student_id === student_id) : null;
  const fallback = { reply: "I'm in demo mode. Think of a function as a machine mapping inputs to outputs.", proof_score: 75 };
  const prompt = `You are Ekalavya Advisor. Integrate student DNA: ${JSON.stringify(studentDna)}. Student asks: ${message}. Respond helpfully in markdown.`;
  const r = await callGemini(prompt, fallback);
  const sessionId = createId('sess');
  const sessionLog = { id: sessionId, student_id, message, timestamp: new Date().toISOString(), source: 'tutor' };
  appendJsonLine('sessions.jsonl', sessionLog);
  if (!r.success) return res.json({ ok: true, reply: fallback.reply, session_id: sessionId, proof_score: fallback.proof_score });
  const replyText = r.data.text || r.data.output?.[0]?.content?.[0]?.text || fallback.reply;
  return res.json({ ok: true, reply: replyText, session_id: sessionId, proof_score: 80 });
});

app.post('/api/generate-quiz', async (req, res) => {
  const { student_id, topic, difficulty = 'medium' } = req.body || {};
  // simple anti-copy: shuffle and paraphrase templates
  const questions = [
    { q: `Explain the core idea of ${topic}.`, id: createId('q') },
    { q: `Solve a basic problem on ${topic}.`, id: createId('q') },
    { q: `Why does the method for ${topic} work?`, id: createId('q') }
  ];
  const quiz = { id: createId('quiz'), student_id, topic, difficulty, questions };
  return res.json({ ok: true, quiz });
});

app.post('/api/submit-quiz', async (req, res) => {
  const { student_id, quiz_id, answers } = req.body || {};
  // grade: simple matching by presence of non-empty answers
  const total = answers?.length || 0;
  const correct = (answers || []).filter((a: any) => a && a.trim().length > 3).length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const result = { id: createId('quizres'), student_id, quiz_id, score, total, correct, timestamp: new Date().toISOString() };
  appendJsonLine('quiz_logs.jsonl', result);

  // Run ML predictor if available
  const context = req.body.context || {
    quiz_score: score,
    reading_time_seconds: req.body.reading_time_seconds || 0,
    quiz_time_seconds: req.body.quiz_time_seconds || 0,
    attempts: req.body.attempts || 0,
    hints_used: req.body.hints_used || 0,
    wrong_answers: req.body.wrong_answers || 0,
    correct_answers: req.body.correct_answers || 0,
    mood: req.body.mood || null,
    ease_rating: req.body.ease_rating || null,
    confidence_score: req.body.confidence_score || null,
    previous_score: req.body.previous_score || null,
    improvement_rate: req.body.improvement_rate || null,
    mistake_type: req.body.mistake_type || null,
    learning_style: req.body.learning_style || null,
    proof_of_thought_score: req.body.proof_of_thought_score || null,
    socratic_engagement: req.body.socratic_engagement || null,
    teaching_verification: req.body.teaching_verification || null,
    cognitive_depth: req.body.cognitive_depth || null,
    effort_consistency: req.body.effort_consistency || null
  };

  const mlRes = runPythonPredict(context);
  if (mlRes) {
    // merge ML results with rule-based
    const mlNeeds = mlRes.needs_support ? true : false;
    const ruleNeeds = score < 40 || (context.mood && ['confused','stressed'].includes(context.mood)) || (context.hints_used && context.hints_used >= 3) || (context.proof_of_thought_score && context.proof_of_thought_score < 50);
    const teacher_alert_required = ruleNeeds || mlNeeds;
    const priority = (ruleNeeds && mlNeeds) ? 'High' : (teacher_alert_required ? 'Medium' : 'Low');

    // Save prediction into quiz log
    const logWithPrediction = { ...result, ml_prediction: mlRes, teacher_alert_required, priority };
    appendJsonLine('quiz_logs.jsonl', { ml: logWithPrediction });

    // update DNA recommendations
    const dnas2 = readData('learning_dna.json');
    const idx2 = Array.isArray(dnas2) ? dnas2.findIndex((d: any) => d.student_id === student_id) : -1;
    if (idx2 >= 0) {
      const rec = dnas2[idx2];
      rec.recommended_difficulty = mlRes.recommended_difficulty || rec.recommended_difficulty;
      rec.learning_pace = mlRes.learning_pace || rec.learning_pace;
      writeData('learning_dna.json', dnas2);
    }

    if (teacher_alert_required) {
      const alerts = readData('teacher_alerts.json');
      const alert = { id: createId('alert'), student_id, score, reason: mlRes.reason || 'ML/Rule combined', priority, timestamp: new Date().toISOString() };
      alerts.push(alert);
      writeData('teacher_alerts.json', alerts);
    }
  }

  // update learning_dna.json topic strength
  const dnas = readData('learning_dna.json');
  const idx = Array.isArray(dnas) ? dnas.findIndex((d: any) => d.student_id === student_id) : -1;
  if (idx >= 0) {
    const rec = dnas[idx];
    rec.last_quiz_score = score;
    if (!rec.topics) rec.topics = {};
    const topic = req.body.topic || 'general';
    rec.topics[topic] = rec.topics[topic] || { strength: 50 };
    // adaptive logic
    if (score >= 80) rec.topics[topic].strength = Math.min(100, (rec.topics[topic].strength || 50) + 10);
    else if (score >= 50) rec.topics[topic].strength = rec.topics[topic].strength;
    else rec.topics[topic].strength = Math.max(0, (rec.topics[topic].strength || 50) - 15);
    writeData('learning_dna.json', dnas);
  }

  // teacher alert
  if (score < 50) {
    const alerts = readData('teacher_alerts.json');
    const alert = { id: createId('alert'), student_id, score, reason: 'Low quiz score', timestamp: new Date().toISOString() };
    alerts.push(alert);
    writeData('teacher_alerts.json', alerts);
  }

  return res.json({ ok: true, result });
});

app.post('/api/session-log', (req, res) => {
  const data = req.body || {};
  const entry = { id: createId('log'), ...data, timestamp: new Date().toISOString() };
  appendJsonLine('sessions.jsonl', entry);
  res.json({ ok: true, entry });
});

app.post('/api/ml/predict-learning', (req, res) => {
  const payload = req.body || {};
  const ml = runPythonPredict(payload);
  if (!ml) return res.json({ ok: false, error: 'ML model not available' });
  res.json({ ok: true, prediction: ml });
});

app.post('/api/socratic-chat', async (req, res) => {
  const { student_id, topic, message } = req.body || {};
  const triggers = ["give me the answer", "what is the answer", "just tell me", "answer"]; 
  const isDirect = triggers.some(t => (message || '').toLowerCase().includes(t));
  if (isDirect) {
    const hint = "Try isolating the variable first; what operation would remove the constant?";
    return res.json({ ok: true, reply: hint, blocked: true });
  }
  const fallback = { reply: "Think of the problem step-by-step. What if you subtract on both sides?" };
  const prompt = `You are a Socratic mentor for topic ${topic}. Ask a single probing question based on student input: ${message}`;
  const r = await callGemini(prompt, fallback);
  if (!r.success) return res.json({ ok: true, reply: fallback.reply });
  const reply = r.data.text || fallback.reply;
  appendJsonLine('sessions.jsonl', { student_id, topic, message, reply });
  res.json({ ok: true, reply });
});

app.post('/api/tutor-flip', async (req, res) => {
  const { student_id, topic, student_explanation } = req.body || {};
  const fallback = {
    clarity: 84, correctness: 76, reasoning_depth: 68, concept_understanding: 72, authenticity: 91,
    feedback: 'Demo feedback: good analogy, refine inverse operation explanation.',
    follow_up_question: 'If we add a constant, how does that affect the unknown?'
  };
  const prompt = `Evaluate explanation for ${topic}: ${student_explanation}. Return JSON with clarity, correctness, reasoning_depth, concept_understanding, authenticity, feedback, follow_up_question.`;
  const r = await callGemini(prompt, fallback);
  let parsed = fallback;
  if (r.success) {
    try { parsed = JSON.parse(r.data.text || '{}'); } catch(e) { parsed = fallback; }
  }
  // Save fingerprint and proof score
  const fingerprint = { id: createId('fp'), student_id, topic, metrics: parsed, timestamp: new Date().toISOString() };
  const fps = readData('cognitive_fingerprints.json') || [];
  fps.push(fingerprint);
  writeData('cognitive_fingerprints.json', fps);
  appendJsonLine('sessions.jsonl', { student_id, topic, event: 'tutor_flip', result: parsed });
  res.json({ ok: true, result: parsed });
});

app.post('/api/generate-fingerprint', (req, res) => {
  const { student_id } = req.body || {};
  const fp = { id: createId('fp'), student_id, factors: { memory: 80, reasoning: 75 }, timestamp: new Date().toISOString() };
  const fps = readData('cognitive_fingerprints.json') || [];
  fps.push(fp);
  writeData('cognitive_fingerprints.json', fps);
  res.json({ ok: true, fingerprint: fp });
});

app.get('/api/teacher/alerts', (req, res) => {
  res.json(readData('teacher_alerts.json'));
});

app.get('/api/report/:session_id', (req, res) => {
  const sid = req.params.session_id;
  // search sessions.jsonl for matching id
  const lines = fs.existsSync(path.join(DATA_DIR, 'sessions.jsonl')) ? fs.readFileSync(path.join(DATA_DIR, 'sessions.jsonl'), 'utf-8').split('\n').filter(Boolean) : [];
  const matches = lines.map(l => { try { return JSON.parse(l); } catch(e){return null;} }).filter(Boolean).filter((s: any) => s.id === sid || s.session_id === sid);
  const report = matches.length ? { session: matches[0], related: matches } : { message: 'No session found' };
  res.json(report);
});

app.get("/api/dna/:student_id", (req, res) => {
  const dnas = readData("learning_dna.json");
  const dna = dnas.find((d: any) => d.student_id === req.params.student_id) || {};
  res.json(dna);
});

app.get("/api/fingerprint/:student_id", (req, res) => {
  const fingerprints = readData("cognitive_fingerprints.json");
  const fingerprint = fingerprints.find((f: any) => f.student_id === req.params.student_id) || {};
  res.json(fingerprint);
});

// Teacher Dashboard Data
app.get("/api/teacher/dashboard", (req, res) => {
    const students = readData("students.json");
    const dnas = readData("learning_dna.json");
    const alerts = readData("teacher_alerts.json");
    const fingerprints = readData("cognitive_fingerprints.json");
    
    res.json({
        total_students: students.length,
        average_proof_score: 85, // Mock average
        alerts: alerts.length ? alerts : [
          { id: 1, name: "Arjun Kumar", topic: "Fractions", problem: "Denominator confusion", priority: "High" },
          { id: 2, name: "Sneha Reddy", topic: "Calculus", problem: "Repeated calculation error", priority: "Medium" }
        ],
        students: students.map((s: any) => ({
            ...s,
            dna: dnas.find((d: any) => d.student_id === s.id),
            fingerprint: fingerprints.find((f: any) => f.student_id === s.id)
        }))
    });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Key is ${process.env.GEMINI_API_KEY ? 'set' : 'not set'}`);
  });
}

startServer();

