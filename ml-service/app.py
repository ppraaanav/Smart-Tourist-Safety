import os
import math
import sys
import subprocess


def _ensure_python_deps():
    # Ensure Flask is available. Keep this service lightweight so it
    # runs without requiring compiled deps (numpy/sklearn).
    try:
        from flask import Flask  # noqa: F401
    except Exception:
        req_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_path])

    # Optionally install ML deps (best-effort). If it fails, we fall back
    # to the heuristic scorer below so `/anomaly` still works.
    try:
        import numpy  # noqa: F401
        import sklearn  # noqa: F401
    except Exception:
        opt_path = os.path.join(os.path.dirname(__file__), "optional-requirements.txt")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", opt_path])
        except Exception:
            pass


_ensure_python_deps()

from flask import Flask, jsonify, request  # noqa: E402


ML_MODEL = None
try:
    import numpy as np  # noqa: E402
    from sklearn.linear_model import LogisticRegression  # noqa: E402
    from sklearn.pipeline import Pipeline  # noqa: E402
    from sklearn.preprocessing import StandardScaler  # noqa: E402

    def _train_dummy_model(random_seed: int = 42):
        # [speedMps, accelerationMps2, headingChangeDeg, accuracyM]
        rng = np.random.default_rng(random_seed)
        n = 2000

        speed = rng.normal(loc=4.0, scale=2.5, size=n).clip(0, 25)
        accel = rng.normal(loc=0.0, scale=1.8, size=n).clip(-10, 10)
        heading_change = rng.normal(loc=0.0, scale=25.0, size=n).clip(-180, 180)
        accuracy = rng.normal(loc=25.0, scale=12.0, size=n).clip(1, 200)

        risky_signal = (
            (speed > 9.0).astype(float)
            + (np.abs(accel) > 3.0).astype(float)
            + (np.abs(heading_change) > 110).astype(float)
            + (accuracy > 90).astype(float)
        )
        y = (risky_signal >= 2.0).astype(int)

        X = np.stack([speed, accel, heading_change, accuracy], axis=1)
        model = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(max_iter=300)),
            ]
        )
        model.fit(X, y)
        return model

    ML_MODEL = _train_dummy_model()
except Exception:
    ML_MODEL = None


APP = Flask(__name__)

def _to_float(x, default=0.0):
    try:
        if x is None:
            return default
        v = float(x)
        if not math.isfinite(v):
            return default
        return v
    except Exception:
        return default


def parse_features(payload: dict):
    features = payload.get("features") or payload
    speed = _to_float(features.get("speedMps"))
    accel = _to_float(features.get("accelerationMps2"))
    heading_change = _to_float(features.get("headingChangeDeg"))
    accuracy = _to_float(features.get("accuracyM"), default=25.0)
    return speed, accel, heading_change, accuracy


@APP.get("/health")
def health():
    return jsonify({"ok": True})


@APP.post("/anomaly")
def anomaly():
    payload = request.get_json(silent=True) or {}
    speed, accel, heading_change, accuracy = parse_features(payload)

    # If sklearn is available, use the dummy trained model.
    # Otherwise, fall back to a heuristic scorer.
    if ML_MODEL is not None:
        X = np.array([[speed, accel, heading_change, accuracy]], dtype=np.float64)
        try:
            proba = ML_MODEL.predict_proba(X)[0]
            anomaly_score = float(proba[1]) if len(proba) > 1 else float(proba[0])
        except Exception:
            anomaly_score = None
    else:
        anomaly_score = None

    if anomaly_score is None or not math.isfinite(anomaly_score):
        x = 0.6 * speed + 0.8 * abs(accel) + 0.01 * abs(heading_change) + 0.003 * accuracy - 7.0
        anomaly_score = 1.0 / (1.0 + math.exp(-x))
    risky = anomaly_score >= 0.7

    # Provide human-friendly reasons based on heuristics.
    reasons = []
    if speed > 9.0:
        reasons.append(f"High speed ({speed:.2f} m/s)")
    if abs(accel) > 3.0:
        reasons.append(f"Unusual acceleration ({accel:.2f} m/s^2)")
    if abs(heading_change) > 110:
        reasons.append(f"Large heading change ({heading_change:.1f} deg)")
    if accuracy > 90:
        reasons.append(f"Low GPS accuracy ({accuracy:.0f} m)")
    if not reasons:
        reasons.append("Pattern matches low-risk movement")

    return jsonify(
        {
            "anomaly_score": anomaly_score,
            "risky": risky,
            "reasons": reasons,
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", "8000"))
    APP.run(host="0.0.0.0", port=port, debug=False)

