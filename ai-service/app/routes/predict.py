import logging
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter()


class PredictionRequest(BaseModel):
    features: dict
    userId: Optional[str] = None
    dtid: Optional[str] = None


class PredictionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    severity: str
    reason: str
    confidence: float
    details: dict


@router.post("/predict", response_model=PredictionResponse)
async def predict_anomaly(request: PredictionRequest, req: Request):
    """
    Predict if the given tourist behavior features indicate an anomaly.

    Input features:
    - current_speed: Current speed in m/s
    - avg_speed: Average speed over recent readings
    - max_speed: Maximum speed in recent readings
    - speed_variance: Variance of speed values
    - lat_variance: Variance of latitude values
    - lng_variance: Variance of longitude values
    - location_spread: Maximum distance between recent locations (meters)
    - hour_of_day: Current hour (0-23)
    - data_points: Number of recent data points
    - time_span_minutes: Time span of recent data in minutes
    """
    detector = req.app.state.detector
    result = detector.predict(request.features)

    if result["is_anomaly"]:
        logger.warning(
            f"Anomaly detected for {request.dtid or 'unknown'}: "
            f"score={result['anomaly_score']}, severity={result['severity']}, "
            f"reason={result['reason']}"
        )

    return PredictionResponse(**result)


@router.post("/predict/batch")
async def predict_batch(requests: list[PredictionRequest], req: Request):
    """Batch prediction for multiple tourists"""
    detector = req.app.state.detector
    results = []

    for prediction_req in requests:
        result = detector.predict(prediction_req.features)
        results.append({
            "userId": prediction_req.userId,
            "dtid": prediction_req.dtid,
            **result
        })

    anomalies = [r for r in results if r["is_anomaly"]]
    return {
        "total": len(results),
        "anomalies_detected": len(anomalies),
        "results": results
    }
