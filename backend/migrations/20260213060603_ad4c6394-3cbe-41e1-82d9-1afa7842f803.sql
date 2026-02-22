
-- Add appointment_id to claims table to link claims to completed appointments
ALTER TABLE public.claims ADD COLUMN appointment_id uuid REFERENCES public.appointments(id);

-- Create index for faster lookups
CREATE INDEX idx_claims_appointment_id ON public.claims(appointment_id);

-- Ensure one claim per appointment
ALTER TABLE public.claims ADD CONSTRAINT unique_claim_per_appointment UNIQUE (appointment_id);
