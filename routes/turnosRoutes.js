/**
 * Rutas de turnos: verbo + path → autenticación/permisos → validaciones → controller.
 * Si algo falla en el camino, el controller nunca se ejecuta.
 *
 * Acceso: todo exige estar autenticado; modificar o eliminar un turno es solo de admin.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import {
  crearTurnoSchema,
  actualizarTurnoSchema,
  idParamSchema,
  listarTurnosQuerySchema,
} from "../schemas/turnoSchema.js";

export function crearTurnosRouter(controller, { authenticate, authorize }) {
  const router = Router();

  // Todas las rutas de turnos requieren un token válido
  router.use(authenticate);

  router.get("/", validate(listarTurnosQuerySchema, "query"), controller.listar);
  router.get("/:id", validate(idParamSchema, "params"), controller.obtener);
  router.post("/", validate(crearTurnoSchema), controller.crear);
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