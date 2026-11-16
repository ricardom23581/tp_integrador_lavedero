/**
 * Listeners de turnos: deciden QUÉ hacer cuando ocurre un evento de turno.
 * Traducen el evento a un mensaje { subject, body } y se lo pasan al notificador.
 * No conocen al emisor (los casos de uso) ni el canal concreto (el notifier se inyecta).
 */
import { EVENTS } from "./eventNames.js";

export function registerTurnoListeners(eventBus, notifier) {
  // Registra un listener que arma el mensaje y notifica, sin dejar escapar errores
  const escuchar = (evento, armarMensaje) => {
    eventBus.on(evento, async (turno) => {
      try {
        await notifier.notify(armarMensaje(turno));
      } catch (err) {
        // Un fallo de notificación NO debe afectar al caso de uso que emitió el evento
        console.error(`[listeners] No se pudo notificar ${evento}:`, err.message);
      }
    });
  };

  escuchar(EVENTS.TURNO_CREADO, (t) => ({
    subject: "Nuevo turno",
    body: `Turno #${t.id} para ${t.patente} (${t.tipoVehiculo}) el ${t.fecha}`,
  }));

  escuchar(EVENTS.TURNO_FINALIZADO, (t) => ({
    subject: "Lavado finalizado",
    body: `El vehículo ${t.patente} está listo para retirar (turno #${t.id})`,
  }));
}