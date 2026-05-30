const express = require('express');
const cors = require('cors');

const routes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is healthy',
    data: {
      service: 'ai-software-builder-backend',
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/api/v1', routes);

module.exports = app;
