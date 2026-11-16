/**
 * Bus de eventos: canal por el que los casos de uso anuncian lo que pasó
 * (ej: "turno.creado") sin saber quién lo escucha.
 * Es una factory y no un singleton: lo crea e inyecta el container.
 */
import { EventEmitter } from "node:events";

export function makeEventBus() {
  return new EventEmitter();
}