const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;

connectDB()
  .then(() => {
    const server = HOST ? app.listen(PORT, HOST) : app.listen(PORT);
    server.on('listening', () => {
      console.log(`Server running on ${HOST ? `http://${HOST}:${PORT}` : `http://localhost:${PORT}`}`);
    });
  })
  .catch((error) => {
    console.error('Backend startup failed:', error?.message || error);
    process.exit(1);
  });
