/**
 * Rutas de turnos: verbo + path → autenticación/permisos → validaciones → controller.
 * Si algo falla en el camino, el controller nunca se ejecuta.
 *
 * Acceso: todo exige estar autenticado; modificar o eliminar un turno es solo de admin.
 * Reprogramar (Clase 13) lo puede hacer el dueño del turno o el admin: eso lo decide el caso de uso.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import {
  crearTurnoSchema,
  actualizarTurnoSchema,
  idParamSchema,
  listarTurnosQuerySchema,
  exportarTurnosQuerySchema,
  reprogramarTurnoSchema,
} from "../schemas/turnoSchema.js";

export function crearTurnosRouter(controller, { authenticate, authorize }) {
  const router = Router();

  // Todas las rutas de turnos requieren un token válido
  router.use(authenticate);

  router.get("/", validate(listarTurnosQuerySchema, "query"), controller.listar);
    // Clase 12. ¿Qué pasaría si "/export.csv" se declarara DESPUÉS de "/:id"?
  // Express prueba las rutas en orden y "/:id" acepta cualquier texto, incluido "export.csv":
  // la validación del id respondería un 400 y la exportación nunca se ejecutaría.
  // Por eso las rutas fijas van antes que las que tienen parámetros.
  router.get(
    "/export.csv",
    authorize("admin"),
    validate(exportarTurnosQuerySchema, "query"),
    controller.exportarCsv
  );
  router.get("/:id/detalle", validate(idParamSchema, "params"), controller.detalle);
  router.get("/:id", validate(idParamSchema, "params"), controller.obtener);
  router.post("/", validate(crearTurnoSchema), controller.crear);
  router.put(
    "/:id/reprogramar",
    validate(idParamSchema, "params"),
    validate(reprogramarTurnoSchema),
    controller.reprogramar
  );
  router.put(
    "/:id",
    authorize("admin"),
    validate(idParamSchema, "params"),
    validate(actualizarTurnoSchema),
    controller.actualizar
  );
  router.delete("/:id", authorize("admin"), validate(idParamSchema, "params"), controller.eliminar);

  return router;
}