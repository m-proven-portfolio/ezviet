-- Backfill profiles from auth.users
-- Ensures all authenticated users have a profile entry for analytics

-- ============================================
-- BACKFILL EXISTING USERS
-- ============================================
-- Creates profiles for users who signed up before the trigger was working
-- or where the trigger silently failed

INSERT INTO profiles (id, username, display_name, email, avatar_url, onboarding_completed, created_at)
SELECT
  u.id,
  -- Generate unique username from name or email
  COALESCE(
    public.name_to_username(
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      )
    ),
    'user'
  ) || CASE
    WHEN ROW_NUMBER() OVER (
      PARTITION BY public.name_to_username(
        COALESCE(
          u.raw_user_meta_data->>'full_name',
          u.raw_user_meta_data->>'name',
          split_part(u.email, '@', 1)
        )
      )
      ORDER BY u.created_at
    ) > 1
    THEN ROW_NUMBER() OVER (
      PARTITION BY public.name_to_username(
        COALESCE(
          u.raw_user_meta_data->>'full_name',
          u.raw_user_meta_data->>'name',
          split_part(u.email, '@', 1)
        )
      )
      ORDER BY u.created_at
    )::text
    ELSE ''
  END,
  -- Display name from metadata
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  u.email,
  u.raw_user_meta_data->>'avatar_url',
  -- Mark as onboarded if they've been around (they clearly got past signup)
  true,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- ============================================
-- IMPROVE TRIGGER ROBUSTNESS
-- ============================================
-- Update the trigger function to be more robust and log better

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

  -- Generate base username
  base_username := public.name_to_username(user_display_name);

  -- Ensure we have a valid base
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Ensure uniqueness by appending number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
    -- Safety limit to prevent infinite loop
    IF counter > 10000 THEN
      final_username := base_username || extract(epoch from now())::bigint::text;
      EXIT;
    END IF;
  END LOOP;

  -- Create profile
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url, created_at)
  VALUES (
    NEW.id,
    final_username,
    user_display_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition - try with timestamp suffix
    INSERT INTO public.profiles (id, username, display_name, email, avatar_url, created_at)
    VALUES (
      NEW.id,
      base_username || extract(epoch from now())::bigint::text,
      user_display_name,
      NEW.email,
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.created_at
    );
    RETURN NEW;
  WHEN others THEN
    -- Log the error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user % (email: %): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
