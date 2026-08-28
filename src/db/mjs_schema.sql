-- ============================================================
-- MJS Schema - Espace PNACIJ / Ministère de la Jeunesse et des Sports
-- Tenant isolation: tenant_id = 'mjs' partout
-- ============================================================

-- ----------------------------------------
-- Secteurs (référentiel : Agriculture, Numérique, BTP, Commerce, Tourisme)
-- ----------------------------------------
CREATE TABLE mjs_secteurs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  nom         TEXT NOT NULL,
  slug        TEXT NOT NULL,
  icone       TEXT,
  ordre       INT DEFAULT 0
);

-- ----------------------------------------
-- Bénéficiaires (profil du jeune, sans secteur unique)
-- ----------------------------------------
CREATE TABLE mjs_beneficiaires (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  nom         TEXT NOT NULL,
  prenom      TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT now()
);

-- ----------------------------------------
-- Recruteurs (profil entreprise/partenaire)
-- ----------------------------------------
CREATE TABLE mjs_recruteurs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  nom         TEXT NOT NULL,
  entreprise  TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT now()
);

-- ----------------------------------------
-- Parcours (rattachés à un secteur, contenu IA généré une seule fois)
-- ----------------------------------------
CREATE TABLE mjs_parcours (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       TEXT NOT NULL DEFAULT 'mjs',
  secteur_id      UUID REFERENCES mjs_secteurs(id) NOT NULL,
  titre           TEXT NOT NULL,
  description     TEXT,
  niveau          TEXT,             -- 'debutant', 'intermediaire', 'avance'
  duree_semaines  INT,
  modules_total   INT DEFAULT 0,
  ordre           INT DEFAULT 0,
  modules_contenu JSONB             -- contenu généré par l'IA (Groq), partagé pour tous les bénéficiaires
);

-- ----------------------------------------
-- Inscriptions (table pivot many-to-many bénéficiaire <-> parcours)
-- ----------------------------------------
CREATE TABLE mjs_inscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  parcours_id UUID REFERENCES mjs_parcours(id) NOT NULL,
  inscrit_le  TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, parcours_id)
);

-- ----------------------------------------
-- Progression (par bénéficiaire, par parcours)
-- ----------------------------------------
CREATE TABLE mjs_progression (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) NOT NULL,
  tenant_id         TEXT NOT NULL DEFAULT 'mjs',
  parcours_id       UUID REFERENCES mjs_parcours(id) NOT NULL,
  modules_faits     INT DEFAULT 0,
  pourcentage       INT DEFAULT 0,
  modules_faits_ids JSONB DEFAULT '[]',   -- liste des ids de modules cochés "terminé"
  updated_at        TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, parcours_id)
);

-- ----------------------------------------
-- Skill Passports (certificats délivrés)
-- ----------------------------------------
CREATE TABLE mjs_skill_passports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  parcours_id UUID REFERENCES mjs_parcours(id) NOT NULL,
  delivre_le  TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, parcours_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE mjs_secteurs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjs_beneficiaires   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjs_recruteurs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjs_parcours        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjs_inscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjs_progression     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mjs_skill_passports ENABLE ROW LEVEL SECURITY;

-- Référentiels en lecture libre pour tout le tenant mjs
CREATE POLICY "read_secteurs" ON mjs_secteurs
  FOR SELECT USING (tenant_id = 'mjs');

CREATE POLICY "read_parcours" ON mjs_parcours
  FOR SELECT USING (tenant_id = 'mjs');

-- Bénéficiaire : ne voit/modifie que son propre profil
CREATE POLICY "beneficiaire_own_profil" ON mjs_beneficiaires
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recruteur : ne voit/modifie que son propre profil
CREATE POLICY "recruteur_own_profil" ON mjs_recruteurs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inscriptions : uniquement les siennes
CREATE POLICY "user_own_inscriptions" ON mjs_inscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Progression : uniquement la sienne
CREATE POLICY "user_own_progression" ON mjs_progression
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Skill Passports : le bénéficiaire voit les siens...
CREATE POLICY "user_own_passport" ON mjs_skill_passports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Bénéficiaire : peut insérer son propre passport (après test final)
CREATE POLICY "user_insert_own_passport" ON mjs_skill_passports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');

CREATE POLICY "user_update_own_passport" ON mjs_skill_passports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND tenant_id = 'mjs');

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

-- Bénéficiaire : peut insérer son propre passport (via test final côté API service role de préférence)
-- Policy documentée ; l'API /api/mjs/skill-passport utilise la service role key.

-- ...et tout recruteur connecté peut consulter tous les passports du tenant
-- (nécessaire pour /mjs/recruteur/dashboard)
CREATE POLICY "recruteur_read_passports" ON mjs_skill_passports
  FOR SELECT
  USING (
    tenant_id = 'mjs'
    AND EXISTS (
      SELECT 1 FROM mjs_recruteurs r
      WHERE r.user_id = auth.uid() AND r.tenant_id = 'mjs'
    )
  );

-- Idem : un recruteur doit pouvoir lire les profils bénéficiaires associés aux passports
CREATE POLICY "recruteur_read_beneficiaires" ON mjs_beneficiaires
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mjs_recruteurs r
      WHERE r.user_id = auth.uid() AND r.tenant_id = 'mjs'
    )
  );

-- ============================================================
-- Trigger : auto-création du profil bénéficiaire à l'inscription
-- Ne s'exécute que si prenom/nom sont fournis dans les métadonnées
-- (laisse passer les inscriptions recruteur sans erreur)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_mjs_user()
RETURNS trigger AS $$
BEGIN
  IF new.raw_user_meta_data->>'prenom' IS NOT NULL THEN
    INSERT INTO public.mjs_beneficiaires (user_id, tenant_id, nom, prenom)
    VALUES (new.id, 'mjs', new.raw_user_meta_data->>'nom', new.raw_user_meta_data->>'prenom');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_mjs ON auth.users;
CREATE TRIGGER on_auth_user_created_mjs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_mjs_user();

-- ============================================================
-- Données de référence : secteurs + parcours de départ
-- ============================================================

INSERT INTO mjs_secteurs (tenant_id, nom, slug, icone, ordre) VALUES
('mjs', 'Numérique', 'numerique', 'ti-cpu', 1),
('mjs', 'Agriculture', 'agriculture', 'ti-plant', 2),
('mjs', 'BTP', 'btp', 'ti-tools', 3),
('mjs', 'Commerce', 'commerce', 'ti-shopping-cart', 4),
('mjs', 'Tourisme', 'tourisme', 'ti-plane', 5)
ON CONFLICT DO NOTHING;

INSERT INTO mjs_parcours (tenant_id, secteur_id, titre, description, niveau, duree_semaines, modules_total, ordre)
VALUES
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'numerique'), 'Développement web', 'Apprends les bases du HTML, CSS et JavaScript pour créer des sites web modernes.', 'debutant', 6, 8, 1),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'numerique'), 'Communication professionnelle', 'Maîtrise les outils de communication digitale en entreprise.', 'debutant', 3, 5, 2),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'numerique'), 'Introduction à l''IA', 'Comprends les bases de l''intelligence artificielle et ses usages pratiques.', 'intermediaire', 4, 6, 3),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'agriculture'), 'Agroéquipement', 'Utilisation et entretien du matériel agricole moderne.', 'intermediaire', 4, 6, 1),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'agriculture'), 'Élevage et santé animale', 'Techniques de base en élevage et soins vétérinaires courants.', 'debutant', 5, 7, 2),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'btp'), 'Électricité bâtiment', 'Les fondamentaux de l''installation électrique résidentielle.', 'debutant', 5, 7, 1),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'btp'), 'Maçonnerie générale', 'Techniques de construction et lecture de plans.', 'debutant', 6, 8, 2),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'commerce'), 'Vente et négociation', 'Techniques de vente et gestion de la relation client.', 'debutant', 3, 5, 1),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'commerce'), 'Gestion d''entreprise', 'Bases de la comptabilité et gestion de petites entreprises.', 'intermediaire', 4, 6, 2),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'tourisme'), 'Accueil et hôtellerie', 'Standards d''accueil et service client dans l''hôtellerie.', 'debutant', 5, 7, 1),
('mjs', (SELECT id FROM mjs_secteurs WHERE slug = 'tourisme'), 'Guide touristique', 'Histoire, patrimoine et techniques de guidage.', 'intermediaire', 4, 6, 2)
ON CONFLICT DO NOTHING;