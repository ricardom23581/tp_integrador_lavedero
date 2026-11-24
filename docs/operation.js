import { body, query, path } from "./zodToOpenApi.js";
import { ERROR_CATALOG, errorExample } from "./errorCatalog.js";

const STATUS_TEXT = {
  400: "Pedido inválido",
  401: "No autenticado",
  403: "Sin permiso",
  404: "No encontrado",
  409: "Conflicto con el estado actual o una regla de negocio",
  422: "Regla de negocio no satisfecha",
  429: "Demasiados intentos",
  500: "Error interno",
  502: "Falló el servicio externo",
  504: "El servicio externo no respondió a tiempo",
};

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (schema) => ({ type: "array", items: schema });
const json = (description, schema, extra = {}) => ({
  description,
  content: { "application/json": { schema } },
  ...extra,
});

function errorResponses(codes) {
  const byStatus = {};
  for (const code of codes) {
    const entry = ERROR_CATALOG[code];
    if (!entry) throw new Error(`Código de error sin documentar en errorCatalog.js: ${code}`);
    const [status] = entry;
    (byStatus[status] ??= []).push(code);
  }

  return Object.fromEntries(
    Object.entries(byStatus).map(([status, statusCodes]) => [
      status,
      {
        description: `${STATUS_TEXT[status]}: ${statusCodes.map((code) => `\`${code}\``).join(", ")}`,
        content: {
          "application/json": {
            schema: ref("ErrorResponse"),
            examples: Object.fromEntries(
              statusCodes.map((code) => [code, { summary: code, value: errorExample(code) }])
            ),
          },
        },
      },
    ])
  );
}

function operation({
  tag,
  id,
  summary,
  description,
  auth = "public",
  params,
  query: querySchema,
  body: bodySchema,
  bodyExample,
  responses,
  errors = [],
}) {
  const codes = [];
  if (params || querySchema || bodySchema) codes.push("VALIDACION");
  if (bodySchema) codes.push("JSON_INVALIDO");
  if (auth !== "public") codes.push("TOKEN_FALTANTE", "TOKEN_INVALIDO", "TOKEN_VENCIDO");
  if (auth === "admin") codes.push("PROHIBIDO");
  codes.push(...errors.filter((code) => !codes.includes(code)));
  if (!codes.includes("ERROR_INTERNO")) codes.push("ERROR_INTERNO");

  const parameters = [...(params ? path(params) : []), ...(querySchema ? query(querySchema) : [])];
  const access = {
    public: "Público.",
    user: "Requiere token válido.",
    admin: "Requiere token válido de administrador.",
  }[auth];

  return {
    tags: [tag],
    operationId: id,
    summary,
    description: [access, description].filter(Boolean).join("\n\n"),
    security: auth === "public" ? [] : [{ bearerAuth: [] }],
    "x-roles": auth === "admin" ? ["admin"] : auth === "user" ? ["user", "admin"] : [],
    ...(parameters.length > 0 && { parameters }),
    ...(bodySchema && { requestBody: body(bodySchema, { example: bodyExample }) }),
    responses: { ...responses, ...errorResponses(codes) },
  };
}

export { operation, ref, arrayOf, json };
