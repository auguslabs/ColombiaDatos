"""Pruebas de consistencia en la predicción del modelo."""

import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier

from src.model_training import train_ensemble


@pytest.fixture
def classification_data():
    rng = np.random.default_rng(42)
    X = pd.DataFrame({"f1": rng.normal(size=100), "f2": rng.normal(size=100)})
    y = pd.Series(rng.integers(0, 2, size=100))
    return X, y


def test_model_trains_and_predicts(classification_data) -> None:
    X, y = classification_data
    model = train_ensemble(X, y, model_type="random_forest")
    predictions = model.predict(X)
    assert len(predictions) == len(y)
    assert set(predictions).issubset(set(y.unique()))


def test_predictions_are_deterministic(classification_data) -> None:
    X, y = classification_data
    model = RandomForestClassifier(random_state=42, n_estimators=10)
    model.fit(X, y)
    pred1 = model.predict(X)
    pred2 = model.predict(X)
    assert np.array_equal(pred1, pred2)
