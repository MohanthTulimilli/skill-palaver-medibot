
-- Update handle_new_user to support admin-specified roles via user_metadata.app_role
-- If app_role is set in metadata (admin-created users), use that role
-- Otherwise fall back to email-pattern matching for demo accounts, default PATIENT

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );

  -- Check if role was explicitly set (admin-created user)
  IF NEW.raw_user_meta_data->>'app_role' IS NOT NULL THEN
    _role := (NEW.raw_user_meta_data->>'app_role')::app_role;
  -- Demo account email patterns
  ELSIF NEW.email = 'admin@medibots.com' THEN
    _role := 'ADMIN';
  ELSIF NEW.email = 'analyst@medibots.com' THEN
    _role := 'AI_ANALYST';
  ELSIF NEW.email = 'billing@medibots.com' THEN
    _role := 'BILLING';
  ELSIF NEW.email = 'insurance@medibots.com' THEN
    _role := 'INSURANCE';
  ELSIF NEW.email = 'doctor@medibots.com' THEN
    _role := 'DOCTOR';
  ELSE
    _role := 'PATIENT';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;
