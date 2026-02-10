# 🔐 Grant Yourself Admin Access

You're logged in but need admin access to create cards.

## 🎯 Quick Fix

### Option 1: Run SQL Query (Easiest)

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
UPDATE profiles
SET is_admin = true
WHERE id = '52ecdf03-fd89-46b7-8100-e02c061a2ab4';
```

4. Click **Run**
5. Refresh your browser
6. Try creating a card again!

### Option 2: Via Table Editor

1. Go to Supabase Dashboard → **Table Editor**
2. Click on **profiles** table
3. Find your row (user ID: `52ecdf03-fd89-46b7-8100-e02c061a2ab4`)
4. Click to edit
5. Set `is_admin` to `true`
6. Click **Save**
7. Refresh your browser

## ✅ Verify It Worked

After running the SQL, you can verify:

```sql
SELECT id, username, display_name, is_admin 
FROM profiles 
WHERE id = '52ecdf03-fd89-46b7-8100-e02c061a2ab4';
```

Should show `is_admin: true`

## 🔄 After Granting Admin

1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. Try accessing `/admin/cards/new` again
3. You should now have access!

---

**Note:** The file `GRANT_ADMIN.sql` contains the same SQL query ready to copy-paste.
