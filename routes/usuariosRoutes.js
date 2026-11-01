/**
 * Rutas de usuarios: verbo + path → validaciones → controller.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  usuarioIdParamSchema,
  listarUsuariosQuerySchema,
} from "../schemas/usuarioSchema.js";

export function crearUsuariosRouter(controller) {
  const router = Router();

  router.get("/", validate(listarUsuariosQuerySchema, "query"), controller.listar);
  router.get("/:id", validate(usuarioIdParamSchema, "params"), controller.obtener);
  router.post("/", validate(crearUsuarioSchema), controller.crear);
  router.put(
    "/:id",
    validate(usuarioIdParamSchema, "params"),
    validate(actualizarUsuarioSchema),
    controller.actualizar
  );
  router.delete("/:id", validate(usuarioIdParamSchema, "params"), controller.eliminar);

  return router;
}