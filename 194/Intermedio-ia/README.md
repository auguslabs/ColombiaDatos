# ColombIA Datos — Equipo 194

**Asistente virtual ciudadano** que permite consultar, analizar y visualizar datos abiertos de Colombia mediante lenguaje natural.

Proyecto Intermedio IA — Concurso Datos al Ecosistema 2026 IA para Colombia.

## Ficha técnica

| Campo | Detalle |
|-------|---------|
| **Nombre** | ColombIA Datos |
| **Equipo** | 194 |
| **Nivel** | Intermedio IA |
| **Problema** | Dificultad ciudadana para acceder, entender y visualizar datos públicos en datos.gov.co |
| **Solución** | Plataforma web con IA (Gemini) que traduce preguntas en lenguaje natural a consultas sobre datos abiertos, con visualizaciones interactivas |
| **Fuente principal** | [datos.gov.co](https://www.datos.gov.co/) — API SODA |
| **Licencia** | MIT — ver [LICENSE](LICENSE) |

## Stack tecnológico

### Aplicación web (`src/`)

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, Motion, Lucide React, Recharts, React Markdown |
| Backend | Express (Node.js), TypeScript, esbuild |
| IA | Google Gen AI SDK (`@google/genai`) — modelos Gemini |
| Datos en nube | Firebase Auth + Cloud Firestore |

Detalle completo en [docs/aplicacion_web.md](docs/aplicacion_web.md) y [docs/stack_tecnologico.md](docs/stack_tecnologico.md).

### Capa analítica (`ml/`, `notebooks/`, `data/`)

| Capa | Tecnología |
|------|------------|
| Análisis | Python, Pandas, Scikit-learn, Jupyter |
| Pipeline | `pipelines/pipeline_ml.py` |
| Pruebas | pytest |

## Estructura del repositorio

```
Intermedio-ia/
├── src/              # Aplicación web full-stack (Google AI Studio)
├── ml/               # Módulos Python de análisis y ML
├── docs/             # Documentación técnica para evaluación
├── data/             # Ciclo de vida de datos (01_raw → 04_model_output)
├── notebooks/        # Experimentación y EDA
├── models/           # Artefactos de modelos entrenados
├── reports/          # Figuras y reporte final
├── tests/            # Pruebas de calidad e inferencia
├── pipelines/        # Pipeline ML reproducible
└── RECURSOS/         # Presentación y material visual
```

## Instalación y ejecución

### Aplicación web

```bash
cd src
npm install
cp .env.example .env.local
# Configurar GEMINI_API_KEY en .env.local
npm run dev
```

Abrir `http://localhost:3000`

Ver [docs/variables_entorno.md](docs/variables_entorno.md) para todas las variables.

### Capa analítica Python

```bash
pip install -r requirements.txt
pytest tests/ -v
python pipelines/pipeline_ml.py
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/planteamiento_problema.md](docs/planteamiento_problema.md) | Problema y objetivos |
| [docs/architecture.md](docs/architecture.md) | Arquitectura del sistema |
| [docs/stack_tecnologico.md](docs/stack_tecnologico.md) | Stack completo del arquitecto |
| [docs/aplicacion_web.md](docs/aplicacion_web.md) | Estructura del código en `src/` |
| [docs/fuentes_datos.md](docs/fuentes_datos.md) | datos.gov.co y API SODA |
| [docs/data_dictionary.md](docs/data_dictionary.md) | Entidades y variables |
| [docs/seguridad.md](docs/seguridad.md) | Firebase, reglas y credenciales |
| [docs/validación_guide.md](docs/validación_guide.md) | Guía para pares evaluadores |

## Changelog

Ver [Changelog.md](Changelog.md).
