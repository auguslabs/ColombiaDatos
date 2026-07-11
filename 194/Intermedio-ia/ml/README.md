# Módulos analíticos Python

Esta carpeta contiene los módulos de análisis de datos y ML del proyecto, según la estructura sugerida del concurso.

> La aplicación web principal vive en `../src/` (React + Express + Gemini).
> Esta carpeta (`ml/`) es la capa analítica offline complementaria.

## Módulos

| Archivo | Responsabilidad |
|---------|-----------------|
| `config.py` | Rutas del proyecto y parámetros globales |
| `data_cleaning.py` | Limpieza, nulos y atípicos |
| `feature_engineering.py` | Variables derivadas y codificación |
| `pipeline_integration.py` | Unión y consolidación de datasets |
| `model_training.py` | Entrenamiento Random Forest / Gradient Boosting |
| `model_evaluation.py` | Matrices de confusión, correlaciones, métricas |

## Uso

```python
from ml.config import DATA_RAW, DATA_PRIMARY
from ml.data_cleaning import drop_duplicates, fill_missing_numeric
from ml.pipeline_integration import run_integration
```

## Pipeline

```bash
python pipelines/pipeline_ml.py
```

## Tests

```bash
pytest tests/ -v
```

## Notebooks

Los notebooks en `../notebooks/` importan desde `ml/`:

```python
from ml.config import DATA_RAW
from ml.data_cleaning import fill_missing_numeric
```
