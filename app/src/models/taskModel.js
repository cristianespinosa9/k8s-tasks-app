const pool = require('../config/db');

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

async function checkConnection() {
  await pool.query('SELECT 1');
}

async function findAll() {
  const result = await pool.query(
    'SELECT id, title, done, created_at FROM tasks ORDER BY id DESC'
  );
  return result.rows;
}

async function create(title) {
  const result = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done, created_at',
    [title]
  );
  return result.rows[0];
}

async function updateDone(id, done) {
  const result = await pool.query(
    'UPDATE tasks SET done = $1 WHERE id = $2 RETURNING id, title, done, created_at',
    [done, id]
  );
  return result.rows[0] || null;
}

async function update(id, { title, done }) {
  const result = await pool.query(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         done  = COALESCE($2, done)
     WHERE id = $3
     RETURNING id, title, done, created_at`,
    [title ?? null, done ?? null, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

module.exports = { initDb, checkConnection, findAll, create, updateDone, update, remove };
