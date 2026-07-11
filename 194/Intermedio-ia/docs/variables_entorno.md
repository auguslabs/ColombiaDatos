# Variables de entorno

Configuración para ejecutar **ColombIA Datos** en desarrollo y producción.

## Archivo de configuración

```bash
cd src
cp .env.example .env
```

También se acepta `.env.local` (Vite lo carga automáticamente).

## Variables del servidor

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | **Sí** | Clave API Gemini. Solo en `server.ts`, nunca en el cliente. |
| `DISABLE_HMR` | No | `true` desactiva hot reload de Vite |

Obtener clave: [Google AI — API Keys](https://ai.google.dev/gemini-api/docs/api-key)

## Variables Firebase (prefijo `VITE_`)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_FIREBASE_API_KEY` | No* | API Key Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | No* | Dominio auth |
| `VITE_FIREBASE_PROJECT_ID` | No* | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | No* | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No* | Sender ID |
| `VITE_FIREBASE_APP_ID` | No* | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No* | Analytics (opcional) |
| `VITE_FIREBASE_DATABASE_ID` | No* | ID Firestore (si no es la predeterminada) |

\* Si se dejan vacías, la app usa `firebase-config.json`.

## Ejemplo `.env`

```env
GEMINI_API_KEY=AIzaSy...

# Opcional — proyecto Firebase propio
# VITE_FIREBASE_API_KEY=
# VITE_FIREBASE_PROJECT_ID=
# VITE_FIREBASE_DATABASE_ID=
```

## Token SODA

Configurado desde el panel admin de la app (`sodaDefaultAppToken`) o por fuente individual.

## Seguridad

- No commitear `.env` ni `.env.local`
- Variables `VITE_*` son públicas en el bundle del cliente

## Verificación

```bash
cd src
npm run dev
# Sin GEMINI_API_KEY → error 500 en POST /api/chat
```
