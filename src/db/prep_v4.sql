-- ============================================================
-- GSN PREP v4 — SQL complet
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ── prep_students ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prep_students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom     text,
  exam_type  text NOT NULL DEFAULT 'BAC',
  serie      text,
  ecole      text,
  classe     text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prep_students ADD COLUMN IF NOT EXISTS prenom text;
ALTER TABLE prep_students ADD COLUMN IF NOT EXISTS ecole  text;
ALTER TABLE prep_students ADD COLUMN IF NOT EXISTS classe text;

-- ── quiz_results ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_results (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere    text NOT NULL,
  chapitre   text,
  score      integer NOT NULL DEFAULT 0,
  total      integer NOT NULL DEFAULT 10,
  mode       text DEFAULT 'qcm',
  created_at timestamptz DEFAULT now()
);

-- ── flashcards ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  serie      text,
  matiere    text,
  chapitre   text,
  recto      text NOT NULL,
  verso      text NOT NULL,
  maitrisee  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── prep_resumes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prep_resumes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere    text,
  chapitre   text,
  contenu    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── prep_player_stats ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prep_player_stats (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points_total integer DEFAULT 0,
  updated_at   timestamptz DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE prep_students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results      ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_resumes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_player_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_students' AND policyname='prep_students_self') THEN
    CREATE POLICY prep_students_self ON prep_students FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_results' AND policyname='quiz_results_self') THEN
    CREATE POLICY quiz_results_self ON quiz_results FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_results' AND policyname='quiz_results_read_all') THEN
    CREATE POLICY quiz_results_read_all ON quiz_results FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flashcards' AND policyname='flashcards_self') THEN
    CREATE POLICY flashcards_self ON flashcards FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_resumes' AND policyname='prep_resumes_self') THEN
    CREATE POLICY prep_resumes_self ON prep_resumes FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_player_stats' AND policyname='prep_player_stats_read_all') THEN
    CREATE POLICY prep_player_stats_read_all ON prep_player_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prep_player_stats' AND policyname='prep_player_stats_self') THEN
    CREATE POLICY prep_player_stats_self ON prep_player_stats FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Index ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id  ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_matiere  ON quiz_results(matiere);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id    ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_prep_students_user_id ON prep_students(user_id);
