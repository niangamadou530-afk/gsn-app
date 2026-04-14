-- =====================================================
-- GSN PREP — Gamification tables
-- Exécute ce script dans Supabase SQL Editor
-- =====================================================

-- Table des stats de joueur (XP, niveau, streak)
create table if not exists prep_player_stats (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  total_xp      integer not null default 0,
  current_level text    not null default 'Novice',
  best_streak   integer not null default 0,
  school        text,
  classe        text,
  serie         text,
  updated_at    timestamptz not null default now()
);

-- Sécurité au niveau ligne
alter table prep_player_stats enable row level security;

-- Chaque user gère ses propres stats
create policy "user_manage_own_stats" on prep_player_stats
  for all using (auth.uid() = user_id);

-- Tout le monde peut lire le classement
create policy "classement_public_read" on prep_player_stats
  for select using (true);

-- Index pour le classement
create index if not exists idx_prep_player_stats_xp
  on prep_player_stats (total_xp desc);

-- Ajouter school/classe à prep_students si pas déjà présent
alter table prep_students add column if not exists school text;
alter table prep_students add column if not exists classe text;

-- =====================================================
-- VÉRIFICATION
-- select count(*) from prep_player_stats;
-- =====================================================
