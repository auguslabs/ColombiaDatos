# Diccionario de datos

Definición de entidades y variables del sistema ColombIA Datos.

## Entidades Firestore (aplicación web)

### UserData — `/users/{uid}`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `uid` | string | Identificador único Firebase Auth |
| `email` | string \| null | Correo electrónico |
| `displayName` | string \| null | Nombre visible |
| `photoURL` | string \| null | URL de avatar |
| `role` | `'public' \| 'admin'` | Rol del usuario |
| `status` | `'active' \| 'suspended'` | Estado de la cuenta |
| `createdAt` | timestamp | Fecha de creación |

### Conversation — `/conversations/{id}`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID del documento |
| `userId` | string | Propietario de la conversación |
| `title` | string | Título generado o editado |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última actualización |

### Message — `/conversations/{id}/messages/{msgId}`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID del mensaje |
| `role` | `'user' \| 'assistant'` | Emisor |
| `content` | string | Texto del mensaje (Markdown en respuestas IA) |
| `datasets` | Dataset[] | Datasets referenciados |
| `visualization` | VisualizationData | Configuración de gráfico embebido |
| `thinking` | string[] | Pasos de razonamiento IA (opcional) |

### DataSource — `/dataSources/{id}`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID de la fuente |
| `name` | string | Nombre legible |
| `url` | string | URL del recurso SODA |
| `entity` | string | Entidad responsable |
| `category` | string | Categoría temática |
| `appToken` | string | Token SODA específico (opcional) |
| `isActive` | boolean | Fuente habilitada |
| `description` | string | Descripción de la fuente |

### AppSetting — `/appSettings/global`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `model` | string | Modelo Gemini (ej. `gemini-3.5-flash`) |
| `temperature` | number | Creatividad del modelo (0–1) |
| `topP` | number | Nucleus sampling |
| `topK` | number | Top-K sampling |
| `customSystemInstruction` | string | Instrucciones del sistema IA |
| `welcomeMessage` | string | Mensaje de bienvenida al ciudadano |
| `rateLimitMessages` | number | Límite de mensajes por usuario |
| `sodaDefaultAppToken` | string | Token SODA global |

### VisualizationData — embebido en Message

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | `'bar' \| 'line' \| 'pie'` | Tipo de gráfico |
| `data` | array | Filas de datos |
| `title` | string | Título del gráfico |
| `xAxis` | string | Columna eje X |
| `yAxis` | string | Columna eje Y |

---

## Variables del dataset consolidado offline (`data/03_primary/`)

Para el análisis Python y notebooks. Completar al integrar datasets reales:

| Variable | Tipo | Descripción | Fuente |
|----------|------|-------------|--------|
| `id` | int | Identificador único | Generado |
| `departamento` | string | Departamento colombiano | datos.gov.co |
| `municipio` | string | Municipio | datos.gov.co |
| `valor` | float | Valor numérico del indicador | datos.gov.co |
| `anio` | int | Año de referencia | datos.gov.co |
| `entidad` | string | Entidad publicadora | Metadatos SODA |
| `categoria` | string | Categoría temática | Metadatos SODA |

> Actualizar esta tabla cuando se descarguen y consoliden datasets específicos del proyecto.
