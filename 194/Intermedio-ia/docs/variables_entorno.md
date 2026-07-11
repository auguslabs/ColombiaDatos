# Variables de entorno

Configuración necesaria para ejecutar ColombIA Datos en desarrollo y producción.

## Archivo de configuración

Copiar la plantilla antes de ejecutar:

```bash
cd src
cp .env.example .env.local
```

## Variables del servidor (backend)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | **Sí** | Clave de la API de Google Gemini. Solo se usa en `server.ts`, nunca en el cliente. |

Obtener en: [Google AI Studio](https://aistudio.google.com/apikey)

## Variables del cliente (Firebase — prefijo `VITE_`)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_FIREBASE_API_KEY` | No* | API Key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | No* | Dominio de autenticación |
| `VITE_FIREBASE_PROJECT_ID` | No* | ID del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | No* | Bucket de almacenamiento |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No* | Sender ID |
| `VITE_FIREBASE_APP_ID` | No* | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No* | Google Analytics (opcional) |
| `VITE_FIREBASE_DATABASE_ID` | No* | ID de base Firestore |

\* En desarrollo local, si se dejan vacías, la app usa las credenciales del sandbox de AI Studio (`firebase-applet-config.json`).

## Ejemplo `.env.local`

```env
GEMINI_API_KEY=AIzaSy...

# Producción / QA — descomentar y completar
# VITE_FIREBASE_API_KEY=
# VITE_FIREBASE_AUTH_DOMAIN=
# VITE_FIREBASE_PROJECT_ID=
# VITE_FIREBASE_STORAGE_BUCKET=
# VITE_FIREBASE_MESSAGING_SENDER_ID=
# VITE_FIREBASE_APP_ID=
# VITE_FIREBASE_MEASUREMENT_ID=
# VITE_FIREBASE_DATABASE_ID=
```

## Token SODA (datos.gov.co)

No es variable de entorno por defecto. Se configura desde el **panel de administración** de la app (`sodaDefaultAppToken`) o por fuente de datos individual.

## Seguridad

- **Nunca** commitear `.env.local` ni archivos con claves reales.
- El `.gitignore` excluye `.env` y `.env.*`.
- Las variables `VITE_*` son visibles en el bundle del cliente — solo usar para config pública de Firebase (diseñado para eso).

## Verificación

```bash
cd src
npm run dev
# Si GEMINI_API_KEY falta, el servidor responderá error 500 en /api/gemini
```
