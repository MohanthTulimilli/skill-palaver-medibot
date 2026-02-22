-- ============================================================
-- PHASE 1 — DATABASE SCHEMA UPGRADE
-- Medibots Health - MySQL Migration
-- Run once. JPA ddl-auto also applies these changes on startup.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CLAIMS TABLE — Add new columns
-- ------------------------------------------------------------
ALTER TABLE claims
  ADD COLUMN primary_icd_code VARCHAR(20),
  ADD COLUMN secondary_icd_code VARCHAR(20),
  ADD COLUMN cpt_code VARCHAR(20),
  ADD COLUMN procedure_category VARCHAR(50),
  ADD COLUMN medical_necessity_score INT,
  ADD COLUMN prior_denial_count INT,
  ADD COLUMN resubmission_count INT,
  ADD COLUMN days_to_submission INT,
  ADD COLUMN documentation_complete BOOLEAN,
  ADD COLUMN claim_type VARCHAR(50),
  ADD COLUMN policy_type VARCHAR(50),
  ADD COLUMN coverage_limit DECIMAL(12,2),
  ADD COLUMN deductible_amount DECIMAL(12,2),
  ADD COLUMN preauthorization_required BOOLEAN,
  ADD COLUMN preauthorization_obtained BOOLEAN,
  ADD COLUMN patient_age INT,
  ADD COLUMN patient_gender VARCHAR(20),
  ADD COLUMN chronic_condition_flag BOOLEAN,
  ADD COLUMN doctor_specialization VARCHAR(100),
  ADD COLUMN hospital_tier VARCHAR(20);

-- ------------------------------------------------------------
-- 2. INVOICES TABLE — Add new columns
-- ------------------------------------------------------------
ALTER TABLE invoices
  ADD COLUMN days_to_payment INT,
  ADD COLUMN payment_delay_flag BOOLEAN,
  ADD COLUMN payer_type VARCHAR(50),
  ADD COLUMN invoice_category VARCHAR(50),
  ADD COLUMN reminder_count INT,
  ADD COLUMN installment_plan BOOLEAN,
  ADD COLUMN historical_avg_payment_delay INT;

-- ------------------------------------------------------------
-- 3. APPOINTMENTS TABLE — Add new columns
-- ------------------------------------------------------------
ALTER TABLE appointments
  ADD COLUMN booking_lead_time_days INT,
  ADD COLUMN previous_no_show_count INT,
  ADD COLUMN sms_reminder_sent BOOLEAN,
  ADD COLUMN reminder_count INT,
  ADD COLUMN appointment_type VARCHAR(50),
  ADD COLUMN distance_from_hospital_km DECIMAL(5,2),
  ADD COLUMN time_slot VARCHAR(20),
  ADD COLUMN weekday VARCHAR(20),
  ADD COLUMN no_show_flag BOOLEAN;

-- ------------------------------------------------------------
-- 4. CLAIM_FEATURES — ML-ready engineered features
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claim_features (
  id VARCHAR(36) PRIMARY KEY,
  claim_id VARCHAR(36) NOT NULL,
  risk_score_normalized DECIMAL(5,4),
  amount_to_coverage_ratio DECIMAL(10,6),
  denial_history_score DECIMAL(5,4),
  documentation_score DECIMAL(5,4),
  urgency_score DECIMAL(5,4),
  feature_vector_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_claim_features_claim (claim_id),
  KEY idx_claim_features_claim (claim_id)
);

-- ------------------------------------------------------------
-- 5. INVOICE_FEATURES — ML-ready engineered features
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_features (
  id VARCHAR(36) PRIMARY KEY,
  invoice_id VARCHAR(36) NOT NULL,
  payment_delay_score DECIMAL(5,4),
  amount_tier VARCHAR(20),
  payer_reliability_score DECIMAL(5,4),
  reminder_effectiveness_score DECIMAL(5,4),
  feature_vector_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_invoice_features_invoice (invoice_id),
  KEY idx_invoice_features_invoice (invoice_id)
);

-- ------------------------------------------------------------
-- 6. APPOINTMENT_FEATURES — ML-ready engineered features
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointment_features (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  no_show_risk_score DECIMAL(5,4),
  lead_time_score DECIMAL(5,4),
  engagement_score DECIMAL(5,4),
  slot_popularity_score DECIMAL(5,4),
  feature_vector_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_appointment_features_appointment (appointment_id),
  KEY idx_appointment_features_appointment (appointment_id)
);
