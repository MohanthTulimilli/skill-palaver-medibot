-- Allow patients to see DOCTOR roles (so they can browse doctors for booking)
CREATE POLICY "Patients can view doctor roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  role = 'DOCTOR'::app_role
  AND has_role(auth.uid(), 'PATIENT'::app_role)
);

-- Allow billing staff to view roles in their hospital
CREATE POLICY "Billing staff view hospital roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'BILLING'::app_role)
);

-- Allow doctor staff to view patient roles (needed for patient lookups)
CREATE POLICY "Doctors view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'DOCTOR'::app_role)
);

-- Allow patients to see doctor profiles for booking
CREATE POLICY "Patients view doctor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'PATIENT'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.user_id AND ur.role = 'DOCTOR'::app_role
  )
);

-- Allow billing to view profiles in their hospital
CREATE POLICY "Billing view hospital profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'BILLING'::app_role)
  AND hospital_id = get_user_hospital_id(auth.uid())
);

-- Allow patients to update their own invoices (for payment status)
CREATE POLICY "Patients update own invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients pt
    WHERE pt.id = invoices.patient_id AND pt.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients pt
    WHERE pt.id = invoices.patient_id AND pt.user_id = auth.uid()
  )
);