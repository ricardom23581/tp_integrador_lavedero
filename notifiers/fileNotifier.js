/**
 * Notificador por archivo. Misma interfaz que el de consola:
 * agrega una línea por evento al archivo indicado.
 */
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export function makeFileNotifier({ filePath }) {
  return {
    async notify({ subject, body }) {
      await mkdir(path.dirname(filePath), { recursive: true });
      const linea = `${new Date().toISOString()} | ${subject} | ${body}\n`;
      await appendFile(filePath, linea);
    },
  };
}