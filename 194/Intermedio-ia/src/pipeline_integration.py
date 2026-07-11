"""Unión y consolidación de los conjuntos de datos."""

import pandas as pd

from src.config import DATA_INTERMEDIATE, DATA_PRIMARY


def load_intermediate() -> pd.DataFrame:
    """Carga datos intermedios (CSV en carpeta intermedia)."""
    csv_files = list(DATA_INTERMEDIATE.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No hay CSV en {DATA_INTERMEDIATE}")
    frames = [pd.read_csv(f) for f in csv_files]
    return pd.concat(frames, ignore_index=True) if len(frames) > 1 else frames[0]


def merge_datasets(left: pd.DataFrame, right: pd.DataFrame, on: str, how: str = "inner") -> pd.DataFrame:
    """Une dos conjuntos de datos por clave."""
    return pd.merge(left, right, on=on, how=how)


def save_primary(df: pd.DataFrame, filename: str = "consolidado.csv") -> None:
    """Guarda el dataset consolidado en data/03_primary/."""
    DATA_PRIMARY.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PRIMARY / filename, index=False)


def run_integration() -> pd.DataFrame:
    """Ejecuta el flujo de integración principal."""
    df = load_intermediate()
    save_primary(df)
    return df
