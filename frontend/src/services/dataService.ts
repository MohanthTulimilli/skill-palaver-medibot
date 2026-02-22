import { api, API_BASE } from '@/lib/api';

// ── Claims ──────────────────────────────────────────────

export interface DbClaim {
  id: string;
  claim_number: string;
  patient_id: string;
  insurance_provider: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'RESUBMITTED';
  ai_risk_score: number | null;
  ai_explanation: string | null;
  submitted_by: string;
  submitted_at: string;
  processed_at: string | null;
  created_at: string;
  patients?: { full_name: string; user_id: string } | null;
  primary_icd_code?: string | null;
  secondary_icd_code?: string | null;
  cpt_code?: string | null;
  procedure_category?: string | null;
  medical_necessity_score?: number | null;
  prior_denial_count?: number | null;
  resubmission_count?: number | null;
  days_to_submission?: number | null;
  documentation_complete?: boolean | null;
  claim_type?: string | null;
  policy_type?: string | null;
  coverage_limit?: number | null;
  deductible_amount?: number | null;
  preauthorization_required?: boolean | null;
  preauthorization_obtained?: boolean | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  chronic_condition_flag?: boolean | null;
  doctor_specialization?: string | null;
  hospital_tier?: string | null;
  hospital_claim_success_rate?: number | null;
  ml_denial_prediction?: number | null;
  ml_denial_probability?: number | null;
}

export async function fetchClaims() {
  return api<DbClaim[]>('/api/claims');
}

export async function fetchPatientClaims(_userId: string) {
  return api<DbClaim[]>('/api/claims/patient');
}

export interface CreateClaimPayload {
  patient_id: string;
  insurance_provider: string;
  amount: number;
  appointment_id?: string;
  hospital_id?: string;
  primary_icd_code?: string;
  secondary_icd_code?: string;
  cpt_code?: string;
  procedure_category?: string;
  medical_necessity_score?: number;
  prior_denial_count?: number;
  resubmission_count?: number;
  days_to_submission?: number;
  documentation_complete?: boolean;
  claim_type?: string;
  policy_type?: string;
  coverage_limit?: number;
  deductible_amount?: number;
  preauthorization_required?: boolean;
  preauthorization_obtained?: boolean;
  patient_age?: number;
  patient_gender?: string;
  chronic_condition_flag?: boolean;
  doctor_specialization?: string;
  hospital_tier?: string;
  hospital_claim_success_rate?: number;
}

export async function createClaim(patientId: string, insuranceProvider: string, amount: number, appointmentId?: string, extras?: Partial<CreateClaimPayload>) {
  const body: Record<string, unknown> = { patient_id: patientId, insurance_provider: insuranceProvider, amount };
  if (appointmentId) body.appointment_id = appointmentId;
  if (extras) {
    Object.assign(body, extras);
  }
  const claim = await api<DbClaim>('/api/claims', { method: 'POST', body: JSON.stringify(body) });
  return claim;
}

export async function fetchCompletedAppointmentsForClaims() {
  const [appointments, claims] = await Promise.all([
    api<any[]>('/api/appointments/for-claims'),
    api<DbClaim[]>('/api/claims'),
  ]);
  const claimedIds = new Set(claims.map((c: DbClaim) => c.appointment_id).filter(Boolean));
  return appointments.filter((a: any) => !claimedIds.has(a.id));
}

// ── ML Predictions & Insights ────────────────────────────

export interface MlClaimStats {
  acceptance_rate?: number;
  denial_rate?: number;
  total_claims?: number;
  accepted_count?: number;
  denied_count?: number;
}

export interface MlClaimPrediction {
  prediction: number;
  probability: number;
  acceptance_rate_pct?: number;
  denial_rate_pct?: number;
  historical_stats?: MlClaimStats;
  insights: string;
}

export interface MlInvoiceStats {
  on_time_rate?: number;
  delay_rate?: number;
  total_invoices?: number;
}

export interface MlInvoicePrediction {
  prediction: number;
  probability: number;
  on_time_rate_pct?: number;
  delay_rate_pct?: number;
  historical_stats?: MlInvoiceStats;
  insights: string;
}

export interface MlAppointmentStats {
  attendance_rate?: number;
  no_show_rate?: number;
  total_appointments?: number;
}

export interface MlAppointmentPrediction {
  prediction: number;
  probability: number;
  attendance_rate_pct?: number;
  no_show_rate_pct?: number;
  historical_stats?: MlAppointmentStats;
  insights: string;
}

export async function fetchMlClaimsStats() {
  return api<MlClaimStats>('/api/ml/stats/claims');
}

export async function fetchMlInvoicesStats() {
  return api<MlInvoiceStats>('/api/ml/stats/invoices');
}

export async function fetchMlAppointmentsStats() {
  return api<MlAppointmentStats>('/api/ml/stats/appointments');
}

export async function predictClaimWithInsights(features: Record<string, unknown>) {
  return api<MlClaimPrediction>('/api/ml/predict/claim', {
    method: 'POST',
    body: JSON.stringify(features),
  });
}

export async function predictInvoiceWithInsights(features: Record<string, unknown>) {
  return api<MlInvoicePrediction>('/api/ml/predict/invoice', {
    method: 'POST',
    body: JSON.stringify(features),
  });
}

export async function predictAppointmentWithInsights(features: Record<string, unknown>) {
  return api<MlAppointmentPrediction>('/api/ml/predict/appointment', {
    method: 'POST',
    body: JSON.stringify(features),
  });
}

export async function rescoreClaims() {
  return api<{ rescored: number; total: number }>('/api/claims/rescore', { method: 'POST' });
}

export async function manageClaim(claimId: string, action: 'approve' | 'reject') {
  return api<DbClaim>('/api/claims/manage', {
    method: 'POST',
    body: JSON.stringify({ claim_id: claimId, action }),
  });
}

// ── Invoices ────────────────────────────────────────────

export interface DbInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  claim_id: string | null;
  total_amount: number;
  due_date: string;
  payment_status: 'UNPAID' | 'PAID' | 'PARTIAL';
  created_at: string;
  patients?: { full_name: string; user_id: string } | null;
  days_to_payment?: number | null;
  payment_delay_flag?: boolean | null;
  payer_type?: string | null;
  invoice_category?: string | null;
  reminder_count?: number | null;
  installment_plan?: boolean | null;
  historical_avg_payment_delay?: number | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  previous_late_payments?: number | null;
  ml_payment_delay_prediction?: number | null;
  ml_payment_delay_probability?: number | null;
}

export async function fetchInvoices() {
  return api<DbInvoice[]>('/api/invoices');
}

export async function fetchPatientInvoices(_userId: string) {
  return api<DbInvoice[]>('/api/invoices/patient');
}

export interface GenerateInvoicePayload {
  claim_id: string;
  line_items?: { description: string; amount: number; item_type: string }[];
  days_to_payment?: number;
  payment_delay_flag?: boolean;
  payer_type?: string;
  invoice_category?: string;
  reminder_count?: number;
  installment_plan?: boolean;
  historical_avg_payment_delay?: number;
  patient_age?: number;
  patient_gender?: string;
  previous_late_payments?: number;
}

export async function generateInvoice(claimId: string, lineItems?: { description: string; amount: number; item_type: string }[], extras?: Partial<GenerateInvoicePayload>) {
  const body: Record<string, unknown> = { claim_id: claimId };
  if (lineItems?.length) body.line_items = lineItems;
  if (extras) {
    if (extras.days_to_payment != null) body.days_to_payment = extras.days_to_payment;
    if (extras.payment_delay_flag != null) body.payment_delay_flag = extras.payment_delay_flag;
    if (extras.payer_type != null) body.payer_type = extras.payer_type;
    if (extras.invoice_category != null) body.invoice_category = extras.invoice_category;
    if (extras.reminder_count != null) body.reminder_count = extras.reminder_count;
    if (extras.installment_plan != null) body.installment_plan = extras.installment_plan;
    if (extras.historical_avg_payment_delay != null) body.historical_avg_payment_delay = extras.historical_avg_payment_delay;
    if (extras.patient_age != null) body.patient_age = extras.patient_age;
    if (extras.patient_gender != null) body.patient_gender = extras.patient_gender;
    if (extras.previous_late_payments != null) body.previous_late_payments = extras.previous_late_payments;
  }
  return api<DbInvoice>('/api/invoices/generate', { method: 'POST', body: JSON.stringify(body) });
}

export interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
  item_type: string;
  created_at: string;
}

export async function fetchInvoiceItems(invoiceId: string) {
  return api<DbInvoiceItem[]>(`/api/invoices/${invoiceId}/items`);
}

export async function createInvoiceFromRecommendations(patientId: string, recommendationIds: string[], hospitalId?: string) {
  return api<DbInvoice>('/api/invoices/from-recommendations', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId, recommendation_ids: recommendationIds, hospital_id: hospitalId }),
  });
}

export async function fetchReceipt(invoiceId: string) {
  return api<{ invoice: DbInvoice; patient_name: string; items: { description: string; amount: number; item_type: string }[] }>(`/api/invoices/${invoiceId}/receipt`);
}

// ── Payments ────────────────────────────────────────────

export interface DbPayment {
  id: string;
  invoice_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  transaction_id: string | null;
  paid_by: string;
  created_at: string;
  invoices?: { invoice_number: string; total_amount: number; patients?: { full_name: string } | null } | null;
}

export async function fetchPayments() {
  return api<DbPayment[]>('/api/payments');
}

// ── Razorpay ─────────────────────────────────────────────

export interface RazorpayOrderResponse {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

export async function getRazorpayConfig() {
  return api<{ enabled: boolean }>('/api/razorpay/config');
}

export async function createRazorpayOrder(invoiceId: string | null, amount: number) {
  const body: Record<string, unknown> = { amount };
  if (invoiceId) body.invoice_id = invoiceId;
  return api<RazorpayOrderResponse>('/api/razorpay/order', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  invoiceId: string
) {
  return api<{ success: boolean; payment: unknown }>('/api/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      invoice_id: invoiceId,
    }),
  });
}

export interface BookingPayload {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  reason?: string;
  hospital_id?: string | null;
  amount: number;
  doctor_name?: string;
  appointment_type?: string;
  previous_no_show_count?: number;
  reminder_count?: number;
  distance_from_hospital_km?: number;
  time_slot?: string;
  weekday?: string;
  patient_age?: number;
  patient_gender?: string;
  previous_late_payments?: number;
}

export async function verifyRazorpayBooking(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  booking: BookingPayload
) {
  return api<{ success: boolean; appointment: unknown; invoice: unknown }>('/api/razorpay/verify-booking', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      ...booking,
    }),
  });
}

export async function makePayment(invoiceId: string, amount: number, paymentMethod: string) {
  return api<DbPayment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify({
      invoice_id: invoiceId,
      amount_paid: amount,
      payment_method: paymentMethod,
      transaction_id: `TXN-${Date.now()}`,
    }),
  });
}

// ── Patients ────────────────────────────────────────────

export async function fetchPatientRecord(_userId?: string) {
  try {
    const record = await api<any>('/api/patients/me');
    return record?.id ? record : null;
  } catch {
    return null;
  }
}

export async function updatePatientProfile(updates: {
  fullName?: string;
  dob?: string;
  gender?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  hospitalId?: string;
  photoIdPath?: string;
  insuranceCardPath?: string;
  validationReport?: Record<string, unknown>;
}) {
  return api<any>('/api/patients/me', {
    method: 'PATCH',
    body: JSON.stringify({
      full_name: updates.fullName ?? null,
      dob: updates.dob ?? null,
      gender: updates.gender ?? null,
      insurance_provider: updates.insuranceProvider ?? null,
      policy_number: updates.policyNumber ?? null,
      hospital_id: updates.hospitalId ?? null,
      photo_id_path: updates.photoIdPath ?? null,
      insurance_card_path: updates.insuranceCardPath ?? null,
      validation_report: updates.validationReport ?? null,
    }),
  });
}

export async function createPatientRecord(record: {
  fullName: string;
  dob: string;
  gender: string;
  insuranceProvider: string;
  policyNumber: string;
  hospitalId?: string;
  photoIdPath?: string;
  insuranceCardPath?: string;
  validationReport?: Record<string, unknown>;
}) {
  return api<any>('/api/patients', {
    method: 'POST',
    body: JSON.stringify({
      full_name: record.fullName,
      dob: record.dob,
      gender: record.gender,
      insurance_provider: record.insuranceProvider,
      policy_number: record.policyNumber,
      hospital_id: record.hospitalId || null,
      photo_id_path: record.photoIdPath || null,
      insurance_card_path: record.insuranceCardPath || null,
      validation_report: record.validationReport || null,
    }),
  });
}

export async function fetchPendingPatients() {
  return api<any[]>('/api/patients/pending');
}

export async function fetchPatientById(id: string) {
  return api<any>(`/api/patients/${id}`);
}

export async function fetchPatientLatePaymentCount(patientId: string) {
  return api<{ patient_id: string; previous_late_payments: number }>(`/api/patients/${patientId}/late-payment-count`);
}

export async function approvePatient(id: string) {
  return api<any>(`/api/patients/${id}/approve`, { method: 'POST' });
}

export async function rejectPatient(id: string) {
  return api<any>(`/api/patients/${id}/reject`, { method: 'POST' });
}

/** Fetch document with auth and return object URL for use in img src. Caller must revoke the URL when done. */
export async function fetchDocumentAsObjectUrl(filename: string): Promise<string> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/patients/documents/serve/${encodeURIComponent(filename)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to load document');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function getDocumentUrl(filename: string): string {
  return `${API_BASE}/api/patients/documents/serve/${encodeURIComponent(filename)}`;
}

export async function uploadPatientDocument(file: File, type: 'photo_id' | 'insurance_card') {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const res = await fetch(`${API_BASE}/api/patients/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    let errMsg = `Upload failed (${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const err = JSON.parse(text) as { error?: string };
          errMsg = err.error || errMsg;
        } catch {
          errMsg = text;
        }
      }
    } catch {
      /* use default errMsg */
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<{ path: string; filename: string }>;
}

export async function validateOnboarding(formData: Record<string, string>, hasPhotoId: boolean, hasInsuranceCard: boolean) {
  return api<{
    documentVerification: string;
    documentVerificationReason: string;
    insuranceEligibility: string;
    insuranceEligibilityReason: string;
    riskAssessment: string;
    riskAssessmentReason: string;
    confidence: number;
    allPassed: boolean;
  }>('/api/patients/onboarding/validate', {
    method: 'POST',
    body: JSON.stringify({ formData, hasPhotoId, hasInsuranceCard }),
  });
}

export async function fetchAllPatients() {
  return api<any[]>('/api/patients');
}
