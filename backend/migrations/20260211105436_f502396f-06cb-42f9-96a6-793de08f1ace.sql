
-- Step 1: Add new enum values and create hospitals table
-- Clear existing data first
DELETE FROM public.ai_logs;
DELETE FROM public.payments;
DELETE FROM public.invoices;
DELETE FROM public.claims;
DELETE FROM public.appointments;
DELETE FROM public.patients;
DELETE FROM public.audit_logs;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- Add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'HOSPITAL_ADMIN';

-- Create hospitals table
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Add hospital_id columns to all tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.ai_logs ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id);

-- Updated_at trigger for hospitals
CREATE TRIGGER update_hospitals_updated_at
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
