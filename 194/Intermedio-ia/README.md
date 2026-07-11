# Proyecto Intermedio IA — Colombia Datos

Guía principal del proyecto: ficha técnica, objetivos, metodología y resultados.

## Descripción

Proyecto de ciencia de datos e inteligencia artificial para el ecosistema de datos abiertos de Colombia.

## Estructura del repositorio

| Carpeta | Descripción |
|---------|-------------|
| `RECURSOS/` | Material visual (presentación, portada) |
| `docs/` | Documentación técnica para evaluación |
| `data/` | Ciclo de vida de datos (raw → model output) |
| `notebooks/` | Experimentación y análisis exploratorio |
| `src/` | Código fuente modularizado |
| `models/` | Artefactos de modelos entrenados |
| `reports/` | Figuras y reporte final |
| `tests/` | Pruebas de calidad de datos e inferencia |
| `pipelines/` | Pipeline de ML reproducible |

## Instalación

```bash
pip install -r requirements.txt
```

O con Conda:

```bash
conda env create -f environment.yml
conda activate colombia-datos-ia
```

## Uso rápido

```bash
python pipelines/pipeline_ml.py
pytest tests/
```

## Licencia

Ver [LICENSE](LICENSE).

## Changelog

Ver [Changelog.md](Changelog.md).
