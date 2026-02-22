# predict.py

import joblib
import pandas as pd


def _normalize_value(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    if isinstance(v, str):
        if v.lower() in ("true", "false"):
            return 1 if v.lower() == "true" else 0  # models expect int for bool cols
        if v.replace(".", "").replace("-", "").isdigit():
            return float(v) if "." in v else int(v)
    return v


def predict(data, model_path):
    model = joblib.load(model_path)
    data = {k: _normalize_value(v) for k, v in data.items()}
    df = pd.DataFrame([data])
    prediction = model.predict(df)[0]
    probability = float(model.predict_proba(df)[0].max())
    return {
        "prediction": int(prediction),
        "probability": probability,
    }
