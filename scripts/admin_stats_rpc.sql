-- 1. Ajouter created_at à prep_students si absent
ALTER TABLE prep_students
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Fonction RPC admin stats (SECURITY DEFINER = bypass RLS)
CREATE OR REPLACE FUNCTION get_admin_stats(
  launch_ts timestamptz DEFAULT '2026-07-01T00:00:00Z'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today  date        := current_date;
  h24ago timestamptz := now() - interval '24 hours';
  h1ago  timestamptz := now() - interval '1 hour';
BEGIN
  RETURN jsonb_build_object(
    'total',
      (SELECT COUNT(*) FROM prep_students WHERE created_at >= launch_ts),
    'last24h',
      (SELECT COUNT(*) FROM prep_students WHERE created_at >= h24ago),
    'lastHour',
      (SELECT COUNT(*) FROM prep_students WHERE created_at >= h1ago),
    -- totaux cumulés depuis le lancement (correspond à la somme de la colonne par élève)
    'quiz',
      COALESCE((SELECT SUM(quiz_count)       FROM prep_usage_quotidien), 0),
    'flashcards',
      COALESCE((SELECT SUM(flashcards_count) FROM prep_usage_quotidien), 0),
    'resumes',
      COALESCE((SELECT SUM(resume_count)     FROM prep_usage_quotidien), 0),
    'coach',
      COALESCE((SELECT SUM(coach_count)      FROM prep_usage_quotidien), 0),
    -- totaux du jour uniquement (pour voir l'activité d'aujourd'hui)
    'quiz_today',
      COALESCE((SELECT SUM(quiz_count)       FROM prep_usage_quotidien WHERE date = today), 0),
    'flashcards_today',
      COALESCE((SELECT SUM(flashcards_count) FROM prep_usage_quotidien WHERE date = today), 0),
    'resumes_today',
      COALESCE((SELECT SUM(resume_count)     FROM prep_usage_quotidien WHERE date = today), 0),
    'coach_today',
      COALESCE((SELECT SUM(coach_count)      FROM prep_usage_quotidien WHERE date = today), 0)
  );
END;
$$;

-- 3. Autoriser l'appel depuis le client anon (la vérification admin se fait côté API)
GRANT EXECUTE ON FUNCTION get_admin_stats(timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION get_admin_stats(timestamptz) TO authenticated;
