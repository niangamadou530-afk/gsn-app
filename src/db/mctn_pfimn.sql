-- ============================================================
-- PFIMN — Migration Supabase
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- 1. Ajouter tenant_id et champs profil PFIMN à la table users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'gsn',
  ADD COLUMN IF NOT EXISTS phone     TEXT,
  ADD COLUMN IF NOT EXISTS region    TEXT,
  ADD COLUMN IF NOT EXISTS age       INTEGER;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- 2. Table d'enrollement PFIMN (1 ligne par bénéficiaire inscrit)
CREATE TABLE IF NOT EXISTS pfimn_enrollments (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domaine                TEXT NOT NULL,  -- dev-web, data, cybersec, ux, ecommerce, cloud
  niveau                 TEXT NOT NULL,  -- Débutant | Intermédiaire | Avancé
  objectif               TEXT NOT NULL,  -- Premier emploi | Freelance | Reconversion
  region                 TEXT,
  course_id              UUID,           -- lien vers user_courses.id une fois généré
  skill_passport_issued  BOOLEAN DEFAULT FALSE,
  inserted               BOOLEAN DEFAULT FALSE,  -- a été placé via GSN WORK
  enrolled_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pfimn_enrollments_user_id ON pfimn_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_pfimn_enrollments_domaine ON pfimn_enrollments(domaine);
CREATE INDEX IF NOT EXISTS idx_pfimn_enrollments_region  ON pfimn_enrollments(region);

-- 3. RLS : un bénéficiaire ne voit que sa propre ligne
ALTER TABLE pfimn_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beneficiaire voit son enrollment" ON pfimn_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Beneficiaire cree son enrollment" ON pfimn_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Beneficiaire modifie son enrollment" ON pfimn_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Vue dashboard MCTN (pour les admins Ministère)
-- Usage: SELECT * FROM mctn_kpis_view;
CREATE OR REPLACE VIEW mctn_kpis_view AS
SELECT
  COUNT(*)                                               AS total_inscrits,
  COUNT(*) FILTER (WHERE skill_passport_issued = TRUE)   AS skill_passports_delivres,
  COUNT(*) FILTER (WHERE inserted = TRUE)                AS insertions_tech,
  COUNT(*) FILTER (WHERE domaine = 'dev-web')            AS dev_web,
  COUNT(*) FILTER (WHERE domaine = 'data')               AS data_ia,
  COUNT(*) FILTER (WHERE domaine = 'cybersec')           AS cybersecurite,
  COUNT(*) FILTER (WHERE domaine = 'ux')                 AS ux_design,
  COUNT(*) FILTER (WHERE domaine = 'ecommerce')          AS ecommerce,
  COUNT(*) FILTER (WHERE domaine = 'cloud')              AS cloud_devops,
  ROUND(COUNT(*) FILTER (WHERE skill_passport_issued = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 1) AS taux_completion_pct,
  ROUND(COUNT(*) FILTER (WHERE inserted = TRUE) * 100.0 / NULLIF(COUNT(*), 0), 1)              AS taux_insertion_pct
FROM pfimn_enrollments;
