import { verificarFeriadosQuerySchema } from "../../schemas/feriadoSchema.js";
import { VerificacionFeriados } from "../responseSchemas.js";
import { operation, ref, json } from "../operation.js";

const feriadosPaths = {
  "/feriados/verificar": {
    get: operation({
      tag: "Feriados",
      id: "verificarFeriados",
      summary: "Consultar feriados para varias fechas",
      description: "Los errores del calendario se incluyen en el resultado de cada fecha; no interrumpen la consulta completa.",
      auth: "user",
      query: verificarFeriadosQuerySchema,
      responses: { "200": json("Resultado de la consulta", ref("VerificacionFeriados")) },
    }),
  },
};

export default feriadosPaths;
