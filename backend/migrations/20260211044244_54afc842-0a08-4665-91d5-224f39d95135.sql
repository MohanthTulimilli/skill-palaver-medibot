
-- Create a trigger function to auto-assign ADMIN role for admin@medibots.com
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
  
  -- Assign role based on email
  IF NEW.email = 'admin@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ADMIN');
  ELSIF NEW.email = 'analyst@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'AI_ANALYST');
  ELSIF NEW.email = 'billing@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'BILLING');
  ELSIF NEW.email = 'insurance@medibots.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'INSURANCE');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'PATIENT');
  END IF;
  
  RETURN NEW;
END;
$$;
