# Aplicación web — estructura de `src/`

La carpeta `src/` contiene la aplicación **ColombIA Datos** exportada desde Google AI Studio y adaptada para el concurso.

## Árbol de archivos

```
src/
├── server.ts                  # Servidor Express + proxy Gemini
├── index.html                 # Punto de entrada HTML
├── vite.config.ts             # Configuración Vite 6
├── tsconfig.json              # TypeScript
├── package.json               # Dependencias Node.js
├── .env.example               # Plantilla de variables de entorno
├── firestore.rules            # Reglas de seguridad Firestore
├── security_spec.md           # Especificación de amenazas
├── firebase-applet-config.json
├── metadata.json              # Metadatos del applet AI Studio
└── src/                       # Código fuente React
    ├── main.tsx               # Bootstrap de React
    ├── App.tsx                # Componente principal (~5000 líneas)
    ├── types.ts               # Interfaces TypeScript
    ├── index.css              # Estilos Tailwind v4
    └── components/
        └── DataChart.tsx      # Gráficos Recharts interactivos
```

## Responsabilidades por archivo

### `server.ts` — Backend

- Servidor Express en puerto **3000**.
- Endpoints protegidos para llamadas a **Gemini** (`/api/gemini`, `/api/analyze-context`).
- **Circuit breaker** ante límites de cuota de la API.
- En desarrollo, integra Vite como middleware para HMR.
- En producción, sirve el build estático desde `dist/`.

### `src/App.tsx` — Frontend principal

- Autenticación Firebase (Google, email/contraseña).
- Chat conversacional con el asistente **ColombIA Datos**.
- Panel de administración (fuentes de datos, configuración Gemini, auditoría).
- Consulta de datasets en **datos.gov.co** vía API SODA.
- Gestión de conversaciones, notas y solicitudes de apertura de datos.
- Renderizado de respuestas en Markdown y visualizaciones embebidas.

### `src/components/DataChart.tsx` — Visualizaciones

- Gráficos de barras, líneas, torta y tabla de datos.
- Exportación a CSV.
- Animaciones con Motion.
- Normalización de columnas para datos colombianos (formato numérico `$ 1.000.000,00`).

### `src/types.ts` — Modelo de datos TypeScript

Define las interfaces compartidas: `UserData`, `Conversation`, `Message`, `DataSource`, `Dataset`, `VisualizationData`, etc.

Ver [data_dictionary.md](data_dictionary.md) para la descripción completa.

## Comandos

```bash
cd src
npm install
cp .env.example .env.local   # Configurar GEMINI_API_KEY
npm run dev                  # Desarrollo → http://localhost:3000
npm run build                # Build producción
npm start                    # Servidor producción
npm run lint                 # Verificación TypeScript
```

## Enlaces

- [Stack tecnológico completo](stack_tecnologico.md)
- [Variables de entorno](variables_entorno.md)
- [Seguridad y Firestore](seguridad.md)
- [Arquitectura del sistema](architecture.md)
