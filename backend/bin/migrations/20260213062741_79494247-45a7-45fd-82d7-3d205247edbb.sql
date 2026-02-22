
-- Fix: Patients should only see doctors from their own hospital
DROP POLICY IF EXISTS "Patients view doctor profiles" ON public.profiles;
CREATE POLICY "Patients view doctor profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'PATIENT'::app_role)
  AND hospital_id = get_user_hospital_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = profiles.user_id AND ur.role = 'DOCTOR'::app_role
  )
);

-- Also let patients see ALL doctor roles (not just from their hospital) so the join works
DROP POLICY IF EXISTS "Patients can view doctor roles" ON public.user_roles;
CREATE POLICY "Patients can view doctor roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  role = 'DOCTOR'::app_role
  AND has_role(auth.uid(), 'PATIENT'::app_role)
);

-- Add consultation_fee column to appointments for pre-appointment payment
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consultation_fee numeric DEFAULT 0;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS fee_paid boolean DEFAULT false;

-- Allow patients to view invoices linked to their appointments (for fee payment)
-- Already covered by existing "Patients view own invoices" policy

-- Add hospital_id auto-population for payments via trigger
CREATE OR REPLACE FUNCTION public.set_payment_hospital_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hospital_id IS NULL THEN
    SELECT i.hospital_id INTO NEW.hospital_id
    FROM invoices i WHERE i.id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_payment_hospital_id ON public.payments;
CREATE TRIGGER trg_set_payment_hospital_id
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_payment_hospital_id();
