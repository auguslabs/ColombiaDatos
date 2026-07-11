# Marco metodológico — CRISP-ML adaptado

Aplicación de CRISP-ML al proyecto ColombIA Datos, combinando desarrollo de producto IA y análisis de datos.

## Fases

| Fase | Actividad | Entregable |
|------|-----------|------------|
| 1. Comprensión del negocio | Planteamiento del problema ciudadano | [planteamiento_problema.md](planteamiento_problema.md) |
| 2. Comprensión de los datos | EDA sobre datasets de datos.gov.co | `notebooks/01_EDA_exploracion_datos.ipynb` |
| 3. Preparación de datos | Limpieza, tipos, nulos | `ml/data_cleaning.py`, `notebooks/02_limpieza_transformacion.ipynb` |
| 4. Ingeniería de features | Variables derivadas, NLP básico | `ml/feature_engineering.py` |
| 5. Modelado | Entrenamiento offline + IA generativa en producción | `ml/model_training.py`, Gemini en `server.ts` |
| 6. Evaluación | Métricas ML + validación UX del asistente | `ml/model_evaluation.py`, `tests/` |
| 7. Despliegue | App web + pipeline reproducible | `src/` (web), `pipelines/pipeline_ml.py` |

## Metodología de desarrollo de la aplicación IA

Paralela al ciclo CRISP-ML, el desarrollo web siguió un enfoque iterativo:

1. **Prototipo en AI Studio** — Validación del concepto conversacional con Gemini.
2. **Exportación full-stack** — React + Express con proxy seguro de APIs.
3. **Integración Firebase** — Auth, persistencia y reglas de seguridad.
4. **Integración SODA** — Conexión en tiempo real con datos.gov.co.
5. **Visualizaciones** — Recharts para gráficos interactivos.
6. **Documentación** — Estructura del concurso + stack del arquitecto.

## Criterios de éxito

| Criterio | Métrica |
|----------|---------|
| Consultas respondidas | Respuesta coherente con datos reales de datos.gov.co |
| Visualizaciones | Gráfico generado cuando la consulta es numérica |
| Seguridad | Claves API no expuestas en el navegador |
| Reproducibilidad | Pipeline Python ejecutable + tests pasando |
| Usabilidad | Interfaz responsive (móvil y escritorio) |

## Herramientas por fase

| Fase | Herramientas |
|------|-------------|
| EDA | Jupyter, Pandas, Seaborn |
| Limpieza / ML | Python, scikit-learn, `ml/` |
| App IA | React 19, Express, Gemini SDK, Firebase |
| Visualización web | Recharts, Motion, Tailwind CSS v4 |
| CI/CD | GitHub Actions, GitLab CI |
