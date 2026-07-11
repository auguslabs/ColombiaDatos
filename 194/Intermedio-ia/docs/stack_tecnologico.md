# Stack tecnológico — ColombIA Datos

Documentación del stack definido por el equipo de arquitectura del proyecto.

El sitio está construido sobre un entorno **full-stack moderno, veloz y seguro**, diseñado para ofrecer una experiencia interactiva fluida al ciudadano.

---

## 1. Interfaz de Usuario (Frontend)

| Tecnología | Versión | Rol en el proyecto |
|------------|---------|-------------------|
| **React** | 19 | Biblioteca principal de UI. Gestiona el estado de la aplicación y renderiza componentes interactivos de forma eficiente. |
| **Vite** | 6 | Entorno de desarrollo ultrarrápido que empaqueta y sirve el código frontend en segundos. |
| **Tailwind CSS** | v4 | Motor de estilos moderno para una interfaz estética, limpia, adaptativa (móvil y escritorio) y con tipografías cuidadas. |
| **Motion** | 12.x | Transiciones suaves, efectos de entrada y micro-animaciones que mejoran la experiencia de navegación. |
| **Lucide React** | — | Iconografía limpia y minimalista para guiar al usuario visualmente. |
| **Recharts** | 3.x | Renderizado de diagramas, gráficos de barras, líneas y tortas con los datos públicos consultados. |
| **React Markdown** | 10.x | Formato legible de los reportes explicativos generados por la inteligencia artificial. |

**Archivos clave:** `src/src/App.tsx`, `src/src/components/DataChart.tsx`, `src/src/index.css`

---

## 2. Servidor y Seguridad (Backend)

| Tecnología | Rol en el proyecto |
|------------|-------------------|
| **Express (Node.js)** | Procesa peticiones de forma segura. Actúa como **proxy/intermediario** para proteger credenciales y claves de API, evitando que queden expuestas en el navegador. |
| **TypeScript** | Tipado estático en cliente y servidor. Código robusto, libre de errores comunes y fácil de mantener. |
| **esbuild** | Compila y empaqueta el servidor backend para puesta en producción en la nube. |
| **tsx** | Ejecuta TypeScript directamente en desarrollo (`npm run dev`). |

**Archivos clave:** `src/server.ts`, `src/tsconfig.json`, `src/package.json`

---

## 3. Servicios en la Nube e Inteligencia Artificial

| Tecnología | Rol en el proyecto |
|------------|-------------------|
| **Google Gen AI SDK** (`@google/genai`) | SDK oficial de última generación para conectar el servidor con modelos **Gemini**. Analiza consultas del ciudadano y estructura información pública. |
| **Firebase Auth** | Autenticación de usuarios (Google OAuth, email/contraseña). |
| **Cloud Firestore** | Base de datos NoSQL en tiempo real. Almacena historial de consultas, reportes guardados, fuentes de datos y configuraciones. |

**Archivos clave:** `src/server.ts` (Gemini), `src/firestore.rules`, `src/firebase-applet-config.json`

---

## 4. Capa analítica (complementaria)

| Tecnología | Rol en el proyecto |
|------------|-------------------|
| **Python 3.11** | Análisis offline, limpieza y modelado |
| **Pandas / scikit-learn** | Procesamiento de datos y ML |
| **Jupyter** | Notebooks de experimentación |
| **pytest** | Pruebas de calidad de datos e inferencia |

**Archivos clave:** `ml/`, `notebooks/`, `pipelines/pipeline_ml.py`, `tests/`

---

## Diagrama de capas

```
┌─────────────────────────────────────────────┐
│  FRONTEND — React 19 + Vite 6 + Tailwind   │
│  Motion · Lucide · Recharts · Markdown      │
├─────────────────────────────────────────────┤
│  BACKEND  — Express + TypeScript + esbuild  │
│  Proxy seguro · Endpoints Gemini            │
├─────────────────────────────────────────────┤
│  CLOUD    — Gemini API · Firebase/Firestore │
├─────────────────────────────────────────────┤
│  DATA     — datos.gov.co (SODA REST API)    │
├─────────────────────────────────────────────┤
│  ANALYTICS— Python · ml/ · notebooks/       │
└─────────────────────────────────────────────┘
```

## Dependencias principales

Ver `src/package.json` (aplicación web) y `requirements.txt` (capa analítica).
