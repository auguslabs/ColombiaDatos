"""Entrenamiento de algoritmos avanzados y tuning."""

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import GridSearchCV, train_test_split

from ml.config import MODELS_DIR, RANDOM_STATE, TEST_SIZE


def train_ensemble(
    X: pd.DataFrame,
    y: pd.Series,
    model_type: str = "random_forest",
) -> object:
    """Entrena Random Forest o Gradient Boosting con validación cruzada básica."""
    if model_type == "gradient_boosting":
        estimator = GradientBoostingClassifier(random_state=RANDOM_STATE)
        param_grid = {"n_estimators": [50, 100], "max_depth": [3, 5]}
    else:
        estimator = RandomForestClassifier(random_state=RANDOM_STATE)
        param_grid = {"n_estimators": [50, 100], "max_depth": [5, 10]}

    grid = GridSearchCV(estimator, param_grid, cv=3, scoring="f1_weighted")
    grid.fit(X, y)
    return grid.best_estimator_


def save_model(model: object, filename: str = "advanced_ensemble.pkl") -> None:
    """Persiste el modelo entrenado."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODELS_DIR / filename)


def prepare_and_train(df: pd.DataFrame, target: str, feature_columns: list[str]) -> object:
    """Divide datos, entrena y guarda el modelo."""
    X = df[feature_columns]
    y = df[target]
    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    model = train_ensemble(X_train, y_train)
    save_model(model)
    return model
