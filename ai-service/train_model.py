"""
Standalone training script.
Run: python train_model.py
"""
import sys
import os
import logging

# Add parent dir to path
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

from app.services.model_trainer import train_and_save_model

if __name__ == "__main__":
    print("=" * 60)
    print("Tourist Safety AI - Model Training")
    print("=" * 60)
    model_path = train_and_save_model()
    print(f"\nModel saved to: {model_path}")
    print("Training complete!")
