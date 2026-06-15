CREATE TABLE mjs_beneficiaires (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  tenant_id   TEXT NOT NULL DEFAULT 'mjs',
  nom         TEXT,
  prenom      TEXT,
  secteur     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT now()
);
