# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from predict import predict
from stats import get_claims_stats, get_invoices_stats, get_appointments_stats
from insights import get_claim_insights, get_invoice_insights, get_appointment_insights
from config import (
    DENIAL_MODEL_PATH,
    PAYMENT_MODEL_PATH,
    NO_SHOW_MODEL_PATH,
)

app = FastAPI(title="Medibots ML Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/predict/denial")
def predict_denial(data: dict):
    return predict(data, DENIAL_MODEL_PATH)


@app.post("/predict/payment-delay")
def predict_payment(data: dict):
    return predict(data, PAYMENT_MODEL_PATH)


@app.post("/predict/no-show")
def predict_no_show(data: dict):
    return predict(data, NO_SHOW_MODEL_PATH)


@app.get("/stats/claims")
def stats_claims():
    return get_claims_stats()


@app.get("/stats/invoices")
def stats_invoices():
    return get_invoices_stats()


@app.get("/stats/appointments")
def stats_appointments():
    return get_appointments_stats()


@app.post("/predict-with-insights/claim")
def predict_claim_with_insights(data: dict):
    result = predict(data, DENIAL_MODEL_PATH)
    stats = get_claims_stats()
    insight = get_claim_insights(data, result["prediction"], result["probability"], stats)
    acceptance_pct = (1 - result["probability"]) * 100 if result["prediction"] == 1 else result["probability"] * 100
    return {
        "prediction": result["prediction"],
        "probability": result["probability"],
        "acceptance_rate_pct": round(acceptance_pct, 1),
        "denial_rate_pct": round(100 - acceptance_pct, 1),
        "historical_stats": stats,
        "insights": insight,
    }


@app.post("/predict-with-insights/invoice")
def predict_invoice_with_insights(data: dict):
    # Normalize: model may expect invoice_amount, backend sends total_amount
    d = dict(data)
    if "total_amount" in d and "invoice_amount" not in d:
        d["invoice_amount"] = d["total_amount"]
    elif "invoice_amount" in d and "total_amount" not in d:
        d["total_amount"] = d["invoice_amount"]
    result = predict(d, PAYMENT_MODEL_PATH)
    stats = get_invoices_stats()
    insight = get_invoice_insights(d, result["prediction"], result["probability"], stats)
    on_time_pct = (1 - result["probability"]) * 100 if result["prediction"] == 1 else result["probability"] * 100
    return {
        "prediction": result["prediction"],
        "probability": result["probability"],
        "on_time_rate_pct": round(on_time_pct, 1),
        "delay_rate_pct": round(100 - on_time_pct, 1),
        "historical_stats": stats,
        "insights": insight,
    }


@app.post("/predict-with-insights/appointment")
def predict_appointment_with_insights(data: dict):
    result = predict(data, NO_SHOW_MODEL_PATH)
    stats = get_appointments_stats()
    insight = get_appointment_insights(data, result["prediction"], result["probability"], stats)
    attendance_pct = (1 - result["probability"]) * 100 if result["prediction"] == 1 else result["probability"] * 100
    return {
        "prediction": result["prediction"],
        "probability": result["probability"],
        "attendance_rate_pct": round(attendance_pct, 1),
        "no_show_rate_pct": round(100 - attendance_pct, 1),
        "historical_stats": stats,
        "insights": insight,
    }
