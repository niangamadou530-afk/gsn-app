-- Table de cache permanent pour les réponses Groq
-- À exécuter dans Supabase SQL Editor (une seule fois)

CREATE TABLE IF NOT EXISTS prep_cache (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key  text        UNIQUE NOT NULL,
  payload    jsonb       NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prep_cache_key ON prep_cache (cache_key);

ALTER TABLE prep_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prep_cache_read"   ON prep_cache FOR SELECT USING (true);
CREATE POLICY "prep_cache_insert" ON prep_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "prep_cache_update" ON prep_cache FOR UPDATE USING (true);
