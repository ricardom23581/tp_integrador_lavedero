/**
 * Rutas de turnos: verbo + path → validaciones → controller.
 * Si una validación falla, el controller nunca se ejecuta.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import {
  crearTurnoSchema,
  actualizarTurnoSchema,
  idParamSchema,
  listarTurnosQuerySchema,
} from "../schemas/turnoSchema.js";

export function crearTurnosRouter(controller) {
  const router = Router();

  router.get("/", validate(listarTurnosQuerySchema, "query"), controller.listar);
  router.get("/:id", validate(idParamSchema, "params"), controller.obtener);
  router.post("/", validate(crearTurnoSchema), controller.crear);
  router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(actualizarTurnoSchema),
    controller.actualizar
  );
  router.delete("/:id", validate(idParamSchema, "params"), controller.eliminar);

  return router;
}