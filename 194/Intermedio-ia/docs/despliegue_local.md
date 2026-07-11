# Despliegue local — ColombIA Datos

Guía para ejecutar la aplicación web en entorno de desarrollo y producción.

## Prerrequisitos

1. **Node.js** 18+ (recomendado 20+)
2. **NPM** 9+
3. **GEMINI_API_KEY** — clave de la API Gemini ([documentación oficial](https://ai.google.dev/gemini-api/docs/api-key))
4. **Firebase** (opcional) — proyecto propio si no se usan credenciales por defecto en `firebase-config.json`

## Paso 1: Instalar dependencias

```bash
cd src
npm install
```

Instala Express, React 19, Tailwind CSS v4, Recharts, Motion, TypeScript y el SDK `@google/genai`.

## Paso 2: Variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
GEMINI_API_KEY=tu_clave_aqui

# Opcional — anular firebase-config.json
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_ID=
```

Ver detalle en [variables_entorno.md](variables_entorno.md).

## Paso 3: Desarrollo

```bash
npm run dev
```

- Servidor Express en puerto **3000** (`tsx server.ts`)
- Vite integrado como middleware (hot reload)
- URL: **http://localhost:3000**

## Paso 4: Producción

```bash
npm run build   # Vite → dist/ + esbuild → dist/server.cjs
npm start       # node dist/server.cjs
```

## Estructura clave

| Ruta | Rol |
|------|-----|
| `server.ts` | Backend Express, endpoints `/api/chat` y `/api/analyze-context` |
| `public/` | Favicon y logo (`favicon.svg`, `logo_colombia_datos.svg`) |
| `src/App.tsx` | UI principal: auth, chat, catálogo, panel admin |
| `src/components/DataChart.tsx` | Visualizaciones Recharts |
| `firebase-config.json` | Credenciales Firebase por defecto |
| `firestore.rules` | Reglas de seguridad Firestore |

## Solución de problemas

| Error | Solución |
|-------|----------|
| `GEMINI_API_KEY is not configured` | Verificar `.env` con clave válida |
| `EADDRINUSE :::3000` | Cerrar proceso en puerto 3000 o cambiar `PORT` en `server.ts` |
| Permisos Firestore | Desplegar `firestore.rules` en consola Firebase |
| Cuota Gemini agotada | Configurar clave propia o esperar reset de cuota |

## Verificación

```bash
npm run lint    # TypeScript sin errores
npm run dev     # App carga con logo y título "ColombIA Datos"
```
