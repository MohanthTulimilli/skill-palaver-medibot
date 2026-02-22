
-- Fix user_roles RLS: replace stale ADMIN reference with SUPER_ADMIN + HOSPITAL_ADMIN
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Super admin manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

CREATE POLICY "Hospital admin manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'HOSPITAL_ADMIN'::app_role));
