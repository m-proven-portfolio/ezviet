-- Add intro scenes to VietQuest levels
-- These tutorial scenes introduce game mechanics before the main content

-- Update airport-taxi level to start with intro
UPDATE vq_levels
SET level_data = jsonb_set(
  level_data,
  '{startScene}',
  '"intro_welcome"'
)
WHERE slug = 'airport-taxi';

-- Add intro scenes to the scenes array
UPDATE vq_levels
SET level_data = jsonb_set(
  level_data,
  '{scenes}',
  (
    -- Prepend intro scenes to existing scenes
    '[
      {
        "id": "intro_welcome",
        "type": "cutscene",
        "nodes": [
          {
            "id": "intro_1",
            "type": "narration",
            "text_vi": "Chào mừng đến Việt Nam!",
            "text_en": "Welcome to Vietnam!",
            "next": "intro_2"
          },
          {
            "id": "intro_2",
            "type": "narration",
            "text_vi": "Bạn vừa hạ cánh tại sân bay Liên Khương, Đà Lạt.",
            "text_en": "You just landed at Lien Khuong Airport, Da Lat.",
            "next": "intro_3"
          },
          {
            "id": "intro_3",
            "type": "narration",
            "text_vi": "Nhiệm vụ của bạn: Sử dụng tiếng Việt để di chuyển và giao tiếp.",
            "text_en": "Your mission: Use Vietnamese to navigate and communicate.",
            "next": "intro_wallet"
          }
        ]
      },
      {
        "id": "intro_wallet",
        "type": "cutscene",
        "nodes": [
          {
            "id": "wallet_1",
            "type": "narration",
            "text_vi": "Bạn có 500.000đ (đồng) - tiền Việt Nam.",
            "text_en": "You have 500,000đ (đồng) - Vietnamese currency.",
            "next": "wallet_2"
          },
          {
            "id": "wallet_2",
            "type": "narration",
            "text_vi": "Và 100⚡ năng lượng - sức chịu đựng tinh thần của bạn.",
            "text_en": "And 100⚡ energy - your mental stamina for the day.",
            "next": "intro_translator"
          }
        ]
      },
      {
        "id": "intro_translator",
        "type": "cutscene",
        "nodes": [
          {
            "id": "trans_1",
            "type": "narration",
            "text_vi": "Thấy câu tiếng Việt không hiểu?",
            "text_en": "See Vietnamese text you do not understand?",
            "next": "trans_2"
          },
          {
            "id": "trans_2",
            "type": "narration",
            "text_vi": "Nhấn nút \"Translate\" để xem nghĩa. Tốn 10⚡ năng lượng.",
            "text_en": "Tap the \"Translate\" button to see the meaning. Costs 10⚡ energy.",
            "next": "trans_3"
          },
          {
            "id": "trans_3",
            "type": "narration",
            "text_vi": "Nhưng dùng dịch sẽ giảm 25% tiền thưởng. Hãy thử hiểu trước!",
            "text_en": "But using translation reduces rewards by 25%. Try understanding first!",
            "next": "trans_4"
          },
          {
            "id": "trans_4",
            "type": "narration",
            "text_vi": "Sẵn sàng chưa? Bắt đầu cuộc phiêu lưu!",
            "text_en": "Ready? Let the adventure begin!",
            "next": "airport_exit"
          }
        ]
      }
    ]'::jsonb || (level_data->'scenes')
  )
)
WHERE slug = 'airport-taxi';
