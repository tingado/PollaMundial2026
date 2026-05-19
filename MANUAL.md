# 📋 MANUAL COMPLETO — Polla Mundialera 2026

**Tiempo estimado: 15 minutos · Solo 3 pasos manuales**

---

## Archivos necesarios

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app web (todo en uno) — se sube a Netlify |
| `Code.gs` | El backend — se pega en Google Apps Script |

---

## PASO 1 — Crear el backend en Google Sheets

> ⚠️ Crear SIEMPRE desde Google Sheets, NO desde script.google.com

### 1.1 Crear la hoja
1. Abre **sheets.google.com** en tu navegador
2. Clic en **"+"** → Nueva hoja de cálculo
3. Clic en el título "Sin título" → escribe **Polla2026** → Enter

### 1.2 Abrir el editor de scripts
1. Menú superior → **Extensiones**
2. Clic en **Apps Script**
3. Se abre una nueva pestaña con el editor

### 1.3 Pegar el código
1. En el editor, selecciona todo el texto → **Cmd+A** (Mac) / **Ctrl+A** (Windows)
2. Bórralo
3. Abre el archivo **Code.gs** con cualquier editor de texto (Bloc de Notas, TextEdit, VS Code)
4. Selecciona todo → Copia
5. Vuelve al editor de Apps Script → Pega
6. Guarda → **Cmd+S** / **Ctrl+S** → escribe el nombre **Polla2026** → OK

### 1.4 Implementar como aplicación web
1. Clic en el botón azul **"Implementar"** (arriba a la derecha)
2. Clic en **"Nueva implementación"**
3. Clic en el ícono **⚙️** junto a "Seleccionar tipo"
4. Clic en **"Aplicación web"**
5. Configura así:
   - Descripción: `Polla2026`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
6. Clic en **"Implementar"**

### 1.5 Autorizar acceso (paso crítico)
Aparece una ventana de Google:
1. Clic en **"Autorizar acceso"**
2. Elige tu cuenta Google
3. Si aparece **"Google no verificó esta app"**:
   - Clic en **"Configuración avanzada"** (texto pequeño abajo)
   - Clic en **"Ir a Polla2026 (no seguro)"**
4. Clic en **"Permitir"**

### 1.6 Copiar la URL
Aparece una ventana con la URL. Se ve así:
```
https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXX/exec
```
**Copia esa URL completa.** La necesitas en el Paso 3.

### 1.7 Verificar que funciona
Abre en el navegador:
```
TU_URL_AQUI?action=ping
```
Debe responder: `{"ok":true,"ts":"..."}`
Si ves eso, el backend está listo.

---

## PASO 2 — Subir la app a Netlify

1. Ve a **app.netlify.com**
2. Si no tienes cuenta, crea una gratis (con tu email o con GitHub)
3. En el panel principal, busca la zona que dice **"Arrastra y suelta tu carpeta aquí"** o **"Deploy manually"**
4. Arrastra el archivo **index.html** a esa zona
5. Espera 20-30 segundos
6. Netlify te da una URL pública, por ejemplo: `https://polla2026mundial.netlify.app`
7. (Opcional) Clic en **"Domain settings"** → **"Options"** → **"Edit site name"** para personalizar la URL

---

## PASO 3 — Conectar la app con el backend

1. Abre la URL de Netlify en tu navegador
2. Aparece un **banner rojo** en la parte superior
3. Pega la URL del Apps Script (del Paso 1.6) en el campo de texto
4. Clic en **"💾 Conectar"**
5. El banner desaparece y el leaderboard queda visible (vacío por ahora)

Si no aparece el banner rojo:
- Abre DevTools → **F12** (o Cmd+Option+I en Mac)
- Pestaña **"Application"** → **"Local Storage"** → tu URL de Netlify
- Borra las entradas `polla2026_url` y `p2026_cache`
- Recarga la página

---

## PASO 4 — Probar que todo funciona

1. Ve a **Inscripción** → escribe tu nombre → clic **"Inscribirse"**
   - Si aparece ✅ → el backend está funcionando
2. Ve a **Mis Pronósticos** → selecciona tu nombre → ingresa algunos marcadores → **Guardar**
3. Ve a **Eliminatorias** → selecciona tu nombre → elige equipos → **Guardar**
4. Ve a **Ranking** → debería aparecer tu nombre con 0 puntos (hasta que empiecen los partidos)

---

## PASO 5 — Compartir con tus amigos

Desde la app, usa el botón **📲 Compartir por WhatsApp** (sidebar o vista Inscripción).

O copia este mensaje manualmente:

```
⚽🏆 POLLA MUNDIALERA 2026 🏆⚽

¡El Mundial se viene y nos jugamos la plata!

💰 Entrada: $5.000
🥇 1° lugar → 50% del pozo
🥈 2° lugar → 30% del pozo
🥉 3° lugar → 20% del pozo

👉 Entra aquí:
https://TU-URL-NETLIFY.netlify.app

Pasos:
1️⃣ Click en "Inscripción" → escribe tu nombre
2️⃣ Pronostica marcadores de grupos
3️⃣ Pronostica quién avanza en eliminatorias
4️⃣ ¡Guarda antes del 11 de junio!

¡El que sepa de fútbol que lo demuestre! 🤙
```

---

## PASO 6 — Durante el torneo (rol del admin)

### Sincronizar resultados automáticamente
1. Ve a la app → **Admin** → PIN: **2026**
2. Sección **"Sincronización con API"**
3. Ingresa el token: `7dcb1c274a5a4c8582337e0752055982`
4. Clic en **"🔄 Sincronizar"**
5. Los resultados se actualizan automáticamente desde football-data.org

### O ingresar resultados manualmente
1. Ve a **Admin** → sección **"Ingreso Manual de Resultados"**
2. Completa los campos según avance el torneo:
   - Equipos en 16avos (32 equipos separados por coma)
   - Equipos en Cuartos (8 equipos)
   - Equipos en Semis (4 equipos)
   - Finalistas (2 equipos)
   - Campeón
3. Clic en **"💾 Guardar y recalcular ranking"**

### Eliminar un participante
1. Ve a **Admin** → sección **"Participantes inscritos"**
2. Clic en **"🗑️ Eliminar"** junto al nombre
3. Confirmar en el diálogo

---

## Sistema de puntaje

### Fase de grupos
| Acierto | Puntos |
|---|---|
| Resultado exacto (ej: 2-1 y fue 2-1) | +3 |
| Diferencia exacta (ej: +1 y fue +1) | +2 |
| Empate correcto (predijo empate y fue empate) | +2 |
| Solo el ganador correcto | +1 |

### Fase eliminatoria
| Acierto | Puntos |
|---|---|
| Equipo llega a 16avos | +1 por equipo |
| Equipo llega a cuartos | +2 por equipo |
| Equipo llega a semis | +3 por equipo |
| Equipo llega a la final | +4 por equipo |
| Campeón correcto | +5 |

---

## Datos importantes

| Dato | Valor |
|---|---|
| PIN admin | **2026** |
| Monto entrada | $5.000 CLP |
| Cierre pronósticos | **11 junio 2026, 15:00 hrs** |
| Token football-data.org | `7dcb1c274a5a4c8582337e0752055982` |
| Inicio del Mundial | 11 junio 2026 |
| Final del torneo | 19 julio 2026 |
| Premios | 50% / 30% / 20% del pozo |

---

## ALTERNATIVA — Publicar en GitHub Pages (en vez de Netlify)

GitHub Pages es gratis, fácil, y no requiere arrastrar archivos cada vez que actualizas.

### ¿Qué necesitas?
- Cuenta en **github.com** (gratis)
- El archivo `index.html`

### Paso a paso

**1. Crear una cuenta en GitHub**
1. Ve a **github.com** → Sign up
2. Elige un nombre de usuario (será parte de tu URL: `tuusuario.github.io`)
3. Verifica tu email

**2. Crear un repositorio**
1. Clic en el botón verde **"New"** (o el ícono `+` arriba a la derecha)
2. Nombre del repositorio: `polla2026` (o cualquier nombre sin espacios)
3. Marca **"Public"** (GitHub Pages requiere repositorio público en plan gratuito)
4. Marca **"Add a README file"**
5. Clic en **"Create repository"**

**3. Subir el index.html**
1. En tu repositorio, clic en **"Add file"** → **"Upload files"**
2. Arrastra el archivo `index.html`
3. Abajo escribe en "Commit message": `Add polla app`
4. Clic en **"Commit changes"**

**4. Activar GitHub Pages**
1. En tu repositorio, clic en **"Settings"** (pestaña arriba)
2. En el menú izquierdo, clic en **"Pages"**
3. En "Source", selecciona **"Deploy from a branch"**
4. En "Branch", selecciona **"main"** y carpeta **"/ (root)"**
5. Clic en **"Save"**
6. Espera 1-2 minutos

**5. Obtener tu URL**
Tu app estará disponible en:
```
https://TUUSUARIO.github.io/polla2026/
```
GitHub Pages lo muestra en la sección "Pages" de Settings.

### Actualizar cuando haya cambios
1. Ve a tu repositorio en github.com
2. Clic en `index.html` → ícono del lápiz (Edit)
3. Borra todo → Pega el nuevo contenido
4. Clic en **"Commit changes"**
5. En ~1 minuto el sitio se actualiza solo

### Comparación Netlify vs GitHub Pages

| | Netlify | GitHub Pages |
|---|---|---|
| Velocidad deploy | ~30 seg | ~1-2 min |
| Arrastrar archivo | ✅ Drag & drop | Sube por web o git |
| URL personalizada | `tuapp.netlify.app` | `user.github.io/repo` |
| Control de versiones | No | Sí (historial completo) |
| Precio | Gratis | Gratis |

> 💡 **Recomendación**: Si vas a actualizar el `index.html` frecuentemente, GitHub Pages es mejor porque guarda el historial de cambios y puedes volver a versiones anteriores.

---

## Problemas frecuentes

| Problema | Solución |
|---|---|
| No aparece el banner rojo | Borrar localStorage como se indica en Paso 3 |
| "Sin conexión — mostrando datos anteriores" | El backend no está conectado. Repetir Paso 3 |
| "Acción no reconocida: fetchResultadosAPI" | El Code.gs es el viejo. Repetir Paso 1 con el Code.gs nuevo |
| "Cannot read properties of null (getSheetByName)" | Creaste el script desde script.google.com. Repetir Paso 1 desde Sheets |
| PIN admin no funciona | El PIN es **2026** (cuatro dígitos) |
| Netlify muestra página en blanco | Asegúrate de subir `index.html` directamente, no una carpeta |
| La URL de Apps Script no funciona | Verifica que el acceso esté en "Cualquier persona" (no "Cualquier persona con cuenta") |

---

## Actualizar la app en Netlify (si hay cambios)

1. Ve a **app.netlify.com** → tu sitio
2. Clic en **"Deploys"**
3. Arrastra el nuevo `index.html` a la zona de deploys
4. Espera 30 segundos → listo
