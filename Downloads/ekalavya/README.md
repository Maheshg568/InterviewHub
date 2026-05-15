<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fe31e2be-9828-4796-bfa1-f2828350b060

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. (Optional) Create a `.env` file in the project root with:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

If you do not provide a Gemini key the server will run in demo fallback mode and return canned responses.

3. Run the app:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

API Endpoints (used by frontend):

- `GET /api/health` - basic health check
- `GET /api/sample` - sample metadata
- `GET /api/sample-data` - sample students & assignments
- `POST /api/simplify` - body `{ text }` returns simplified lesson JSON
- `POST /api/tutor` - body `{ student_id, message }` returns tutor reply
- `POST /api/socratic-chat` - body `{ student_id, topic, message }` returns socratic reply
- `POST /api/tutor-flip` - body `{ student_id, topic, student_explanation }` returns evaluation JSON
- `POST /api/generate-quiz` - generate adaptive quiz
- `POST /api/submit-quiz` - submit answers and calculate score
- `POST /api/session-log` - append session log
- `POST /api/generate-fingerprint` - create a cognitive fingerprint
- `GET /api/teacher/alerts` - list teacher alerts
- `GET /api/report/:session_id` - get session report

Notes:
- Gemini API key is used only on the backend (`server.ts`). The frontend no longer calls Gemini directly.
- Data is persisted in the `data/` folder using JSON files and newline-delimited logs for sessions and quizzes.

**Machine Learning Training**

This project includes a lightweight ML pipeline for predicting student support needs and adaptive recommendations. Models are trained on synthetic data and used only for adaptive decisions (not replacing Gemini).

To generate data and train models (requires Python 3.8+):

```bash
cd backend/ml
pip install -r requirements-ml.txt
python generate_dataset.py
python train_model.py
python predict.py  # optional sample run; accepts JSON via stdin or as an arg
```

Artifacts:
- `backend/ml/data/student_learning_data.csv` — synthetic dataset (500 rows)
- `backend/ml/models/support_model.pkl` — needs_support model
- `backend/ml/models/difficulty_model.pkl` — recommended difficulty model
- `backend/ml/models/pace_model.pkl` — learning pace model
- `backend/ml/predict.py` — prediction script used by the backend

The backend exposes `/api/ml/predict-learning` which forwards session data to the predictor. The server will gracefully fallback to rule-based logic if the ML models are not available.

## DeepLink Workspace — Verifiable Learning (Integrated)

This project integrates DeepLink-inspired verifiable learning features into Ekalavya. Key additions:

- **Socratic Grind:** AI guides students with one-question-at-a-time Socratic mentoring. Direct answer requests are politely blocked and logged.
- **AI-Tutor Flip:** Students teach the AI; the AI evaluates explanations for clarity, correctness, reasoning depth, and authenticity.
- **Cognitive Fingerprint:** The system captures session logs, hints used, timing, struggle points, and mastery moments to generate a Cognitive Fingerprint and a unique Cognitive ID.
- **Proof of Thought Score:** Aggregates Socratic engagement, teaching verification, cognitive depth, and effort consistency into a single score to indicate authenticity of learning.
- **Teacher Trust Dashboard:** Teacher endpoints and pages surface effort heatmaps, struggle points, mastery moments, proof scores, and suggested actions.

All calls to Gemini are proxied through the backend. If `GEMINI_API_KEY` is missing, the server provides safe demo fallbacks so the UI remains interactive.

### New / Important API Behavior (DeepLink-focused)

- `POST /api/socratic-chat` — Socratic mentor. Blocks direct-answer requests and logs exchanges.
- `POST /api/tutor-flip` — Analyze student explanations and store analysis in `data/cognitive_fingerprints.json`.
- `POST /api/generate-fingerprint` — Aggregate a session into a Cognitive Fingerprint and create a `cognitive_id` stored in `data/cognitive_ids.json`.
- `GET /api/fingerprint/:student_id` — Retrieve latest cognitive fingerprint for a student.
- `GET /api/teacher/dashboard` — Teacher view with aggregated students, alerts, fingerprints and proof score summaries.

### Cognitive ID format and storage

Every generated fingerprint gets a `cognitive_id` of the format `COG-{student_id}-{topic_code}-{year}-{rand4}` and is stored in `data/cognitive_ids.json`.

### Demo Flow (quick)

1. Run app locally (`npm run dev`).
2. Login as a demo student (S001 / Arjun).
3. Open a lesson and use the **Start Socratic Grind** flow — ask for a hint, observe direct answer blocking.
4. Take a quiz; view mistake analysis and Learning DNA changes.
5. Use **AI-Tutor Flip** to explain back and receive a semantic evaluation.
6. Generate a Cognitive Fingerprint and view the Proof of Thought score and Cognitive ID in the Cognitive Fingerprint page.
7. Login as teacher and open the Teacher Dashboard to review alerts, effort heatmap, and suggested actions.

### Security / Notes

- The Gemini API key must only be placed in `.env` at the project root and is accessed only by `server.ts`. The frontend never imports `@google/genai` nor has access to the key.
- For environments without Gemini, the backend returns safe demo responses and still persists session logs and fingerprints for demonstration.

## Added data files
The following file was added for Cognitive ID storage:

- `data/cognitive_ids.json` — list of Cognitive IDs and metadata.

## Where to look (key files)

- Backend endpoints: `server.ts`
- Socratic UI: `src/pages/SocraticSession.tsx`
- Tutor-Flip UI: `src/pages/TutorFlip.tsx`
- Cognitive Fingerprint UI: `src/pages/CognitiveFingerprint.tsx`
- Teacher dashboard: `src/pages/TeacherDashboard.tsx`

---

If you want, I can now run the dev server (stop any process on port 3000 first) and walk through the demo flows interactively, or I can add a CLI script to generate a sample Cognitive ID and fingerprint for the three demo students.
