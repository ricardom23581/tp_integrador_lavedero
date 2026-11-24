import express from "express";
import request from "supertest";
import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import buildOpenApiSpec from "../../docs/openapi.js";
import { crearDocsRouter } from "../../routes/docsRoutes.js";

describe("documentación OpenAPI", () => {
  it("genera un contrato OpenAPI válido con todas las operaciones de la API", async () => {
    const spec = buildOpenApiSpec();

    await expect(SwaggerParser.validate(spec)).resolves.toBeDefined();
    expect(Object.keys(spec.paths)).toEqual(
      expect.arrayContaining([
        "/auth/register",
        "/auth/login",
        "/auth/me",
        "/auth/password",
        "/turnos",
        "/turnos/export.csv",
        "/turnos/{id}",
        "/turnos/{id}/detalle",
        "/turnos/{id}/reprogramar",
        "/usuarios",
        "/usuarios/{id}",
        "/feriados/verificar",
      ])
    );
    expect(spec.servers[0].url).toBe("/api");
  });

  it("documenta como opcionales los valores con default y mantiene el formato que el cliente envía", () => {
    const spec = buildOpenApiSpec();
    const queryParameters = spec.paths["/turnos"].get.parameters;
    const limit = queryParameters.find((parameter) => parameter.name === "limit");
    const fechas = spec.paths["/feriados/verificar"].get.parameters.find(
      (parameter) => parameter.name === "fechas"
    );

    expect(limit.required).toBe(false);
    expect(limit.schema.default).toBe(20);
    expect(fechas.schema.type).toBe("string");
  });

  it("sirve el JSON OpenAPI y Swagger UI solo a través del router de documentación", async () => {
    const app = express().use(crearDocsRouter());
    const openapi = await request(app).get("/openapi.json");
    const swagger = await request(app).get("/docs/");

    expect(openapi.status).toBe(200);
    expect(openapi.body.openapi).toBe("3.1.0");
    expect(swagger.status).toBe(200);
    expect(swagger.text).toContain("swagger-ui");
  });
});
