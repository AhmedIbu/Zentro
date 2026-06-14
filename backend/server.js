require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const downloadRouter = require('./routes/download');
const historyRouter = require('./routes/history');

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: '*',
    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
      'X-Zentro-Title',
      'X-Zentro-Platform',
      'X-Zentro-Filename',
      'X-Zentro-Filesize',
    ],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    name: 'Zentro API',
    status: 'ok',
    version: '1.0.0',
    endpoints: ['POST /download', 'GET /download/file/:id', 'GET /history'],
  });
});

app.get('/health', (req, res) => res.json({ status: 'healthy', uptime: process.uptime() }));

app.use('/download', downloadRouter);
app.use('/history', historyRouter);

// ---------------------------------------------------------------------------
// 404 + error handlers
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n  Zentro backend running on port ${PORT}`);
  console.log(`  yt-dlp:  ${process.env.YTDLP_PATH || 'yt-dlp (PATH)'}`);
  console.log(`  ffmpeg:  ${process.env.FFMPEG_LOCATION || 'PATH'}`);
  console.log(`  caching: ${process.env.ENABLE_CACHE === 'true' ? 'on' : 'off'}\n`);
});

// Media downloads can take a while; disable Node's default request timeouts so
// large transfers are not cut off mid-stream.
server.requestTimeout = 0;
server.headersTimeout = 0;
server.keepAliveTimeout = 120000;

module.exports = app;
