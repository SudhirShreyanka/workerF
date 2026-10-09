require('dotenv').config();

const rawPort = process.env.PORT;
const parsedPort = parseInt(rawPort, 10);
const port = !isNaN(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const config = {
  port,
  backendUrl: (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, ''),
  apiSecret: process.env.API_SECRET ? process.env.API_SECRET.trim() : '',
};

function logFrontendConfig() {
  console.log(`[Frontend Config] Port: ${config.port}`);
  console.log(`[Frontend Config] Backend Proxy Target: ${config.backendUrl}`);
  console.log(`[Frontend Config] Server-side API_SECRET configured: ${config.apiSecret ? 'Yes (✓)' : 'No (✗)'}`);
}

module.exports = {
  config,
  logFrontendConfig,
};
