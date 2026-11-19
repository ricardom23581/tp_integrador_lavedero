// scripts/csvDemo.js — prueba de utils/csv.js: node scripts/csvDemo.js
import { toCsv } from "../utils/csv.js";

const filas = [
  { patente: "AB123CD", cliente: 'Pérez, "Juan"', obs: "línea 1\nlínea 2" },
  { patente: "ABC123", cliente: '=HYPERLINK("http://sitio-malo.com","clic")', obs: "+cmd" },
  { patente: "AA111BB", cliente: "@SUMA(1+1)", obs: -5 },
];
const columnas = [
  { header: "patente", value: (r) => r.patente },
  { header: "cliente", value: (r) => r.cliente },
  { header: "obs", value: (r) => r.obs },
];

// JSON.stringify muestra los caracteres invisibles (BOM, \r\n) tal cual viajan
console.log("separador ',':", JSON.stringify(toCsv(filas, columnas)));
console.log("separador ';':", JSON.stringify(toCsv(filas, columnas, { separator: ";" })));

// Qué se espera ver:
//  - 'Pérez, "Juan"' queda entre comillas y con las comillas duplicadas.
//  - El salto de línea queda dentro de la celda entre comillas.
//  - '=HYPERLINK(...)', '+cmd' y '@SUMA(...)' empiezan con un apóstrofe: Excel los trata como texto, no como fórmula.
//  - El número -5 NO se toca (es un number, no un texto).