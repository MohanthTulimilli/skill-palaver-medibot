-- Add patient_age, patient_gender, previous_late_payments to invoices and appointments
-- Add hospital_claim_success_rate to claims

ALTER TABLE invoices
  ADD COLUMN patient_age INT,
  ADD COLUMN patient_gender VARCHAR(20),
  ADD COLUMN previous_late_payments INT;

ALTER TABLE appointments
  ADD COLUMN patient_age INT,
  ADD COLUMN patient_gender VARCHAR(20),
  ADD COLUMN previous_late_payments INT;

ALTER TABLE claims
  ADD COLUMN hospital_claim_success_rate DECIMAL(5,2);
