import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import buildOpenApiSpec from "../docs/openapi.js";

export function crearDocsRouter() {
  const router = Router();
  const spec = buildOpenApiSpec();

  router.get("/openapi.json", (req, res) => res.json(spec));
  router.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

  return router;
}
