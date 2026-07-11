# Arquitectura del proyecto

## Diagrama de flujo

```mermaid
flowchart LR
    A[Fuentes datos.gov.co] --> B[01_raw]
    B --> C[Limpieza src/data_cleaning]
    C --> D[02_intermediate]
    D --> E[Feature engineering]
    E --> F[03_primary]
    F --> G[Modelo src/model_training]
    G --> H[04_model_output]
    G --> I[models/]
    H --> J[reports/]
```

## Integración de fuentes

Describir aquí las fuentes de datos, APIs y proceso de consolidación.

## Componentes

| Módulo | Responsabilidad |
|--------|-----------------|
| `data_cleaning.py` | Limpieza y tratamiento de nulos/atípicos |
| `feature_engineering.py` | Variables derivadas y codificación |
| `pipeline_integration.py` | Unión de conjuntos de datos |
| `model_training.py` | Entrenamiento y tuning |
| `model_evaluation.py` | Métricas e insights |
