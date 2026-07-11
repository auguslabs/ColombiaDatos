"""Generación de matrices, curvas ROC e insights."""

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

from ml.config import FIGURES_DIR


def plot_confusion_matrix(y_true, y_pred, save_path: str = "matriz_confusion.png") -> None:
    """Genera y guarda la matriz de confusión."""
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title("Matriz de confusión")
    plt.ylabel("Real")
    plt.xlabel("Predicción")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / save_path)
    plt.close()


def plot_correlations(df: pd.DataFrame, save_path: str = "correlaciones.png") -> None:
    """Genera mapa de calor de correlaciones."""
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        return
    plt.figure(figsize=(10, 8))
    sns.heatmap(numeric.corr(), annot=True, fmt=".2f", cmap="coolwarm", center=0)
    plt.title("Matriz de correlaciones")
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / save_path)
    plt.close()


def evaluate_classifier(model, X_test, y_test) -> dict:
    """Calcula métricas de clasificación."""
    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)
    try:
        if hasattr(model, "predict_proba"):
            y_score = model.predict_proba(X_test)[:, 1]
            report["roc_auc"] = roc_auc_score(y_test, y_score)
    except (ValueError, IndexError):
        pass
    return report
