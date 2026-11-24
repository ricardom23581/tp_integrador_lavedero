/**
 * Demo (Clase 15, ejercicio 2.2): cómo se ve un esquema de Zod convertido a JSON Schema.
 *   node scripts/zodDemo.js
 *
 * Se imprimen dos esquemas, cada uno con io "input" (lo que el cliente MANDA) y con io "output"
 * (lo que queda DESPUÉS de aplicar defaults y transformaciones).
 *
 * Pregunta: ¿qué cambia en `limit` (listarTurnosQuerySchema)? ¿Y en `fechas` (verificarFeriadosQuerySchema)?
 *  - `limit` tiene `.default(20)`: con io "input" es OPCIONAL (el cliente puede no mandarlo); con io "output" es
 *    OBLIGATORIO, porque cuando el caso de uso lo recibe, Zod ya le puso el 20.
 *  - `fechas` llega como TEXTO ("2026-12-25,2026-12-26") y un `.transform` lo convierte en ARREGLO. Con io "input"
 *    es un string; con io "output" es un array de strings.
 *  - `ausentes` tiene un `.transform(() => true)`: con io "output" sale como `{}` (JSON Schema no puede describir
 *    una función), y con io "input" sale como enum ["true"].
 *  ¿Cuál corresponde documentar para un pedido? El "input": la documentación le dice al cliente qué puede MANDAR,
 *  no en qué lo convierte nuestro servidor. Documentar el "output" haría creer que `limit` es obligatorio
 *  o que `fechas` se manda como arreglo.
 *
 * Ejercicio 2.3 — ¿Aparecen las reglas finas en el JSON Schema?
 *  - El `pattern` de la patente y el de la fecha (formato) SÍ aparecen: son regex.
 *  - El horario de atención (`esHorarioDeAtencion`) y que la fecha exista (`fechaExiste`) son `refine`: NO aparecen.
 *  - El "desde <= hasta" de `listarTurnosQuerySchema` es un `refine` sobre todo el objeto: NO aparece.
 *  Lo que no se ve, se explica con `.meta({ description })` en el esquema (ver schemas/).
 */
import { listarTurnosQuerySchema } from "../schemas/turnoSchema.js";
import { verificarFeriadosQuerySchema } from "../schemas/feriadoSchema.js";
import { jsonSchema } from "../docs/zodToOpenApi.js";

const casos = [
  ["listarTurnosQuerySchema", listarTurnosQuerySchema],
  ["verificarFeriadosQuerySchema", verificarFeriadosQuerySchema],
];

for (const [nombre, esquema] of casos) {
  for (const io of ["input", "output"]) {
    console.log(`\n===== ${nombre} — io: "${io}" =====`);
    console.log(JSON.stringify(jsonSchema(esquema, { io }), null, 2));
  }
}