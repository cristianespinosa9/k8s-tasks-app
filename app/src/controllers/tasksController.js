const taskModel = require('../models/taskModel');

async function list(req, res) {
  try {
    const tasks = await taskModel.findAll();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title es requerido' });
  }
  try {
    const task = await taskModel.create(title);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: 'Debes enviar title y/o done' });
  }
  if (title !== undefined && typeof title !== 'string') {
    return res.status(400).json({ error: 'title debe ser texto' });
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done debe ser true o false' });
  }

  try {
    const task = await taskModel.update(id, { title, done });
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  try {
    const deleted = await taskModel.remove(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, create, update, remove };
