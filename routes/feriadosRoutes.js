/**
 * Rutas de feriados (Clase 12).
 * Cada consulta dispara pedidos a una API de terceros: exige estar autenticado.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import { verificarFeriadosQuerySchema } from "../schemas/feriadoSchema.js";

export function crearFeriadosRouter(controller, { authenticate }) {
  const router = Router();

  router.get("/verificar", authenticate, validate(verificarFeriadosQuerySchema, "query"), controller.verificar);

  return router;
}