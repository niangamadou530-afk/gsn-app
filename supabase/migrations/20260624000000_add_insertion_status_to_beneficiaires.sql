-- ============================================================
-- Migration : Ajout du statut d'insertion pour les bénéficiaires PNACIJ
-- Fichier : supabase/migrations/20260624000000_add_insertion_status_to_beneficiaires.sql
-- ============================================================

-- 1. Ajout de la colonne statut_insertion avec contrainte de vérification
ALTER TABLE mjs_beneficiaires 
ADD COLUMN IF NOT EXISTS statut_insertion TEXT DEFAULT 'recherche' 
CHECK (statut_insertion IN ('recherche', 'insere', 'entrepreneuriat', 'etudes'));

-- 2. Commentaire explicatif sur la colonne
COMMENT ON COLUMN mjs_beneficiaires.statut_insertion IS 'Statut d''insertion professionnelle du jeune : recherche (en recherche), insere (salarié/inséré), entrepreneuriat (auto-emploi/indépendant), etudes (en formation/études).';

-- 3. Mise à jour de quelques données de test pour avoir des taux d'insertion réalistes
-- (Ces requêtes n'affectent que les bénéficiaires de test créés par défaut)
UPDATE mjs_beneficiaires 
SET statut_insertion = 'insere' 
WHERE prenom ILIKE '%serigne%';

UPDATE mjs_beneficiaires 
SET statut_insertion = 'entrepreneuriat' 
WHERE prenom ILIKE '%wqeqeq%';

UPDATE mjs_beneficiaires 
SET statut_insertion = 'recherche' 
WHERE prenom ILIKE '%taha%';
