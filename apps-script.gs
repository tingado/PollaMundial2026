// ═══════════════════════════════════════════════════════
// LA POLLA MUNDIALERA 2026 — Google Apps Script Backend
// ═══════════════════════════════════════════════════════
// DEPLOY INSTRUCTIONS:
// 1. Abrir script.google.com → proyecto vinculado al Google Sheet
// 2. Seleccionar TODO (Ctrl+A) y REEMPLAZAR con este código completo
// 3. Guardar (Ctrl+S)
// 4. Deploy > Manage deployments > editar deployment existente > New version
//    - Execute as: Me  |  Who has access: Anyone
// 5. La URL /exec NO cambia
//
// AUTO-SYNC (opcional, después de hacer deploy):
// 1. Abrir este editor de Apps Script
// 2. En el menú superior, seleccionar función: configurarAutoSync
// 3. Presionar ▶ Ejecutar (una sola vez)
// → Desde ahí se sincroniza automáticamente cada 10 minutos
//
// SCORING FASE DE GRUPOS (sin cambios):
//   Grupo 1°: +2pts | Grupo 2°: +1pt | Marcador exacto: +2pts adicionales
// SCORING FASE ELIMINATORIA (nuevo sistema, reemplaza bracket):
//   Por partido: +1 gol local correcto · +1 gol visita correcto · +2 ganador = 4 pts máx
//   Si va a alargue/penales: solo +2 por ganador (campo aet:true en ScoresKO)
// ═══════════════════════════════════════════════════════

// ─── CONFIGURAR AUTO-SYNC DESDE EL EDITOR ───────────────
// Ejecuta esta función UNA VEZ desde el editor para activar el trigger.
// Menú: selecciona "configurarAutoSync" en el dropdown de funciones → ▶ Ejecutar
function configurarAutoSync() {
  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!token) {
    Logger.log('⚠️ ADVERTENCIA: API_TOKEN no configurado. El auto-sync fallará hasta que guardes un token válido desde Admin → Guardar Token.');
  }
  // Eliminar triggers anteriores
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'autoSyncResultados') ScriptApp.deleteTrigger(t);
  });
  // Crear trigger cada 10 minutos
  ScriptApp.newTrigger('autoSyncResultados')
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log('✅ Auto-Sync activado: autoSyncResultados se ejecutará cada 10 minutos.');
  Logger.log('Para ver el log: Ver > Registros de ejecución');
}

// Ejecuta esto para desactivar el auto-sync
function desactivarTrigger() {
  const result = desactivarAutoSync();
  Logger.log(result.msg);
}
// ────────────────────────────────────────────────────────

const ss = SpreadsheetApp.getActiveSpreadsheet();

// ── MAPEO DE NOMBRES (API inglés / códigos → español de la app) ──
// Usado tanto al sincronizar (fetchResultadosAPI) como al leer (getScores),
// para que las claves "Local|Visita" siempre queden en español.
const NAME_MAP = {
  // Nombres completos (football-data.org "name")
  'Mexico': 'México', 'Canada': 'Canadá', 'United States': 'Estados Unidos',
  'Brazil': 'Brasil', 'Germany': 'Alemania', 'Netherlands': 'Países Bajos',
  'Belgium': 'Bélgica', 'Spain': 'España', 'France': 'Francia',
  'Argentina': 'Argentina', 'Portugal': 'Portugal', 'England': 'Inglaterra',
  'Croatia': 'Croacia', 'Morocco': 'Marruecos', 'Senegal': 'Senegal',
  'Japan': 'Japón', 'South Korea': 'Corea del Sur', 'Saudi Arabia': 'Arabia Saudita',
  'Uruguay': 'Uruguay', 'Colombia': 'Colombia', 'Ecuador': 'Ecuador',
  'Switzerland': 'Suiza', 'Paraguay': 'Paraguay', 'Australia': 'Australia',
  'Tunisia': 'Túnez', 'Sweden': 'Suecia', 'Norway': 'Noruega', 'Iraq': 'Irak',
  'Egypt': 'Egipto', 'Iran': 'Irán', 'South Africa': 'Sudáfrica',
  'Ghana': 'Ghana', "Côte d'Ivoire": 'Costa de Marfil', 'New Zealand': 'Nueva Zelanda',
  'Czechia': 'Chequia', 'Austria': 'Austria', 'Jordan': 'Jordania',
  'Algeria': 'Algeria', 'Turkey': 'Turquía', 'Türkiye': 'Turquía',
  'Cape Verde': 'Cabo Verde', 'Haiti': 'Haití', 'Scotland': 'Escocia',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina', 'Qatar': 'Qatar',
  'Curaçao': 'Curazao', 'Uzbekistan': 'Uzbekistán',
  'DR Congo': 'R.D. del Congo', 'Panama': 'Panamá',
  // Variantes que usa Zafronix
  'Korea Republic': 'Corea del Sur', 'IR Iran': 'Irán',
  'Congo DR': 'R.D. del Congo', 'Cabo Verde': 'Cabo Verde',
  // Códigos de 3 letras (football-data.org "shortName") — respaldo
  'MEX': 'México', 'CAN': 'Canadá', 'USA': 'Estados Unidos',
  'BRA': 'Brasil', 'GER': 'Alemania', 'NED': 'Países Bajos',
  'BEL': 'Bélgica', 'ESP': 'España', 'FRA': 'Francia',
  'ARG': 'Argentina', 'POR': 'Portugal', 'ENG': 'Inglaterra',
  'CRO': 'Croacia', 'MAR': 'Marruecos', 'SEN': 'Senegal',
  'JPN': 'Japón', 'KOR': 'Corea del Sur', 'KSA': 'Arabia Saudita',
  'URU': 'Uruguay', 'COL': 'Colombia', 'ECU': 'Ecuador',
  'SUI': 'Suiza', 'PAR': 'Paraguay', 'AUS': 'Australia',
  'TUN': 'Túnez', 'SWE': 'Suecia', 'NOR': 'Noruega', 'IRQ': 'Irak',
  'EGY': 'Egipto', 'IRN': 'Irán', 'RSA': 'Sudáfrica',
  'GHA': 'Ghana', 'CIV': 'Costa de Marfil', 'NZL': 'Nueva Zelanda',
  'CZE': 'Chequia', 'AUT': 'Austria', 'JOR': 'Jordania',
  'ALG': 'Algeria', 'TUR': 'Turquía',
  'CPV': 'Cabo Verde', 'HAI': 'Haití', 'SCO': 'Escocia',
  'BIH': 'Bosnia y Herzegovina', 'QAT': 'Qatar',
  'CUW': 'Curazao', 'UZB': 'Uzbekistán',
  'COD': 'R.D. del Congo', 'PAN': 'Panamá'
};
function mapName(n) { return NAME_MAP[String(n).trim()] || String(n).trim(); }
// Normaliza una clave "Local|Visita" mapeando cada lado al nombre español.
function normalizarClaveScore(key) {
  const parts = String(key).split('|');
  if (parts.length !== 2) return String(key);
  return mapName(parts[0]) + '|' + mapName(parts[1]);
}

function doGet(e) {
  const p = e.parameter;
  const cb = p.callback || 'callback';
  let result;
  try {
    switch(p.action) {
      case 'getAll':                  result = getAll(); break;
      case 'inscribir':               result = inscribir(p); break;
      case 'guardarPron':             result = guardarPron(p); break;
      case 'guardarResultados':       result = guardarResultados(p); break;
      case 'guardarResultadosGrupos': result = guardarResultadosGrupos(p); break;
      case 'guardarScores':           result = guardarScores(p); break;
      case 'guardarKO':               result = guardarKO(p); break;
      case 'guardarResultadosKO':     result = guardarResultadosKO(p); break;
      case 'guardarKOConfig':         result = guardarKOConfig(p); break;
      case 'fetchResultadosAPI':      result = fetchResultadosAPI(p); break;
      case 'fetchResultadosZafronix': result = fetchResultadosZafronix(p); break;
      case 'guardarToken':            result = guardarToken(p); break;
      case 'guardarTokenZafronix':    result = guardarTokenZafronix(p); break;
      case 'activarAutoSync':         result = activarAutoSync(p); break;
      case 'desactivarAutoSync':      result = desactivarAutoSync(); break;
      case 'getAutoSyncStatus':       result = getAutoSyncStatus(); break;
      case 'eliminarJugador':         result = eliminarJugador(p); break;
      case 'resetear':                result = resetear(); break;
      default: result = {error: 'Acción desconocida: ' + p.action};
    }
  } catch(err) {
    result = {error: err.message};
  }
  const output = ContentService.createTextOutput(cb + '(' + JSON.stringify(result) + ')');
  output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  return output;
}

// ── HELPERS ─────────────────────────────────────────────

function getSheet(name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function toArrGAS(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch(e) { return []; }
}

// ── READ ─────────────────────────────────────────────────

function getAll() {
  let scores = {}, scoresKO = {}, koConfig = {};
  try { scores   = getScores();   } catch(e) {}
  try { scoresKO = getScoresKO(); } catch(e) {}
  try { koConfig = getKOConfig(); } catch(e) {}
  return {
    jugadores:   getJugadores(),
    pronosticos: getPronosticos(),
    resultados:  getResultados(),
    scores:      scores,
    scoresKO:    scoresKO,
    koConfig:    koConfig
  };
}

function getJugadores() {
  const sh = getSheet('Jugadores');
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(r => ({
    nombre: r[0],
    monto:  r[1],
    fecha:  r[2] ? Utilities.formatDate(new Date(r[2]), 'America/Santiago', 'dd/MM/yyyy') : ''
  })).filter(j => j.nombre);
}

function getPronosticos() {
  const sh = getSheet('Pronosticos');
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return {};
  const result = {};
  data.slice(1).forEach(r => {
    if (!r[0]) return;
    try { result[r[0]] = JSON.parse(r[1] || '{}'); } catch(e) { result[r[0]] = {}; }
  });
  return result;
}

function getResultados() {
  const sh = getSheet('Resultados');
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return {};
  const r = data[1];
  let grupos = {}, oct = [], qua = [], sem = [], terc = [];
  try { grupos = JSON.parse(r[0] || '{}'); } catch(e) {}
  try { oct   = JSON.parse(r[1] || '[]'); } catch(e) {}
  try { qua   = JSON.parse(r[2] || '[]'); } catch(e) {}
  try { sem   = JSON.parse(r[3] || '[]'); } catch(e) {}
  try { terc  = JSON.parse(r[7] || '[]'); } catch(e) {}
  return { grupos, oct, qua, sem, f1: r[4]||'', f2: r[5]||'', campeon: r[6]||'', terc };
}

function getScores() {
  const sh = getSheet('Scores');
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return {};
  const result = {};
  // Rows: [key (local|visita), gL, gV]
  // Las claves se normalizan a español al leer (sin modificar la hoja),
  // así un marcador guardado como "SUI|..." se entrega como "Suiza|...".
  data.slice(1).forEach(r => {
    if (!r[0]) return;
    const key = normalizarClaveScore(r[0]);
    const gL = r[1] !== '' && r[1] !== null ? Number(r[1]) : null;
    const gV = r[2] !== '' && r[2] !== null ? Number(r[2]) : null;
    // Si ya existe esa clave (duplicado por clave vieja + nueva), preferir la que tenga marcador
    if (result[key] && (gL === null || gV === null)) return;
    result[key] = { gL: gL, gV: gV };
  });
  return result;
}

// Lee resultados de partidos KO desde hoja ScoresKO.
// Devuelve {r32:[{gL,gV,aet?,winner?},...], r16:[...], qf:[...], sf:[...], fin:[...]}
function getScoresKO() {
  const sh = getSheet('ScoresKO');
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return {};
  const result = {};
  data.slice(1).forEach(r => {
    const rnd = String(r[0] || '').trim();
    if (!rnd) return;
    const slot = Number(r[1]);
    if (!result[rnd]) result[rnd] = [];
    while (result[rnd].length <= slot) result[rnd].push(null);
    const gL = r[2] !== '' && r[2] !== null ? Number(r[2]) : null;
    const gV = r[3] !== '' && r[3] !== null ? Number(r[3]) : null;
    const aet = r[4] === true || String(r[4]).toLowerCase() === 'true';
    const winner = String(r[5] || '').trim();
    result[rnd][slot] = { gL, gV, aet: aet || undefined, winner: winner || undefined };
  });
  // NO compactar: el índice del array debe seguir siendo el número de slot,
  // para que predicción[i] y resultado[i] correspondan al mismo partido aunque
  // los partidos terminen en distinto orden (slots con null = sin resultado aún).
  return result;
}

// Lee configuración de rondas KO desde hoja KOConfig.
// Devuelve {rounds:{r32:{status,deadline,slots:[{local,visita}]}, r16:..., ...}}
function getKOConfig() {
  const sh = getSheet('KOConfig');
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return {};
  try { return JSON.parse(String(data[1][0] || '{}')); } catch(e) { return {}; }
}

function guardarScores(p) {
  let scores;
  try { scores = JSON.parse(p.scores || '[]'); } catch(e) { scores = []; }
  // scores = [{key:'México|Sudáfrica', gL:2, gV:1}, ...]
  const sh = getSheet('Scores');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['partido', 'gL', 'gV']);
  }
  const existing = sh.getDataRange().getValues();
  scores.forEach(s => {
    if (!s.key || s.gL === undefined || s.gV === undefined) return;
    // Look for existing row to update
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === s.key) {
        sh.getRange(i + 1, 2, 1, 2).setValues([[s.gL, s.gV]]);
        existing[i][1] = s.gL; existing[i][2] = s.gV;
        return;
      }
    }
    // New row
    sh.appendRow([s.key, s.gL, s.gV]);
    existing.push([s.key, s.gL, s.gV]);
  });
  return { ok: true, saved: scores.length };
}

/**
 * Solo para auto-sync: inserta scores de partidos NUEVOS que aún no existen en el sheet.
 * NO sobrescribe partidos que ya tienen un score ingresado manualmente por el admin.
 * El admin siempre puede corregir un marcador usando guardarScores (admin panel).
 */
/**
 * Auto-sync only: inserts scores for NEW matches without overwriting existing ones.
 * Processes all changes in memory then writes with a single setValues() call
 * to avoid per-row Spreadsheet API calls that cause slowness and quota issues.
 */
function guardarScoresAutoSync(scoresList) {
  const sh = getSheet('Scores');

  // Limpia columnas basura más allá de la C (D, E, …) que rompen el setValues de 3 columnas.
  if (sh.getLastRow() > 0 && sh.getLastColumn() > 3) {
    sh.getRange(1, 4, sh.getLastRow(), sh.getLastColumn() - 3).clearContent();
  }

  // Normaliza SIEMPRE cada fila a exactamente 3 columnas [partido, gL, gV],
  // sin importar cuántas columnas tenga la hoja, para que el setValues de abajo
  // (rango de 3 columnas) nunca falle por desajuste de columnas.
  let modified = sh.getLastRow() === 0;
  const existing = modified
    ? [['partido', 'gL', 'gV']]
    : sh.getDataRange().getValues().map(row => [
        row[0] || '',
        row[1] !== undefined && row[1] !== null ? row[1] : '',
        row[2] !== undefined && row[2] !== null ? row[2] : ''
      ]);

  // Build index: key → row index, and set of keys that already have a score
  const keyToRowIndex = {};
  const existingKeys = new Set();
  for (let i = 1; i < existing.length; i++) {
    const k = existing[i][0];
    if (!k) continue;
    keyToRowIndex[k] = i;
    const hasScore = existing[i][1] !== '' && existing[i][1] !== null &&
                     existing[i][2] !== '' && existing[i][2] !== null;
    if (hasScore) existingKeys.add(k);
  }

  let added = 0;

  scoresList.forEach(s => {
    if (!s.key || s.gL === undefined || s.gV === undefined) return;
    if (existingKeys.has(s.key)) return; // already has a manual score — leave it

    const rowIdx = keyToRowIndex[s.key];
    if (rowIdx !== undefined) {
      existing[rowIdx][1] = s.gL;
      existing[rowIdx][2] = s.gV;
    } else {
      existing.push([s.key, s.gL, s.gV]);
      keyToRowIndex[s.key] = existing.length - 1;
    }
    existingKeys.add(s.key);
    added++;
    modified = true;
  });

  // Single batch write instead of N individual Spreadsheet API calls
  if (modified) {
    sh.getRange(1, 1, existing.length, 3).setValues(existing);
  }

  return { ok: true, added };
}

// ── KO WRITE ─────────────────────────────────────────────

const KO_ROUNDS_VALID = ['r32','r16','qf','sf','tercer','fin'];

// Calendario FIFA 2026 por defecto (hora de Chile, UTC−4). Debe coincidir con
// KO_CALENDAR_DEFAULTS del index.html. Apertura = fin fase anterior; cierre = 5 min antes del 1er partido.
const KO_CALENDAR_DEFAULTS_GAS = {
  r32: { apertura: '2026-06-27T20:00:00-04:00', cierre: '2026-06-28T14:55:00-04:00' },
  r16: { apertura: '2026-07-03T20:00:00-04:00', cierre: '2026-07-04T12:55:00-04:00' },
  qf:  { apertura: '2026-07-07T20:00:00-04:00', cierre: '2026-07-09T15:55:00-04:00' },
  sf:  { apertura: '2026-07-11T20:00:00-04:00', cierre: '2026-07-14T14:55:00-04:00' },
  fin: { apertura: '2026-07-15T20:00:00-04:00', cierre: '2026-07-18T16:55:00-04:00' } // cierra antes del partido por 3er lugar (sáb 18)
};

// Estado efectivo de una ronda KO en el servidor (espejo de getEffectiveKOStatus del frontend).
// Override manual del admin (status != 'auto') manda; si no, se calcula por fecha/hora.
function koEffectiveStatus(ronda, config) {
  config = config || getKOConfig();
  const cfg = (config.rounds && config.rounds[ronda]) || {};
  const ov = cfg.status;
  if (ov && ov !== 'auto') return ov;
  const def = KO_CALENDAR_DEFAULTS_GAS[ronda] || {};
  const apertura = cfg.apertura || def.apertura || '';
  const cierre   = cfg.deadline || def.cierre   || '';
  const now = new Date();
  if (apertura && now < new Date(apertura)) return 'pendiente';
  if (cierre   && now >= new Date(cierre))  return 'cerrado';
  if (apertura || cierre) return 'abierto';
  return 'pendiente';
}

// Guarda predicciones de marcadores KO de un jugador para una ronda.
// p.nombre, p.ronda (r32|r16|qf|sf|tercer|fin), p.predicciones (JSON array [{g1,g2},...])
function guardarKO(p) {
  const nombre = (p.nombre || '').trim();
  if (!nombre) throw new Error('Nombre requerido');
  const ronda = (p.ronda || '').trim();
  if (KO_ROUNDS_VALID.indexOf(ronda) === -1) throw new Error('Ronda inválida: ' + ronda);
  // Bloqueo real: solo se aceptan predicciones mientras la ronda esté ABIERTA.
  const estado = koEffectiveStatus(ronda);
  if (estado !== 'abierto') {
    return { error: 'La ronda de ' + ronda + ' no está abierta para predicciones (estado: ' + estado + '). Espera a que se habilite o revisa que no haya cerrado.' };
  }
  let preds;
  try { preds = JSON.parse(p.predicciones || '[]'); } catch(e) { preds = []; }

  const sh = getSheet('Pronosticos');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['nombre', 'pronostico']);
  }
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === nombre) {
      let pron = {};
      try { pron = JSON.parse(rows[i][1] || '{}'); } catch(e) {}
      if (!pron.ko) pron.ko = {};
      pron.ko[ronda] = preds;
      sh.getRange(i + 1, 2).setValue(JSON.stringify(pron));
      return { ok: true };
    }
  }
  sh.appendRow([nombre, JSON.stringify({ ko: { [ronda]: preds } })]);
  return { ok: true };
}

// Guarda resultados de partidos KO (con flag AET) en hoja ScoresKO.
// p.ronda, p.resultados (JSON array [{slot,gL,gV,aet,winner},...])
// Si el slot ya existe lo actualiza; si no, lo inserta.
function guardarResultadosKO(p) {
  const ronda = (p.ronda || '').trim();
  if (KO_ROUNDS_VALID.indexOf(ronda) === -1) throw new Error('Ronda inválida: ' + ronda);
  let resultados;
  try { resultados = JSON.parse(p.resultados || '[]'); } catch(e) { resultados = []; }

  const sh = getSheet('ScoresKO');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ronda', 'slot', 'gL', 'gV', 'aet', 'winner']);
  }
  const existing = sh.getDataRange().getValues();

  resultados.forEach(r => {
    const slot = Number(r.slot);
    const aet  = r.aet ? true : false;
    const winner = r.winner || '';
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === ronda && Number(existing[i][1]) === slot) {
        sh.getRange(i + 1, 3, 1, 4).setValues([[r.gL, r.gV, aet, winner]]);
        existing[i][2] = r.gL; existing[i][3] = r.gV;
        existing[i][4] = aet;  existing[i][5] = winner;
        return;
      }
    }
    sh.appendRow([ronda, slot, r.gL, r.gV, aet, winner]);
    existing.push([ronda, slot, r.gL, r.gV, aet, winner]);
  });

  return { ok: true, saved: resultados.length };
}

// Guarda configuración de rondas KO (status, deadlines, slots).
// p.config = JSON con {rounds:{r32:{status,deadline,slots:[{local,visita}]}, ...}}
function guardarKOConfig(p) {
  let config;
  try { config = JSON.parse(p.config || '{}'); } catch(e) { config = {}; }
  const sh = getSheet('KOConfig');
  if (sh.getLastRow() === 0) sh.appendRow(['config_json']);
  if (sh.getLastRow() <= 1) sh.appendRow([JSON.stringify(config)]);
  else sh.getRange(2, 1).setValue(JSON.stringify(config));
  return { ok: true };
}

// ── WRITE ────────────────────────────────────────────────

function inscribir(p) {
  const nombre = (p.nombre || '').trim();
  if (!nombre) throw new Error('Nombre requerido');
  const sh = getSheet('Jugadores');
  const data = sh.getDataRange().getValues();
  // Init headers if empty
  if (data.length === 1 && data[0][0] === '') {
    sh.getRange(1, 1, 1, 3).setValues([['nombre', 'monto', 'fecha']]);
  }
  if (sh.getDataRange().getValues().slice(1).some(r => r[0] === nombre)) {
    throw new Error('Ya existe un participante con ese nombre');
  }
  sh.appendRow([nombre, Number(p.monto) || 10000, new Date()]);
  return { ok: true };
}

function guardarPron(p) {
  const nombre = (p.nombre || '').trim();
  if (!nombre) throw new Error('Nombre requerido');
  let pron;
  try { pron = JSON.parse(p.pronostico || '{}'); } catch(e) { pron = {}; }
  const sh = getSheet('Pronosticos');
  const data = sh.getDataRange().getValues();
  if (data.length === 1 && data[0][0] === '') {
    sh.getRange(1, 1, 1, 2).setValues([['nombre', 'pronostico']]);
  }
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === nombre) {
      // CRÍTICO: nunca sobrescribir ciegamente. Si el navegador que guarda
      // Grupos/Partidos tiene en memoria un estado viejo (ej. una pestaña
      // abierta desde antes de que el jugador guardara sus predicciones de
      // llaves en otra sesión), el payload entrante puede no traer 'ko' —
      // en ese caso se preserva el 'ko' ya guardado en la planilla en vez
      // de borrarlo. Si el payload sí trae 'ko', se fusiona ronda por ronda
      // con el existente para no perder rondas que el payload no incluya.
      if (!pron || typeof pron !== 'object') {
        return { ok: false, error: 'Pronóstico inválido' };
      }
      let existing = {};
      try {
        const parsed = JSON.parse(rows[i][1] || '{}');
        if (parsed && typeof parsed === 'object') {
          existing = parsed;
        }
      } catch(e) {}
      if (existing.ko && Object.keys(existing.ko).length) {
        const safePronKo = (pron.ko && typeof pron.ko === 'object' && !Array.isArray(pron.ko)) ? pron.ko : {};
        pron.ko = Object.assign({}, existing.ko, safePronKo);
      }
      sh.getRange(i + 1, 2).setValue(JSON.stringify(pron));
      return { ok: true };
    }
  }
  sh.appendRow([nombre, JSON.stringify(pron)]);
  return { ok: true };
}

function guardarResultados(p) {
  let res;
  try { res = JSON.parse(p.resultados || '{}'); } catch(e) { res = {}; }
  const sh = getSheet('Resultados');
  // Init headers (col 8 = terc_json)
  if (sh.getLastRow() === 0) {
    sh.appendRow(['grupos_json', 'oct_json', 'qua_json', 'sem_json', 'f1', 'f2', 'campeon', 'terc_json']);
  }
  // Preserve existing grupos and terc
  let existingGrupos = '{}', existingTerc = '[]';
  if (sh.getLastRow() > 1) {
    existingGrupos = sh.getRange(2, 1).getValue() || '{}';
    existingTerc  = sh.getRange(2, 8).getValue() || '[]';
  }
  const row = [
    existingGrupos,
    JSON.stringify(res.oct  || []),
    JSON.stringify(res.qua  || []),
    JSON.stringify(res.sem  || []),
    res.f1 || '',
    res.f2 || '',
    res.campeon || '',
    JSON.stringify(res.terc || JSON.parse(existingTerc))
  ];
  if (sh.getLastRow() <= 1) sh.appendRow(row);
  else sh.getRange(2, 1, 1, 8).setValues([row]);
  return { ok: true };
}

function guardarResultadosGrupos(p) {
  let grupos;
  try { grupos = JSON.parse(p.grupos || '{}'); } catch(e) { grupos = {}; }
  const sh = getSheet('Resultados');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['grupos_json', 'oct_json', 'qua_json', 'sem_json', 'f1', 'f2', 'campeon', 'terc_json']);
  }
  if (sh.getLastRow() <= 1) {
    sh.appendRow([JSON.stringify(grupos), '[]', '[]', '[]', '', '', '', '[]']);
  } else {
    sh.getRange(2, 1).setValue(JSON.stringify(grupos));
  }
  return { ok: true };
}

// ── SCORING ──────────────────────────────────────────────

function calcularScores(jugadores, pronosticos, resultados) {
  const scores = {};
  jugadores.forEach(j => {
    const pron = pronosticos[j.nombre] || {};
    let pts = 0;

    // Fase de grupos: 1° = +2pts, 2° = +1pt
    const pg = pron.grupos || {};
    const rg = resultados.grupos || {};
    Object.keys(rg).forEach(g => {
      const pp = pg[g] || {};
      const rr = rg[g] || {};
      if (pp.p1 && rr.p1 && pp.p1 === rr.p1) pts += 2;
      if (pp.p2 && rr.p2 && pp.p2 === rr.p2) pts += 1;
    });

    // Eliminatorias
    const elim = pron.elim || {};
    const rOct = toArrGAS(resultados.oct);
    const rQua = toArrGAS(resultados.qua);
    const rSem = toArrGAS(resultados.sem);
    const rFin = [resultados.f1 || '', resultados.f2 || ''].filter(Boolean);
    const rCamp = resultados.campeon || '';

    (elim.oct || []).forEach(t => { if (rOct.indexOf(t) > -1) pts += 2; });
    (elim.qua || []).forEach(t => { if (rQua.indexOf(t) > -1) pts += 4; });
    (elim.sem || []).forEach(t => { if (rSem.indexOf(t) > -1) pts += 6; });
    const userFin = [...new Set([elim.f1, elim.f2])].filter(Boolean);
    userFin.forEach(t => { if (rFin.indexOf(t) > -1) pts += 8; });
    if (elim.campeon && elim.campeon === rCamp) pts += 10;

    scores[j.nombre] = pts;
  });
  return scores;
}

// ── FOOTBALL-DATA.ORG API ────────────────────────────────

function fetchResultadosAPI(p) {
  const token = (p && p.apiToken) || PropertiesService.getScriptProperties().getProperty('API_TOKEN') || '';
  if (!token) return { error: 'Token no configurado. Usa Admin → Guardar Token primero.' };
  // NAME_MAP y mapName ahora son globales (definidos arriba) y se comparten con getScores.

  try {
    // WC 2026 competition ID on football-data.org is 2000 (FIFA World Cup)
    const url = 'https://api.football-data.org/v4/competitions/2000/matches?status=FINISHED';
    const response = UrlFetchApp.fetch(url, {
      headers: { 'X-Auth-Token': token },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code === 403) {
      return { error: 'Tu plan de football-data.org NO incluye el Mundial 2026 (error 403). El plan gratuito solo da acceso a ciertas ligas. Carga los marcadores manualmente en Admin → ⚽ Marcadores (funciona igual y suma puntos al ranking).' };
    }
    if (code === 429) {
      return { error: 'Demasiadas peticiones a la API (error 429). Espera un minuto e intenta de nuevo.' };
    }
    if (code === 401) {
      return { error: 'Token inválido o expirado (error 401). Revisa el token de football-data.org.' };
    }
    if (code !== 200) {
      return { error: 'API respondió con código ' + code + ': ' + response.getContentText().substring(0, 300) };
    }

    const data = JSON.parse(response.getContentText());
    const matches = data.matches || [];

    // Build match results array with Spanish team names
    const results = matches
      .filter(m => m.status === 'FINISHED' && m.score && m.score.fullTime)
      .map(m => ({
        apiId:  m.id,
        local:  mapName(m.homeTeam.name || m.homeTeam.shortName),
        visita: mapName(m.awayTeam.name || m.awayTeam.shortName),
        gL:     m.score.fullTime.home,
        gV:     m.score.fullTime.away,
        fecha:  m.utcDate ? m.utcDate.substring(0, 10) : '',
        stage:  m.stage || ''
      }));

    // Build resultados from elimination stage matches
    const oct = new Set(), qua = new Set(), sem = new Set();
    let f1 = '', f2 = '', campeon = '';
    const groupScores = []; // {key, gL, gV}

    results.forEach(m => {
      if (m.stage === 'GROUP_STAGE' || m.stage === 'PRELIMINARY_ROUND') {
        groupScores.push({ key: m.local + '|' + m.visita, gL: m.gL, gV: m.gV });
      }
      if (m.stage === 'ROUND_OF_32')    { oct.add(m.local); oct.add(m.visita); }
      if (m.stage === 'QUARTER_FINALS') { qua.add(m.local); qua.add(m.visita); }
      if (m.stage === 'SEMI_FINALS')    { sem.add(m.local); sem.add(m.visita); }
      if (m.stage === 'FINAL') {
        f1 = m.local; f2 = m.visita;
        campeon = m.gL > m.gV ? m.local : m.gL < m.gV ? m.visita : '';
      }
    });

    // Save group match scores to Scores sheet
    if (groupScores.length > 0) {
      // fetchResultadosAPI: no sobrescribir scores manuales
      guardarScoresAutoSync(groupScores);
    }

    const resultadosObj = {
      oct: Array.from(oct), qua: Array.from(qua), sem: Array.from(sem),
      f1, f2, campeon
    };

    // Save elimination results to sheet if any data
    if (oct.size > 0 || qua.size > 0 || sem.size > 0 || f1) {
      const sh = getSheet('Resultados');
      if (sh.getLastRow() === 0) {
        sh.appendRow(['grupos_json', 'oct_json', 'qua_json', 'sem_json', 'f1', 'f2', 'campeon', 'terc_json']);
      }
      const existingGrupos = sh.getLastRow() > 1 ? (sh.getRange(2, 1).getValue() || '{}') : '{}';
      const existingTerc   = sh.getLastRow() > 1 ? (sh.getRange(2, 8).getValue() || '[]') : '[]';
      const row = [
        existingGrupos,
        JSON.stringify(resultadosObj.oct), JSON.stringify(resultadosObj.qua),
        JSON.stringify(resultadosObj.sem), f1, f2, campeon, existingTerc
      ];
      if (sh.getLastRow() <= 1) sh.appendRow(row);
      else sh.getRange(2, 1, 1, 8).setValues([row]);
    }

    return { ok: true, resultados: resultadosObj, scores: getScores(), matches: results.length };

  } catch(err) {
    return { error: 'Error al consultar football-data.org: ' + err.message };
  }
}

// ── ZAFRONIX WC API (api.zafronix.com) ───────────────────
// Fuente principal de resultados del Mundial 2026 (en vivo).
function fetchResultadosZafronix(p) {
  const key = (p && p.apiToken) || PropertiesService.getScriptProperties().getProperty('ZAFRONIX_KEY') || '';
  if (!key) return { error: 'API key de Zafronix no configurada. Pégala en Admin y presiona Guardar Token.' };

  try {
    const url = 'https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026';
    const response = UrlFetchApp.fetch(url, {
      headers: { 'X-API-Key': key },
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    if (code === 401 || code === 403) {
      return { error: 'API key de Zafronix inválida (error ' + code + '). Revísala en Admin → Guardar Token.' };
    }
    if (code === 429) {
      return { error: 'Límite de peticiones de Zafronix alcanzado (error 429). Espera un momento e intenta de nuevo.' };
    }
    if (code !== 200) {
      return { error: 'Zafronix respondió con código ' + code + ': ' + response.getContentText().substring(0, 200) };
    }

    const data = JSON.parse(response.getContentText());
    const matches = data.data || [];

    const groupScores = []; // {key, gL, gV}
    const oct = new Set(), qua = new Set(), sem = new Set();
    let f1 = '', f2 = '', campeon = '';

    // Mapa de stage Zafronix → ronda KO interna
    const ZAFRONIX_STAGE_TO_KO = {
      'round_of_16':   'r32',  // 16avos (16 partidos, primer KO del WC 2026)
      'round_of_32':   'r32',  // nombre alternativo
      'round_of_8':    'r16',  // 8vos (8 partidos)
      'quarter_final': 'qf',   // cuartos (4 partidos)
      'semi_final':    'sf',   // semis (2 partidos)
      'final':         'fin'   // final (1 partido)
    };

    const koConfig = getKOConfig();
    // koMatchesByRnd: {r32:[{local,visita,gL,gV,aet,winner},...], ...}
    const koMatchesByRnd = {};

    matches.forEach(m => {
      const stage = m.stageNormalized || m.stage || '';
      const home = m.homeTeam ? mapName(m.homeTeam) : '';
      const away = m.awayTeam ? mapName(m.awayTeam) : '';
      const played = m.homeScore !== null && m.homeScore !== undefined &&
                     m.awayScore !== null && m.awayScore !== undefined;

      if (stage.indexOf('group') === 0) {
        if (played && home && away) {
          groupScores.push({ key: home + '|' + away, gL: m.homeScore, gV: m.awayScore });
        }
        return;
      }

      // Equipos que alcanzaron cada ronda (sistema legacy — se mantiene para compatibilidad)
      if (stage === 'round_of_16' || stage === 'round_of_32') { if (home) oct.add(home); if (away) oct.add(away); }
      if (stage === 'round_of_8' || stage === 'quarter_final') { if (home) qua.add(home); if (away) qua.add(away); }
      if (stage === 'semi_final') { if (home) sem.add(home); if (away) sem.add(away); }
      if (stage === 'final') {
        if (home) f1 = home;
        if (away) f2 = away;
        if (played && home && away) {
          campeon = m.homeScore > m.awayScore ? home : m.awayScore > m.homeScore ? away : campeon;
        }
      }

      // Nuevo sistema: guardar marcadores KO por slot (usando config de slots)
      const koRnd = ZAFRONIX_STAGE_TO_KO[stage];
      if (koRnd && played && home && away) {
        if (!koMatchesByRnd[koRnd]) koMatchesByRnd[koRnd] = [];
        const aet = !!(m.extraTime || m.penalties);
        const winner = aet ? (m.homeScore > m.awayScore || (m.penalties && m.homePenalties > m.awayPenalties) ? 'local' : 'visita') : '';
        koMatchesByRnd[koRnd].push({ local: home, visita: away, gL: m.homeScore, gV: m.awayScore, aet, winner });
      }
    });

    // Guardar marcadores KO usando los slots definidos en koConfig
    const koResultadosToSave = {};
    Object.keys(koMatchesByRnd).forEach(rnd => {
      const slots = (koConfig.rounds && koConfig.rounds[rnd] && koConfig.rounds[rnd].slots) || [];
      if (!slots.length) return;
      const results = [];
      koMatchesByRnd[rnd].forEach(m => {
        const slotIdx = slots.findIndex(s => s.local === m.local && s.visita === m.visita);
        if (slotIdx === -1) return;
        results.push({ slot: slotIdx, gL: m.gL, gV: m.gV, aet: m.aet, winner: m.winner });
      });
      if (results.length) {
        koResultadosToSave[rnd] = results;
        guardarResultadosKO({ ronda: rnd, resultados: JSON.stringify(results) });
      }
    });

    if (groupScores.length > 0) guardarScoresAutoSync(groupScores);

    const resultadosObj = { oct: Array.from(oct), qua: Array.from(qua), sem: Array.from(sem), f1, f2, campeon };

    if (oct.size > 0 || qua.size > 0 || sem.size > 0 || f1) {
      const sh = getSheet('Resultados');
      if (sh.getLastRow() === 0) {
        sh.appendRow(['grupos_json', 'oct_json', 'qua_json', 'sem_json', 'f1', 'f2', 'campeon', 'terc_json']);
      }
      const existingGrupos = sh.getLastRow() > 1 ? (sh.getRange(2, 1).getValue() || '{}') : '{}';
      const existingTerc   = sh.getLastRow() > 1 ? (sh.getRange(2, 8).getValue() || '[]') : '[]';
      const row = [
        existingGrupos,
        JSON.stringify(resultadosObj.oct), JSON.stringify(resultadosObj.qua),
        JSON.stringify(resultadosObj.sem), f1, f2, campeon, existingTerc
      ];
      if (sh.getLastRow() <= 1) sh.appendRow(row);
      else sh.getRange(2, 1, 1, 8).setValues([row]);
    }

    return { ok: true, resultados: resultadosObj, scores: getScores(), scoresKO: getScoresKO(), matches: groupScores.length };
  } catch(err) {
    return { error: 'Error al consultar Zafronix: ' + err.message };
  }
}

// Guarda la API key de Zafronix en el servidor (Script Properties)
function guardarTokenZafronix(p) {
  const key = (p && p.apiToken || '').trim();
  if (!key) return { error: 'API key vacía' };
  PropertiesService.getScriptProperties().setProperty('ZAFRONIX_KEY', key);
  return { ok: true, msg: 'API key de Zafronix guardada. Ahora puedes activar el Auto-Sync.' };
}

// ── ADMIN ────────────────────────────────────────────────

function eliminarJugador(p) {
  const nombre = (p.nombre || '').trim();
  if (!nombre) throw new Error('Nombre requerido');

  const jSh = getSheet('Jugadores');
  const jData = jSh.getDataRange().getValues();
  for (let i = jData.length - 1; i >= 1; i--) {
    if (String(jData[i][0]).trim() === nombre) { jSh.deleteRow(i + 1); break; }
  }

  const pSh = getSheet('Pronosticos');
  const pData = pSh.getDataRange().getValues();
  for (let i = pData.length - 1; i >= 1; i--) {
    if (String(pData[i][0]).trim() === nombre) { pSh.deleteRow(i + 1); break; }
  }

  return { ok: true };
}

function resetear() {
  ['Jugadores', 'Pronosticos', 'Resultados', 'Scores'].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) sh.clearContents();
  });
  return { ok: true };
}

// ── AUTO-SYNC (trigger automático cada 10 min) ─────────────

// Guarda el token en Script Properties (no queda en código público)
function guardarToken(p) {
  const token = (p.apiToken || '').trim();
  if (!token) return { error: 'Token vacío' };
  PropertiesService.getScriptProperties().setProperty('API_TOKEN', token);
  return { ok: true, msg: 'Token guardado en el servidor. Ahora puedes activar el Auto-Sync.' };
}

// Activa un trigger que llama a autoSyncResultados cada 10 minutos
function activarAutoSync(p) {
  // Si se pasa un token nuevo, guardarlo también
  if (p && p.apiToken) {
    PropertiesService.getScriptProperties().setProperty('API_TOKEN', p.apiToken.trim());
  }
  // Verificar que hay alguna key (Zafronix preferida, o football-data como respaldo)
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('ZAFRONIX_KEY') || props.getProperty('API_TOKEN');
  if (!token) return { error: 'Primero guarda la API key con Guardar Token.' };

  // Eliminar triggers anteriores del mismo tipo para evitar duplicados
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'autoSyncResultados') ScriptApp.deleteTrigger(t);
  });

  // Crear nuevo trigger cada 10 minutos
  ScriptApp.newTrigger('autoSyncResultados')
    .timeBased()
    .everyMinutes(10)
    .create();

  return { ok: true, msg: 'Auto-Sync activado: resultados se sincronizan cada 10 minutos automáticamente.' };
}

// Desactiva todos los triggers de auto-sync
function desactivarAutoSync() {
  let count = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'autoSyncResultados') {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });
  return { ok: true, msg: count > 0 ? 'Auto-Sync desactivado.' : 'No había Auto-Sync activo.' };
}

// Informa si el trigger está activo
function getAutoSyncStatus() {
  const active = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'autoSyncResultados');
  const props = PropertiesService.getScriptProperties();
  const hasToken = !!(props.getProperty('ZAFRONIX_KEY') || props.getProperty('API_TOKEN'));
  return { active, hasToken };
}

// Cierra automáticamente las rondas KO cuyo deadline ya pasó.
// Llamado desde autoSyncResultados (cada 10 min).
function autoCloseKORounds() {
  try {
    const config = getKOConfig();
    if (!config || !config.rounds) return 0;
    const now = new Date();
    let changed = 0;
    Object.keys(config.rounds).forEach(rnd => {
      const r = config.rounds[rnd];
      if (r.status === 'abierto' && r.deadline && now > new Date(r.deadline)) {
        r.status = 'cerrado';
        changed++;
      }
    });
    if (changed > 0) guardarKOConfig({ config: JSON.stringify(config) });
    return changed;
  } catch(e) {
    return 0;
  }
}

// Esta función es llamada por el trigger automático.
// Prefiere Zafronix (tiene el Mundial 2026); usa football-data solo si no hay key de Zafronix.
function autoSyncResultados() {
  try {
    const hasZafronix = !!PropertiesService.getScriptProperties().getProperty('ZAFRONIX_KEY');
    const result = hasZafronix ? fetchResultadosZafronix({}) : fetchResultadosAPI({});
    const closed = autoCloseKORounds();
    // Log en hoja auxiliar para diagnóstico
    const logSh = getSheet('AutoSyncLog');
    if (logSh.getLastRow() > 500) logSh.deleteRows(2, 100); // evitar crecer indefinidamente
    logSh.appendRow([new Date(), result.matches || 0, result.error || 'ok (' + (hasZafronix ? 'zafronix' : 'football-data') + ')' + (closed > 0 ? ' | cerró ' + closed + ' ronda(s) KO' : '')]);
  } catch(e) {
    const logSh = getSheet('AutoSyncLog');
    logSh.appendRow([new Date(), 0, 'ERROR: ' + e.message]);
  }
}
