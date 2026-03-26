-- Fix: handle_new_user trigger omitía el campo email (NOT NULL en profiles)
-- Causa: migración 20260326_avatar_url_handle_new_user.sql introdujo avatar_url
-- pero no incluyó email en el INSERT, rompiendo el signup OAuth para nuevos usuarios.
-- Síntoma: "database error saving new user" al completar el flujo OAuth de join.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
