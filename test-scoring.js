#!/usr/bin/env node
/**
 * test-scoring.js — Suite de verificación del sistema de puntaje de La Polla Mundialera 2026
 *
 * Se corre con:  node test-scoring.js
 *
 * IMPORTANTE: esta suite NO copia la lógica de puntaje — extrae y ejecuta las funciones
 * REALES de index.html (calcPtsGrupos, calcPtsPartido, calcPtsPartidos, calcPtsKOPartido,
 * calcPtsKO, calcPtsTotal, calcPtsDetalle, getScoreCorrection) dentro de un sandbox de Node.
 * Así, cualquier cambio futuro a esas funciones se valida automáticamente contra:
 *   1. Casos unitarios de la fórmula (grupos, partidos, llaves, alargue/penales).
 *   2. Chequeos de integridad de índices (alineamiento predicción ↔ cruce ↔ resultado).
 *   3. Un snapshot real de la planilla (test-data/snapshot-2026-07-03.json) con los
 *      totales esperados de los 14 jugadores, calculados de forma independiente
 *      (recálculo en Python durante la auditoría del 03-07-2026).
 *
 * Salida: exit code 0 si todos los tests obligatorios pasan; 1 si alguno falla.
 * Los "DATA-WARN" no botan la suite (son problemas de datos que debe corregir el admin
 * en la planilla, no bugs del código), pero se listan de forma prominente.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ─────────────────────────────────────────────────────────────
// 1. EXTRACCIÓN DEL CÓDIGO REAL DESDE index.html
// ─────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extrae un bloque balanceado que empieza en `startToken` y abre con `open`/cierra con `close`.
function extractBalanced(src, startToken, open, close) {
  const start = startToken instanceof RegExp
    ? (src.search(startToken))
    : src.indexOf(startToken);
  if (start === -1) throw new Error('No se encontró: ' + startToken);
  const openIdx = src.indexOf(open, start);
  let depth = 0, i = openIdx;
  for (; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) { depth--; if (depth === 0) break; }
  }
  return src.slice(start, i + 1);
}
const extractFn    = name => extractBalanced(HTML, 'function ' + name + '(', '{', '}');
const extractConst = (name, open, close) => extractBalanced(HTML, new RegExp('const ' + name + '\\s*='), open, close) + ';';

const codigo = [
  extractConst('PARTIDOS', '[', ']'),
  extractConst('GRUPOS', '{', '}'),
  extractConst('KO_ROUNDS', '[', ']'),
  extractConst('KO_SCORE_CORRECTIONS', '[', ']'),
  extractFn('toArr'),
  extractFn('getScoreCorrection'),
  extractFn('calcPtsGrupos'),
  extractFn('calcPtsPartido'),
  extractFn('calcPtsPartidos'),
  extractFn('calcPtsKOPartido'),
  extractFn('calcPtsKO'),
  extractFn('calcPtsTotal'),
  extractFn('calcPtsDetalle'),
  // Los `const` del script son léxicos y no quedan en el objeto global del sandbox;
  // se exportan explícitamente (las funciones sí quedan como globales).
  'this.PARTIDOS = PARTIDOS; this.GRUPOS = GRUPOS; this.KO_ROUNDS = KO_ROUNDS; this.KO_SCORE_CORRECTIONS = KO_SCORE_CORRECTIONS;',
].join('\n\n');

const sandbox = { state: { scores: {}, scoresKO: {}, resultados: {}, koConfig: {} }, console };
vm.createContext(sandbox);
vm.runInContext(codigo, sandbox, { filename: 'index.html(extracto)' });
const S = sandbox; // acceso a las funciones reales

// ─────────────────────────────────────────────────────────────
// 2. MINI FRAMEWORK
// ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const warns = [];
function test(desc, fn) {
  try { fn(); pass++; console.log('  ✓ ' + desc); }
  catch (e) { fail++; console.log('  ✗ ' + desc + '\n      → ' + e.message); }
}
function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || '') + ' esperado=' + JSON.stringify(expected) + ' obtenido=' + JSON.stringify(actual));
}
function dataWarn(msg) { warns.push(msg); }

// ─────────────────────────────────────────────────────────────
// 3. TESTS UNITARIOS — calcPtsPartido (fase de grupos, por partido)
//    Regla: +2 marcador exacto · +1 tendencia correcta (W/E/L) · 0 si falla
// ─────────────────────────────────────────────────────────────
console.log('\n■ calcPtsPartido (partidos de grupos)');
test('marcador exacto → 2 pts', () => eq(S.calcPtsPartido({ g1: 2, g2: 1 }, { gL: 2, gV: 1 }), 2));
test('marcador exacto 0-0 → 2 pts (el 0 no es tratado como falsy)', () => eq(S.calcPtsPartido({ g1: 0, g2: 0 }, { gL: 0, gV: 0 }), 2));
test('tendencia correcta (gana local) → 1 pt', () => eq(S.calcPtsPartido({ g1: 3, g2: 0 }, { gL: 1, gV: 0 }), 1));
test('tendencia correcta (empate distinto marcador) → 1 pt', () => eq(S.calcPtsPartido({ g1: 2, g2: 2 }, { gL: 0, gV: 0 }), 1));
test('tendencia incorrecta → 0 pts', () => eq(S.calcPtsPartido({ g1: 2, g2: 0 }, { gL: 0, gV: 2 }), 0));
test('sin predicción (undefined) → 0 pts', () => eq(S.calcPtsPartido(undefined, { gL: 1, gV: 0 }), 0));
test('sin resultado (undefined) → 0 pts', () => eq(S.calcPtsPartido({ g1: 1, g2: 0 }, undefined), 0));
test('resultado con goles null → 0 pts', () => eq(S.calcPtsPartido({ g1: 1, g2: 0 }, { gL: null, gV: null }), 0));
// Documenta un filo conocido del código actual (guardia de null ausente en calcPtsPartido,
// a diferencia de calcPtsKOPartido). HOY es inalcanzable porque todos los flujos de guardado
// escriben g1/g2 numéricos completos, pero si algún flujo futuro guardara {g1:null,g2:null},
// un empate real regalaría +1. Si este test falla, es porque ALGUIEN AGREGÓ la guardia (bien)
// y hay que actualizar el test.
test('COMPORTAMIENTO ACTUAL documentado: pred {null,null} + empate real → 1 pt (falta guardia)', () =>
  eq(S.calcPtsPartido({ g1: null, g2: null }, { gL: 1, gV: 1 }), 1));
// Documenta el filo string-vs-number: goles como string pierden el punto de marcador exacto.
// El chequeo de tipos sobre el snapshot (sección 6) garantiza que hoy no hay strings guardados.
test('COMPORTAMIENTO ACTUAL documentado: pred con strings "2","1" vs 2-1 real → 1 pt (no 2)', () =>
  eq(S.calcPtsPartido({ g1: '2', g2: '1' }, { gL: 2, gV: 1 }), 1));

// ─────────────────────────────────────────────────────────────
// 4. TESTS UNITARIOS — calcPtsKOPartido (llaves)
//    Regla: +1 gol local · +1 gol visita · +2 tendencia/ganador (a los 90') · máx 4.
//    Con aet:true el 90' fue empate ⇒ gL===gV es el marcador a 90'; +2 sólo si predijo empate.
// ─────────────────────────────────────────────────────────────
console.log('\n■ calcPtsKOPartido (fase eliminatoria)');
test('marcador exacto sin alargue → 4 pts (1+1+2)', () => eq(S.calcPtsKOPartido({ g1: 2, g2: 1 }, { gL: 2, gV: 1 }), 4));
test('ganador correcto + 1 gol correcto → 3 pts', () => eq(S.calcPtsKOPartido({ g1: 2, g2: 0 }, { gL: 2, gV: 1 }), 3));
test('solo ganador correcto → 2 pts', () => eq(S.calcPtsKOPartido({ g1: 3, g2: 0 }, { gL: 2, gV: 1 }), 2));
test('solo un gol correcto (tendencia errada) → 1 pt', () => eq(S.calcPtsKOPartido({ g1: 2, g2: 2 }, { gL: 2, gV: 1 }), 1));
test('todo errado → 0 pts', () => eq(S.calcPtsKOPartido({ g1: 0, g2: 3 }, { gL: 2, gV: 1 }), 0));
test('0-0 exacto → 4 pts', () => eq(S.calcPtsKOPartido({ g1: 0, g2: 0 }, { gL: 0, gV: 0 }), 4));
test('ALARGUE: 90\' fue 1-1, predijo 1-1 → 4 pts (1+1+2 empate=tendencia)', () =>
  eq(S.calcPtsKOPartido({ g1: 1, g2: 1 }, { gL: 1, gV: 1, aet: true, winner: 'local' }), 4));
test('ALARGUE: 90\' fue 1-1, predijo 2-2 → 2 pts (solo tendencia empate)', () =>
  eq(S.calcPtsKOPartido({ g1: 2, g2: 2 }, { gL: 1, gV: 1, aet: true, winner: 'visita' }), 2));
test('ALARGUE: 90\' fue 1-1, predijo 1-0 → 1 pt (solo gol local; sin +2 aunque "acertara ganador")', () =>
  eq(S.calcPtsKOPartido({ g1: 1, g2: 0 }, { gL: 1, gV: 1, aet: true, winner: 'local' }), 1));
test('ALARGUE: el ganador de penales NO afecta el puntaje (winner local vs visita, mismos pts)', () => {
  const p = { g1: 0, g2: 0 };
  eq(S.calcPtsKOPartido(p, { gL: 0, gV: 0, aet: true, winner: 'local' }),
     S.calcPtsKOPartido(p, { gL: 0, gV: 0, aet: true, winner: 'visita' }));
});
test('predicción {g1:null,g2:null} → 0 pts (guardia presente en KO)', () =>
  eq(S.calcPtsKOPartido({ g1: null, g2: null }, { gL: 1, gV: 1, aet: true }), 0));
test('resultado inexistente (slot sin jugar) → 0 pts', () =>
  eq(S.calcPtsKOPartido({ g1: 1, g2: 0 }, undefined), 0));

// ─────────────────────────────────────────────────────────────
// 5. TESTS UNITARIOS — calcPtsGrupos (en vivo + bonus de cierre)
// ─────────────────────────────────────────────────────────────
console.log('\n■ calcPtsGrupos (en vivo + bonus)');
function conEstado(scores, resultados, fn) {
  const s0 = S.state.scores, r0 = S.state.resultados;
  S.state.scores = scores; S.state.resultados = resultados || {};
  try { return fn(); } finally { S.state.scores = s0; S.state.resultados = r0; }
}
// A1 real: México vs Sudáfrica (grupo A). A2: Corea del Sur vs Chequia.
test('en vivo: gana tu 1° predicho → +2', () => conEstado(
  { 'México|Sudáfrica': { gL: 2, gV: 0 } }, {},
  () => eq(S.calcPtsGrupos({ grupos: { A: { p1: 'México', p2: 'Chequia' } } }, S.state.resultados), 2)));
test('en vivo: gana tu 2° predicho → +1', () => conEstado(
  { 'México|Sudáfrica': { gL: 0, gV: 1 } }, {},
  () => eq(S.calcPtsGrupos({ grupos: { A: { p1: 'México', p2: 'Sudáfrica' } } }, S.state.resultados), 1)));
test('en vivo: empate → 0 pts para todos', () => conEstado(
  { 'México|Sudáfrica': { gL: 1, gV: 1 } }, {},
  () => eq(S.calcPtsGrupos({ grupos: { A: { p1: 'México', p2: 'Sudáfrica' } } }, S.state.resultados), 0)));
test('bonus cierre: 1° exacto +3 y 2° exacto +2 (total 5)', () => conEstado(
  {}, { grupos: { A: { p1: 'México', p2: 'Sudáfrica' } } },
  () => eq(S.calcPtsGrupos({ grupos: { A: { p1: 'México', p2: 'Sudáfrica' } } }, S.state.resultados), 5)));
test('bonus cierre: 1° y 2° invertidos → 0 (no hay puntos cruzados)', () => conEstado(
  {}, { grupos: { A: { p1: 'México', p2: 'Sudáfrica' } } },
  () => eq(S.calcPtsGrupos({ grupos: { A: { p1: 'Sudáfrica', p2: 'México' } } }, S.state.resultados), 0)));
test('sin resultados de grupos (grupos_json vacío) → bonus 0', () => conEstado(
  {}, { grupos: {} },
  () => eq(S.calcPtsGrupos({ grupos: { A: { p1: 'México', p2: 'Sudáfrica' } } }, S.state.resultados), 0)));

// ─────────────────────────────────────────────────────────────
// 6. SNAPSHOT REAL — regresión + integridad de datos
// ─────────────────────────────────────────────────────────────
console.log('\n■ Snapshot real de la planilla (test-data/snapshot-2026-07-03.json)');
const SNAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-data', 'snapshot-2026-07-03.json'), 'utf8'));

// Totales esperados calculados de forma INDEPENDIENTE (recálculo Python, auditoría 03-07-2026).
// Si cambias la fórmula de puntaje a propósito, recalcula y actualiza estos valores.
const TOTALES_ESPERADOS = {
  'Omar Olave': 145, 'Gabriel Dartuwig': 130, 'Esteban': 137, 'Catalina Aliste': 129,
  'Katherine Widemann': 129, 'Daniel Piña': 144, 'Diego Guerrero': 131,
  'Claudia Villablanca': 140, 'Sara Barahona': 138, 'German Carvacho': 139,
  'Dani Carvacho': 150, 'Agustín Delgado': 148, 'Estrella Rivera': 79, 'Diego Triviño ()': 128,
};
const DESGLOSE_ESPERADO = {
  'Omar Olave': [58, 63, 24], 'Gabriel Dartuwig': [46, 57, 27], 'Esteban': [51, 63, 23],
  'Catalina Aliste': [43, 57, 29], 'Katherine Widemann': [38, 64, 27], 'Daniel Piña': [51, 65, 28],
  'Diego Guerrero': [45, 62, 24], 'Claudia Villablanca': [50, 60, 30], 'Sara Barahona': [47, 62, 29],
  'German Carvacho': [48, 62, 29], 'Dani Carvacho': [52, 63, 35], 'Agustín Delgado': [51, 64, 33],
  'Estrella Rivera': [33, 46, 0], 'Diego Triviño ()': [44, 61, 23],
};

S.state.scores = SNAP.scores;
S.state.scoresKO = SNAP.scoresKO;
S.state.resultados = SNAP.resultados;
S.state.koConfig = SNAP.koConfig;

for (const j of SNAP.jugadores) {
  const n = j.nombre;
  test(`regresión total ${n} = ${TOTALES_ESPERADOS[n]} pts`, () => {
    const d = S.calcPtsDetalle(SNAP.pronosticos[n] || {}, SNAP.resultados, n);
    const [ep, eg, ek] = DESGLOSE_ESPERADO[n];
    eq(d.partidos, ep, 'partidos:'); eq(d.grupos, eg, 'grupos:'); eq(d.ko, ek, 'llaves:');
    eq(d.total, TOTALES_ESPERADOS[n], 'total:');
    eq(S.calcPtsTotal(SNAP.pronosticos[n] || {}, SNAP.resultados, n), TOTALES_ESPERADOS[n], 'calcPtsTotal≠calcPtsDetalle:');
  });
}

test('consistencia interna: calcPtsDetalle.total === suma de sus componentes (todos los jugadores)', () => {
  for (const j of SNAP.jugadores) {
    const d = S.calcPtsDetalle(SNAP.pronosticos[j.nombre] || {}, SNAP.resultados, j.nombre);
    eq(d.total, d.grupos + d.ko + d.partidos + d.correccion, j.nombre + ':');
  }
});

// ─────────────────────────────────────────────────────────────
// 7. INTEGRIDAD DE ÍNDICES (el bug de desalineamiento no puede repetirse en silencio)
// ─────────────────────────────────────────────────────────────
console.log('\n■ Integridad de índices predicción ↔ cruce ↔ resultado');
const rounds = (SNAP.koConfig && SNAP.koConfig.rounds) || {};

test('slots de cada ronda: sin huecos intermedios (nunca se compactó/reordenó)', () => {
  for (const [rnd, cfg] of Object.entries(rounds)) {
    const slots = cfg.slots || [];
    let vacioVisto = false;
    slots.forEach((s, i) => {
      const vacio = !(s && (s.local || s.visita));
      if (vacio) vacioVisto = true;
      else if (vacioVisto) throw new Error(`ronda ${rnd}: slot ${i} lleno después de un slot vacío — señal de compactación/reordenamiento`);
    });
  }
});

test('predicciones KO de cada jugador: largo compatible con los slots de la ronda', () => {
  for (const j of SNAP.jugadores) {
    const ko = (SNAP.pronosticos[j.nombre] || {}).ko || {};
    for (const [rnd, preds] of Object.entries(ko)) {
      const slots = (rounds[rnd] || {}).slots || [];
      if (!Array.isArray(preds)) throw new Error(`${j.nombre}/${rnd}: preds no es array`);
      if (preds.length > slots.length)
        throw new Error(`${j.nombre}/${rnd}: tiene ${preds.length} predicciones pero la ronda tiene ${slots.length} cruces — los slots se acortaron DESPUÉS de guardar (desalineamiento)`);
    }
  }
});

test('resultados KO: cada slot con resultado corresponde a un cruce definido', () => {
  for (const [rnd, resArr] of Object.entries(SNAP.scoresKO || {})) {
    const slots = (rounds[rnd] || {}).slots || [];
    (resArr || []).forEach((r, i) => {
      if (r && r.gL != null && !(slots[i] && slots[i].local && slots[i].visita))
        throw new Error(`ronda ${rnd} slot ${i}: hay resultado ${r.gL}-${r.gV} pero no hay cruce definido en ese índice`);
    });
  }
});

test('tipos: todas las predicciones y resultados guardados son numéricos (no strings)', () => {
  const chk = (v, ctx) => {
    if (v != null && typeof v !== 'number') throw new Error(ctx + ': valor ' + JSON.stringify(v) + ' de tipo ' + typeof v);
  };
  for (const j of SNAP.jugadores) {
    const p = SNAP.pronosticos[j.nombre] || {};
    for (const [id, pd] of Object.entries(p.partidos || {})) { chk(pd.g1, `${j.nombre} partidos[${id}].g1`); chk(pd.g2, `${j.nombre} partidos[${id}].g2`); }
    for (const [rnd, arr] of Object.entries(p.ko || {})) (arr || []).forEach((pd, i) => { if (pd) { chk(pd.g1, `${j.nombre} ko.${rnd}[${i}].g1`); chk(pd.g2, `${j.nombre} ko.${rnd}[${i}].g2`); } });
  }
  for (const [k, v] of Object.entries(SNAP.scores || {})) { chk(v.gL, `scores[${k}].gL`); chk(v.gV, `scores[${k}].gV`); }
  for (const [rnd, arr] of Object.entries(SNAP.scoresKO || {})) (arr || []).forEach((r, i) => { if (r) { chk(r.gL, `scoresKO.${rnd}[${i}].gL`); chk(r.gV, `scoresKO.${rnd}[${i}].gV`); } });
});

// ─────────────────────────────────────────────────────────────
// 8. CHEQUEOS DE DATOS (no botan la suite: son tareas del admin en la planilla)
// ─────────────────────────────────────────────────────────────
console.log('\n■ Chequeos de datos de la planilla (warnings)');

// Invariante de la regla de alargue: si aet=true, el 90' fue empate ⇒ gL debe ser igual a gV.
for (const [rnd, arr] of Object.entries(SNAP.scoresKO || {})) {
  (arr || []).forEach((r, i) => {
    if (r && r.aet && r.gL != null && r.gL !== r.gV) {
      const slot = ((rounds[rnd] || {}).slots || [])[i] || {};
      dataWarn(`scoresKO.${rnd}[${i}] (${slot.local || '?'} vs ${slot.visita || '?'}): aet=true con marcador ${r.gL}-${r.gV} — parece marcador de 120', pero la regla puntúa el marcador a los 90' (que en un partido con alargue es SIEMPRE empate). Corregir en la hoja ScoresKO con el marcador real a los 90'.`);
    }
  });
}

// Claves duplicadas/invertidas o basura en Scores.
{
  const fixtureKeys = new Set(S.PARTIDOS.map(p => p.local + '|' + p.visita));
  const fixtureIds = new Set(S.PARTIDOS.map(p => p.id));
  for (const k of Object.keys(SNAP.scores || {})) {
    if (fixtureKeys.has(k) || fixtureIds.has(k)) continue;
    const [a, b] = k.split('|');
    if (a && b && fixtureKeys.has(b + '|' + a)) dataWarn(`Scores: la clave "${k}" está INVERTIDA respecto al fixture ("${b}|${a}"); la app la ignora al puntuar pero infla el contador de partidos e induce a confusión. Eliminar la fila o corregir el orden.`);
    else dataWarn(`Scores: la clave "${k}" no corresponde a ningún partido del fixture (fila basura o nombre mal escrito) — la app la ignora al puntuar.`);
  }
}

// Cobertura: partidos del fixture sin resultado (información, no error).
{
  const sinResultado = S.PARTIDOS.filter(p => {
    const sc = SNAP.scores[p.local + '|' + p.visita] || SNAP.scores[p.id];
    return !sc || sc.gL == null || sc.gV == null;
  });
  if (sinResultado.length) dataWarn(`Faltan resultados de grupos para: ${sinResultado.map(p => p.id).join(', ')}`);
}

// Bonus de grupos pendiente.
if (!Object.keys((SNAP.resultados || {}).grupos || {}).length) {
  const jugados = S.PARTIDOS.filter(p => { const sc = SNAP.scores[p.local + '|' + p.visita]; return sc && sc.gL != null; }).length;
  if (jugados === S.PARTIDOS.length) dataWarn('Los 72 partidos de grupos tienen resultado pero resultados.grupos está VACÍO: el bonus de cierre de grupos (+3 por 1° exacto, +2 por 2° exacto) aún no se ha otorgado a nadie. El admin debe cargar las posiciones finales en Admin → Grupos.');
}

// ─────────────────────────────────────────────────────────────
// RESUMEN
// ─────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════');
console.log(`Tests: ${pass} OK, ${fail} FALLARON`);
if (warns.length) {
  console.log(`\n⚠️  ${warns.length} advertencia(s) de DATOS (corregir en la planilla, no en el código):`);
  warns.forEach(w => console.log('  • ' + w));
}
console.log('════════════════════════════════════════════════');
process.exit(fail ? 1 : 0);
