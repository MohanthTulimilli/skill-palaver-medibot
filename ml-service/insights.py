# insights.py - Grok-powered meaningful insights (fallback to templates if no API key)

import os
import json

GROK_API_URL = "https://api.x.ai/v1/chat/completions"
GROK_MODEL = "grok-3-latest"  # or grok-beta, grok-2


def _call_grok(system_prompt: str, user_content: str) -> str | None:
    api_key = os.environ.get("XAI_API_KEY") or os.environ.get("GROK_API_KEY")
    if not api_key:
        return None
    try:
        import urllib.request
        body = json.dumps({
            "model": GROK_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "max_tokens": 300,
            "temperature": 0.3,
        }).encode("utf-8")
        req = urllib.request.Request(
            GROK_API_URL,
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
            return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception:
        return None


def get_claim_insights(features: dict, prediction: int, probability: float, stats: dict) -> str:
    """Grok insights for claim acceptance/denial prediction."""
    patient_name = features.get("patient_name") or features.get("patientName") or "the patient"
    claim_amount = features.get("claim_amount") or features.get("amount")
    amt_str = f"₹{claim_amount:,.0f}" if isinstance(claim_amount, (int, float)) else str(claim_amount)
    insurance = features.get("insurance_provider") or "Unknown"
    user_content = f"""
Patient: {patient_name}
Insurance: {insurance}
Claim amount: {amt_str}
Full claim details: {json.dumps(features, default=str)}
ML Prediction: {'DENIAL' if prediction == 1 else 'ACCEPTANCE'} with {probability*100:.1f}% confidence
Historical data: {stats.get('acceptance_rate', 0)*100:.1f}% acceptance, {stats.get('denial_rate', 0)*100:.1f}% denial from {stats.get('total_claims', 0)} past claims.

Provide 2-3 personalized, actionable insights for {patient_name} based on their claim amount, insurance, and profile. Focus on what improves acceptance chances. Address them directly.
"""
    result = _call_grok(
        "You are a healthcare revenue cycle AI assistant. Give clear, personalized insights to patients about their insurance claim likelihood based on their specific information. Be concise, actionable, and address the patient by context.",
        user_content,
    )
    if result:
        return result
    # Fallback template
    acc = stats.get("acceptance_rate", 0.75)
    den = stats.get("denial_rate", 0.25)
    if prediction == 1:
        return f"Based on {stats.get('total_claims', 400)} historical claims, {den*100:.0f}% were denied. Your claim has elevated denial risk. Tip: Ensure documentation is complete and pre-authorization is obtained when required."
    return f"Historical acceptance rate is {acc*100:.0f}%. Your profile suggests a favorable outcome. Complete documentation and timely submission improve approval odds."


def get_invoice_insights(features: dict, prediction: int, probability: float, stats: dict) -> str:
    """Grok insights for payment delay prediction."""
    user_content = f"""
Invoice details: {json.dumps(features, default=str)}
ML Prediction: {'PAYMENT DELAY LIKELY' if prediction == 1 else 'ON-TIME PAYMENT'} with {probability*100:.1f}% confidence
Historical data: {stats.get('on_time_rate', 0)*100:.1f}% on-time, {stats.get('delay_rate', 0)*100:.1f}% delayed from {stats.get('total_invoices', 0)} past invoices.

Provide 2-3 concise insights for the patient about payment likelihood and tips to avoid delay.
"""
    result = _call_grok(
        "You are a healthcare billing AI assistant. Give clear insights about invoice payment timing likelihood. Be concise.",
        user_content,
    )
    if result:
        return result
    delay = stats.get("delay_rate", 0.3)
    if prediction == 1:
        return f"Based on {stats.get('total_invoices', 350)} historical invoices, {delay*100:.0f}% experienced payment delay. Consider setting reminders or opting for early payment to avoid late fees."
    return f"Historical on-time rate is {(1-delay)*100:.0f}%. Your invoice profile suggests timely payment. Keep payment reminders enabled."


def get_appointment_insights(features: dict, prediction: int, probability: float, stats: dict) -> str:
    """Grok insights for no-show prediction."""
    user_content = f"""
Appointment details: {json.dumps(features, default=str)}
ML Prediction: {'NO-SHOW RISK' if prediction == 1 else 'LIKELY TO ATTEND'} with {probability*100:.1f}% confidence
Historical data: {stats.get('attendance_rate', 0)*100:.1f}% attended, {stats.get('no_show_rate', 0)*100:.1f}% no-show from {stats.get('total_appointments', 0)} past appointments.

Provide 2-3 concise insights and tips to reduce no-show risk.
"""
    result = _call_grok(
        "You are a healthcare scheduling AI assistant. Give clear insights about appointment attendance likelihood. Be concise and helpful.",
        user_content,
    )
    if result:
        return result
    ns = stats.get("no_show_rate", 0.28)
    if prediction == 1:
        return f"Based on {stats.get('total_appointments', 250)} historical appointments, {ns*100:.0f}% were no-shows. Enable SMS reminders and plan travel in advance to improve attendance."
    return f"Historical attendance rate is {(1-ns)*100:.0f}%. Your profile suggests you're likely to attend. SMS reminders help reduce last-minute cancellations."
