import AppError from "../../errors/AppError.js";
import { estaAusente } from "../../domain/situacionTurno.js";

/**
 * Regla compartida por R3 (createTurno) y R6 (reprogramarTurno): si entre `turnos` hay alguno AUSENTE al día `hoy`,
 * corta con 409 CLIENTE_CON_AUSENCIAS y en `details` lista cuáles son (el front sabe qué turnos mostrar).
 * Clase 14 - Ej. 10.3: salió del REFACTOR de TDD. Al implementar R6 en verde, el bloque quedó copiado casi igual
 * al de createTurno; con los tests en verde se pudo extraer sin miedo. Solo cambia el final del mensaje.
 */
function assertSinAusencias(turnos, hoy, accion) {
  const ausentes = turnos.filter((t) => estaAusente(t, hoy));
  if (ausentes.length > 0) {
    throw new AppError(
      "CLIENTE_CON_AUSENCIAS",
      `El cliente tiene turnos a los que no se presentó: hay que resolverlos con el lavadero antes de ${accion}`,
      409,
      ausentes.map((t) => ({ turnoId: t.id, patente: t.patente, fecha: t.fecha }))
    );
  }
}

export default assertSinAusencias;