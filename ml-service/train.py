# train.py

import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from config import *
from preprocess import create_preprocessor


def train_model(data_path, target_column, model_path, preprocessor_path):
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    df = pd.read_csv(data_path)

    X, y, preprocessor = create_preprocessor(df, target_column)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    pipeline.fit(X_train, y_train)

    joblib.dump(pipeline, model_path)
    joblib.dump(preprocessor, preprocessor_path)

    print(f"Model saved at {model_path}")


if __name__ == "__main__":
    # Claims: derive denial_flag from status if needed
    import pandas as pd
    claims_df = pd.read_csv(CLAIMS_PATH)
    if "denial_flag" not in claims_df.columns and "status" in claims_df.columns:
        claims_df["denial_flag"] = (claims_df["status"] == "DENIED").astype(int)
        claims_df = claims_df.drop(columns=["status"])  # avoid leakage
        claims_df.to_csv(CLAIMS_PATH, index=False)

    print("Training Denial Model...")
    train_model(CLAIMS_PATH, "denial_flag",
                DENIAL_MODEL_PATH, DENIAL_PREPROCESSOR_PATH)

    print("Training Payment Delay Model...")
    train_model(INVOICES_PATH, "payment_delay_flag",
                PAYMENT_MODEL_PATH, PAYMENT_PREPROCESSOR_PATH)

    print("Training No Show Model...")
    train_model(APPOINTMENTS_PATH, "no_show_flag",
                NO_SHOW_MODEL_PATH, NO_SHOW_PREPROCESSOR_PATH)

    print("All models trained successfully.")