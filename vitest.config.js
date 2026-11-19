import { defineConfig } from "vitest/config";

/**
 * Configuración de Vitest (Clase 14).
 * - Solo corre los archivos *.test.js de la carpeta tests/ (no hace falta levantar el servidor ni tener un .env).
 * - restoreMocks: después de cada test se deshacen los vi.spyOn (por ejemplo, el silenciado de console.warn).
 * - La cobertura se mide sobre lo que testeamos: dominio, casos de uso, utilidades y gateways (el calendario).
 *
 * Ejercicio 1.6 — ¿Por qué Vitest va en devDependencies? Porque solo se usa para DESARROLLAR (correr los tests),
 * no para que la API funcione. En producción se instala con `npm ci --omit=dev`: si Vitest estuviera en
 * dependencies, se instalarían decenas de paquetes que nunca se ejecutan (más espacio, más tiempo de deploy y
 * más superficie para vulnerabilidades), y quien lea el package.json pensaría que la app lo necesita para correr.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["domain/**", "usecases/**", "utils/**", "gateways/**"],
      reporter: ["text", "html"], // "html" deja un reporte navegable en coverage/index.html
    },
  },
});