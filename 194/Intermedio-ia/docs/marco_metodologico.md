# Marco metodológico — CRISP-ML

Aplicación de la metodología CRISP-ML al proyecto.

## Fases

1. **Comprensión del negocio** — Planteamiento del problema y objetivos.
2. **Comprensión de los datos** — EDA en `notebooks/01_EDA_exploracion_datos.ipynb`.
3. **Preparación de datos** — Limpieza y transformación (`src/data_cleaning.py`).
4. **Modelado** — Entrenamiento y validación (`src/model_training.py`).
5. **Evaluación** — Métricas e interpretación (`src/model_evaluation.py`).
6. **Despliegue** — Pipeline reproducible (`pipelines/pipeline_ml.py`).

## Criterios de éxito

Definir métricas objetivo (accuracy, F1, RMSE, etc.) según el tipo de problema.
