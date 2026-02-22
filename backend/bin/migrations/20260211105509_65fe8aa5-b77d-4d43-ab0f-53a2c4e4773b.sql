
-- ============================================================
-- PHASE 1B: RLS policies and trigger using new enum values
-- ============================================================

-- HOSPITALS RLS
CREATE POLICY "Super admins full access hospitals"
  ON public.hospitals FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Users view own hospital"
  ON public.hospitals FOR SELECT
  USING (id IN (
    SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid()
  ));

-- PROFILES: hospital-aware policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Hospital admin view hospital profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'HOSPITAL_ADMIN')
    AND hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- CLAIMS: hospital-isolated
DROP POLICY IF EXISTS "Admins full access claims" ON public.claims;
DROP POLICY IF EXISTS "Billing view claims" ON public.claims;
DROP POLICY IF EXISTS "Insurance manage claims" ON public.claims;
DROP POLICY IF EXISTS "AI Analyst view claims" ON public.claims;
DROP POLICY IF EXISTS "Patients view own claims" ON public.claims;

CREATE POLICY "Super admin full access claims"
  ON public.claims FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Hospital staff view claims"
  ON public.claims FOR SELECT
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND (
      public.has_role(auth.uid(), 'HOSPITAL_ADMIN')
      OR public.has_role(auth.uid(), 'BILLING')
      OR public.has_role(auth.uid(), 'INSURANCE')
      OR public.has_role(auth.uid(), 'AI_ANALYST')
      OR public.has_role(auth.uid(), 'DOCTOR')
    )
  );

CREATE POLICY "Insurance manage hospital claims"
  ON public.claims FOR ALL
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND public.has_role(auth.uid(), 'INSURANCE')
  );

CREATE POLICY "Patients view own claims"
  ON public.claims FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients pt WHERE pt.id = claims.patient_id AND pt.user_id = auth.uid()
  ));

-- APPOINTMENTS: hospital-isolated
DROP POLICY IF EXISTS "Admins full access appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can book appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;

CREATE POLICY "Super admin full access appointments"
  ON public.appointments FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Hospital admin manage appointments"
  ON public.appointments FOR ALL
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND public.has_role(auth.uid(), 'HOSPITAL_ADMIN')
  );

CREATE POLICY "Doctors view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Patients book appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM patients pt WHERE pt.id = appointments.patient_id AND pt.user_id = auth.uid()
  ));

CREATE POLICY "Patients view own appointments"
  ON public.appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients pt WHERE pt.id = appointments.patient_id AND pt.user_id = auth.uid()
  ));

-- AI_LOGS
DROP POLICY IF EXISTS "Admins full access ai_logs" ON public.ai_logs;
DROP POLICY IF EXISTS "AI Analysts view logs" ON public.ai_logs;

CREATE POLICY "Super admin full access ai_logs"
  ON public.ai_logs FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Hospital staff view ai_logs"
  ON public.ai_logs FOR SELECT
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND (public.has_role(auth.uid(), 'HOSPITAL_ADMIN') OR public.has_role(auth.uid(), 'AI_ANALYST'))
  );

-- INVOICES
DROP POLICY IF EXISTS "Admins full access invoices" ON public.invoices;
DROP POLICY IF EXISTS "Billing manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Patients view own invoices" ON public.invoices;

CREATE POLICY "Super admin full access invoices"
  ON public.invoices FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Billing manage hospital invoices"
  ON public.invoices FOR ALL
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND public.has_role(auth.uid(), 'BILLING')
  );

CREATE POLICY "Patients view own invoices"
  ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients pt WHERE pt.id = invoices.patient_id AND pt.user_id = auth.uid()
  ));

-- PAYMENTS
DROP POLICY IF EXISTS "Admins full access payments" ON public.payments;
DROP POLICY IF EXISTS "Billing manage payments" ON public.payments;
DROP POLICY IF EXISTS "Patients can make payments" ON public.payments;
DROP POLICY IF EXISTS "Patients view own payments" ON public.payments;

CREATE POLICY "Super admin full access payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Billing manage hospital payments"
  ON public.payments FOR ALL
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND public.has_role(auth.uid(), 'BILLING')
  );

CREATE POLICY "Patients make payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = paid_by);

CREATE POLICY "Patients view own payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM invoices i JOIN patients pt ON i.patient_id = pt.id
    WHERE i.id = payments.invoice_id AND pt.user_id = auth.uid()
  ));

-- PATIENTS
DROP POLICY IF EXISTS "Admins can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Billing can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Insurance can view all patients" ON public.patients;

CREATE POLICY "Super admin full access patients"
  ON public.patients FOR ALL
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Hospital staff view patients"
  ON public.patients FOR SELECT
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND (
      public.has_role(auth.uid(), 'HOSPITAL_ADMIN')
      OR public.has_role(auth.uid(), 'BILLING')
      OR public.has_role(auth.uid(), 'INSURANCE')
      OR public.has_role(auth.uid(), 'DOCTOR')
    )
  );

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;

CREATE POLICY "Super admin view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

CREATE POLICY "Hospital admin view hospital audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    hospital_id IN (SELECT p.hospital_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND public.has_role(auth.uid(), 'HOSPITAL_ADMIN')
  );

-- ============================================================
-- UPDATE TRIGGER for multi-tenancy
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
  _hospital_id uuid;
  _domain text;
BEGIN
  IF NEW.raw_user_meta_data->>'app_role' IS NOT NULL THEN
    _role := (NEW.raw_user_meta_data->>'app_role')::app_role;
  ELSE
    _role := 'PATIENT';
  END IF;

  IF NEW.raw_user_meta_data->>'hospital_id' IS NOT NULL THEN
    _hospital_id := (NEW.raw_user_meta_data->>'hospital_id')::uuid;
  ELSE
    _domain := split_part(NEW.email, '@', 2);
    IF _domain != 'medibots.com' THEN
      SELECT id INTO _hospital_id FROM public.hospitals WHERE domain = _domain LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, name, email, hospital_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    _hospital_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;
