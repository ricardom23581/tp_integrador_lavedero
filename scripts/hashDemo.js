/**
 * Demo de bcrypt (Ejercicio 2 de la clase 11). Se corre aparte: node scripts/hashDemo.js
 */
import bcrypt from "bcryptjs";

const password = "Lavadero2026";

// 1) La misma contraseña hasheada dos veces
const hashA = await bcrypt.hash(password, 10);
const hashB = await bcrypt.hash(password, 10);
console.log("hash A:", hashA);
console.log("hash B:", hashB);
console.log("¿son iguales?", hashA === hashB);

// ¿Por qué son distintos y aun así compare funciona con los dos?
// bcrypt genera un salt ALEATORIO en cada hash() y lo guarda dentro del resultado
// ($2b$10$ + 22 caracteres de salt + hash). compare() lee el salt del hash guardado,
// vuelve a hashear la contraseña con ESE salt y compara. Por eso no hay columna "salt".
console.log("compare con A:", await bcrypt.compare(password, hashA));
console.log("compare con B:", await bcrypt.compare(password, hashB));
console.log("compare con otra:", await bcrypt.compare("otra-clave", hashA));

// 2) Cuánto tarda hash() según el costo (rounds)
// Cada +1 DUPLICA el tiempo: de 4 a 10 es 64 veces más lento, de 10 a 14 otras 16 veces.
// Es lento a propósito: en un login no se nota, pero a un atacante que prueba
// millones de contraseñas se lo vuelve inviable.
for (const rounds of [4, 10, 14]) {
  const inicio = performance.now();
  await bcrypt.hash(password, rounds);
  console.log(`rounds ${String(rounds).padStart(2)}: ${(performance.now() - inicio).toFixed(0)} ms`);
}