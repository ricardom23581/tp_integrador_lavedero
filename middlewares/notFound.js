/**
 * notFound: se registra después de todas las rutas.
 * Si un request llegó hasta acá, ninguna ruta matcheó → 404 con el formato estándar.
 */
export default function notFound(req, res) {
  res.status(404).json({
    error: {
      code: "RUTA_NO_ENCONTRADA",
      message: `No existe la ruta ${req.method} ${req.originalUrl}`,
    },
  });
}