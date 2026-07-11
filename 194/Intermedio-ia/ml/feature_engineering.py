"""Creación de variables y codificación de NLP básico."""

import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler


def encode_categorical(df: pd.DataFrame, columns: list[str]) -> tuple[pd.DataFrame, dict]:
    """Codifica variables categóricas con LabelEncoder."""
    result = df.copy()
    encoders: dict = {}
    for col in columns:
        if col in result.columns:
            le = LabelEncoder()
            result[col] = le.fit_transform(result[col].astype(str))
            encoders[col] = le
    return result, encoders


def scale_features(df: pd.DataFrame, columns: list[str]) -> tuple[pd.DataFrame, StandardScaler]:
    """Estandariza columnas numéricas."""
    scaler = StandardScaler()
    result = df.copy()
    result[columns] = scaler.fit_transform(result[columns])
    return result, scaler


def create_text_length_feature(df: pd.DataFrame, text_column: str, new_column: str = "text_length") -> pd.DataFrame:
    """Crea variable de longitud de texto (NLP básico)."""
    result = df.copy()
    result[new_column] = result[text_column].astype(str).str.len()
    return result
