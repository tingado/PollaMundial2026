# 📋 MANUAL — Polla Mundialera 2026

**Tiempo estimado: 15 minutos · 3 pasos manuales**

> Demo en vivo: [tingado.github.io/PollaMundial2026](https://tingado.github.io/PollaMundial2026/)

---

## Archivos necesarios

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app web completa — se sube a GitHub Pages o Netlify |
| `apps-script.gs` | El backend — se pega en Google Apps Script |

---

## PASO 1 — Crear el backend en Google Sheets

> ⚠️ Crear SIEMPRE desde Google Sheets, NO desde script.google.com

### 1.1 Crear la hoja
1. Abre **sheets.google.com**
2. Clic en **"+"** → Nueva hoja de cálculo
3. Renómbrala **Polla2026**

### 1.2 Abrir el editor de scripts
1. Menú superior → **Extensiones → Apps Script**
2. Se abre el editor en una nueva pestaña

### 1.3 Pegar el código
1. Selecciona todo el texto en el editor → bórralo
2. Copia todo el contenido de **`apps-script.gs`**
3. Pégalo en el editor
4. Guarda (**Ctrl+S** / **Cmd+S**) → nombre: **Polla2026**

### 1.4 Implementar como aplicación web
1. Clic en **"Implementar"** → **"Nueva implementación"**
2. Clic en **⚙️** → **"Aplicación web"**
3. Configura:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
4. Clic en **"Implementar"**

### 1.5 Autorizar acceso
1. Clic en **"Autorizar acceso"** → elige tu cuenta
2. Si aparece "Google no verificó esta app":
   - Clic en **"Configuración avanzada"**
   - Clic en **"Ir a Polla2026 (no seguro)"**
3. Clic en **"Permitir"**

### 1.6 Copiar la URL del backend
Aparece una URL así:
```
https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
```
**Copia esa URL — la necesitas en el Paso 3.**

---

## PASO 2 — Publicar la app

### Opción A: GitHub Pages (recomendado)

1. Crea un repositorio público en **github.com**
2. Sube el archivo `index.html`
3. Ve a **Settings → Pages → Branch: main → Save**
4. Tu app queda en: `https://TUUSUARIO.github.io/REPO/`

### Opción B: Netlify (más rápido)

1. Ve a **app.netlify.com**
2. Arrastra el archivo `index.html` a la zona de deploy
3. Tu app queda en: `https://nombre-random.netlify.app`

---

## PASO 3 — Conectar la app con el backend

1. Abre tu URL de la app
2. Aparece un **banner rojo** arriba
3. Pega la URL del Apps Script (del Paso 1.6)
4. Clic en **"💾 Conectar"**
5. El banner desaparece — ¡listo!

**Si no aparece el banner:**
Borra `polla2026_url` y `p2026_cache` del localStorage del navegador (F12 → Application → Local Storage → tu URL)

---

## PASO 4 — Verificar que funciona

1. **Inscripción** → escribe un nombre → **Inscribirse** → debe aparecer ✅
2. **Mis Pronósticos** → selecciona el nombre → elige 1° y 2° en algún grupo → **Guardar**
3. **Eliminatorias** → selecciona el nombre → elige equipos → **Guardar**
4. **Ranking** → debe aparecer el nombre con 0 puntos

---

## PASO 5 — Compartir con tus amigos

Usa el botón **📲 Compartir por WhatsApp** en el sidebar, o copia este mensaje:

```
⚽🏆 POLLA MUNDIALERA 2026 🏆⚽

¡El Mundial se viene y nos jugamos la plata!

💰 Entrada: $5.000
🥇 1° lugar → 50% del pozo
🥈 2° lugar → 30% del pozo
🥉 3° lugar → 20% del pozo

👉 Entra aquí:
TU-URL-AQUI

Pasos:
1️⃣ Inscripción → escribe tu nombre
2️⃣ Pronostica 1° y 2° de cada grupo (A–L)
3️⃣ Elige quién avanza en eliminatorias
4️⃣ ¡Guarda antes del 11 de junio!

¡El que sepa de fútbol que lo demuestre! 🤙
```

---

## PASO 6 — Durante el torneo (rol del admin)

### Sincronizar resultados automáticamente
1. App → **Admin** → PIN: `2026`
2. Sección **"🔌 Sincronización con API"**
3. Token: `7dcb1c274a5a4c8582337e0752055982`
4. Clic en **"🔄 Sincronizar"**

El sistema obtiene los resultados desde football-data.org, actualiza las rondas de eliminatoria y recalcula el ranking automáticamente.

### Ingresar resultados de grupos manualmente
1. App → **Admin** → sección **"🏟️ Resultados Finales de Grupos"**
2. Para cada grupo (A–L), selecciona quién quedó 1° y 2°
3. Clic en **"💾 Guardar resultados de grupos"**

### Ingresar resultados de eliminatoria manualmente
1. App → **Admin** → sección **"✍️ Ingreso Manual de Resultados"**
2. Completa los campos según avanza el torneo:
   - Equipos en 16avos (32 equipos, separados por coma)
   - Equipos en Cuartos (8 equipos)
   - Equipos en Semis (4 equipos)
   - Finalista 1 y Finalista 2
   - Campeón
3. Clic en **"💾 Guardar y recalcular ranking"**

---

## Sistema de puntaje

### Fase de grupos
| Acierto | Puntos |
|---|---|
| 🥇 1° lugar del grupo correcto | **+2 pts** |
| 🥈 2° lugar del grupo correcto | **+1 pt** |

Máximo en grupos: 12 grupos × 3 pts = **36 pts**

### Fase eliminatoria
| Ronda | Por equipo correcto |
|---|---|
| 16avos de Final (32 clasificados) | **+2 pts** |
| Cuartos de Final (8 equipos) | **+4 pts** |
| Semifinales (4 equipos) | **+6 pts** |
| Finalista (2 equipos) | **+8 pts** |
| 🏆 Campeón del Mundo | **+10 pts** |

---

## Datos de referencia

| Dato | Valor |
|---|---|
| PIN admin | `2026` |
| Monto entrada | $5.000 CLP |
| Cierre pronósticos | 11 junio 2026, 15:00 hrs |
| Token football-data.org | `7dcb1c274a5a4c8582337e0752055982` |
| Inicio del Mundial | 11 junio 2026 |
| Final del torneo | 19 julio 2026 |
| Premios | 50% / 30% / 20% del pozo |

---

## Actualizar el Apps Script (si hubo cambios)

1. Abre **script.google.com** → tu proyecto
2. Reemplaza todo el código con el contenido actualizado de `apps-script.gs`
3. **Implementar → Gestionar implementaciones → editar implementación existente → Nueva versión**
4. La URL **no cambia** — no necesitas reconfigurar la app

---

## Problemas frecuentes

| Problema | Solución |
|---|---|
| No aparece el banner rojo | Borrar localStorage como se indica en Paso 3 |
| "Sin conexión — mostrando datos anteriores" | Reconectar el backend (Paso 3) |
| "Acción desconocida: guardarResultadosGrupos" | El Apps Script es el viejo — repetir Paso 1 con `apps-script.gs` |
| "Cannot read properties of null" | Creaste el script desde script.google.com, no desde Sheets — repetir Paso 1 |
| PIN admin no funciona | El PIN es `2026` (cuatro dígitos) |
| Netlify muestra página en blanco | Asegúrate de subir `index.html` directamente, no una carpeta |
| La URL de Apps Script no funciona | Verificar que el acceso sea "Cualquier persona" (no "con cuenta") |
| Los puntos de finalistas no suman | Actualiza el Apps Script — había un bug en versiones anteriores |
