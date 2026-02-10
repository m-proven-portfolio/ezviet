-- Fix profile creation trigger - ensures name_to_username function exists
-- Run this in Supabase SQL Editor if you're getting "Database error saving new user"

-- First, create the name_to_username helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.name_to_username(input_name text)
RETURNS text AS $$
BEGIN
  -- Convert name to URL-friendly username
  RETURN lower(regexp_replace(input_name, '[^a-zA-Z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.name_to_username(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.name_to_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.name_to_username(text) TO anon;

-- Fix the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
  user_display_name text;
BEGIN
  -- Get display name from user metadata (Google provides this)
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'user'
  );

  -- Generate base username using the helper function
  base_username := public.name_to_username(user_display_name);
  
  -- Ensure we have a valid username
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;

  -- Ensure uniqueness by appending number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
    -- Safety limit
    IF counter > 10000 THEN
      final_username := base_username || extract(epoch from now())::bigint::text;
      EXIT;
    END IF;
  END LOOP;

  -- Create profile
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    user_display_name,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition - try with timestamp suffix
    INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
    VALUES (
      NEW.id,
      base_username || extract(epoch from now())::bigint::text,
      user_display_name,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      )
    );
    RETURN NEW;
  WHEN others THEN
    -- Log the error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user % (email: %): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
