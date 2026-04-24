-- Learning App Progress Table
-- Run this in Supabase SQL Editor (Database → SQL Editor)

CREATE TABLE IF NOT EXISTS kid_progress (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learned_letters  TEXT[]   DEFAULT '{}',
  learned_numbers  INT[]    DEFAULT '{}',
  completed_words  TEXT[]   DEFAULT '{}',
  math_high_score  INT      DEFAULT 0,
  total_stars      INT      DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: each user can only read/write their own row
ALTER TABLE kid_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON kid_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own progress" ON kid_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
