# Auditoría del sistema de puntaje — 03 de julio de 2026

Auditoría exhaustiva de código + verificación independiente contra los datos reales de la
planilla (`Polla2026`, Google Sheets), solicitada ante la existencia de premios en dinero.

**Metodología:**
1. Lectura completa de todas las funciones que calculan, leen o escriben puntaje y estado
   (`index.html` 6.480 líneas, `apps-script.gs` 938 líneas).
2. Descarga de la planilla real (8 hojas) y **recálculo desde cero en Python** de los
   puntos de los 14 jugadores, replicando la fórmula del código de forma independiente.
3. **Doble verificación cruzada**: la suite `test-scoring.js` extrae las funciones REALES
   de `index.html`, las ejecuta en Node contra un snapshot congelado de la planilla
   (`test-data/snapshot-2026-07-03.json`) y compara contra los totales del recálculo
   Python. Ambas implementaciones coinciden en los 14 jugadores, punto por punto.

---

## 1. Resultado de la verificación con datos reales

El recálculo independiente coincide **exactamente** con lo que la app calcula y muestra en
el Ranking para los 14 jugadores (la app no guarda puntajes: los recalcula en cada render
desde `pronosticos + scores + scoresKO + resultados`, por lo que ejecutar sus funciones
reales sobre los datos reales ES el valor mostrado):

| Jugador | Partidos | Grupos | Llaves | TOTAL |
|---|---|---|---|---|
| Dani Carvacho | 52 | 63 | 35 | **150** |
| Agustín Delgado | 51 | 64 | 33 | **148** |
| Omar Olave | 58 | 63 | 24 | **145** |
| Daniel Piña | 51 | 65 | 28 | **144** |
| Claudia Villablanca | 50 | 60 | 30 | **140** |
| German Carvacho | 48 | 62 | 29 | **139** |
| Sara Barahona | 47 | 62 | 29 | **138** |
| Esteban | 51 | 63 | 23 | **137** |
| Diego Guerrero | 45 | 62 | 24 | **131** |
| Gabriel Dartuwig | 46 | 57 | 27 | **130** |
| Catalina Aliste | 43 | 57 | 29 | **129** |
| Katherine Widemann | 38 | 64 | 27 | **129** |
| Diego Triviño () | 44 | 61 | 23 | **128** |
| Estrella Rivera | 33 | 46 | 0 | **79** |

Verificaciones adicionales sobre los datos guardados:
- Los pronósticos de los 14 jugadores parsean sin errores; **todos** los goles guardados
  (grupos, partidos y KO) son numéricos (`int`), sin strings — el riesgo de comparación
  `'2'!==2` no afecta datos actuales.
- Las predicciones KO de los 13 jugadores que las tienen miden exactamente 16 slots,
  alineadas 1:1 con los 16 cruces de `KOConfig.rounds.r32.slots` — **no hay
  desalineamiento residual** del bug corregido en `guardarConfigKO`.
- Los 72 partidos de grupos tienen marcador cargado. En 16avos hay 13 de 16 resultados;
  los slots 12 (Argentina–Cabo Verde), 13 (Australia–Egipto) y 15 (Colombia–Ghana)
  corresponden a partidos del 3 de julio (aún no cargados — normal).

---

## 2. Hallazgos que afectan puntos HOY (datos, no código)

### D1 — Bonus de cierre de grupos: **NO APLICA por decisión de reglas** (resuelto 03-jul)

> **Resolución del admin (03-jul-2026):** el puntaje de la fase de grupos quedó **cerrado e
> inamovible** con los resultados matemáticos previos al inicio de los 16avos (antes de
> Sudáfrica–Canadá). El bonus de posiciones finales (+3/+2) **no se considera**. Por lo
> tanto `Resultados!grupos_json` debe **permanecer vacío** — no cargar las posiciones
> finales en Admin → Grupos, porque eso activaría el bonus retroactivamente.
>
> Acción pendiente derivada: el banner del Ranking (index.html:4370) todavía anuncia
> "Bonus fin de grupos: +2/+1 por posición exacta". Ese texto debe **eliminarse** para que
> ningún jugador reclame un bonus que por regla no existe.

Lo que sigue de esta sección se conserva **solo como referencia histórica** (qué habría
pasado si el bonus se aplicara), porque documenta un comportamiento del código que sigue
latente: si algún día alguien escribe posiciones en `grupos_json`, el bonus se otorgará
automáticamente.

`Resultados!grupos_json` está **vacío** (`{}`), por lo que `calcPtsGrupos()` (index.html:4694-4699)
otorga **0 puntos de bonus** a todos. El bonus (+3 por 1° exacto, +2 por 2° exacto, por
cada uno de los 12 grupos) solo se activaría si el admin cargara posiciones finales en
**Admin → 🏟️ Grupos**.

Tablas finales reales calculadas desde los 72 marcadores (sin ambigüedad: ningún grupo
requirió desempates más allá de puntos/dif. gol/goles a favor, por lo que el criterio de la
app y el de FIFA coinciden):

| Grupo | 1° | 2° | | Grupo | 1° | 2° |
|---|---|---|---|---|---|---|
| A | México | Sudáfrica | | G | Bélgica | Egipto |
| B | Suiza | Canadá | | H | España | Cabo Verde |
| C | Brasil | Marruecos | | I | Francia | Noruega |
| D | Estados Unidos | Australia | | J | Argentina | Austria |
| E | Alemania | Costa de Marfil | | K | Colombia | Portugal |
| F | Países Bajos | Japón | | L | Inglaterra | Croacia |

Bonus pendiente por jugador y **ranking corregido** si se aplica:

| # | Jugador | Total hoy | Bonus pendiente | Total real |
|---|---|---|---|---|
| 1 | Agustín Delgado | 148 | +44 | **192** |
| 2 | Daniel Piña | 144 | +47 | **191** |
| 3 | Dani Carvacho | 150 | +40 | **190** |
| 4 | Omar Olave | 145 | +39 | **184** |
| 5 | Sara Barahona | 138 | +40 | **178** |
| 6 | German Carvacho | 139 | +37 | **176** |
| 7 | Katherine Widemann | 129 | +45 | **174** |
| 8 | Claudia Villablanca | 140 | +32 | **172** |
| 9 | Esteban | 137 | +33 | **170** |
| 10 | Diego Guerrero | 131 | +35 | **166** |
| 11 | Diego Triviño () | 128 | +38 | **166** |
| 12 | Gabriel Dartuwig | 130 | +32 | **162** |
| 13 | Catalina Aliste | 129 | +31 | **160** |
| 14 | Estrella Rivera | 79 | +23 | **102** |

⚠️ Si se aplicara, el bonus cambiaría al líder y al podio completo — **por eso mismo la
resolución de arriba (no aplica, grupos cerrados) debe quedar publicada en las reglas
visibles de la app**, para que el criterio quede fijado antes de que decida premios.

### 🔴 D2 — Bélgica–Senegal (16avos, slot 7) guardado con marcador de 120', no de 90'

`ScoresKO` fila `r32 / slot 7`: **3–2, aet=true, winner=local**. Un partido con
`aet=true` fue empate a los 90', así que el marcador guardado debe ser ese empate
(la regla dice: *"los goles de alargue no suman"*). Un 3–2 con alargue es el marcador
de 120'. Consecuencia: los +1/+1 por gol se están comparando contra 3–2 en vez del
marcador real de 90'. Puntos hoy en ese partido:

| Jugador | Pred. | Pts hoy | Si 90' fue 2–2 | Si 90' fue 1–1 |
|---|---|---|---|---|
| Omar Olave | 3-1 | 1 | 0 (−1) | 1 |
| Gabriel Dartuwig | 2-0 | 0 | 1 (+1) | 0 |
| Esteban | 1-2 | 1 | 1 | 1 |
| Catalina Aliste | 0-0 | 2 | 2 | 2 |
| Katherine Widemann | 0-0 | 2 | 2 | 2 |
| Daniel Piña | 1-1 | 2 | 2 | 4 (+2) |
| Diego Guerrero | 2-2 | 3 | 4 (+1) | 2 (−1) |
| Claudia Villablanca | 2-0 | 0 | 1 (+1) | 0 |
| Sara Barahona | 2-1 | 0 | 1 (+1) | 1 (+1) |
| German Carvacho | 2-0 | 0 | 1 (+1) | 0 |
| Dani Carvacho | 2-1 | 0 | 1 (+1) | 1 (+1) |
| Agustín Delgado | 3-2 | 2 | 1 (−1) | 0 (−2) |
| Diego Triviño () | 2-1 | 0 | 1 (+1) | 1 (+1) |

**Acción**: confirmar el marcador real a los 90' de ese partido y corregir la fila en
`ScoresKO` (o en Admin → Llaves). Los dos otros partidos con alargue (slots 0 y 3,
ambos 1–1) están bien guardados. **No aplicar ningún cambio de puntaje a mano**: al
corregir el dato, el puntaje se recalcula solo.

Causa raíz: el auto-sync (`fetchResultadosZafronix`, apps-script.gs:762) guarda
`m.homeScore/m.awayScore` tal como los entrega la API con `aet=true`, sin verificar que
sea el marcador de 90'. Y el formulario de Admin → Llaves (`guardarMarcadoresKO`,
index.html:5287) tampoco valida que `aet ⇒ empate`. Ver hallazgos C4/C5.

#### D2 confirmado por evidencia independiente: el caso Sara Barahona (agregado 03-jul, tarde)

Reclamo de la jugadora: antes de Suiza–Argelia tenía **135** pts en pantalla; acertó el
marcador exacto (2–0 → +4) y esperaba **139**, pero la app quedó en **138**.

Reconstrucción con los datos reales de la planilla (desglose completo de sus 16avos en la
suite/snapshot):

- Con los datos **actuales**, Sara suma 47 (partidos) + 62 (grupos) + 29 (llaves) = **138** ✓,
  y su total *sin* el slot 11 (Suiza–Argelia) da **134** — no 135.
- El único punto que falta contra su recuerdo está en el **slot 7 (Bélgica–Senegal)**: su
  predicción fue **2–1** y hoy recibe **0 pts** contra el `3–2 aet` guardado.
- Si el slot 7 hubiera tenido el marcador de 90' (empate: **1–1 o 2–2**, cualquiera de los
  dos), Sara habría mostrado **exactamente 135** antes de Suiza–Argelia, y **139** después
  de su +4 — cuadra al punto con lo que ella vio.

Conclusión: en algún momento el slot 7 tuvo (o debió tener) el marcador de 90' y fue
sobrescrito con el marcador de 120' (3–2). El reclamo de Sara **no requiere ajuste manual
de puntos ni tocar ninguna predicción**: se resuelve corrigiendo la fila `r32/slot 7` de
`ScoresKO` con el marcador real de 90' (pendiente de confirmar si fue 1–1 o 2–2 — para
Sara da +1 en ambos casos, pero para otros jugadores la matriz de arriba difiere según el
marcador exacto). Descartadas las alternativas: los otros slots donde Sara puntúa bajo
(slot 0: pred 2-0 vs 1-1 aet; slot 4: pred 1-2 vs 2-1) no tienen ninguna versión plausible
del dato que explique el −1, y ningún marcador de grupos cambió su componente de partidos.

### 🟡 D3 — Filas basura/duplicadas en la hoja `Scores`

- Fila `Ecuador|Alemania (2,1)` **invertida** respecto al fixture (`Alemania|Ecuador (1,2)`,
  que también existe y es la que puntúa). La app la ignora al calcular, pero infla el
  contador "N partidos con resultado" y puede confundir a quien revise la hoja. Origen
  probable: la API entregó el partido con local/visita invertidos y el emparejamiento por
  nombre exacto la guardó como partido nuevo; alguien luego cargó la fila correcta a mano.
- Filas de encabezado manual `"Resultados Polla"` / `"Jugador|Puntaje|Puntaje"` dentro del
  área de datos.

**Acción**: borrar la fila invertida y las filas de encabezado extra (solo limpieza; no
cambia puntos).

### 🟡 D4 — Auto-sync detenido desde el 17 de junio

`AutoSyncLog` registra su última corrida el **17-jun 18:02** (sin errores previos). Todo lo
posterior se ha cargado a mano o con el botón manual. Si fue intencional, ok (la carga
manual con validación es incluso más segura); si no, reactivarlo en Admin → API Sync,
teniendo presente D2 (validar partidos con alargue antes de confiar en el sync).

---

## 3. Hallazgos de código (riesgos latentes — no afectan los datos actuales)

Severidad: 🔴 alto · 🟡 medio · 🔵 bajo. Ninguno altera puntos hoy (verificado contra la
planilla); son puertas abiertas para errores futuros.

> **Actualización 04-jul-2026 — blindaje aplicado** (a pedido del admin, tras repetirse el
> patrón de D2 con Argentina–Cabo Verde, detectado y cargado bien esta vez):
> - **C1 corregido**: `guardarConfigKO` (cliente) exige confirmación explícita para cambiar
>   cruces ya definidos cuando la ronda tiene predicciones, y `guardarKOConfig` (servidor)
>   **rechaza** ese cambio salvo `force='1'` — ninguna vía puede reordenar en silencio.
> - **C4 corregido**: el formulario Admin → Llaves bloquea guardar ET/Pen con marcador
>   desigualado (debe ser el empate de los 90') y exige elegir quién avanzó.
> - **C5 corregido**: `guardarResultadosKO` (servidor) rechaza `aet` con `gL≠gV`, y el
>   auto-sync de Zafronix **omite** partidos con alargue cuyo marcador venga desigualado
>   (marcador de 120'), dejándolos para carga manual con el marcador de 90'.
> - **C11 corregido**: el banner del Ranking ya no promete el bonus de fin de grupos
>   (que por decisión de reglas no aplica) y ahora resume la regla real de llaves.
>
> ⚠️ Para que esto quede vivo: el cambio de `index.html` se publica al mergear a `main`
> (GitHub Pages); el de `apps-script.gs` requiere pegar el archivo en el editor de Apps
> Script y crear **New version** del deployment.

| # | Sev. | Archivo:línea | Hallazgo | Escenario que lo dispara |
|---|---|---|---|---|
| C1 | 🔴 | index.html:5249 (`guardarConfigKO`) | El fix actual evita compactar, pero **no protege contra reordenar/reescribir cruces ya definidos** cuando ya existen predicciones guardadas. `importarCrucesKO` (5222) rellena los inputs en el orden del texto pegado; si el admin re-importa 8vos/4tos/semis en otro orden después de que la gente predijo, se guarda sin advertencia y TODAS las predicciones quedan contra el partido equivocado. | Admin re-pega el bracket de 8vos con otro orden después del cierre de predicciones. |
| C2 | 🔴 | apps-script.gs:773 (`fetchResultadosZafronix`) | El emparejamiento de resultados KO exige `slot.local===API.home && slot.visita===API.away` **exacto**. Si la API invierte local/visita o difiere en un nombre, el resultado **se descarta en silencio** (nadie puntúa ese partido y no hay aviso). Con grupos ya pasó (fila `Ecuador\|Alemania`, ver D3). | API reporta "Senegal vs Bélgica" con equipos invertidos. |
| C3 | 🟡 | apps-script.gs:761 | Cálculo del `winner` con `\|\|` encadenado: si un partido se define en alargue (sin penales) y la API entregara el marcador de 90' empatado, `winner` sale `'visita'` aunque haya ganado el local. No afecta puntos (el puntaje no usa `winner`), pero sí el bracket/avance mostrado. | ET sin penales + API con marcador 90'. |
| C4 | 🔴 | index.html:5287 (`guardarMarcadoresKO`) | No valida `aet ⇒ gL===gV`. Permitió guardar el 3–2 aet de D2. | Admin marca ET/Pen e ingresa el marcador de 120'. |
| C5 | 🔴 | apps-script.gs:762 | El auto-sync guarda `homeScore/awayScore` con `aet=true` sin saber si son de 90' o 120'. Causa raíz de D2. | Cualquier partido decidido en alargue sincronizado por API. |
| C6 | 🟡 | index.html:4726 (`calcPtsPartido`) | Falta la guardia de nulls que sí tiene `calcPtsKOPartido` (4753): con `pred={g1:null,g2:null}` y empate real, regala +1 (null>null→false ⇒ "empate predicho"). Hoy inalcanzable (todos los flujos guardan g1/g2 completos), pero cualquier flujo futuro que guarde predicciones parciales lo activa. | Un guardado futuro de partidos con `{g1:null,g2:null}`. |
| C7 | 🟡 | index.html:4729, 4758-4768 | Comparaciones `===` de goles sin coerción de tipo: `'2'!==2` haría perder el punto de marcador exacto en silencio. Hoy todos los datos son numéricos (verificado), y `test-scoring.js` vigila que siga así. | Edición manual del JSON en la planilla con comillas. |
| C8 | 🟡 | apps-script.gs:221 (`getScores`) | Ante claves duplicadas (ambas con marcador), gana la **última fila** de la hoja. Hoy funciona porque la corrección manual quedó después; si el orden fuera el inverso, ganaría el dato viejo sin aviso. | Duplicado por clave inglesa/española o invertida, con corrección insertada antes. |
| C9 | 🔵 | apps-script.gs:237 (`getScoresKO`) | `Number(celda_vacía)===0`: una fila de ScoresKO con el slot en blanco se lee como **slot 0** y pisa el resultado real del primer cruce. | Edición manual de la hoja dejando la columna slot vacía. |
| C10 | 🔵 | index.html:4366 | "N partidos con resultado" cuenta `Object.keys(state.scores)`, incluyendo filas basura/invertidas (hoy muestra 74 en vez de 72). | Ya visible; cosmético. |
| C11 | 🟡 | index.html:4370 | Texto de reglas del banner: "Bonus fin de grupos: +2/+1" ≠ código (+3/+2). Los jugadores no pueden auditar su puntaje con reglas mal publicadas. | Ya visible. |
| C12 | 🔵 | apps-script.gs:22 | Comentario de cabecera: "Si va a alargue/penales: solo +2 por ganador" — descripción desactualizada de la regla implementada (+1 gol local, +1 gol visita, +2 empate-tendencia). | Confunde a quien mantenga el backend. |
| C13 | 🔵 | index.html:4704 / apps-script.gs:552 | `calcPtsElim` y `calcularScores` son **código muerto** (nadie los llama) con OTRA fórmula de puntos (10/20/30/40/80 y 2/4/6/8/10). El README además dice que "deben ser idénticos". Riesgo de que un futuro mantenedor los "reconecte". | Refactor futuro guiado por el README. |
| C14 | 🔵 | apps-script.gs:838 (`resetear`) | Limpia `Jugadores/Pronosticos/Resultados/Scores` pero **no** `ScoresKO` ni `KOConfig`: un reset dejaría resultados KO fantasma que puntuarían contra predicciones nuevas. | Uso de Admin → Riesgo → Resetear. |
| C15 | 🟡 | index.html:4343 | Desempate del ranking: `total → pts partidos → pts grupos`, no publicado en ninguna regla visible. Hoy hay un empate real en 129 (Catalina/Katherine) y otro potencial en 166 tras aplicar D1. Con premios en dinero, el criterio de desempate debe estar **pactado y publicado** antes de que importe. | Empate en el podio al final del torneo. |

Aspectos verificados que están **bien**:
- El cierre de predicciones KO se valida **en el servidor** (`koEffectiveStatus`,
  apps-script.gs:372-385; `guardarKO` rechaza si la ronda no está abierta) — no se puede
  predecir tarde manipulando el reloj del navegador.
- El puntaje nunca se persiste: siempre se recalcula desde los datos primarios, por lo que
  corregir un dato corrige el puntaje retroactivamente y sin residuos.
- `guardarMarcadoresKO`/`guardarResultadosKO` preservan el número de slot explícito
  (`{slot:i,...}`); el `.filter(Boolean)` de 5300 no desplaza índices.
- El simulador y las proyecciones inyectan estado temporal y lo restauran en `finally`;
  reutilizan `calcPtsTotal` sin duplicar fórmula (sin riesgo de doble conteo).
- `0` como cantidad de goles se maneja bien en todos los caminos revisados (`!= null` y no truthiness).
- Los 3 slots KO sin resultado (12, 13, 15) devuelven 0 pts sin romper nada (guardias de null correctas).

---

## 4. Suite de tests (`test-scoring.js`)

```
node test-scoring.js
```

- **Extrae y ejecuta las funciones reales** de `index.html` (no copias) en un sandbox Node.
- 47 tests: fórmula de partidos de grupos (exacto/tendencia/0-0/nulls/strings), fórmula KO
  (los 5 niveles de acierto + los 4 casos de alargue/penales, incluyendo que el ganador de
  penales no da puntos), bonus/en-vivo de grupos, y regresión completa de los 14 jugadores
  contra el snapshot real `test-data/snapshot-2026-07-03.json` (totales verificados de
  forma independiente en Python).
- **Integridad de índices**: falla si algún arreglo de slots tiene huecos intermedios
  (señal de compactación), si las predicciones de un jugador quedan más largas que los
  cruces de la ronda (señal de reordenamiento post-guardado), o si hay resultados en slots
  sin cruce definido.
- **Chequeos de datos** (warnings, no botan la suite): hoy detecta exactamente D1, D2 y D3.
- Para futuras rondas: después de cerrar 8vos/4tos/semis/final conviene regenerar un
  snapshot nuevo y actualizar los totales esperados (el archivo documenta cómo).

---

## 5. Propuesta de blindaje estructural (NO implementada — para discusión)

El modelo actual ancla cada predicción KO a la **posición del arreglo** de cruces. El fix
de `guardarConfigKO` y los tests reducen el riesgo, pero la fragilidad es intrínseca:
cualquier código o edición manual que altere el orden de los slots desalinea todas las
predicciones guardadas, en silencio.

**Propuesta: anclar cada predicción y cada resultado al cruce, no al índice.**

1. **Nuevo campo aditivo `match`** en cada predicción KO:
   `{g1:2, g2:1, match:'Bélgica|Senegal'}`. Igual en cada resultado de `ScoresKO`
   (columnas `local`/`visita` junto a `slot`).
2. **Migración one-shot, sin tocar nada existente**: para cada jugador y ronda,
   `pred[i].match = koConfig.rounds[rnd].slots[i].local + '|' + slots[i].visita`
   (los datos actuales están verificados como alineados, así que la anotación es segura
   hoy; hacerla AHORA, antes de que abran los 8vos). No se modifica ni g1 ni g2 ni el
   orden; solo se agrega el campo. Reversible y auditable.
3. **Scoring con clave estable**: `calcPtsKO` busca el resultado cuyo cruce coincida con
   `pred.match` (con normalización de nombres); si la predicción no tiene `match` (datos
   viejos), cae al índice como hoy. Cambio de ~15 líneas, compatible hacia atrás.
4. **Validación en el servidor** (`guardarKOConfig`): rechazar (o exigir confirmación
   explícita) cualquier guardado que **cambie los equipos de un slot ya no-vacío** cuando
   existan predicciones guardadas para esa ronda. Esto convierte el desalineamiento de
   "error silencioso" a "operación bloqueada con aviso".
5. **Validación `aet ⇒ empate`** en `guardarResultadosKO` (servidor) y en el formulario
   admin (cliente), para que D2 no pueda repetirse.

Orden sugerido: (4) y (5) son pequeños y urgentes antes de los 8vos; (1)–(3) pueden
hacerse con calma entre rondas (idealmente también antes de la final, donde cada punto
decidirá premios).

---

## 6. Checklist inmediato para el admin (antes de los 8vos, hoy 20:00)

1. ☐ ~~Cargar posiciones finales de los 12 grupos~~ **NO hacerlo**: por decisión de reglas
   el bonus no aplica y los puntos de grupos quedaron inamovibles (ver D1). En su lugar,
   **eliminar la frase "Bonus fin de grupos: +2/+1 por posición exacta"** del banner del
   Ranking (index.html:4370) y publicar la regla en la app.
2. ☐ **Confirmar el marcador a los 90' de Bélgica–Senegal** (¿1–1 o 2–2?) y corregir la
   fila `r32/slot 7` de ScoresKO (D2). Esto resuelve automáticamente el reclamo de Sara
   Barahona (135+4=139) y ajusta a los demás jugadores según la matriz de la sección 2.
3. ☐ Borrar filas basura de `Scores` (D3).
4. ☐ Al configurar los cruces de 8vos: cargarlos **una sola vez, en el orden del bracket
   oficial**, y no reordenarlos después de que alguien guarde predicciones (C1).
5. ☐ Correr `node test-scoring.js` después de cada cambio de datos o código.
6. ☐ Pactar y publicar el criterio de desempate del ranking (C15) antes de la final.
