-- ============================================================
-- MJS — Policies RLS supplémentaires
-- À exécuter dans Supabase → SQL Editor si l'app tourne SANS
-- SUPABASE_SERVICE_ROLE_KEY (flux client avec clé anon).
-- ============================================================

-- Bénéficiaire inscrit : peut initialiser le contenu IA d'un parcours encore vide
CREATE POLICY "inscribed_seed_parcours_content" ON mjs_parcours
  FOR UPDATE
  USING (
    tenant_id = 'mjs'
    AND (
      modules_contenu IS NULL
      OR jsonb_array_length(COALESCE(modules_contenu, '[]'::jsonb)) = 0
    )
    AND EXISTS (
      SELECT 1 FROM mjs_inscriptions i
      WHERE i.parcours_id = mjs_parcours.id
        AND i.user_id = auth.uid()
        AND i.tenant_id = 'mjs'
    )
  )
  WITH CHECK (tenant_id = 'mjs');

-- Bénéficiaire : peut créer son propre Skill Passport (après test final)
CREATE POLICY "user_insert_own_passport" ON mjs_skill_passports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');

CREATE POLICY "user_update_own_passport" ON mjs_skill_passports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');
