-- À exécuter dans Supabase SQL Editor avant d'utiliser le formulaire d'avis
CREATE TABLE IF NOT EXISTS prep_feedback (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id),
  categorie  text,
  message    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prep_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_insert_feedback" ON prep_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
