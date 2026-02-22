# stats.py - Historical acceptance/denial rates from CSV data

import os
import pandas as pd
from config import CLAIMS_PATH, INVOICES_PATH, APPOINTMENTS_PATH


def _load_csv(path: str, base_dir: str = None) -> pd.DataFrame | None:
    p = path if base_dir is None else os.path.join(base_dir, path)
    if not os.path.exists(p):
        # Try relative to script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        p = os.path.join(script_dir, path)
    if not os.path.exists(p):
        return None
    return pd.read_csv(p)


def get_claims_stats() -> dict:
    """From claims_400.csv: denial_flag 1=denied, 0=accepted"""
    df = _load_csv(CLAIMS_PATH)
    if df is None or "denial_flag" not in df.columns:
        return {"acceptance_rate": 0.75, "denial_rate": 0.25, "total_claims": 400, "source": "default"}
    total = len(df)
    denied = int(df["denial_flag"].sum())
    accepted = total - denied
    return {
        "acceptance_rate": round(accepted / total, 4) if total > 0 else 0,
        "denial_rate": round(denied / total, 4) if total > 0 else 0,
        "total_claims": total,
        "accepted_count": int(accepted),
        "denied_count": int(denied),
        "source": "claims_400.csv",
    }


def get_invoices_stats() -> dict:
    """From invoices_350.csv: payment_delay_flag 1=delayed, 0=on-time"""
    df = _load_csv(INVOICES_PATH)
    if df is None or "payment_delay_flag" not in df.columns:
        return {"on_time_rate": 0.7, "delay_rate": 0.3, "total_invoices": 350, "source": "default"}
    total = len(df)
    delayed = int(df["payment_delay_flag"].sum())
    on_time = total - delayed
    return {
        "on_time_rate": round(on_time / total, 4) if total > 0 else 0,
        "delay_rate": round(delayed / total, 4) if total > 0 else 0,
        "total_invoices": total,
        "on_time_count": int(on_time),
        "delayed_count": int(delayed),
        "source": "invoices_350.csv",
    }


def get_appointments_stats() -> dict:
    """From appointments_250.csv: no_show_flag 1=no-show, 0=attended"""
    df = _load_csv(APPOINTMENTS_PATH)
    if df is None or "no_show_flag" not in df.columns:
        return {"attendance_rate": 0.72, "no_show_rate": 0.28, "total_appointments": 250, "source": "default"}
    total = len(df)
    no_show = int(df["no_show_flag"].sum())
    attended = total - no_show
    return {
        "attendance_rate": round(attended / total, 4) if total > 0 else 0,
        "no_show_rate": round(no_show / total, 4) if total > 0 else 0,
        "total_appointments": total,
        "attended_count": int(attended),
        "no_show_count": int(no_show),
        "source": "appointments_250.csv",
    }
