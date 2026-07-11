# Aplicación web — estructura de `src/`

La carpeta `src/` contiene **ColombIA Datos — Portal de Inteligencia Pública**: aplicación full-stack para veeduría ciudadana y consulta de datos abiertos.

## Árbol de archivos

```
src/
├── server.ts                  # Backend Express + proxy Gemini
├── index.html                 # HTML (título, favicon)
├── vite.config.ts             # Vite 6 + Tailwind CSS v4
├── tsconfig.json
├── package.json
├── .env.example
├── firestore.rules            # Reglas Firestore
├── security_spec.md           # Especificación de amenazas
├── firebase-config.json       # Firebase por defecto (desarrollo)
├── firebase-blueprint.json    # Blueprint de infraestructura Firebase
├── metadata.json              # Metadatos del proyecto
├── public/                    # Assets estáticos
│   ├── favicon.svg
│   └── logo_colombia_datos.svg
└── src/                       # Código React
    ├── main.tsx
    ├── App.tsx                # UI principal (~4900 líneas)
    ├── types.ts               # Interfaces TypeScript
    ├── index.css              # Tailwind v4
    └── components/
        └── DataChart.tsx      # Gráficos Recharts
```

## Backend — `server.ts`

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/chat` | POST | Chat con Gemini (modelo configurable, default `gemini-3.5-flash`) |
| `/api/analyze-context` | POST | Análisis de contexto conversacional + chips de atajos |

Características del servidor:

- **Proxy seguro** — `GEMINI_API_KEY` solo en servidor
- **Circuit breaker** — protección ante cuotas agotadas
- **Reintentos** — manejo de errores 429 / RESOURCE_EXHAUSTED
- **Motor heurístico offline** — objetivos y atajos sin llamar a Gemini cuando el circuit breaker está activo
- **Caché en memoria** — evita llamadas redundantes a `/api/analyze-context`
- Puerto **3000**; Vite como middleware en desarrollo

## Frontend — `src/App.tsx`

Módulos funcionales integrados en el componente principal:

| Funcionalidad | Descripción |
|---------------|-------------|
| Autenticación | Firebase Auth (Google OAuth, email/contraseña) |
| Chat IA | Consultas en lenguaje natural vía `/api/chat` |
| Catálogo Nacional | Exploración de fuentes SODA de datos.gov.co |
| Panel Admin | Gestión de fuentes, configuración Gemini, auditoría, logs |
| Conversaciones | Historial persistente en Firestore |
| Notas | Anotaciones sobre respuestas del asistente |
| Solicitudes de apertura | Ciudadanos piden nuevos datasets |
| Onboarding | Tour guiado para nuevos usuarios |
| Visualizaciones | Gráficos embebidos vía `DataChart` |

Branding: logo `/logo_colombia_datos.svg`, icono `ColombIAIcon`, colores institucionales (azul, amarillo, rojo).

## `DataChart.tsx`

- Gráficos: barras, líneas, torta, tabla
- Exportación CSV
- Normalización de formatos numéricos colombianos (`$ 1.000.000,00`)
- Animaciones Motion, vista expandida modal

## Comandos

```bash
cd src
npm install
cp .env.example .env
npm run dev      # http://localhost:3000
npm run build
npm start
npm run lint
```

## Enlaces

- [Despliegue local](despliegue_local.md)
- [Stack tecnológico](stack_tecnologico.md)
- [Variables de entorno](variables_entorno.md)
- [Arquitectura](architecture.md)
