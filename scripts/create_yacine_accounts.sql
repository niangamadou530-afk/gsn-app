-- ============================================================
-- Comptes test Yacine (stagiaire) — illimités
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter la colonne unlimited si elle n'existe pas
ALTER TABLE prep_students
  ADD COLUMN IF NOT EXISTS unlimited boolean DEFAULT false;

-- 2. Créer les deux utilisateurs
DO $$
DECLARE
  uid_bac  uuid;
  uid_bfem uuid;
BEGIN

  -- ── Compte BAC ──
  SELECT id INTO uid_bac FROM auth.users WHERE email = 'yacine.bac@gsnprep.local';
  IF uid_bac IS NULL THEN
    uid_bac := gen_random_uuid();
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud
    ) VALUES (
      uid_bac,
      'yacine.bac@gsnprep.local',
      crypt('YacineBAC2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), 'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), uid_bac,
      'yacine.bac@gsnprep.local', 'email',
      jsonb_build_object('sub', uid_bac::text, 'email', 'yacine.bac@gsnprep.local'),
      now(), now(), now()
    );
  END IF;

  -- ── Compte BFEM ──
  SELECT id INTO uid_bfem FROM auth.users WHERE email = 'yacine.bfem@gsnprep.local';
  IF uid_bfem IS NULL THEN
    uid_bfem := gen_random_uuid();
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, role, aud
    ) VALUES (
      uid_bfem,
      'yacine.bfem@gsnprep.local',
      crypt('YacineBFEM2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), 'authenticated', 'authenticated'
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), uid_bfem,
      'yacine.bfem@gsnprep.local', 'email',
      jsonb_build_object('sub', uid_bfem::text, 'email', 'yacine.bfem@gsnprep.local'),
      now(), now(), now()
    );
  END IF;

  -- 3. Table public.users
  INSERT INTO public.users (id, name, score, profile_type)
  VALUES
    (uid_bac,  'Yacine BAC',  0, 'eleve'),
    (uid_bfem, 'Yacine BFEM', 0, 'eleve')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Table prep_students (exam_type + série + unlimited)
  INSERT INTO prep_students (user_id, prenom, ecole, exam_type, serie, unlimited, created_at)
  VALUES
    (uid_bac,  'Yacine', 'Compte test GSN', 'BAC',  'S1', true, now()),
    (uid_bfem, 'Yacine', 'Compte test GSN', 'BFEM', null, true, now())
  ON CONFLICT (user_id) DO UPDATE SET unlimited = true;

END $$;

-- 5. Vérification
SELECT
  au.email,
  ps.exam_type,
  ps.serie,
  ps.unlimited
FROM auth.users au
JOIN prep_students ps ON ps.user_id = au.id
WHERE au.email IN ('yacine.bac@gsnprep.local', 'yacine.bfem@gsnprep.local');
