const mongoose = require('mongoose');

let cached = global.__mongooseConnectionCache;
if (!cached) {
  cached = global.__mongooseConnectionCache = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const error = new Error('MONGODB_URI is missing. Set MONGODB_URI in environment variables.');
    console.error(error.message);
    throw error;
  }

  if (cached.conn) return cached.conn;
  if (cached.promise) return cached.promise;

  try {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10
    }).then((m) => m.connection);
    cached.conn = await cached.promise;
    console.log('MongoDB connected');
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error?.message || error);
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

module.exports = connectDB;
