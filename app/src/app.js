const express = require('express');
const metricsMiddleware = require('./middleware/metrics');
const healthRoutes = require('./routes/healthRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(metricsMiddleware);

  app.use(metricsRoutes);   // GET /metrics
  app.use(healthRoutes);    // GET /health, /ready
  app.use(tasksRoutes);     // /tasks...

  app.get('/', (req, res) => {
    res.json({
      service: 'tasks-api',
      endpoints: [
        '/health', '/ready', '/metrics',
        'GET /tasks', 'POST /tasks', 'PATCH /tasks/:id', 'DELETE /tasks/:id',
      ],
    });
  });

  return app;
}

module.exports = createApp;
