/**
 * Notificador por consola. Efecto secundario: imprimir el evento.
 * Interfaz común de todos los notificadores: async notify(evento, payload)
 */
export function makeConsoleNotifier() {
  return {
    async notify({ subject, body }) {
      console.log(`[NOTIFICACIÓN] ${subject} — ${body}`);
    },
  };
}