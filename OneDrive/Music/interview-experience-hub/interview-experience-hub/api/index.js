const dotenv = require('dotenv');
dotenv.config({ path: 'backend/.env' });

const connectDB = require('../backend/config/db');
const app = require('../backend/app');

let dbReady = false;

module.exports = async (req, res) => {
  if (dbReady) return app(req, res);
  try {
    await connectDB();
    dbReady = true;
    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      error: 'Database connection failed',
      details: error?.message || 'Unknown database error'
    });
  }
};
