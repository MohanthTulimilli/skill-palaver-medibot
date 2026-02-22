
-- Create security definer function to get user's hospital_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_hospital_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hospital_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Fix the self-referencing policy on profiles
DROP POLICY IF EXISTS "Hospital admin view hospital profiles" ON public.profiles;
CREATE POLICY "Hospital admin view hospital profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
  AND hospital_id = get_user_hospital_id(auth.uid())
);

-- Also fix other policies that subquery profiles to avoid similar issues
DROP POLICY IF EXISTS "Hospital staff view claims" ON public.claims;
CREATE POLICY "Hospital staff view claims"
ON public.claims
FOR SELECT
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND (
    has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
    OR has_role(auth.uid(), 'BILLING'::app_role)
    OR has_role(auth.uid(), 'INSURANCE'::app_role)
    OR has_role(auth.uid(), 'AI_ANALYST'::app_role)
    OR has_role(auth.uid(), 'DOCTOR'::app_role)
  )
);

DROP POLICY IF EXISTS "Insurance manage hospital claims" ON public.claims;
CREATE POLICY "Insurance manage hospital claims"
ON public.claims
FOR ALL
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND has_role(auth.uid(), 'INSURANCE'::app_role)
);

DROP POLICY IF EXISTS "Billing manage hospital invoices" ON public.invoices;
CREATE POLICY "Billing manage hospital invoices"
ON public.invoices
FOR ALL
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND has_role(auth.uid(), 'BILLING'::app_role)
);

DROP POLICY IF EXISTS "Hospital staff view ai_logs" ON public.ai_logs;
CREATE POLICY "Hospital staff view ai_logs"
ON public.ai_logs
FOR SELECT
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND (
    has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
    OR has_role(auth.uid(), 'AI_ANALYST'::app_role)
  )
);

DROP POLICY IF EXISTS "Hospital admin manage appointments" ON public.appointments;
CREATE POLICY "Hospital admin manage appointments"
ON public.appointments
FOR ALL
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
);

DROP POLICY IF EXISTS "Hospital admin view hospital audit logs" ON public.audit_logs;
CREATE POLICY "Hospital admin view hospital audit logs"
ON public.audit_logs
FOR SELECT
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
);

DROP POLICY IF EXISTS "Hospital staff view patients" ON public.patients;
CREATE POLICY "Hospital staff view patients"
ON public.patients
FOR SELECT
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND (
    has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role)
    OR has_role(auth.uid(), 'BILLING'::app_role)
    OR has_role(auth.uid(), 'INSURANCE'::app_role)
    OR has_role(auth.uid(), 'DOCTOR'::app_role)
  )
);

DROP POLICY IF EXISTS "Billing manage hospital payments" ON public.payments;
CREATE POLICY "Billing manage hospital payments"
ON public.payments
FOR ALL
USING (
  hospital_id = get_user_hospital_id(auth.uid())
  AND has_role(auth.uid(), 'BILLING'::app_role)
);

DROP POLICY IF EXISTS "Users view own hospital" ON public.hospitals;
CREATE POLICY "Users view own hospital"
ON public.hospitals
FOR SELECT
USING (id = get_user_hospital_id(auth.uid()));
