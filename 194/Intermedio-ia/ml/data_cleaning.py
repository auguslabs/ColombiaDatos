"""Scripts de limpieza y tratamiento de nulos/atípicos."""

import pandas as pd


def drop_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Elimina filas duplicadas."""
    return df.drop_duplicates()


def fill_missing_numeric(df: pd.DataFrame, strategy: str = "median") -> pd.DataFrame:
    """Imputa valores faltantes en columnas numéricas."""
    numeric_cols = df.select_dtypes(include="number").columns
    result = df.copy()
    for col in numeric_cols:
        if strategy == "median":
            result[col] = result[col].fillna(result[col].median())
        elif strategy == "mean":
            result[col] = result[col].fillna(result[col].mean())
    return result


def remove_outliers_iqr(df: pd.DataFrame, column: str, factor: float = 1.5) -> pd.DataFrame:
    """Filtra atípicos usando el rango intercuartílico."""
    q1 = df[column].quantile(0.25)
    q3 = df[column].quantile(0.75)
    iqr = q3 - q1
    lower = q1 - factor * iqr
    upper = q3 + factor * iqr
    return df[(df[column] >= lower) & (df[column] <= upper)]
