
-- Create claim status enum
CREATE TYPE public.claim_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'RESUBMITTED');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('UNPAID', 'PAID', 'PARTIAL');

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  dob DATE,
  gender TEXT,
  insurance_provider TEXT,
  policy_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Claims table
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number TEXT NOT NULL UNIQUE DEFAULT ('CLM-' || substr(gen_random_uuid()::text, 1, 8)),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  insurance_provider TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status claim_status NOT NULL DEFAULT 'PENDING',
  ai_risk_score NUMERIC(5,2),
  ai_explanation TEXT,
  submitted_by UUID NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || substr(gen_random_uuid()::text, 1, 8)),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  payment_status payment_status NOT NULL DEFAULT 'UNPAID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_id TEXT,
  paid_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- AI Logs table
CREATE TABLE public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  prediction_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  flagged BOOLEAN NOT NULL DEFAULT false,
  log_time TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== RLS POLICIES =====

-- PATIENTS: users see own, admins see all
CREATE POLICY "Patients can view own record" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all patients" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Billing can view all patients" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'BILLING'));
CREATE POLICY "Insurance can view all patients" ON public.patients FOR SELECT USING (public.has_role(auth.uid(), 'INSURANCE'));
CREATE POLICY "Users can insert own patient record" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patient record" ON public.patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage patients" ON public.patients FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- CLAIMS: role-based access
CREATE POLICY "Patients view own claims" ON public.claims FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Admins full access claims" ON public.claims FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Billing view claims" ON public.claims FOR SELECT USING (public.has_role(auth.uid(), 'BILLING'));
CREATE POLICY "Insurance manage claims" ON public.claims FOR ALL USING (public.has_role(auth.uid(), 'INSURANCE'));
CREATE POLICY "AI Analyst view claims" ON public.claims FOR SELECT USING (public.has_role(auth.uid(), 'AI_ANALYST'));

-- INVOICES: role-based access
CREATE POLICY "Patients view own invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid())
);
CREATE POLICY "Admins full access invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Billing manage invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'BILLING'));

-- PAYMENTS: role-based access
CREATE POLICY "Patients view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i JOIN public.patients p ON i.patient_id = p.id WHERE i.id = invoice_id AND p.user_id = auth.uid())
);
CREATE POLICY "Patients can make payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = paid_by);
CREATE POLICY "Admins full access payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Billing manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'BILLING'));

-- AI LOGS: analysts and admins only
CREATE POLICY "AI Analysts view logs" ON public.ai_logs FOR SELECT USING (public.has_role(auth.uid(), 'AI_ANALYST'));
CREATE POLICY "Admins full access ai_logs" ON public.ai_logs FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));
