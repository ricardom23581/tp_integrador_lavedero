/**
 * Elige qué notificador usar según NOTIFIER_TYPE (console | file).
 * Mismo patrón que crearDaos() en el container con PERSISTENCE_TYPE.
 */
import { makeConsoleNotifier } from "./consoleNotifier.js";
import { makeFileNotifier } from "./fileNotifier.js";

export function makeNotifier({ type, filePath }) {
  if (type === "console") return makeConsoleNotifier();
  if (type === "file") return makeFileNotifier({ filePath });
  throw new Error(`NOTIFIER_TYPE inválido: ${type}`);
}