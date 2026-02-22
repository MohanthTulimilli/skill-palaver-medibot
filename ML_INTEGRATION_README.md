# ML Predictive Analysis Integration

End-to-end flow: **User → React Frontend → Spring Boot Backend → FastAPI ML Service → MySQL → Display**

## Architecture

```
User
  ↓
React Frontend (displays predictions)
  ↓
Spring Boot Backend (calls ML, saves to MySQL)
  ↓
FastAPI ML Service (predict/denial, predict/payment-delay, predict/no-show)
  ↓
Prediction Result
  ↓
Spring Boot saves to MySQL (claim_features, invoice_features, appointment_features)
  ↓
React displays result
```

## Setup

### 1. Train ML models
```bash
cd medibotshealth-skill-palaver/ml-service
python train.py
```

### 2. Start ML API
```bash
cd medibotshealth-skill-palaver/ml-service
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Start Spring Boot
```bash
cd medibotshealth-skill-palaver/backend
mvn spring-boot:run
```

### 4. Start React frontend
```bash
cd medibotshealth-skill-palaver/frontend
npm run dev
```

### 5. Configure ML URL (optional)
By default the backend calls `http://127.0.0.1:8000`. Override with:
```
ML_SERVICE_URL=http://your-ml-host:8000
```

## Where predictions appear

| Page | Prediction | Display |
|------|------------|---------|
| **Claims Management** | Denial risk | AI Risk %, ML Denial Risk badge in detail modal |
| **Billing & Payments** | Payment delay risk | "Payment Delay Risk" column (High/Low + %) |
| **Doctor Appointments** | No-show risk | "ML No-Show Risk" in appointment detail modal |

## API response fields

- **Claims**: `ai_risk_score`, `ml_denial_prediction` (0/1), `ml_denial_probability` (0–1)
- **Invoices**: `ml_payment_delay_prediction` (0/1), `ml_payment_delay_probability` (0–1)
- **Appointments**: `ml_no_show_prediction` (0/1), `ml_no_show_probability` (0–1)

## Database

Hibernate `ddl-auto: update` adds `ml_prediction` and `ml_probability` to:
- `claim_features`
- `invoice_features`
- `appointment_features`
