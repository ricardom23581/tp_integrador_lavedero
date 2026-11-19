/**
 * Controller de feriados (Clase 12).
 * Recibe los casos de uso por inyección: no conoce el gateway ni la API externa.
 */
export function makeFeriadosController(useCases) {
  // GET /api/feriados/verificar?fechas=...&mode=sequential|parallel|limited|batch
  const verificar = async (req, res) => {
    res.status(200).json(await useCases.verificarFechas(req.validated.query));
  };

  return { verificar };
}