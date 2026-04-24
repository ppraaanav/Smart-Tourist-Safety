import os
import logging
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from app.services.data_simulator import generate_training_data

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "current_speed", "avg_speed", "max_speed", "speed_variance",
    "lat_variance", "lng_variance", "location_spread",
    "hour_of_day", "data_points", "time_span_minutes"
]


def train_and_save_model():
    """Train both Isolation Forest and Random Forest models, then save"""
    logger.info("Starting model training pipeline...")

    # Generate training data
    df = generate_training_data(n_normal=3000, n_anomaly=500)

    X = df[FEATURE_COLUMNS].values
    y = df["is_anomaly"].values

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ===== Train Isolation Forest =====
    logger.info("Training Isolation Forest...")
    isolation_forest = IsolationForest(
        n_estimators=200,
        contamination=0.12,
        max_features=0.8,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    isolation_forest.fit(X_train_scaled)

    # Evaluate Isolation Forest
    if_predictions = isolation_forest.predict(X_test_scaled)
    if_labels = np.where(if_predictions == -1, 1, 0)
    logger.info(f"Isolation Forest Accuracy: {accuracy_score(y_test, if_labels):.4f}")
    logger.info(f"\nIsolation Forest Report:\n{classification_report(y_test, if_labels)}")

    # ===== Train Random Forest Classifier =====
    logger.info("Training Random Forest Classifier...")
    random_forest = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    random_forest.fit(X_train_scaled, y_train)

    # Evaluate Random Forest
    rf_predictions = random_forest.predict(X_test_scaled)
    logger.info(f"Random Forest Accuracy: {accuracy_score(y_test, rf_predictions):.4f}")
    logger.info(f"\nRandom Forest Report:\n{classification_report(y_test, rf_predictions)}")

    # Feature importance
    importances = random_forest.feature_importances_
    feature_importance = sorted(
        zip(FEATURE_COLUMNS, importances),
        key=lambda x: x[1],
        reverse=True
    )
    logger.info("Feature Importances:")
    for feat, imp in feature_importance:
        logger.info(f"  {feat}: {imp:.4f}")

    # Save models
    model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "trained_model.joblib")

    joblib.dump({
        "isolation_forest": isolation_forest,
        "random_forest": random_forest,
        "scaler": scaler,
        "feature_columns": FEATURE_COLUMNS,
        "training_stats": {
            "total_samples": len(df),
            "normal_samples": int((y == 0).sum()),
            "anomaly_samples": int((y == 1).sum()),
            "if_accuracy": float(accuracy_score(y_test, if_labels)),
            "rf_accuracy": float(accuracy_score(y_test, rf_predictions))
        }
    }, model_path)

    logger.info(f"Models saved to {model_path}")
    return model_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_save_model()
