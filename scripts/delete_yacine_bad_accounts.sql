-- Supprimer les comptes Yacine mal créés (insertion SQL directe)
-- Après ce script, cliquer sur "Créer comptes Yacine" dans le dashboard admin

DELETE FROM auth.identities
WHERE provider_id IN ('yacine.bac@gsnprep.local', 'yacine.bfem@gsnprep.local');

DELETE FROM prep_students
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('yacine.bac@gsnprep.local', 'yacine.bfem@gsnprep.local')
);

DELETE FROM public.users
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('yacine.bac@gsnprep.local', 'yacine.bfem@gsnprep.local')
);

DELETE FROM auth.users
WHERE email IN ('yacine.bac@gsnprep.local', 'yacine.bfem@gsnprep.local');

-- Vérification : doit retourner 0 lignes
SELECT email FROM auth.users
WHERE email IN ('yacine.bac@gsnprep.local', 'yacine.bfem@gsnprep.local');
