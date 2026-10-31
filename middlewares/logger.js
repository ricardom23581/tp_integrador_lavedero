/**
 * Logger: imprime método, URL, status y duración de cada request.
 * Middleware de aplicación: hace algo y sigue (llama a next()).
 */
export default function logger(req, res, next) {
  const inicio = Date.now();

  // "finish" se dispara cuando la response terminó de enviarse
  res.on("finish", () => {
    const ms = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms} ms)`);
  });

  next();
}