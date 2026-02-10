-- Enhanced Stats System
-- Adds proper streak calculation and mastery tracking
-- Single source of truth: learning_history -> profiles aggregates

-- ============================================
-- ENHANCED record_card_view FUNCTION
-- ============================================
-- Now calculates streaks and mastery, not just view count

-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS record_card_view(uuid, uuid);

CREATE OR REPLACE FUNCTION record_card_view(p_user_id uuid, p_card_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_times_viewed integer;
  v_mastery_level integer;
  v_cards_viewed integer;
  v_cards_mastered integer;
  v_current_streak integer;
  v_longest_streak integer;
  v_activity_dates date[];
  v_date date;
  v_prev_date date;
  v_streak integer;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
BEGIN
  -- Insert or update learning history
  INSERT INTO learning_history (user_id, card_id, times_viewed, last_viewed_at)
  VALUES (p_user_id, p_card_id, 1, now())
  ON CONFLICT (user_id, card_id)
  DO UPDATE SET
    times_viewed = learning_history.times_viewed + 1,
    last_viewed_at = now()
  RETURNING times_viewed INTO v_times_viewed;

  -- Calculate mastery level (0-5, capped at 5)
  v_mastery_level := LEAST(v_times_viewed, 5);

  -- Update mastery_level in learning_history
  UPDATE learning_history
  SET mastery_level = v_mastery_level
  WHERE user_id = p_user_id AND card_id = p_card_id;

  -- Calculate cards_viewed (unique cards)
  SELECT COUNT(DISTINCT card_id) INTO v_cards_viewed
  FROM learning_history
  WHERE user_id = p_user_id;

  -- Calculate cards_mastered (cards with mastery_level >= 5)
  SELECT COUNT(*) INTO v_cards_mastered
  FROM learning_history
  WHERE user_id = p_user_id AND mastery_level >= 5;

  -- Get activity dates for streak calculation
  -- We use last_viewed_at dates, grouped by day
  SELECT ARRAY_AGG(DISTINCT last_viewed_at::date ORDER BY last_viewed_at::date DESC)
  INTO v_activity_dates
  FROM learning_history
  WHERE user_id = p_user_id;

  -- Calculate current streak
  v_current_streak := 0;
  IF v_activity_dates IS NOT NULL AND array_length(v_activity_dates, 1) > 0 THEN
    -- Check if most recent activity is today or yesterday
    IF v_activity_dates[1] = v_today OR v_activity_dates[1] = v_yesterday THEN
      v_prev_date := v_activity_dates[1];
      FOREACH v_date IN ARRAY v_activity_dates LOOP
        IF v_date = v_prev_date THEN
          v_current_streak := v_current_streak + 1;
          v_prev_date := v_prev_date - 1;
        ELSE
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- Calculate longest streak
  v_longest_streak := 0;
  v_streak := 0;
  v_prev_date := NULL;

  IF v_activity_dates IS NOT NULL THEN
    FOREACH v_date IN ARRAY v_activity_dates LOOP
      IF v_prev_date IS NULL OR v_date = v_prev_date - 1 THEN
        v_streak := v_streak + 1;
      ELSE
        v_longest_streak := GREATEST(v_longest_streak, v_streak);
        v_streak := 1;
      END IF;
      v_prev_date := v_date;
    END LOOP;
    v_longest_streak := GREATEST(v_longest_streak, v_streak);
  END IF;

  -- Update profile with all calculated stats
  UPDATE profiles
  SET
    cards_viewed = v_cards_viewed,
    cards_mastered = v_cards_mastered,
    current_streak = v_current_streak,
    longest_streak = GREATEST(longest_streak, v_longest_streak),
    last_active_at = now()
  WHERE id = p_user_id;

  -- Return the updated stats for optimistic UI
  RETURN jsonb_build_object(
    'cards_viewed', v_cards_viewed,
    'cards_mastered', v_cards_mastered,
    'current_streak', v_current_streak,
    'longest_streak', GREATEST(
      (SELECT longest_streak FROM profiles WHERE id = p_user_id),
      v_longest_streak
    ),
    'times_viewed', v_times_viewed,
    'mastery_level', v_mastery_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET ADMIN STATS FUNCTION
-- ============================================
-- Single query for all admin dashboard stats

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb AS $$
DECLARE
  v_total_cards integer;
  v_total_categories integer;
  v_total_views bigint;
  v_total_users integer;
BEGIN
  SELECT COUNT(*) INTO v_total_cards FROM cards;
  SELECT COUNT(DISTINCT category_id) INTO v_total_categories FROM cards WHERE category_id IS NOT NULL;
  SELECT COALESCE(SUM(view_count), 0) INTO v_total_views FROM cards;
  SELECT COUNT(*) INTO v_total_users FROM profiles;

  RETURN jsonb_build_object(
    'total_cards', v_total_cards,
    'total_categories', v_total_categories,
    'total_views', v_total_views,
    'total_users', v_total_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET USER STATS FUNCTION
-- ============================================
-- Get complete stats for a user by ID or username

CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid DEFAULT NULL, p_username text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_stats jsonb;
BEGIN
  -- Resolve user_id from username if needed
  IF p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSIF p_username IS NOT NULL THEN
    SELECT id INTO v_user_id FROM profiles WHERE username = p_username;
    IF v_user_id IS NULL THEN
      RETURN NULL;
    END IF;
  ELSE
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'cards_viewed', cards_viewed,
    'cards_mastered', cards_mastered,
    'current_streak', current_streak,
    'longest_streak', longest_streak,
    'last_active_at', last_active_at
  )
  INTO v_stats
  FROM profiles
  WHERE id = v_user_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RECALCULATE ALL USER STATS
-- ============================================
-- One-time function to fix existing data

CREATE OR REPLACE FUNCTION recalculate_all_user_stats()
RETURNS void AS $$
DECLARE
  v_profile RECORD;
  v_cards_viewed integer;
  v_cards_mastered integer;
  v_current_streak integer;
  v_longest_streak integer;
  v_activity_dates date[];
  v_date date;
  v_prev_date date;
  v_streak integer;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
BEGIN
  FOR v_profile IN SELECT id FROM profiles LOOP
    -- Calculate cards_viewed
    SELECT COUNT(DISTINCT card_id) INTO v_cards_viewed
    FROM learning_history
    WHERE user_id = v_profile.id;

    -- Update mastery levels first
    UPDATE learning_history
    SET mastery_level = LEAST(times_viewed, 5)
    WHERE user_id = v_profile.id;

    -- Calculate cards_mastered
    SELECT COUNT(*) INTO v_cards_mastered
    FROM learning_history
    WHERE user_id = v_profile.id AND mastery_level >= 5;

    -- Get activity dates
    SELECT ARRAY_AGG(DISTINCT last_viewed_at::date ORDER BY last_viewed_at::date DESC)
    INTO v_activity_dates
    FROM learning_history
    WHERE user_id = v_profile.id;

    -- Calculate current streak
    v_current_streak := 0;
    IF v_activity_dates IS NOT NULL AND array_length(v_activity_dates, 1) > 0 THEN
      IF v_activity_dates[1] = v_today OR v_activity_dates[1] = v_yesterday THEN
        v_prev_date := v_activity_dates[1];
        FOREACH v_date IN ARRAY v_activity_dates LOOP
          IF v_date = v_prev_date THEN
            v_current_streak := v_current_streak + 1;
            v_prev_date := v_prev_date - 1;
          ELSE
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;

    -- Calculate longest streak
    v_longest_streak := 0;
    v_streak := 0;
    v_prev_date := NULL;

    IF v_activity_dates IS NOT NULL THEN
      FOREACH v_date IN ARRAY v_activity_dates LOOP
        IF v_prev_date IS NULL OR v_date = v_prev_date - 1 THEN
          v_streak := v_streak + 1;
        ELSE
          v_longest_streak := GREATEST(v_longest_streak, v_streak);
          v_streak := 1;
        END IF;
        v_prev_date := v_date;
      END LOOP;
      v_longest_streak := GREATEST(v_longest_streak, v_streak);
    END IF;

    -- Update profile
    UPDATE profiles
    SET
      cards_viewed = COALESCE(v_cards_viewed, 0),
      cards_mastered = COALESCE(v_cards_mastered, 0),
      current_streak = COALESCE(v_current_streak, 0),
      longest_streak = GREATEST(longest_streak, COALESCE(v_longest_streak, 0))
    WHERE id = v_profile.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the recalculation immediately
SELECT recalculate_all_user_stats();
