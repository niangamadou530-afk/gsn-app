-- ══════════════════════════════════════════════════════════════
-- 1. TABLE epreuves_bac
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS epreuves_bac (
  id            uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  annee         integer      NOT NULL,
  serie         text         NOT NULL,
  matiere       text         NOT NULL,
  type          text         NOT NULL CHECK (type IN ('epreuve', 'corrige')),
  url_originale text         NOT NULL UNIQUE,
  url_storage   text,                          -- URL publique Supabase Storage
  nom_fichier   text,
  created_at    timestamptz  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epreuves_bac_annee   ON epreuves_bac (annee);
CREATE INDEX IF NOT EXISTS idx_epreuves_bac_matiere ON epreuves_bac (matiere);
CREATE INDEX IF NOT EXISTS idx_epreuves_bac_serie   ON epreuves_bac (serie);
CREATE INDEX IF NOT EXISTS idx_epreuves_bac_type    ON epreuves_bac (type);

-- RLS : lecture publique (pas besoin d'être connecté pour consulter les épreuves)
ALTER TABLE epreuves_bac ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'epreuves_bac' AND policyname = 'epreuves_bac_public_read'
  ) THEN
    CREATE POLICY epreuves_bac_public_read
      ON epreuves_bac FOR SELECT USING (true);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 2. BUCKET Supabase Storage
--    (à exécuter dans SQL Editor — crée le bucket si absent)
-- ══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('epreuves-bac', 'epreuves-bac', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy lecture publique sur le bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'epreuves_bac_storage_read'
  ) THEN
    CREATE POLICY epreuves_bac_storage_read
      ON storage.objects FOR SELECT
      USING (bucket_id = 'epreuves-bac');
  END IF;
END $$;

-- Policy insert via service role uniquement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'epreuves_bac_storage_insert'
  ) THEN
    CREATE POLICY epreuves_bac_storage_insert
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'epreuves-bac'
        AND auth.role() = 'service_role'
      );
  END IF;
END $$;
