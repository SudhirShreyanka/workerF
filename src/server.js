const express = require('express');
const path = require('path');
const { config, logFrontendConfig } = require('./config');

const app = express();

/**
 * 1. Railway Frontend Healthcheck
 * Responds immediately to verify container health on Railway.
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'frontend-bff',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// JSON body parsing with request size limit
app.use(express.json({ limit: '100kb' }));

// Serve static UI assets from public folder
app.use(express.static(path.join(__dirname, '../public')));

/**
 * 2. BFF Reverse Proxy: Check Backend Health
 * Allows the browser UI to check connectivity without exposing the Render URL.
 */
app.get('/api/backend-health', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${config.backendUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: 'ok',
        connected: true,
        backendUptime: data.uptime,
      });
    }

    return res.status(502).json({
      status: 'error',
      connected: false,
      message: `Backend returned HTTP ${response.status}`,
    });
  } catch (error) {
    return res.status(502).json({
      status: 'error',
      connected: false,
      message: 'Backend API unreachable or timed out.',
    });
  }
});

/**
 * 3. BFF Reverse Proxy: Send Email
 * The browser sends email data to this same-origin endpoint.
 * The server attaches the secret token and proxies securely to Render.
 */
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body || {};

  // Basic client request validation
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({
      status: 'error',
      error: 'Validation Error',
      message: 'Recipient, subject, and message content are required.',
    });
  }

  if (!config.apiSecret) {
    console.error('[Frontend BFF Error] API_SECRET is not configured on Railway server.');
    return res.status(500).json({
      status: 'error',
      error: 'Server Misconfiguration',
      message: 'Backend authentication secret is missing on the frontend server.',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout for SMTP handshake

    const backendRes = await fetch(`${config.backendUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiSecret}`,
      },
      body: JSON.stringify({ to, subject, text, html }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await backendRes.json();
    return res.status(backendRes.status).json(data);
  } catch (error) {
    console.error('[Frontend BFF Error] Proxy request failed:', error.message);
    return res.status(502).json({
      status: 'error',
      error: 'Proxy Error',
      message: 'Unable to communicate with the backend email service. Please check backend status.',
    });
  }
});

// Catch-all route to serve UI
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start frontend server
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`[Frontend BFF] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[Frontend BFF] Proxying to: ${config.backendUrl}`);
  console.log(`===============================================`);
  logFrontendConfig();
});
