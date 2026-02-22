CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _hospital_id uuid;
  _domain text;
  _specialization text;
BEGIN
  IF NEW.raw_user_meta_data->>'app_role' IS NOT NULL THEN
    _role := (NEW.raw_user_meta_data->>'app_role')::app_role;
  ELSE
    _domain := split_part(NEW.email, '@', 2);
    IF _domain = 'medibots.com' THEN _role := 'SUPER_ADMIN';
    ELSIF _domain = 'admin.medibots.com' THEN _role := 'HOSPITAL_ADMIN';
    ELSIF _domain = 'doctor.medibots.com' THEN _role := 'DOCTOR';
    ELSIF _domain = 'billingcare.medibots.com' THEN _role := 'BILLING';
    ELSIF _domain = 'insurance.medibots.com' THEN _role := 'INSURANCE';
    ELSIF _domain = 'analyst.medibots.com' THEN _role := 'AI_ANALYST';
    ELSE _role := 'PATIENT';
    END IF;
  END IF;

  IF NEW.raw_user_meta_data->>'hospital_id' IS NOT NULL THEN
    _hospital_id := (NEW.raw_user_meta_data->>'hospital_id')::uuid;
  END IF;

  _specialization := NEW.raw_user_meta_data->>'specialization';

  INSERT INTO public.profiles (user_id, name, email, hospital_id, specialization)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    _hospital_id,
    _specialization
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;