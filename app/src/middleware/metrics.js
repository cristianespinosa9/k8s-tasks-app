const { httpRequestsTotal, httpRequestDuration } = require('../config/metrics');

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    // req.route.path da el patrón ("/tasks/:id"), no la URL exacta,
    // para no explotar la cardinalidad de las métricas.
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
}

module.exports = metricsMiddleware;
