import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.predict import router as predict_router
from app.routes.health import router as health_router
from app.models.anomaly_detector import AnomalyDetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tourist Safety AI Service",
    description="AI-powered anomaly detection for tourist safety monitoring",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detector
detector = AnomalyDetector()

@app.on_event("startup")
async def startup_event():
    """Load or train model on startup"""
    model_path = os.path.join(os.path.dirname(__file__), "models", "trained_model.joblib")
    if os.path.exists(model_path):
        detector.load_model(model_path)
        logger.info("Loaded pre-trained anomaly detection model")
    else:
        logger.info("No pre-trained model found. Training new model...")
        from app.services.model_trainer import train_and_save_model
        train_and_save_model()
        detector.load_model(model_path)
        logger.info("Trained and loaded new model")

# Store detector in app state
app.state.detector = detector

# Include routers
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(predict_router, prefix="/api", tags=["Prediction"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
