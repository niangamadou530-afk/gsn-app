-- ============================================================
-- Migration Phase 2 : Extension Espace MJS
-- Fichier : supabase/migrations/20260625000000_update_mjs_schema_v2.sql
-- ============================================================

-- 1. Ajout des colonnes démographiques à mjs_beneficiaires
ALTER TABLE mjs_beneficiaires 
ADD COLUMN IF NOT EXISTS genre TEXT CHECK (genre IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS situation_handicap BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN mjs_beneficiaires.genre IS 'Genre du bénéficiaire : M (Homme) ou F (Femme).';
COMMENT ON COLUMN mjs_beneficiaires.region IS 'Région du Sénégal de résidence du bénéficiaire.';
COMMENT ON COLUMN mjs_beneficiaires.situation_handicap IS 'Indique si le bénéficiaire est en situation de handicap (TRUE/FALSE).';

-- 2. Création de la table mjs_offres pour les recruteurs
CREATE TABLE IF NOT EXISTS mjs_offres (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    TEXT NOT NULL DEFAULT 'mjs',
  recruteur_id UUID REFERENCES auth.users(id) NOT NULL,
  titre        TEXT NOT NULL,
  entreprise   TEXT NOT NULL,
  description  TEXT NOT NULL,
  salaire      TEXT,
  localisation TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT now()
);

-- RLS pour mjs_offres
ALTER TABLE mjs_offres ENABLE ROW LEVEL SECURITY;

-- Politique : Tout recruteur ou utilisateur connecté peut voir les offres s'il a un passeport (ou s'il est recruteur)
CREATE POLICY "read_offres" ON mjs_offres
  FOR SELECT
  USING (
    tenant_id = 'mjs'
    AND (
      -- Soit l'auteur de l'offre
      auth.uid() = recruteur_id
      -- Soit n'importe quel autre recruteur
      OR EXISTS (
        SELECT 1 FROM mjs_recruteurs r 
        WHERE r.user_id = auth.uid() AND r.tenant_id = 'mjs'
      )
      -- Soit un bénéficiaire ayant obtenu au moins un Skill Passport (certifié)
      OR EXISTS (
        SELECT 1 FROM mjs_skill_passports p 
        WHERE p.user_id = auth.uid() AND p.tenant_id = 'mjs'
      )
    )
  );

-- Politique : Un recruteur peut insérer/modifier/supprimer ses propres offres
CREATE POLICY "recruteur_all_own_offres" ON mjs_offres
  FOR ALL
  USING (auth.uid() = recruteur_id)
  WITH CHECK (auth.uid() = recruteur_id AND tenant_id = 'mjs');


-- 3. Création de la table mjs_transactions pour GSN Pay (Finances)
CREATE TABLE IF NOT EXISTS mjs_transactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  TEXT NOT NULL DEFAULT 'mjs',
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  titre      TEXT NOT NULL,
  montant    INT NOT NULL, -- points/FCFA positif pour crédit, négatif pour débit
  created_at TIMESTAMP DEFAULT now()
);

-- RLS pour mjs_transactions
ALTER TABLE mjs_transactions ENABLE ROW LEVEL SECURITY;

-- Politique : Un bénéficiaire ne peut voir que ses propres transactions
CREATE POLICY "user_own_transactions" ON mjs_transactions
  FOR SELECT
  USING (auth.uid() = user_id AND tenant_id = 'mjs');

-- Politique : Un bénéficiaire peut insérer ses propres transactions (ex: demande de crédit)
CREATE POLICY "user_insert_own_transactions" ON mjs_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');


-- 4. Seeding des données de test
-- Mise à jour des bénéficiaires existants avec des données démographiques variées
UPDATE mjs_beneficiaires 
SET genre = 'M', region = 'Dakar', situation_handicap = FALSE 
WHERE prenom ILIKE '%serigne%';

UPDATE mjs_beneficiaires 
SET genre = 'F', region = 'Thiès', situation_handicap = TRUE 
WHERE prenom ILIKE '%wqeqeq%';

UPDATE mjs_beneficiaires 
SET genre = 'M', region = 'Diourbel', situation_handicap = FALSE 
WHERE prenom ILIKE '%taha%';

-- Insertion de quelques transactions de test pour le premier bénéficiaire
-- (Recherche d'un user_id valide pour lier)
INSERT INTO mjs_transactions (tenant_id, user_id, titre, montant)
SELECT 
  'mjs', 
  user_id, 
  'Allocation d''équipement initial', 
  50000
FROM mjs_beneficiaires
LIMIT 1;

INSERT INTO mjs_transactions (tenant_id, user_id, titre, montant)
SELECT 
  'mjs', 
  user_id, 
  'Bonus de validation de module (Agriculture)', 
  10000
FROM mjs_beneficiaires
LIMIT 1;

-- Insertion de quelques appels d'offres de test par le recruteur existant
-- (Recherche d'un recruteur valide)
INSERT INTO mjs_offres (tenant_id, recruteur_id, titre, entreprise, description, salaire, localisation)
SELECT 
  'mjs', 
  user_id, 
  'Développeur Junior Node.js', 
  entreprise, 
  'Nous recherchons un développeur junior spécialisé en JavaScript/TypeScript pour rejoindre notre équipe. Compétences en base de données SQL requises.', 
  '300 000 FCFA', 
  'Dakar'
FROM mjs_recruteurs
LIMIT 1;

INSERT INTO mjs_offres (tenant_id, recruteur_id, titre, entreprise, description, salaire, localisation)
SELECT 
  'mjs', 
  user_id, 
  'Technicien Agricole en Agroéquipement', 
  entreprise, 
  'Recherche technicien agricole certifié pour la maintenance et l''optimisation des équipements d''irrigation automatiques.', 
  '250 000 FCFA', 
  'Thiès'
FROM mjs_recruteurs
LIMIT 1;

-- 5. Création de la table mjs_candidatures pour le suivi des postulants
CREATE TABLE IF NOT EXISTS mjs_candidatures (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  offre_id    UUID REFERENCES mjs_offres(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMP DEFAULT now(),
  UNIQUE(offre_id, user_id)
);

-- RLS pour mjs_candidatures
ALTER TABLE mjs_candidatures ENABLE ROW LEVEL SECURITY;

-- Politique : Un jeune connecté peut créer et voir ses propres candidatures
CREATE POLICY "user_own_candidatures" ON mjs_candidatures
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');

-- Politique : Un recruteur connecté peut consulter les candidatures reçues pour ses propres offres
CREATE POLICY "recruteur_read_candidatures" ON mjs_candidatures
  FOR SELECT
  USING (
    tenant_id = 'mjs'
    AND EXISTS (
      SELECT 1 FROM mjs_offres o
      WHERE o.id = mjs_candidatures.offre_id AND o.recruteur_id = auth.uid()
    )
  );

