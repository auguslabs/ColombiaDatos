"""Pruebas de calidad de datos: rangos, nulos y tipos."""

import pandas as pd
import pytest

from src.data_cleaning import drop_duplicates, fill_missing_numeric


@pytest.fixture
def sample_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "id": [1, 2, 2, 3],
            "valor": [10.0, None, 30.0, 40.0],
            "categoria": ["A", "B", "B", "C"],
        }
    )


def test_drop_duplicates(sample_df: pd.DataFrame) -> None:
    result = drop_duplicates(sample_df)
    assert len(result) == 3


def test_fill_missing_numeric(sample_df: pd.DataFrame) -> None:
    result = fill_missing_numeric(sample_df)
    assert result["valor"].isna().sum() == 0


def test_numeric_types(sample_df: pd.DataFrame) -> None:
    result = fill_missing_numeric(sample_df)
    assert pd.api.types.is_numeric_dtype(result["valor"])
