const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Health check simple, para el liveness/readiness probe del Deployment.
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'tasks-web' });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => console.log(`tasks-web escuchando en puerto ${PORT}`));
