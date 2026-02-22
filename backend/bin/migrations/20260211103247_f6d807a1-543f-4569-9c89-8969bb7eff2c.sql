
-- 1. Add DOCTOR to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'DOCTOR';

-- 2. Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL, -- references auth.users id
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','COMPLETED')),
  appointment_date timestamp with time zone NOT NULL,
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Doctors can see their own appointments
CREATE POLICY "Doctors view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = doctor_id);

-- Doctors can update their own appointments
CREATE POLICY "Doctors update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

-- Patients can view their own appointments
CREATE POLICY "Patients view own appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = appointments.patient_id AND p.user_id = auth.uid())
  );

-- Patients can insert appointments (book)
CREATE POLICY "Patients can book appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = appointments.patient_id AND p.user_id = auth.uid())
  );

-- Admins full access
CREATE POLICY "Admins full access appointments" ON public.appointments
  FOR ALL USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins view audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Any authenticated user can insert audit logs (system writes)
CREATE POLICY "Authenticated users insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Update handle_new_user trigger to assign DOCTOR role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );

  IF NEW.email = 'admin@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ADMIN');
  ELSIF NEW.email = 'analyst@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'AI_ANALYST');
  ELSIF NEW.email = 'billing@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'BILLING');
  ELSIF NEW.email = 'insurance@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'INSURANCE');
  ELSIF NEW.email = 'doctor@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'DOCTOR');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'PATIENT');
  END IF;

  RETURN NEW;
END;
$$;
