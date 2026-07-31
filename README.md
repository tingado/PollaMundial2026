# ⚽ La Polla Mundialera 2026

> **Demo en vivo:** [tingado.github.io/PollaMundial2026](https://tingado.github.io/PollaMundial2026/)

Plataforma web para organizar una quiniela de fútbol entre amigos para el Mundial 2026. Sin servidores de pago, sin instalaciones — solo un archivo HTML y Google Sheets como base de datos.

---

## ¿Qué incluye?

- 📅 Calendario de los 64 partidos de la fase de grupos
- 🏟️ Tablas de posición de los 12 grupos (A–L)
- 🎯 Pronósticos: quién clasifica 1° y 2° en cada grupo
- 🏆 Eliminatorias: selección de equipos por ronda
- 📊 Ranking con puntaje en tiempo real
- 📋 Inscripción con gestión del pozo ($5.000 CLP entrada)
- 🧮 Explicación del sistema de puntaje
- ⚙️ Admin: resultados manuales + sincronización automática con football-data.org
- ⚡ Panel lateral "¿Sabías que?" con datos curiosos del Mundial

---

## Sistema de puntaje

### Fase de grupos
| Acierto | Puntos |
|---|---|
| 🥇 1° lugar del grupo correcto | **+2 pts** |
| 🥈 2° lugar del grupo correcto | **+1 pt** |

### Fase eliminatoria
| Ronda | Puntos por equipo |
|---|---|
| 16avos de Final (32 equipos) | **+2 pts** |
| Cuartos de Final (8 equipos) | **+4 pts** |
| Semifinales (4 equipos) | **+6 pts** |
| Finalista (2 equipos) | **+8 pts** |
| 🏆 Campeón | **+10 pts** |

Máximo posible: 36 pts grupos + 264 pts eliminatorias = **300 pts**

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│              index.html (Frontend)                  │
│  Todo el app en un solo archivo HTML/CSS/JS         │
│  Se publica en GitHub Pages o Netlify               │
└───────────────────┬─────────────────────────────────┘
                    │ JSONP (GET)
┌───────────────────▼─────────────────────────────────┐
│         apps-script.gs (Backend)                    │
│  Google Apps Script — gratis, sin servidor          │
│  Desplegado como Web App pública                    │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│         Google Sheets (Base de datos)               │
│  Hojas: Jugadores · Pronosticos · Resultados        │
└─────────────────────────────────────────────────────┘
```

---

## Archivos del repositorio

| Archivo | Descripción |
|---|---|
| `index.html` | App completa (frontend) — todo en un solo archivo |
| `apps-script.gs` | Backend (Google Apps Script) — se pega en el editor de Google |
| `MANUAL.md` | Guía paso a paso para desplegar desde cero en ~15 minutos |
| `Explicacion_Proyecto_Polla2026` | Guía conceptual para entender la arquitectura y trabajar con IA |
| `test-scoring.js` | Suite de tests del sistema de puntaje — `node test-scoring.js` (ejecuta las funciones reales de `index.html`) |
| `test-data/snapshot-2026-07-03.json` | Snapshot real de la planilla para el test de regresión |
| `AUDITORIA-PUNTAJE-2026-07-03.md` | Informe de la auditoría completa del sistema de puntaje |

---

## Deploy rápido (15 minutos)

1. **Backend:** Abre Google Sheets → Extensiones → Apps Script → pega `apps-script.gs` → Implementar como Web App
2. **Frontend:** Activa GitHub Pages en este repo (Settings → Pages → rama `main`) o arrastra `index.html` a Netlify
3. **Conectar:** Abre la app → pega la URL del Apps Script en el banner → Conectar

📋 Instrucciones detalladas en el [MANUAL.md](./MANUAL.md)

---

## Replicar este proyecto para tu propio torneo

Este proyecto está pensado para adaptarse fácilmente. Todo lo que necesitas cambiar está bien señalizado en los archivos:

**Para adaptar el torneo:**
- `FECHA_INICIO` y `FECHA_CIERRE` en `index.html`
- Array `PARTIDOS` con el calendario de tu torneo
- Objeto `GRUPOS` con los equipos participantes
- `MONTO_ENTRADA` y porcentajes del pozo
- `ADMIN_PIN` (default: `2026`)

**Para cambiar el diseño:**
- Variables CSS en `:root` al inicio del `<style>` (colores, fuentes)
- El layout usa flexbox con sidebar fijo + main + panel derecho

**Para cambiar la lógica de puntaje:**
- `calcPtsGrupos()`, `calcPtsPartido()`/`calcPtsPartidos()` y `calcPtsKOPartido()`/`calcPtsKO()` en `index.html` — el puntaje se calcula SOLO en el frontend, siempre fresco desde los datos
- (`calcPtsElim()` en `index.html` y `calcularScores()` en `apps-script.gs` son código legado sin uso — no los reconectes)
- Después de cualquier cambio corre `node test-scoring.js` para validar la fórmula contra los casos conocidos

> 💡 La arquitectura está diseñada para que puedas describir los cambios en lenguaje natural a una IA (Claude, ChatGPT, Gemini) y aplicarlos sin saber programar. Ver [Explicacion_Proyecto_Polla2026](./Explicacion_Proyecto_Polla2026) para guía de prompts.

---

## Datos técnicos

| | |
|---|---|
| Frontend | HTML + CSS + JS vanilla (sin frameworks) |
| Backend | Google Apps Script (JSONP) |
| Base de datos | Google Sheets |
| Hosting | GitHub Pages (gratis) |
| API resultados | football-data.org (plan gratuito) |
| Fuentes | Google Fonts (Bebas Neue + Outfit) |
| Costo total | **$0** |
