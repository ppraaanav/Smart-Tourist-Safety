import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)


def generate_training_data(n_normal: int = 2000, n_anomaly: int = 300) -> pd.DataFrame:
    """
    Generate simulated tourist behavior data for model training.
    
    Normal behavior patterns:
    - Walking speed: 1-5 km/h (0.28-1.39 m/s)
    - Moderate location variance
    - Active during daytime hours (7 AM - 11 PM)
    - Reasonable location spread
    
    Anomalous behavior patterns:
    - Very high speed (vehicle on pedestrian paths)
    - No movement for extended time
    - Erratic movement patterns
    - Late night activity with movement
    - Impossible travel (teleporting)
    """
    np.random.seed(42)

    # ===== NORMAL DATA =====
    normal_data = {
        "current_speed": np.random.lognormal(mean=-0.5, sigma=0.8, size=n_normal).clip(0, 5),
        "avg_speed": np.random.lognormal(mean=-0.3, sigma=0.6, size=n_normal).clip(0, 4),
        "max_speed": np.random.lognormal(mean=0.2, sigma=0.7, size=n_normal).clip(0, 8),
        "speed_variance": np.random.exponential(scale=2, size=n_normal).clip(0, 20),
        "lat_variance": np.random.exponential(scale=0.00001, size=n_normal),
        "lng_variance": np.random.exponential(scale=0.00001, size=n_normal),
        "location_spread": np.random.lognormal(mean=5, sigma=1.5, size=n_normal).clip(10, 3000),
        "hour_of_day": np.random.choice(range(7, 23), size=n_normal),
        "data_points": np.random.randint(5, 30, size=n_normal),
        "time_span_minutes": np.random.exponential(scale=30, size=n_normal).clip(5, 180),
        "is_anomaly": np.zeros(n_normal, dtype=int)
    }

    # ===== ANOMALY DATA =====
    # Type 1: High speed anomalies (40%)
    n_speed = int(n_anomaly * 0.3)
    speed_anomaly = {
        "current_speed": np.random.uniform(15, 50, size=n_speed),
        "avg_speed": np.random.uniform(10, 40, size=n_speed),
        "max_speed": np.random.uniform(20, 60, size=n_speed),
        "speed_variance": np.random.uniform(50, 300, size=n_speed),
        "lat_variance": np.random.exponential(scale=0.001, size=n_speed),
        "lng_variance": np.random.exponential(scale=0.001, size=n_speed),
        "location_spread": np.random.uniform(3000, 15000, size=n_speed),
        "hour_of_day": np.random.choice(range(0, 24), size=n_speed),
        "data_points": np.random.randint(3, 20, size=n_speed),
        "time_span_minutes": np.random.uniform(1, 30, size=n_speed),
        "is_anomaly": np.ones(n_speed, dtype=int)
    }

    # Type 2: Inactivity anomalies (20%)
    n_inactive = int(n_anomaly * 0.2)
    inactive_anomaly = {
        "current_speed": np.random.uniform(0, 0.1, size=n_inactive),
        "avg_speed": np.random.uniform(0, 0.05, size=n_inactive),
        "max_speed": np.random.uniform(0, 0.2, size=n_inactive),
        "speed_variance": np.random.uniform(0, 0.01, size=n_inactive),
        "lat_variance": np.random.uniform(0, 0.0000001, size=n_inactive),
        "lng_variance": np.random.uniform(0, 0.0000001, size=n_inactive),
        "location_spread": np.random.uniform(0, 5, size=n_inactive),
        "hour_of_day": np.random.choice(range(0, 24), size=n_inactive),
        "data_points": np.random.randint(10, 30, size=n_inactive),
        "time_span_minutes": np.random.uniform(30, 180, size=n_inactive),
        "is_anomaly": np.ones(n_inactive, dtype=int)
    }

    # Type 3: Erratic movement (20%)
    n_erratic = int(n_anomaly * 0.2)
    erratic_anomaly = {
        "current_speed": np.random.uniform(0, 10, size=n_erratic),
        "avg_speed": np.random.uniform(2, 8, size=n_erratic),
        "max_speed": np.random.uniform(10, 30, size=n_erratic),
        "speed_variance": np.random.uniform(100, 500, size=n_erratic),
        "lat_variance": np.random.exponential(scale=0.01, size=n_erratic),
        "lng_variance": np.random.exponential(scale=0.01, size=n_erratic),
        "location_spread": np.random.uniform(500, 8000, size=n_erratic),
        "hour_of_day": np.random.choice(range(0, 24), size=n_erratic),
        "data_points": np.random.randint(5, 20, size=n_erratic),
        "time_span_minutes": np.random.uniform(5, 60, size=n_erratic),
        "is_anomaly": np.ones(n_erratic, dtype=int)
    }

    # Type 4: Night activity (15%)
    n_night = int(n_anomaly * 0.15)
    night_anomaly = {
        "current_speed": np.random.uniform(1, 10, size=n_night),
        "avg_speed": np.random.uniform(1, 8, size=n_night),
        "max_speed": np.random.uniform(2, 15, size=n_night),
        "speed_variance": np.random.uniform(5, 50, size=n_night),
        "lat_variance": np.random.exponential(scale=0.0001, size=n_night),
        "lng_variance": np.random.exponential(scale=0.0001, size=n_night),
        "location_spread": np.random.uniform(500, 5000, size=n_night),
        "hour_of_day": np.random.choice([0, 1, 2, 3, 4, 5], size=n_night),
        "data_points": np.random.randint(5, 15, size=n_night),
        "time_span_minutes": np.random.uniform(10, 120, size=n_night),
        "is_anomaly": np.ones(n_night, dtype=int)
    }

    # Type 5: Impossible travel / teleporting (15%)
    n_teleport = n_anomaly - n_speed - n_inactive - n_erratic - n_night
    teleport_anomaly = {
        "current_speed": np.random.uniform(0, 5, size=n_teleport),
        "avg_speed": np.random.uniform(0, 3, size=n_teleport),
        "max_speed": np.random.uniform(0, 5, size=n_teleport),
        "speed_variance": np.random.uniform(0, 10, size=n_teleport),
        "lat_variance": np.random.exponential(scale=0.1, size=n_teleport),
        "lng_variance": np.random.exponential(scale=0.1, size=n_teleport),
        "location_spread": np.random.uniform(5000, 50000, size=n_teleport),
        "hour_of_day": np.random.choice(range(0, 24), size=n_teleport),
        "data_points": np.random.randint(3, 10, size=n_teleport),
        "time_span_minutes": np.random.uniform(1, 10, size=n_teleport),
        "is_anomaly": np.ones(n_teleport, dtype=int)
    }

    # Combine all data
    all_dfs = [
        pd.DataFrame(normal_data),
        pd.DataFrame(speed_anomaly),
        pd.DataFrame(inactive_anomaly),
        pd.DataFrame(erratic_anomaly),
        pd.DataFrame(night_anomaly),
        pd.DataFrame(teleport_anomaly)
    ]

    df = pd.concat(all_dfs, ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    logger.info(f"Generated {len(df)} samples: {n_normal} normal, {n_anomaly} anomalous")
    logger.info(f"Anomaly types: speed={n_speed}, inactive={n_inactive}, "
                f"erratic={n_erratic}, night={n_night}, teleport={n_teleport}")

    return df
