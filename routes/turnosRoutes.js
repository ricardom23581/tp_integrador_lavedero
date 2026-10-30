/**
 * Rutas de turnos: solo dicen QUÉ verbo + path llama a QUÉ función del controller.
 * El prefijo /turnos lo pone quien monta este router.
 */
import { Router } from "express";

export function crearTurnosRouter(controller) {
  const router = Router();

  router.get("/", controller.listar);
  router.get("/:id", controller.obtener);
  router.post("/", controller.crear);
  router.put("/:id", controller.actualizar);
  router.delete("/:id", controller.eliminar);

  return router;
}

// ¿Por qué crearTurnosRouter(controller) y no un router que importa el controller?	Porque el controller se inyecta. El router no sabe de dónde viene, y así el container decide todo