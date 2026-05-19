⚽ Polla Mundialera 2026 (AI-Friendly)
Bienvenido a la Polla Mundialera 2026. Este repositorio contiene una plataforma web ligera, moderna y completamente automatizada para gestionar una quiniela deportiva (polla) entre amigos, familiares o compañeros de trabajo para el Mundial de Fútbol 2026.
El proyecto ha sido diseñado bajo un enfoque AI-Friendly. Esto significa que su arquitectura es lo suficientemente limpia, modular y sencilla para que cualquier persona —incluso sin conocimientos previos de programación— pueda administrarlo, mantenerlo y expandirlo utilizando herramientas de Inteligencia Artificial (como Gemini, Claude o ChatGPT) mediante instrucciones en lenguaje natural (prompts).
---
1. 🏗️ Arquitectura del Sistema (En Simple)
Para gestionar este proyecto con IA, solo necesitas entender cómo interactúan sus tres componentes principales:
La Interfaz o Frontend (`index.html`): Es la página web con la que interactúan los jugadores. Muestra los formularios de inscripción, las cartillas para ingresar los pronósticos, las tablas de posiciones y genera los comprobantes de juego en PDF.
El Cerebro o Backend (`Code.gs`): Es un script que corre de forma gratuita dentro del entorno de Google Apps Script. Se encarga de procesar los datos que envía la página web, asegurar que dos registros no choquen entre sí (`LockService`), validar al administrador y conectarse de forma segura a internet para obtener los resultados oficiales.
La Base de Datos (Google Sheets): Una planilla de cálculo tradicional en tu Google Drive que almacena la información en tres pestañas: `Jugadores`, `Pronosticos` y `Resultados`.
---
2. 🚀 Despliegue Rápido (En 15 Minutos)
El proyecto funciona de manera serverless (sin servidores de pago). El despliegue se realiza en tres grandes pasos:
Crear la Base de Datos: Abre una nueva planilla en Google Sheets, ve a Extensiones > Apps Script, pega todo el contenido del archivo `Code.gs` e impleméntalo como Aplicación Web (configurando el acceso para "Cualquier persona").
Enlazar la Interfaz: Copia la URL que te entregó Google Apps Script, abre tu archivo `index.html` y reemplaza la variable de conexión correspondiente.
Publicar la Web: Sube el archivo `index.html` a un servicio de hosting estático gratuito como Netlify (arrastrando el archivo) o activando GitHub Pages en este repositorio.
> 📋 *Para ver el paso a paso detallado con capturas lógicas de configuración y resolución de problemas comunes, lee el [MANUAL.md](./MANUAL.md).*
---
3. 🤖 Guía de Mantenimiento y Evolución con IA
Este repositorio está pensado para que lo co-administres con un modelo de lenguaje. A continuación, se detalla qué archivo debes entregarle a la IA según lo que desees lograr:
¿Quieres cambiar el diseño, colores o interfaz?
Archivo a modificar: `index.html`
Conceptos clave: Tailwind CSS clases, estilos `:root`, estructura HTML, jsPDF (para el diseño del comprobante).
Ejemplo de Prompt: "Revisa el archivo index.html adjunto. Quiero cambiar la paleta de colores actual para que coincida con la identidad visual de mi empresa (usa tonos azules y grises corporativos). Asegúrate de que los botones mantengan sus identificadores (`id`) para no romper la conexión con el servidor."
¿Quieres cambiar las reglas de puntaje o la lógica del juego?
Archivo a modificar: `Code.gs`
Conceptos clave: Google Apps Script, cálculo de puntajes, traducción de nombres de equipos de la API, endpoints (`getAll`, `inscribir`, `guardarPronosticos`).
Ejemplo de Prompt: "Utilizando el archivo Code.gs adjunto, modifica la función que calcula los puntajes. Actualmente otorga X puntos por acierto; necesito que agregues una regla especial que premie con 10 puntos adicionales a quien adivine correctamente al Campeón del Mundo al final del torneo."
¿Quieres agregar campos de información nuevos?
Archivos a modificar: Ambos (`index.html` y `Code.gs`)
Ejemplo de Prompt: "Necesito capturar el número de teléfono de los participantes al inscribirse. Modifica index.html para agregar el campo de texto en el formulario visual, y modifica Code.gs para que tome ese nuevo dato y lo escriba en una nueva columna en la pestaña 'Jugadores' de Google Sheets."
---
4. 🛠️ Tecnologías y Dependencias Externas
Para mantener el proyecto liviano y fácil de leer en un solo archivo de interfaz, se utilizan los siguientes recursos vía CDN (no requieren instalación local):
Fuentes: Google Fonts (Bebas Neue y Outfit) para la consistencia tipográfica.
Iconos: Lucide Icons para la iconografía de la plataforma.
Efectos: Confetti-js para las animaciones de celebración al guardar datos.
Documentos: jsPDF y jsPDF-AutoTable para estructurar y descargar el comprobante de juego en el dispositivo del usuario.
Datos Deportivos: API de `football-data.org` para la descarga automatizada de los resultados oficiales del mundial.
