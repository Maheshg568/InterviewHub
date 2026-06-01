const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required to initialize sessions and database connection.');
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS origin not allowed'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'replace_with_long_random_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Interview Experience Hub API is running' });
});

app.use(/^\/api(\/|$)/, (req, res) => {
  return res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  if (!err) return next();
  if (req.path.startsWith('/api')) {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
  return next(err);
});

module.exports = app;
