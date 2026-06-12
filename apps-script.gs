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
// SCORING:
//   Grupo 1°: +2pts | Grupo 2°: +1pt | Marcador exacto: +2pts adicionales
//   Octavos: +10 | Cuartos: +20 | Semis: +30 | Finalista: +40 | Campeón: +80
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
      case 'fetchResultadosAPI':      result = fetchResultadosAPI(p); break;
      case 'guardarToken':            result = guardarToken(p); break;
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
  let scores = {};
  try { scores = getScores(); } catch(e) { /* Scores sheet may not exist yet */ }
  return {
    jugadores:  getJugadores(),
    pronosticos: getPronosticos(),
    resultados:  getResultados(),
    scores:      scores
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
  data.slice(1).forEach(r => {
    if (!r[0]) return;
    result[String(r[0])] = {
      gL: r[1] !== '' && r[1] !== null ? Number(r[1]) : null,
      gV: r[2] !== '' && r[2] !== null ? Number(r[2]) : null
    };
  });
  return result;
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

  // Team name mapping: API English → App Spanish
  const NAME_MAP = {
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
    'DR Congo': 'R.D. del Congo', 'Panama': 'Panamá'
  };
  function mapName(n) { return NAME_MAP[n] || n; }

  try {
    // WC 2026 competition ID on football-data.org is 2000 (FIFA World Cup)
    const url = 'https://api.football-data.org/v4/competitions/2000/matches?status=FINISHED';
    const response = UrlFetchApp.fetch(url, {
      headers: { 'X-Auth-Token': token },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
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
        local:  mapName(m.homeTeam.shortName || m.homeTeam.name),
        visita: mapName(m.awayTeam.shortName || m.awayTeam.name),
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
      guardarScores({ scores: JSON.stringify(groupScores) });
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

// ── ADMIN ────────────────────────────────────────────────

function eliminarJugador(p) {
  const nombre = (p.nombre || '').trim();
  if (!nombre) throw new Error('Nombre requerido');

  const jSh = getSheet('Jugadores');
  const jData = jSh.getDataRange().getValues();
  for (let i = jData.length - 1; i >= 1; i--) {
    if (jData[i][0] === nombre) { jSh.deleteRow(i + 1); break; }
  }

  const pSh = getSheet('Pronosticos');
  const pData = pSh.getDataRange().getValues();
  for (let i = pData.length - 1; i >= 1; i--) {
    if (pData[i][0] === nombre) { pSh.deleteRow(i + 1); break; }
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
  // Verificar que hay token
  const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!token) return { error: 'Primero guarda el token con guardarToken.' };

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
  const hasToken = !!PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return { active, hasToken };
}

// Esta función es llamada por el trigger automático
function autoSyncResultados() {
  try {
    const result = fetchResultadosAPI({});
    // Log en hoja auxiliar para diagnóstico
    const logSh = getSheet('AutoSyncLog');
    if (logSh.getLastRow() > 500) logSh.deleteRows(2, 100); // evitar crecer indefinidamente
    logSh.appendRow([new Date(), result.matches || 0, result.error || 'ok']);
  } catch(e) {
    const logSh = getSheet('AutoSyncLog');
    logSh.appendRow([new Date(), 0, 'ERROR: ' + e.message]);
  }
}
