-- GSN PREP v3 — nouvelles tables
-- À exécuter dans Supabase SQL Editor

-- 1. Colonne positioning_done sur prep_students
ALTER TABLE prep_students ADD COLUMN IF NOT EXISTS positioning_done boolean DEFAULT false;

-- 2. Suivi par chapitre (programme de révision)
CREATE TABLE IF NOT EXISTS prep_chapter_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere text NOT NULL,
  chapitre text NOT NULL,
  statut text NOT NULL DEFAULT 'a_travailler', -- 'a_travailler' | 'en_cours' | 'maitrise'
  score integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, matiere, chapitre)
);
ALTER TABLE prep_chapter_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_own_chapter_progress" ON prep_chapter_progress
  FOR ALL USING (auth.uid() = user_id);

-- 3. Flashcards sauvegardées
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  serie text,
  matiere text,
  chapitre text,
  recto text NOT NULL,
  verso text NOT NULL,
  maitrisee boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_own_flashcards" ON flashcards
  FOR ALL USING (auth.uid() = user_id);

-- 4. Résumés de cours sauvegardés
CREATE TABLE IF NOT EXISTS prep_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  matiere text,
  chapitre text,
  titre text,
  contenu text NOT NULL,
  points_cles jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE prep_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "user_own_resumes" ON prep_resumes
  FOR ALL USING (auth.uid() = user_id);
