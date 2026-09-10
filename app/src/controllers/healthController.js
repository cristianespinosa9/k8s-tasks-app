const taskModel = require('../models/taskModel');

function health(req, res) {
  // Liveness: solo confirma que el proceso Node responde, no depende de la BD.
  // Si esto falla, Kubernetes reinicia el pod.
  res.status(200).json({ status: 'ok', service: 'tasks-api' });
}

async function ready(req, res) {
  // Readiness: confirma que la app puede hablar con Postgres.
  // Si esto falla, Kubernetes saca el pod del Service (sin reiniciarlo).
  try {
    await taskModel.checkConnection();
    res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not-ready', db: 'unreachable', error: err.message });
  }
}

module.exports = { health, ready };
