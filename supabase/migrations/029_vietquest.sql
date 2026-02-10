-- VietQuest: Embodied Language Learning Game
-- A narrative travel RPG where Vietnamese is the control system

-- ============================================
-- WORLDS TABLE (Cities)
-- ============================================
CREATE TABLE vq_worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(50) UNIQUE NOT NULL,
  name_vi varchar(100) NOT NULL,
  name_en varchar(100) NOT NULL,
  description text,
  difficulty integer DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  unlock_requirements jsonb,
  cover_image_path text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vq_worlds_slug ON vq_worlds(slug);
CREATE INDEX idx_vq_worlds_active ON vq_worlds(is_active, sort_order);

-- ============================================
-- LEVELS TABLE
-- ============================================
CREATE TABLE vq_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid NOT NULL REFERENCES vq_worlds(id) ON DELETE CASCADE,
  level_number integer NOT NULL,
  slug varchar(100) NOT NULL,
  title_vi varchar(255) NOT NULL,
  title_en varchar(255) NOT NULL,
  description text,

  -- Content stored as JSONB (scenes, dialogues, challenges)
  level_data jsonb NOT NULL,

  -- Rewards and costs
  base_dong_reward integer DEFAULT 50000,
  energy_cost integer DEFAULT 10,

  -- Version control
  version integer DEFAULT 1,
  status varchar(20) DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'archived')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(world_id, level_number),
  UNIQUE(world_id, slug)
);

-- Indexes
CREATE INDEX idx_vq_levels_world ON vq_levels(world_id);
CREATE INDEX idx_vq_levels_status ON vq_levels(status) WHERE status = 'live';
CREATE INDEX idx_vq_levels_slug ON vq_levels(slug);

-- ============================================
-- PLAYER STATS TABLE (Wallet + Global Stats)
-- ============================================
CREATE TABLE vq_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Currencies
  total_dong bigint DEFAULT 500000,
  current_energy integer DEFAULT 100,
  max_energy integer DEFAULT 100,

  -- Global stats
  levels_completed integer DEFAULT 0,
  total_conversations integer DEFAULT 0,
  translator_uses_total integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,

  -- Current world (for hub display)
  current_world_id uuid REFERENCES vq_worlds(id),

  -- Energy regeneration (ties into 6-hour cycles)
  energy_last_regen timestamptz DEFAULT now(),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vq_player_stats_user ON vq_player_stats(user_id);

-- ============================================
-- PROGRESS TABLE (Per-Level Progress)
-- ============================================
CREATE TABLE vq_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES vq_levels(id) ON DELETE CASCADE,

  -- Completion state
  status varchar(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  checkpoint_data jsonb,

  -- Scores
  best_score integer DEFAULT 0,
  dong_earned integer DEFAULT 0,
  translator_uses integer DEFAULT 0,
  choices_made jsonb DEFAULT '[]'::jsonb,

  -- Timestamps
  started_at timestamptz,
  completed_at timestamptz,
  last_played_at timestamptz,

  UNIQUE(user_id, level_id)
);

-- Indexes
CREATE INDEX idx_vq_progress_user ON vq_progress(user_id);
CREATE INDEX idx_vq_progress_level ON vq_progress(level_id);
CREATE INDEX idx_vq_progress_status ON vq_progress(status) WHERE status = 'completed';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE vq_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vq_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vq_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE vq_progress ENABLE ROW LEVEL SECURITY;

-- WORLDS POLICIES (publicly readable)
CREATE POLICY "Anyone can view active worlds"
  ON vq_worlds
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage worlds"
  ON vq_worlds
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- LEVELS POLICIES
CREATE POLICY "Anyone can view live levels"
  ON vq_levels
  FOR SELECT
  USING (status = 'live');

CREATE POLICY "Admins can view all levels"
  ON vq_levels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage levels"
  ON vq_levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- PLAYER STATS POLICIES
CREATE POLICY "Users can view own stats"
  ON vq_player_stats
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own stats"
  ON vq_player_stats
  FOR ALL
  USING (user_id = auth.uid());

-- PROGRESS POLICIES
CREATE POLICY "Users can view own progress"
  ON vq_progress
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own progress"
  ON vq_progress
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_vq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vq_worlds_updated_at
  BEFORE UPDATE ON vq_worlds
  FOR EACH ROW
  EXECUTE FUNCTION update_vq_updated_at();

CREATE TRIGGER vq_levels_updated_at
  BEFORE UPDATE ON vq_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_vq_updated_at();

CREATE TRIGGER vq_player_stats_updated_at
  BEFORE UPDATE ON vq_player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_vq_updated_at();

-- ============================================
-- HELPER: INITIALIZE PLAYER STATS
-- ============================================
CREATE OR REPLACE FUNCTION init_vq_player_stats(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  stats_id uuid;
  dalat_world_id uuid;
BEGIN
  -- Get Đà Lạt world ID (starter world)
  SELECT id INTO dalat_world_id FROM vq_worlds WHERE slug = 'dalat' LIMIT 1;

  INSERT INTO vq_player_stats (user_id, current_world_id)
  VALUES (p_user_id, dalat_world_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO stats_id;

  RETURN stats_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER: CALCULATE ENERGY REGEN
-- ============================================
-- Energy regenerates based on 6-hour cycles (matching EZViet's progression system)
CREATE OR REPLACE FUNCTION calculate_energy_regen(
  p_current_energy integer,
  p_max_energy integer,
  p_last_regen timestamptz
)
RETURNS integer AS $$
DECLARE
  hours_passed numeric;
  energy_to_add integer;
  regen_rate integer := 25; -- Energy per 6-hour cycle
BEGIN
  hours_passed := EXTRACT(EPOCH FROM (now() - p_last_regen)) / 3600;
  energy_to_add := floor(hours_passed / 6) * regen_rate;

  RETURN LEAST(p_current_energy + energy_to_add, p_max_energy);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- SEED DATA: Đà Lạt World + Level 1
-- ============================================
INSERT INTO vq_worlds (slug, name_vi, name_en, description, difficulty, sort_order)
VALUES (
  'dalat',
  'Đà Lạt',
  'Da Lat',
  'The city of eternal spring. A calm, beginner-friendly introduction to Vietnamese.',
  1,
  1
);

-- Insert Level 1: Airport Taxi
INSERT INTO vq_levels (
  world_id,
  level_number,
  slug,
  title_vi,
  title_en,
  description,
  status,
  base_dong_reward,
  energy_cost,
  level_data
)
SELECT
  id,
  1,
  'airport-taxi',
  'Từ sân bay đến khách sạn',
  'Airport to Hotel',
  'Your first challenge: navigate from Lien Khuong Airport to your hotel in the city center.',
  'live',
  80000,
  10,
  '{
    "startScene": "airport_exit",
    "scenes": [
      {
        "id": "airport_exit",
        "type": "dialogue",
        "background": "dalat_airport_premium.png",
        "nodes": [
          {
            "id": "narration_1",
            "type": "narration",
            "text_vi": "Bạn vừa đến sân bay Liên Khương. Thành phố Đà Lạt cách đây 30km.",
            "text_en": "You have just arrived at Lien Khuong Airport. Da Lat city is 30km away.",
            "next": "choice_transport"
          },
          {
            "id": "choice_transport",
            "type": "player_choice",
            "prompt": "How will you get to your hotel?",
            "choices": [
              {
                "id": "taxi",
                "text_vi": "Đi taxi",
                "text_en": "Take a taxi",
                "consequence": "neutral",
                "result": "taxi_counter"
              },
              {
                "id": "grab",
                "text_vi": "Đặt Grab",
                "text_en": "Book a Grab",
                "dong_cost": 0,
                "consequence": "positive",
                "result": "grab_scene"
              }
            ]
          }
        ]
      },
      {
        "id": "taxi_counter",
        "type": "dialogue",
        "background": "taxi_counter_premium.png",
        "nodes": [
          {
            "id": "driver_greeting",
            "type": "npc_says",
            "npc": "taxi_driver",
            "text_vi": "Chào anh! Đi đâu?",
            "text_en": "Hello sir! Where to?",
            "speed": "normal",
            "emotion": "friendly",
            "next": "respond_destination"
          },
          {
            "id": "respond_destination",
            "type": "response_picker",
            "context_en": "The driver asks where you are going. How do you respond?",
            "options": [
              {
                "id": "perfect",
                "text_vi": "Cho tôi đến khách sạn Đà Lạt Palace",
                "text_en": "Take me to Dalat Palace Hotel",
                "quality": "perfect",
                "result": "driver_impressed"
              },
              {
                "id": "good",
                "text_vi": "Đi khách sạn... Đà Lạt Palace",
                "text_en": "Go to hotel... Dalat Palace",
                "quality": "good",
                "result": "driver_confirms"
              },
              {
                "id": "awkward",
                "text_vi": "Hotel... uh... Đà Lạt?",
                "text_en": "(Mixed English/Vietnamese)",
                "quality": "awkward",
                "result": "driver_confused"
              }
            ],
            "perfect_bonus_dong": 10000,
            "show_translation": true
          },
          {
            "id": "driver_impressed",
            "type": "npc_says",
            "npc": "taxi_driver",
            "text_vi": "Ồ, anh nói tiếng Việt giỏi quá! Tám mươi nghìn thôi nhé.",
            "text_en": "Oh, you speak Vietnamese very well! Only 80,000 dong.",
            "emotion": "friendly",
            "next": "price_choice_local"
          },
          {
            "id": "driver_confirms",
            "type": "npc_says",
            "npc": "taxi_driver",
            "text_vi": "À, Đà Lạt Palace. Được rồi. Một trăm nghìn.",
            "text_en": "Ah, Dalat Palace. OK. 100,000 dong.",
            "emotion": "neutral",
            "next": "price_choice_normal"
          },
          {
            "id": "driver_confused",
            "type": "npc_says",
            "npc": "taxi_driver",
            "text_vi": "Hotel? Khách sạn nào? ... À, Đà Lạt Palace à? Một trăm hai mươi nghìn.",
            "text_en": "Hotel? Which hotel? ... Ah, Dalat Palace? 120,000 dong.",
            "emotion": "confused",
            "next": "price_choice_tourist"
          },
          {
            "id": "price_choice_local",
            "type": "player_choice",
            "prompt": "The driver offers the local price of 80,000 đồng",
            "choices": [
              {
                "id": "accept",
                "text_vi": "Được. Cảm ơn anh!",
                "text_en": "OK. Thank you!",
                "dong_cost": 80000,
                "consequence": "positive",
                "result": "ride_start"
              }
            ]
          },
          {
            "id": "price_choice_normal",
            "type": "player_choice",
            "prompt": "The driver quotes 100,000 đồng. What do you do?",
            "choices": [
              {
                "id": "accept",
                "text_vi": "Được rồi",
                "text_en": "OK",
                "dong_cost": 100000,
                "consequence": "neutral",
                "result": "ride_start"
              },
              {
                "id": "negotiate",
                "text_vi": "Đắt quá! Tám mươi nghìn được không?",
                "text_en": "Too expensive! How about 80,000?",
                "consequence": "positive",
                "result": "negotiate_success"
              }
            ]
          },
          {
            "id": "price_choice_tourist",
            "type": "player_choice",
            "prompt": "The tourist price is 120,000 đồng. What do you do?",
            "choices": [
              {
                "id": "accept",
                "text_vi": "OK...",
                "text_en": "OK...",
                "dong_cost": 120000,
                "consequence": "negative",
                "result": "ride_start"
              },
              {
                "id": "negotiate",
                "text_vi": "Đắt quá! Một trăm nghìn thôi.",
                "text_en": "Too expensive! Just 100,000.",
                "consequence": "neutral",
                "result": "negotiate_partial"
              }
            ]
          },
          {
            "id": "negotiate_success",
            "type": "npc_says",
            "npc": "taxi_driver",
            "text_vi": "Haha, được rồi. Tám mươi nghìn.",
            "text_en": "Haha, OK. 80,000.",
            "emotion": "friendly",
            "next": "negotiate_accept"
          },
          {
            "id": "negotiate_accept",
            "type": "player_choice",
            "prompt": "The driver agrees to 80,000 đồng!",
            "choices": [
              {
                "id": "accept",
                "text_vi": "Cảm ơn anh!",
                "text_en": "Thank you!",
                "dong_cost": 80000,
                "consequence": "positive",
                "result": "ride_start"
              }
            ]
          },
          {
            "id": "negotiate_partial",
            "type": "npc_says",
            "npc": "taxi_driver",
            "text_vi": "Một trăm nghìn, OK.",
            "text_en": "100,000, OK.",
            "emotion": "neutral",
            "next": "negotiate_partial_accept"
          },
          {
            "id": "negotiate_partial_accept",
            "type": "player_choice",
            "prompt": "The driver agrees to 100,000 đồng",
            "choices": [
              {
                "id": "accept",
                "text_vi": "Được",
                "text_en": "OK",
                "dong_cost": 100000,
                "consequence": "neutral",
                "result": "ride_start"
              }
            ]
          }
        ]
      },
      {
        "id": "grab_scene",
        "type": "dialogue",
        "background": "phone_screen_premium.png",
        "nodes": [
          {
            "id": "grab_narration",
            "type": "narration",
            "text_vi": "Bạn mở ứng dụng Grab trên điện thoại...",
            "text_en": "You open the Grab app on your phone...",
            "next": "grab_price"
          },
          {
            "id": "grab_price",
            "type": "narration",
            "text_vi": "Giá Grab: 75,000 đồng. Rẻ hơn taxi!",
            "text_en": "Grab price: 75,000 dong. Cheaper than taxi!",
            "next": "grab_choice"
          },
          {
            "id": "grab_choice",
            "type": "player_choice",
            "prompt": "Book the Grab for 75,000 đồng?",
            "choices": [
              {
                "id": "book",
                "text_vi": "Đặt xe",
                "text_en": "Book ride",
                "dong_cost": 75000,
                "consequence": "positive",
                "result": "grab_booked"
              }
            ]
          },
          {
            "id": "grab_booked",
            "type": "narration",
            "text_vi": "Tài xế sẽ đến trong 5 phút...",
            "text_en": "Driver will arrive in 5 minutes...",
            "next": "ride_start"
          }
        ]
      },
      {
        "id": "ride_start",
        "type": "dialogue",
        "background": "dalat_road_premium.png",
        "nodes": [
          {
            "id": "ride_narration",
            "type": "narration",
            "text_vi": "Xe chạy qua những con đường đẹp của Đà Lạt. Thông xanh, không khí mát lạnh...",
            "text_en": "The car drives through the beautiful roads of Da Lat. Pine trees, cool fresh air...",
            "next": "arrival"
          },
          {
            "id": "arrival",
            "type": "narration",
            "text_vi": "Bạn đã đến khách sạn Đà Lạt Palace!",
            "text_en": "You have arrived at Dalat Palace Hotel!",
            "next": "level_complete"
          },
          {
            "id": "level_complete",
            "type": "reward",
            "dong": 80000,
            "message_vi": "Chúc mừng! Bạn đã hoàn thành level đầu tiên!",
            "message_en": "Congratulations! You have completed your first level!",
            "next": "end_level"
          },
          {
            "id": "end_level",
            "type": "narration",
            "text_vi": "Tiếp tục hành trình của bạn ở Đà Lạt...",
            "text_en": "Continue your journey in Da Lat...",
            "next": null
          }
        ]
      }
    ],
    "endCondition": {
      "type": "reach_node",
      "nodeId": "end_level"
    }
  }'::jsonb
FROM vq_worlds
WHERE slug = 'dalat';
