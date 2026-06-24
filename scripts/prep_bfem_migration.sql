-- ══════════════════════════════════════════════════════════════
-- Migration BFEM — À exécuter dans Supabase SQL Editor
-- AVANT de lancer scrape_bfem.py
-- ══════════════════════════════════════════════════════════════

-- 1. Colonnes manquantes sur epreuves_bac
ALTER TABLE epreuves_bac ADD COLUMN IF NOT EXISTS examen       text DEFAULT 'BAC';
ALTER TABLE epreuves_bac ADD COLUMN IF NOT EXISTS contenu_html text;

-- Backfill : toutes les entrées existantes (BAC) reçoivent examen='BAC'
UPDATE epreuves_bac SET examen = 'BAC' WHERE examen IS NULL;

-- 2. Étendre le CHECK sur 'type' pour inclure 'annale_preparation'
ALTER TABLE epreuves_bac DROP CONSTRAINT IF EXISTS epreuves_bac_type_check;
ALTER TABLE epreuves_bac ADD CONSTRAINT epreuves_bac_type_check
  CHECK (type IN ('epreuve', 'corrige', 'annale_preparation'));

-- Index pour filtrer par examen (BFEM / BAC)
CREATE INDEX IF NOT EXISTS idx_epreuves_bac_examen ON epreuves_bac (examen);

-- 3. Bucket Supabase Storage pour les PDFs BFEM (séparé du bucket BAC)
INSERT INTO storage.buckets (id, name, public)
VALUES ('epreuves-bfem', 'epreuves-bfem', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy : lecture publique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'epreuves_bfem_storage_read'
  ) THEN
    CREATE POLICY epreuves_bfem_storage_read
      ON storage.objects FOR SELECT
      USING (bucket_id = 'epreuves-bfem');
  END IF;
END $$;

-- Policy : insert réservé au service role (script de scraping)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'epreuves_bfem_storage_insert'
  ) THEN
    CREATE POLICY epreuves_bfem_storage_insert
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'epreuves-bfem'
        AND auth.role() = 'service_role'
      );
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- Vérification post-migration
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'epreuves_bac' ORDER BY ordinal_position;
-- ══════════════════════════════════════════════════════════════
