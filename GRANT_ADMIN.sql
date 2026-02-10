-- Grant yourself admin access
-- Replace YOUR_USER_ID with your actual user ID from the console logs
-- Your user ID: 52ecdf03-fd89-46b7-8100-e02c061a2ab4

UPDATE profiles
SET is_admin = true
WHERE id = '52ecdf03-fd89-46b7-8100-e02c061a2ab4';

-- Verify it worked
SELECT id, username, display_name, is_admin 
FROM profiles 
WHERE id = '52ecdf03-fd89-46b7-8100-e02c061a2ab4';
