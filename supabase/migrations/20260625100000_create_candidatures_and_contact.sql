-- ============================================================
-- Migration Phase 3 : Candidatures et Coordonnées de Contact
-- Fichier : supabase/migrations/20260625100000_create_candidatures_and_contact.sql
-- ============================================================

-- 1. Ajout des colonnes de contact à mjs_beneficiaires
ALTER TABLE mjs_beneficiaires 
  ADD COLUMN IF NOT EXISTS email       TEXT,
  ADD COLUMN IF NOT EXISTS telephone   TEXT;

COMMENT ON COLUMN mjs_beneficiaires.email IS 'Adresse email du bénéficiaire pour contact recruteur.';
COMMENT ON COLUMN mjs_beneficiaires.telephone IS 'Numéro de téléphone du bénéficiaire pour contact recruteur.';

-- 2. Création de la table mjs_candidatures pour le suivi des candidatures
CREATE TABLE IF NOT EXISTS mjs_candidatures (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  offre_id    UUID REFERENCES mjs_offres(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMP DEFAULT now(),
  UNIQUE(offre_id, user_id)
);

COMMENT ON TABLE mjs_candidatures IS 'Candidatures envoyées par les jeunes certifiés aux offres des recruteurs.';

-- RLS pour mjs_candidatures
ALTER TABLE mjs_candidatures ENABLE ROW LEVEL SECURITY;

-- Politique : Un jeune connecté peut créer et voir ses propres candidatures
DROP POLICY IF EXISTS "user_own_candidatures" ON mjs_candidatures;
CREATE POLICY "user_own_candidatures" ON mjs_candidatures
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');

-- Politique : Un recruteur connecté peut consulter les candidatures reçues pour ses propres offres
DROP POLICY IF EXISTS "recruteur_read_candidatures" ON mjs_candidatures;
CREATE POLICY "recruteur_read_candidatures" ON mjs_candidatures
  FOR SELECT
  USING (
    tenant_id = 'mjs'
    AND EXISTS (
      SELECT 1 FROM mjs_offres o
      WHERE o.id = mjs_candidatures.offre_id AND o.recruteur_id = auth.uid()
    )
  );

-- 3. Mise à jour de la politique de lecture des bénéficiaires pour les recruteurs
DROP POLICY IF EXISTS "recruteur_read_beneficiaires" ON mjs_beneficiaires;
CREATE POLICY "recruteur_read_beneficiaires" ON mjs_beneficiaires
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mjs_recruteurs r
      WHERE r.user_id = auth.uid() AND r.tenant_id = 'mjs'
    )
  );

-- 4. Mise à jour du trigger pour copier automatiquement l'email lors de la création d'un utilisateur auth
CREATE OR REPLACE FUNCTION public.handle_new_mjs_user()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'prenom' IS NOT NULL THEN
    INSERT INTO public.mjs_beneficiaires (user_id, tenant_id, nom, prenom, email)
    VALUES (
      new.id, 
      'mjs', 
      new.raw_user_meta_data->>'nom', 
      new.raw_user_meta_data->>'prenom',
      new.email
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
