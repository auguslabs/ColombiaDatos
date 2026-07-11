"""Pipeline de ML reproducible."""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import DATA_PRIMARY  # noqa: E402
from src.pipeline_integration import run_integration  # noqa: E402


def main() -> None:
    """Ejecuta integración de datos y prepara el consolidado."""
    print("Iniciando pipeline ML...")
    try:
        df = run_integration()
        print(f"Consolidado generado: {len(df)} filas en {DATA_PRIMARY}")
    except FileNotFoundError as exc:
        print(f"Pipeline en modo esqueleto: {exc}")
        print("Coloque datos en data/02_intermediate/ para ejecutar el flujo completo.")
    print("Pipeline finalizado.")


if __name__ == "__main__":
    main()
