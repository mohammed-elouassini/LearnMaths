/*
# Add profile picture to review settings

1. Modified Tables
- `review_settings`: new nullable column `avatar_data_url` (text) that stores the profile picture as a small square JPEG encoded in a data URL. NULL means the default sigma icon is shown.

2. Security
- No change to RLS or grants: the table already grants SELECT and UPDATE to anon and authenticated, which covers the new column.
- A CHECK constraint limits the value to a JPEG data URL of at most 200 000 characters so oversized uploads cannot be stored.

3. Notes
- Existing rows keep NULL, so the app keeps showing the sigma until the user imports a picture.
*/

ALTER TABLE review_settings ADD COLUMN IF NOT EXISTS avatar_data_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'review_settings_avatar_data_url_check'
  ) THEN
    ALTER TABLE review_settings ADD CONSTRAINT review_settings_avatar_data_url_check
      CHECK (avatar_data_url IS NULL OR (avatar_data_url LIKE 'data:image/jpeg;base64,%' AND length(avatar_data_url) <= 200000));
  END IF;
END $$;
