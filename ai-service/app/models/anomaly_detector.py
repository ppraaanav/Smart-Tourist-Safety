import numpy as np
import joblib
import logging
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Hybrid anomaly detection using:
    1. Isolation Forest (unsupervised) - for detecting novel anomalies
    2. Random Forest Classifier (supervised) - for classifying known anomaly types
    3. Rule-based engine - for domain-specific rules
    """

    def __init__(self):
        self.isolation_forest = None
        self.random_forest = None
        self.scaler = None
        self.feature_names = [
            "current_speed", "avg_speed", "max_speed", "speed_variance",
            "lat_variance", "lng_variance", "location_spread",
            "hour_of_day", "data_points", "time_span_minutes"
        ]

    def load_model(self, path: str):
        """Load pre-trained models from disk"""
        try:
            models = joblib.load(path)
            self.isolation_forest = models.get("isolation_forest")
            self.random_forest = models.get("random_forest")
            self.scaler = models.get("scaler")
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            self._init_default_models()

    def _init_default_models(self):
        """Initialize default models if loading fails"""
        self.scaler = StandardScaler()
        self.isolation_forest = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )
        self.random_forest = None

    def predict(self, features: dict) -> dict:
        """
        Run anomaly detection on input features.
        Returns anomaly prediction with severity and score.
        """
        try:
            # Extract and validate features
            feature_vector = self._extract_features(features)

            # Scale features
            if self.scaler is not None:
                feature_scaled = self.scaler.transform([feature_vector])
            else:
                feature_scaled = np.array([feature_vector])

            result = {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "severity": "low",
                "reason": "",
                "confidence": 0.0,
                "details": {}
            }

            # 1. Isolation Forest prediction
            if self.isolation_forest is not None:
                if_prediction = self.isolation_forest.predict(feature_scaled)[0]
                if_score = -self.isolation_forest.score_samples(feature_scaled)[0]

                result["details"]["isolation_forest"] = {
                    "prediction": int(if_prediction),
                    "anomaly_score": float(if_score)
                }

                if if_prediction == -1:  # Anomaly detected
                    result["is_anomaly"] = True
                    result["anomaly_score"] = min(float(if_score), 1.0)

            # 2. Random Forest classification (if available)
            if self.random_forest is not None:
                rf_prediction = self.random_forest.predict(feature_scaled)[0]
                rf_proba = self.random_forest.predict_proba(feature_scaled)[0]

                result["details"]["random_forest"] = {
                    "prediction": int(rf_prediction),
                    "probability": float(max(rf_proba))
                }

                if rf_prediction == 1:  # Anomaly class
                    result["is_anomaly"] = True
                    result["confidence"] = float(max(rf_proba))

            # 3. Rule-based checks
            rule_result = self._apply_rules(features)
            if rule_result["is_anomaly"]:
                result["is_anomaly"] = True
                result["reason"] = rule_result["reason"]
                result["anomaly_score"] = max(result["anomaly_score"], rule_result["score"])

            # Determine severity based on score
            if result["is_anomaly"]:
                score = result["anomaly_score"]
                if score >= 0.8:
                    result["severity"] = "critical"
                elif score >= 0.6:
                    result["severity"] = "high"
                elif score >= 0.4:
                    result["severity"] = "medium"
                else:
                    result["severity"] = "low"

                if not result["reason"]:
                    result["reason"] = self._generate_reason(features, result)

            result["anomaly_score"] = round(result["anomaly_score"], 4)
            result["confidence"] = round(max(result["confidence"], result["anomaly_score"]), 4)

            return result

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "severity": "low",
                "reason": f"Prediction error: {str(e)}",
                "confidence": 0.0,
                "details": {}
            }

    def _extract_features(self, features: dict) -> list:
        """Extract feature vector from input dict"""
        return [
            features.get("current_speed", 0),
            features.get("avg_speed", 0),
            features.get("max_speed", 0),
            features.get("speed_variance", 0),
            features.get("lat_variance", 0),
            features.get("lng_variance", 0),
            features.get("location_spread", 0),
            features.get("hour_of_day", 12),
            features.get("data_points", 1),
            features.get("time_span_minutes", 0)
        ]

    def _apply_rules(self, features: dict) -> dict:
        """Rule-based anomaly detection"""
        result = {"is_anomaly": False, "reason": "", "score": 0.0}

        # Rule: Very high speed
        current_speed = features.get("current_speed", 0)
        if current_speed > 30:  # > 108 km/h
            result["is_anomaly"] = True
            result["reason"] = f"Abnormally high speed: {current_speed * 3.6:.1f} km/h"
            result["score"] = min(current_speed / 50, 1.0)
            return result

        # Rule: High speed variance
        speed_variance = features.get("speed_variance", 0)
        if speed_variance > 100:
            result["is_anomaly"] = True
            result["reason"] = f"Erratic movement pattern detected (speed variance: {speed_variance:.2f})"
            result["score"] = min(speed_variance / 200, 1.0)
            return result

        # Rule: Large location spread in short time
        spread = features.get("location_spread", 0)
        time_span = features.get("time_span_minutes", 0)
        if spread > 5000 and time_span < 10:
            result["is_anomaly"] = True
            result["reason"] = f"Impossible travel detected: {spread:.0f}m in {time_span:.0f} minutes"
            result["score"] = 0.9
            return result

        # Rule: Night activity with movement
        hour = features.get("hour_of_day", 12)
        avg_speed = features.get("avg_speed", 0)
        if 1 <= hour <= 5 and avg_speed > 2:
            result["is_anomaly"] = True
            result["reason"] = "Unusual movement during late night hours (1-5 AM)"
            result["score"] = 0.4
            return result

        # Rule: Inactivity
        if time_span > 30 and spread < 5 and features.get("data_points", 0) >= 5:
            result["is_anomaly"] = True
            result["reason"] = f"No movement for {time_span:.0f} minutes"
            result["score"] = 0.5
            return result

        return result

    def _generate_reason(self, features: dict, result: dict) -> str:
        """Generate human-readable reason for anomaly"""
        reasons = []
        if features.get("current_speed", 0) > 20:
            reasons.append(f"high speed ({features['current_speed'] * 3.6:.1f} km/h)")
        if features.get("speed_variance", 0) > 50:
            reasons.append("erratic movement")
        if features.get("location_spread", 0) > 3000:
            reasons.append("large area covered")

        if 1 <= features.get("hour_of_day", 12) <= 5:
            reasons.append("unusual hour")

        return f"Anomalous behavior detected: {', '.join(reasons)}" if reasons else "AI model flagged unusual pattern"
