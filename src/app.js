const express = require('express');
const cors = require('cors');

const projectRoutes = require('./routes/project.routes');
const buildRoutes = require('./routes/build.routes');
const deployRoutes = require('./routes/deploy.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const membersRoutes = require('./routes/members.routes');
const questsRoutes = require('./routes/quests.routes');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
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

app.use('/api/projects', projectRoutes);
app.use('/api/projects', buildRoutes);
app.use('/api/projects', deployRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', membersRoutes);
app.use('/api/quests', questsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
