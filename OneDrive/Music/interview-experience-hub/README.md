# Interview Experience Hub - Prototype

A full-stack prototype of a student-focused interview practice platform, built with React, Vite, Node.js, Express, and an OpenAI API integration for practice questions.

## Features Included (Prototype Scope)
- **Role-based Dashboards:** Dedicated views for Students and Interviewers.
- **Booking Flow:** Select an interviewer, choose a date/slot, and simulate payment upload.
- **Feedback & Progress:** Interviewers submit structured feedback; students view their progress with milestone celebrations.
- **AI Practice Module:** Generates topic-specific practice questions using OpenAI.
- **Data Persistence:** MongoDB Atlas with hashed passwords (bcrypt).

## Prerequisites
- Node.js (v18+ recommended)
- An OpenAI API Key

## Setup & Run Instructions

### 1. Clone the project (if applicable) or enter the directory
```bash
# If you haven't already:
git clone <project>
cd interview-experience-hub
```

### 2. Configure Environment Variables
Inside the project root, rename `.env.example` to `.env` and add your OpenAI Key:
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start the Backend
```bash
cd backend
npm install
npm run seed     # This will create demo users and a sample booking
node server.js
```
The backend will run on `http://localhost:5000`.

### 4. Start the Frontend (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`. Open this URL in your browser.

## Default Demo Accounts (created by `npm run seed`)
- **Student:** `student@demo.com` / `password123`
- **Interviewer:** `interviewer@demo.com` / `password123`

## Quick Demo Steps
If you're presenting this live, follow the steps in `demo-script.txt` for the best flow (Landing -> Login Student -> Book -> Login Interviewer -> Accept -> Give Feedback -> Student views feedback -> AI Practice). Payment verification can be simulated via the checkbox on the booking form.

## Notes on Production Readiness
- **Database:** Uses MongoDB Atlas via `MONGODB_URI`.
- **Payment Proof Storage:** Uses Cloudinary URLs for proof files.
- **Video Calls:** Google Meet link upload is manual by interviewer (no external meeting API integration).

## Vercel Hosting Setup

### Architecture
- Frontend: React + Vite deployed on Vercel.
- Backend: Express app exported for Vercel serverless (`api/index.js`) and local run (`backend/server.js`).
- Database: MongoDB Atlas via `MONGODB_URI`.
- Payment Proof Storage: Cloudinary (`interview-experience-hub/payment-proofs`).

### 1. Create MongoDB Atlas database
- Create cluster and database user.
- Network access: allow deployment IPs (commonly `0.0.0.0/0` for hosted environments).
- Copy connection string into `MONGODB_URI`.

### 2. Create Cloudinary account
- Collect `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Keep all Cloudinary secrets in backend env only.

### 3. Configure backend environment variables
Use `backend/.env.example` as template.
Required keys:
- `MONGODB_URI`
- `SESSION_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NODE_ENV=production` (for production)

### 4. Configure frontend environment variables
Use `frontend/.env.example` as template.
- `VITE_API_URL` should point to backend base URL.

### 5. Local development run
```bash
cd backend
npm install
npm run seed
npm start
```

```bash
cd frontend
npm install
npm run dev
```

### 6. Deploy backend
Option A: Vercel Functions (included config)
- Uses `api/index.js` and `vercel.json`.

Option B (recommended fallback if session behavior is not ideal for your traffic pattern)
- Deploy backend on Render/Railway.
- Keep frontend on Vercel.

### 7. Deploy frontend on Vercel
- If deploying frontend separately: set project root to `frontend`.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` in frontend env.

### 8. Production verification checklist
- Student login works.
- Student creates booking with required payment proof.
- Payment proof file appears in Cloudinary.
- Booking is persisted in MongoDB Atlas.
- Interviewer verifies payment proof.
- Interviewer accepts booking only after payment is verified.
- Student receives accepted notification popup.
- Interviewer uploads Google Meet link.
- Student receives meeting link notification and can join.
