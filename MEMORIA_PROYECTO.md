# LifeVault — Memoria del Proyecto

---

## El Problema

### ¿Cuál es el problema que estás resolviendo?

Las personas acumulan documentos importantes (contratos, pólizas de seguro, informes médicos, CVs, facturas) en carpetas físicas, correos electrónicos, descargas del ordenador o servicios de almacenamiento genéricos como Google Drive o Dropbox. El problema no es solo el almacenamiento: es la **recuperación y el uso inteligente de esa información**.

Cuando alguien necesita saber "¿cuándo vence mi seguro?" o "¿qué tecnologías aparecen en mi CV?" o "¿tengo algún documento relacionado con mi salud?", tiene que buscar manualmente entre decenas de archivos, abrirlos uno por uno y leer su contenido. Este proceso es lento, frustrante y propenso a errores u olvidos.

A esto se suma la gestión de la vida personal: citas, tareas, recordatorios. Hoy se gestionan con múltiples apps desconectadas (Google Calendar, Todoist, Notion, WhatsApp...) que no se comunican entre sí ni tienen contexto sobre quién eres o qué documentos tienes.

### ¿A quién afecta y por qué es relevante?

Afecta a cualquier persona que gestione su vida personal o profesional de forma digital. Es especialmente relevante en situaciones como:

- **Tiempo:** buscar un documento específico puede llevar de minutos a horas si no está bien organizado.
- **Dinero:** olvidar renovar un seguro, no recordar los plazos de un contrato o perder una factura puede tener consecuencias económicas reales.
- **Decisiones:** tener acceso rápido a información personal (historial médico, formación, experiencia) permite tomar mejores decisiones en entrevistas, consultas o gestiones.
- **Errores:** la gestión manual de documentos y citas implica dependencia de la memoria humana, que falla.

### ¿Cómo se resolvía antes, o no se resolvía?

Antes de este sistema, las alternativas existentes eran:

| Alternativa | Limitación |
|---|---|
| Google Drive / Dropbox | Solo almacenamiento. Sin búsqueda por contenido ni consultas en lenguaje natural |
| Asistentes de voz (Siri, Alexa) | No acceden a documentos personales del usuario |
| ChatGPT / Claude | No tienen acceso persistente a los documentos ni al calendario del usuario |
| Gestores de contraseñas (1Password) | Solo guardan credenciales, no documentos ni información estructurada |
| Agendas / calendarios | No conectados con los documentos ni con un asistente con contexto |

En resumen: **no existía una solución integrada** que combinara almacenamiento de documentos personales, gestión de agenda y un asistente de IA con acceso real a todo eso.

---

## La Solución

### ¿Qué has construido?

**LifeVault** es una aplicación móvil y web cross-platform con un asistente de IA personal que tiene acceso al vault de documentos del usuario, su calendario de Google y sus tareas. El usuario puede hablar con el asistente en lenguaje natural y obtener respuestas basadas en su información real.

#### Componentes principales

**Frontend — React Native (Expo)**
- Aplicación móvil y web construida con React Native + Expo Router
- Pantallas: Landing/Auth, Dashboard, Vault de Documentos, Asistente IA, Planificador Semanal, Ajustes
- Estado global con Zustand
- Renderizado de markdown en el chat para respuestas formateadas
- Tarjetas de descarga de documentos directamente desde el chat
- Gestión de sesiones de conversación independientes

**Backend — Node.js (Fastify)**
- API REST con autenticación JWT + OAuth Google
- Endpoints para documentos, tareas, eventos, asistente IA
- Adaptador modular para proveedores de IA (OpenAI, Claude, Gemini, n8n)
- Almacenamiento de archivos en S3-compatible
- Persistencia de historial de conversación en PostgreSQL

**Base de datos — PostgreSQL (Supabase)**
- Tablas: `users`, `documents`, `tasks`, `events`, `ai_messages`, `vault_notes`
- Búsqueda vectorial con embeddings en la tabla `documents` (columna `embedding`)
- Historial de chat de n8n en `n8n_chat_histories`

**Automatización e IA — n8n**
- Workflow "LifeVault Chatbot" con arquitectura multi-agente
- Agente orquestador principal que delega a agentes especializados
- Memoria conversacional persistente en PostgreSQL

**Herramientas externas conectadas**
- **Google Calendar API** — consultar, crear y modificar eventos del usuario
- **Supabase Vector Store** — búsqueda semántica en documentos por embeddings
- **OpenAI Embeddings** — generación de vectores para búsqueda semántica
- **PostgreSQL (Supabase)** — recuperación directa de filas de documentos con filtros

#### Agentes en n8n

| Agente | Función | Herramientas |
|---|---|---|
| **Agente Chatbot** | Orquestador principal. Interpreta el mensaje y delega | Agente Calendar, Agente Documentos, Postgres Memory |
| **Agente Calendar** | Gestiona eventos de Google Calendar | Create event, Get events, Update event |
| **Agente Documentos** | Busca y extrae información de documentos del vault | Supabase Vector Store, Get rows Supabase |

### ¿Cuál es el flujo completo, de principio a fin?

```
Usuario escribe mensaje en la app
        ↓
App (React Native) → POST /assistant/query
  { user_id, message, session_id }
        ↓
Backend (Fastify) autentica JWT y extrae userId
        ↓
n8n.adapter.ts → POST webhook n8n
  { user_id, message, session_id }
        ↓
n8n — Webhook recibe el mensaje
        ↓
Agente Chatbot (Gemini/OpenAI)
  ├─ Carga memoria conversacional (Postgres Chat Memory, clave: session_id)
  ├─ Analiza la intención del mensaje
  ├─ Si es sobre documentos → delega a Agente Documentos
  │     ├─ Supabase Vector Store (búsqueda semántica por embeddings)
  │     └─ Get many rows (búsqueda directa con filtro user_id)
  └─ Si es sobre calendario → delega a Agente Calendar
        ├─ Create event in Google Calendar
        ├─ Get many events in Google Calendar
        └─ Update event in Google Calendar
        ↓
Code node JavaScript
  ├─ Parsea la respuesta del agente
  ├─ Extrae referencias de documentos [DOC:uuid:titulo]
  └─ Serializa a JSON: { message, actions, attachments }
        ↓
Respond to Webhook → devuelve JSON al backend
        ↓
Backend persiste mensaje en ai_messages (PostgreSQL)
        ↓
App renderiza la respuesta con markdown formateado
  └─ Si hay attachments → muestra tarjetas de descarga de documentos
```

---

## La Evidencia

### Casos de uso funcionando

**1. Consulta de documentos**
El usuario pregunta: *"Dame detalles sobre mi experiencia laboral, de mi CV"*

El sistema:
- El Agente Chatbot detecta que es una consulta de documentos
- Delega al Agente Documentos
- El Agente Documentos busca en Supabase Vector Store usando embeddings semánticos
- Recupera los chunks relevantes del CV almacenado
- Devuelve una respuesta formateada con markdown con experiencia, tecnologías y certificaciones reales del CV

Respuesta real obtenida:
> *"Tienes un currículum que destaca tu experiencia en desarrollo web y de inteligencia artificial, con dominio de tecnologías como Python, Laravel, JavaScript y SQL. Además, estás realizando un Máster en IA Generativa e Innovación y cuentas con certificaciones en AWS y en inglés B2..."*

**2. Creación de eventos en Google Calendar**
El usuario escribe: *"Crea un evento para mañana para ir al dentista a las 12 del mediodía"*

El sistema:
- El Agente Chatbot delega al Agente Calendar
- El Agente Calendar llama a "Create an event in Google Calendar"
- El evento se crea con título "Dentista", fecha y hora correctas en la zona horaria Europe/Madrid
- Google Calendar confirma la creación con el ID del evento

El usuario también pidió un segundo evento para el médico a las 15:00, que se creó de forma independiente en la misma conversación.

**3. Gestión de sesiones**
El botón ↺ "Nueva sesión" en el header del chat genera un nuevo UUID de sesión, lo que hace que n8n cree un nuevo contexto en `n8n_chat_histories`. Cada sesión es independiente y el asistente no recuerda conversaciones anteriores.

**4. Descarga de documentos**
Cuando el agente identifica un documento relevante e incluye su referencia `[DOC:uuid:titulo]`, el Code node de n8n la parsea y la incluye en el array `attachments` de la respuesta. La app renderiza una tarjeta azul con el nombre del archivo y un botón de descarga que llama al endpoint `/documents/:id/download` del backend, que genera una URL firmada de S3 con 5 minutos de validez.

---

## La Reflexión

### ¿Qué ha funcionado bien?

- **La arquitectura multi-agente en n8n** permite separar responsabilidades de forma clara. El orquestador no necesita saber los detalles de cómo funciona el calendario o la búsqueda de documentos.
- **La búsqueda semántica con embeddings** (Supabase Vector Store + OpenAI Embeddings) permite encontrar información relevante en documentos aunque el usuario no use las palabras exactas que aparecen en el texto.
- **La memoria conversacional por sesión** con Postgres Chat Memory hace que el asistente mantenga contexto dentro de una conversación sin necesidad de que el usuario repita información.
- **El adaptador de n8n en el backend** permite que el sistema sea completamente transparente para la app: el frontend no sabe si la IA es OpenAI, Gemini o un workflow de n8n.
- **El renderizado de markdown** en el chat mejora significativamente la legibilidad de respuestas largas con listas, negritas y estructura.

### ¿Qué mejorarías o ampliarías?

- **Filtrado por user_id en el Vector Store**: actualmente el filtro de metadatos por `user_id` en el Supabase Vector Store no es 100% fiable dentro del contexto de los agentes de n8n. En producción con múltiples usuarios es un problema de privacidad crítico que requeriría una solución más robusta (posiblemente una función RPC dedicada en Supabase con RLS activado).

- **Procesamiento de documentos al subir**: actualmente los documentos se suben al vault pero el proceso de chunking, embedding y almacenamiento vectorial no está completamente automatizado en el flujo de subida. Habría que añadir un workflow de n8n que se dispare al subir un documento, extraiga el texto, lo divida en chunks y genere los embeddings automáticamente.

- **Acciones ejecutables desde el chat**: el campo `actions` en la respuesta del asistente está preparado en el código pero no se usa. Se podría implementar que el agente devuelva acciones como `{ type: "create_task", payload: {...} }` que la app ejecute automáticamente creando tareas en la base de datos.

- **Notificaciones push**: el sistema podría enviar recordatorios proactivos basados en los eventos del calendario o tareas con fecha límite próxima.

- **Soporte multi-idioma real**: aunque el agente detecta el idioma del usuario, el sistema de prompts está en español. Una mejora sería internacionalizar los system prompts.

- **Cifrado de documentos (zero-knowledge)**: el concepto original de LifeVault incluía cifrado en el cliente antes de subir los documentos. Esto aún no está implementado.

### ¿Qué aprendizajes te llevas del proceso?

**Técnicos:**
- Los modelos de lenguaje en n8n tienden a repetir llamadas a herramientas para "verificar" resultados. Controlar este comportamiento requiere instrucciones explícitas en el system prompt ("ejecuta cada herramienta exactamente una vez").
- El formato de las expresiones en n8n varía según el contexto: `{{ expr }}` en cuerpos JSON, `={{ expr }}` en campos individuales, y `JSON.stringify()` para serializar objetos complejos de forma segura.
- La inyección de arrays en el cuerpo JSON del nodo "Respond to Webhook" no funciona directamente con expresiones inline. La solución más robusta es serializar todo el objeto en el Code node y usar Text mode en el Respond to Webhook.
- Los sub-agentes en n8n (agentes usados como tools por otro agente) tienen un contexto de `$json` diferente al del agente principal. Las referencias a nodos anteriores como `$('Webhook').item.json` son más fiables que `$json` genérico.

**De producto:**
- La experiencia de usuario en un asistente conversacional depende más del comportamiento del modelo (si pide confirmaciones, si es proactivo, si es directo) que de la tecnología subyacente. El system prompt es tan importante como la arquitectura técnica.
- Un MVP bien definido permite iterar rápido. Empezar con un único documento de prueba (el CV) fue la decisión correcta para validar el pipeline antes de escalar.

---

## Mínimo Técnico

### Agente construido en n8n ✅

El proyecto incluye un workflow completo en n8n con tres agentes:
- **Agente Chatbot** (orquestador principal)
- **Agente Calendar** (especializado en Google Calendar)
- **Agente Documentos** (especializado en búsqueda semántica en vault)

Accesible en: `https://n8n-pmv-playground.up.railway.app/webhook/lifevault-chatbot`

### Conexión con herramientas externas ✅

| Herramienta | Tipo | Uso |
|---|---|---|
| **Google Calendar API** | API externa | Crear, consultar y modificar eventos del usuario |
| **Supabase (PostgreSQL)** | Base de datos | Almacenamiento de documentos, usuarios, tareas, eventos e historial de chat |
| **Supabase Vector Store** | Base de datos vectorial | Búsqueda semántica en el contenido de documentos |
| **OpenAI API** | API externa | Generación de embeddings y modelo de lenguaje |
| **Google Gemini API** | API externa | Modelo de lenguaje principal del agente |
| **AWS S3 / compatible** | Almacenamiento objeto | Almacenamiento de archivos de documentos con URLs firmadas |
