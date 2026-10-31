/*
# Create review schema (matières, chapitres, cartes, réglages)

Plain-English summary
This migration creates the tables that store the whole learning library: subjects (matières), chapters inside each subject, flashcards inside each chapter, and one row of review settings (the 5 review intervals and the daily reminder hour).

1. New Tables
- `decks` : subjects. Columns: id, name, description, created_at.
- `chapters` : chapters of a subject. Columns: id, deck_id (subject), name, description, created_at. Deleting a subject deletes its chapters.
- `cards` : flashcards. Columns: id, chapter_id, front, back, level (1 to 5, the review interval currently scheduled), due_on (day the card is due), review_count, last_activity_at (last creation or review, used to order the daily queue), mastered_at (set once the card is validated after level 5), created_at. Deleting a chapter deletes its cards.
- `review_settings` : a single row (id = 1) with `intervals` (5 strictly increasing day counts, default 1, 3, 7, 15, 30) and `reminder_hour` (0 to 23, default 18).

2. Security
- Row level security is enabled on every table.
- The app has no sign-in screen, so every policy targets the `anon` and `authenticated` roles. The data is intentionally shared by the app, as with other no-login apps in this project.
- Grants give SELECT, INSERT, UPDATE and DELETE on each table to `anon` and `authenticated` only.

3. Important notes
- Idempotent: safe to re-run.
- The intervals check enforces five distinct values in ascending order.
*/

CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chapters_deck_id_idx ON chapters (deck_id);

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  level smallint NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  due_on date NOT NULL DEFAULT current_date,
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  mastered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cards_chapter_id_idx ON cards (chapter_id);
CREATE INDEX IF NOT EXISTS cards_due_on_idx ON cards (due_on) WHERE mastered_at IS NULL;

CREATE TABLE IF NOT EXISTS review_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  intervals integer[] NOT NULL DEFAULT '{1,3,7,15,30}'
    CHECK (
      array_length(intervals, 1) = 5
      AND intervals[1] >= 1
      AND intervals[1] < intervals[2]
      AND intervals[2] < intervals[3]
      AND intervals[3] < intervals[4]
      AND intervals[4] < intervals[5]
    ),
  reminder_hour smallint NOT NULL DEFAULT 18 CHECK (reminder_hour BETWEEN 0 AND 23),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO review_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON decks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chapters TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cards TO anon, authenticated;
GRANT SELECT, UPDATE ON review_settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_decks" ON decks;
CREATE POLICY "anon_select_decks" ON decks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_decks" ON decks;
CREATE POLICY "anon_insert_decks" ON decks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_decks" ON decks;
CREATE POLICY "anon_update_decks" ON decks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_decks" ON decks;
CREATE POLICY "anon_delete_decks" ON decks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_chapters" ON chapters;
CREATE POLICY "anon_select_chapters" ON chapters FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chapters" ON chapters;
CREATE POLICY "anon_insert_chapters" ON chapters FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_chapters" ON chapters;
CREATE POLICY "anon_update_chapters" ON chapters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chapters" ON chapters;
CREATE POLICY "anon_delete_chapters" ON chapters FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_cards" ON cards;
CREATE POLICY "anon_select_cards" ON cards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cards" ON cards;
CREATE POLICY "anon_insert_cards" ON cards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cards" ON cards;
CREATE POLICY "anon_update_cards" ON cards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cards" ON cards;
CREATE POLICY "anon_delete_cards" ON cards FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_review_settings" ON review_settings;
CREATE POLICY "anon_select_review_settings" ON review_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_update_review_settings" ON review_settings;
CREATE POLICY "anon_update_review_settings" ON review_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
