
-- Keep admin@medibots.com as SUPER_ADMIN bootstrap
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
  -- Check explicit role from admin creation
  IF NEW.raw_user_meta_data->>'app_role' IS NOT NULL THEN
    _role := (NEW.raw_user_meta_data->>'app_role')::app_role;
  -- Bootstrap: admin@medibots.com is always SUPER_ADMIN
  ELSIF NEW.email = 'admin@medibots.com' THEN
    _role := 'SUPER_ADMIN';
  ELSE
    _role := 'PATIENT';
  END IF;

  -- Get hospital_id from metadata or resolve from domain
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
