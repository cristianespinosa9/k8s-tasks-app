const express = require('express');
const tasksController = require('../controllers/tasksController');

const router = express.Router();

router.get('/tasks', tasksController.list);
router.post('/tasks', tasksController.create);
router.patch('/tasks/:id', tasksController.update);
router.delete('/tasks/:id', tasksController.remove);

module.exports = router;
