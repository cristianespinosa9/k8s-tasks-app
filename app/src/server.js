const createApp = require('./app');
const taskModel = require('./models/taskModel');

const PORT = process.env.PORT || 3000;
const app = createApp();

taskModel
  .initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`tasks-api escuchando en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo inicializar la BD, arrancando igual (readiness fallará):', err.message);
    app.listen(PORT, () => console.log(`tasks-api escuchando en puerto ${PORT} (sin BD lista)`));
  });
