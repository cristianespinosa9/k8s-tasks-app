const express = require('express');
const { Pool } = require('pg');
const client = require('prom-client');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- Métricas ---
const register = new client.Registry();
client.collectDefaultMetrics({ register }); // CPU, memoria, event loop, GC, etc. del proceso Node

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP recibidas',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    // req.route.path da el patrón ("/tasks"), no la URL exacta, para no explotar cardinalidad
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// Liveness: solo confirma que el proceso Node responde (no depende de la BD).
// Si esto falla, Kubernetes reinicia el pod.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'tasks-api' });
});

// Readiness: confirma que la app puede hablar con Postgres.
// Si esto falla, Kubernetes saca el pod del Service (no recibe tráfico) pero no lo reinicia.
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not-ready', db: 'unreachable', error: err.message });
  }
});

app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, done, created_at FROM tasks ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title es requerido' });
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done, created_at',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    service: 'tasks-api',
    endpoints: ['/health', '/ready', 'GET /tasks', 'POST /tasks'],
  });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`tasks-api escuchando en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo inicializar la BD, arrancando igual (readiness fallará):', err.message);
    app.listen(PORT, () => console.log(`tasks-api escuchando en puerto ${PORT} (sin BD lista)`));
  });
