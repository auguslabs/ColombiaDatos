# ColombIA Datos — Equipo 194

**Portal de Inteligencia Pública** — asistente virtual ciudadano para veeduría y análisis de datos abiertos de Colombia mediante lenguaje natural.

Proyecto Intermedio IA — Concurso Datos al Ecosistema 2026 IA para Colombia.

## Ficha técnica

| Campo | Detalle |
|-------|---------|
| **Nombre** | ColombIA Datos — Portal de Inteligencia Pública |
| **Equipo** | 194 |
| **Nivel** | Intermedio IA |
| **Problema** | Dificultad ciudadana para acceder, entender y visualizar datos públicos en datos.gov.co |
| **Solución** | Plataforma web con IA (Gemini) que traduce preguntas en lenguaje natural a consultas SODA, con visualizaciones interactivas y panel de veeduría |
| **Fuente principal** | [datos.gov.co](https://www.datos.gov.co/) — API SODA |
| **Licencia** | MIT — ver [LICENSE](LICENSE) |

## Stack tecnológico

### Aplicación web (`src/`)

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, Motion, Lucide React, Recharts, React Markdown |
| Backend | Express (Node.js), TypeScript, esbuild |
| IA | Google Gen AI SDK (`@google/genai`) — Gemini (`/api/chat`) |
| Datos en nube | Firebase Auth + Cloud Firestore |
| Branding | `public/logo_colombia_datos.svg`, `public/favicon.svg` |

Detalle en [docs/aplicacion_web.md](docs/aplicacion_web.md) y [docs/stack_tecnologico.md](docs/stack_tecnologico.md).

### Capa analítica (`ml/`, `notebooks/`, `data/`)

| Capa | Tecnología |
|------|------------|
| Análisis | Python, Pandas, Scikit-learn, Jupyter |
| Pipeline | `pipelines/pipeline_ml.py` |
| Pruebas | pytest |

## Estructura del repositorio

```
Intermedio-ia/
├── src/              # Portal web full-stack
│   ├── public/       # Logo y favicon
│   ├── server.ts     # API /api/chat, /api/analyze-context
│   └── src/          # React (App.tsx, DataChart)
├── ml/               # Módulos Python analíticos
├── docs/             # Documentación técnica
├── data/             # Ciclo de vida de datos
├── notebooks/        # EDA y experimentación
├── tests/            # Pruebas pytest
└── pipelines/        # Pipeline ML
```

## Instalación y ejecución

### Aplicación web

```bash
cd src
npm install
cp .env.example .env
# Configurar GEMINI_API_KEY en .env
npm run dev
```

Abrir `http://localhost:3000`

Guía completa: [docs/despliegue_local.md](docs/despliegue_local.md)

### Capa analítica Python

```bash
pip install -r requirements.txt
pytest tests/ -v
python pipelines/pipeline_ml.py
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/despliegue_local.md](docs/despliegue_local.md) | Instalación paso a paso |
| [docs/planteamiento_problema.md](docs/planteamiento_problema.md) | Problema y objetivos |
| [docs/architecture.md](docs/architecture.md) | Arquitectura y API |
| [docs/aplicacion_web.md](docs/aplicacion_web.md) | Estructura de `src/` |
| [docs/stack_tecnologico.md](docs/stack_tecnologico.md) | Stack del arquitecto |
| [docs/fuentes_datos.md](docs/fuentes_datos.md) | datos.gov.co y SODA |
| [docs/data_dictionary.md](docs/data_dictionary.md) | Entidades Firestore |
| [docs/seguridad.md](docs/seguridad.md) | Firebase y credenciales |
| [docs/validación_guide.md](docs/validación_guide.md) | Guía para evaluadores |

## Changelog

Ver [Changelog.md](Changelog.md).
