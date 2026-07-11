"""Parámetros globales y rutas del proyecto."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_RAW = PROJECT_ROOT / "data" / "01_raw"
DATA_INTERMEDIATE = PROJECT_ROOT / "data" / "02_intermediate"
DATA_PRIMARY = PROJECT_ROOT / "data" / "03_primary"
DATA_MODEL_OUTPUT = PROJECT_ROOT / "data" / "04_model_output"

MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"

RANDOM_STATE = 42
TEST_SIZE = 0.2
