-- ============================================================
-- Table des établissements scolaires sénégalais
-- Sources :
--   Lycées   → academie-plus.com (données vérifiables)
--   CEM      → openstreetmap.org via Nominatim API
-- ============================================================

DROP TABLE IF EXISTS etablissements_senegal;

CREATE TABLE etablissements_senegal (
  id        bigint generated always as identity primary key,
  nom       text not null,
  type      text not null check (type in (
    'Lycée Public', 'Lycée Privé',
    'CEM Public', 'CEM Privé',
    'Collège Public', 'Collège Privé', 'Collège Privé Catholique',
    'Groupe Scolaire Privé'
  )),
  ville     text not null,
  region    text not null,
  adresse   text,
  telephone text,
  source    text not null default 'manuel'
);

ALTER TABLE etablissements_senegal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des établissements"
  ON etablissements_senegal FOR SELECT USING (true);

-- ─── INDEX pour sélection/recherche côté client ──────────────────────────────
CREATE INDEX ON etablissements_senegal (region);
CREATE INDEX ON etablissements_senegal (ville);
CREATE INDEX ON etablissements_senegal (type);


-- ============================================================
-- LYCÉES — source : academie-plus.com
-- ============================================================

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES

-- ── DAKAR ────────────────────────────────────────────────────────────────────
  ('Lycée Blaise Diagne',                    'Lycée Public',  'Dakar',       'Dakar',       'Zone A / Zone B',                           '33 825 08 20',  'academie-plus.com'),
  ('Lycée Lamine Guèye',                     'Lycée Public',  'Dakar',       'Dakar',       'Rue du 18 juin',                            '33 821 10 17',  'academie-plus.com'),
  ('Lycée Thierno Saïdou Nourou Tall',       'Lycée Public',  'Dakar',       'Dakar',       'Point E',                                   '33 824 60 74',  'academie-plus.com'),
  ('Lycée Maurice Delafosse',                'Lycée Public',  'Dakar',       'Dakar',       'Gueule Tapée',                              '33 822 43 68',  'academie-plus.com'),
  ('Lycée Industriel Delafosse',             'Lycée Public',  'Dakar',       'Dakar',       'Gueule Tapée',                              '33 822 21 16',  'academie-plus.com'),
  ('Lycée des Parcelles Assainies',          'Lycée Public',  'Dakar',       'Dakar',       'Parcelles Assainies',                       '33 839 05 12',  'academie-plus.com'),
  ('Lycée Galandou Diouf',                   'Lycée Public',  'Dakar',       'Dakar',       'Mermoz Sacré-Cœur',                         '33 823 08 63',  'academie-plus.com'),
  ('Lycée Mouhamad Fadilou Mbacké',          'Lycée Public',  'Dakar',       'Dakar',       'Point E',                                   '33 825 28 10',  'academie-plus.com'),
  ('Lycée Alassane Diop',                    'Lycée Public',  'Dakar',       'Dakar',       '2, Cité Impôts et Domaines',                '33 835 78 71',  'academie-plus.com'),
  ('Lycée Moderne',                          'Lycée Public',  'Dakar',       'Dakar',       'Champs des courses',                        '33 836 60 41',  'academie-plus.com'),
  ('Lycée Mariama Bâ',                       'Lycée Public',  'Gorée',       'Dakar',       'Île de Gorée',                              '33 821 60 21',  'academie-plus.com'),
  ('Lycée Seydina Limamou Laye',             'Lycée Public',  'Guédiawaye',  'Dakar',       'Ndiarèm Guédiawaye',                        '33 837 08 95',  'academie-plus.com'),
  ('Lycée Abdoulaye Sadji',                  'Lycée Public',  'Rufisque',    'Dakar',       'Keury Souf',                                '33 836 00 47',  'academie-plus.com'),
  ('Cours Sainte Marie de Hann',             'Lycée Privé',   'Dakar',       'Dakar',       'Route du Front de Terre – Hann',            '33 823 87 36',  'academie-plus.com'),
  ('Institution Immaculée Conception',       'Lycée Privé',   'Dakar',       'Dakar',       'Bvd El Hadj Djily MBaye',                   '33 889 03 70',  'academie-plus.com'),
  ('Institut Sainte Jeanne d''Arc',          'Lycée Privé',   'Dakar',       'Dakar',       '147, Av. du Président Lamine Guèye',        '33 889 60 61',  'academie-plus.com'),
  ('Lycée Français Jean Mermoz',             'Lycée Privé',   'Dakar',       'Dakar',       'Route de Ouakam, côté Gendarmerie Ouakam',  '33 860 45 33',  'academie-plus.com'),
  ('Lycée International Bilingue',           'Lycée Privé',   'Dakar',       'Dakar',       'Almadies, face Méridien Président',         '33 820 49 29',  'academie-plus.com'),
  ('Lycée Technique Ahmadou Bamba',          'Lycée Public',  'Diourbel',    'Diourbel',    'Diourbel',                                  '33 971 15 76',  'academie-plus.com'),

-- ── SAINT-LOUIS ──────────────────────────────────────────────────────────────
  ('Lycée Charles de Gaulle',                'Lycée Public',  'Saint-Louis', 'Saint-Louis', 'Av. Rawane Ngom Diameguene',                '33 961 17 93',  'academie-plus.com'),
  ('Lycée Cheikh Oumar Foutiyou Tall',       'Lycée Public',  'Saint-Louis', 'Saint-Louis', 'Rue général de Gaulle nord',               '33 961 10 01',  'academie-plus.com'),
  ('Lycée des Jeunes Filles Ahmet Fall',     'Lycée Public',  'Saint-Louis', 'Saint-Louis', 'Rue Babacar Seye ex Neuvi sud',             '33 961 11 55',  'academie-plus.com'),
  ('Lycée Technique André Peytavin',         'Lycée Public',  'Saint-Louis', 'Saint-Louis', 'Av. Moustapha Gaye Sor Ndiolofène',         '33 961 11 55',  'academie-plus.com'),
  ('Lycée Prytanée Militaire Ch. Ntchorère', 'Lycée Public',  'Saint-Louis', 'Saint-Louis', 'Prytanée Militaire',                        '33 961 19 36',  'academie-plus.com'),
  ('École Saint-Exupéry',                    'Lycée Privé',   'Saint-Louis', 'Saint-Louis', 'Quai Roume Nord',                           '33 961 18 80',  'academie-plus.com'),

-- ── THIÈS / MBOUR ────────────────────────────────────────────────────────────
  ('Lycée Malick Sy',                        'Lycée Public',  'Thiès',       'Thiès',       'El H. Malick SY',                           '33 951 12 40',  'academie-plus.com'),
  ('Lycée de Mboro',                         'Lycée Public',  'Mboro',       'Thiès',       'Mboro village',                             '33 955 77 77',  'academie-plus.com'),
  ('Lycée de Tivaouane',                     'Lycée Public',  'Tivaouane',   'Thiès',       'Tivaouane',                                 '33 955 16 95',  'academie-plus.com'),
  ('Lycée Léopold Sédar Senghor',            'Lycée Public',  'Mbour',       'Thiès',       'Escale Joal',                               '33 957 61 94',  'academie-plus.com'),
  ('Lycée Demba Diop',                       'Lycée Public',  'Mbour',       'Thiès',       'Golf Mbour',                                '33 957 10 32',  'academie-plus.com'),
  ('École Jacques Prévert',                  'Lycée Privé',   'Mbour',       'Thiès',       'Mbour Saly',                                '33 957 52 71',  'academie-plus.com'),
  ('École du Docteur René Guillet',          'Lycée Privé',   'Thiès',       'Thiès',       '75 rue de Prades Escale Sud',               '33 951 33 84',  'academie-plus.com'),

-- ── DIOURBEL / MBACKÉ ────────────────────────────────────────────────────────
  ('Lycée de Diourbel',                      'Lycée Public',  'Diourbel',    'Diourbel',    'Ndayane Thierno Kandji',                    '33 971 45 01',  'academie-plus.com'),
  ('Lycée Ndayane',                          'Lycée Public',  'Diourbel',    'Diourbel',    'Ndayane Thierno Kandji',                    '33 971 30 96',  'academie-plus.com'),
  ('Lycée de Mbacké',                        'Lycée Public',  'Mbacké',      'Diourbel',    'Mbacké ville',                              '33 976 82 03',  'academie-plus.com'),
  ('Lycée de Bambey',                        'Lycée Public',  'Bambey',      'Diourbel',    'Bambey',                                    '33 973 61 31',  'academie-plus.com'),

-- ── KAOLACK / FATICK ─────────────────────────────────────────────────────────
  ('Lycée Valdiodio Ndiaye',                 'Lycée Public',  'Kaolack',     'Kaolack',     'Kaolack ville',                             '33 941 13 28',  'academie-plus.com'),
  ('Lycée Gaston Berger',                    'Lycée Public',  'Kaolack',     'Kaolack',     'Kaolack ville',                             '33 941 13 26',  'academie-plus.com'),
  ('Lycée Technique Commerciale',            'Lycée Public',  'Kaolack',     'Kaolack',     'Kaolack ville',                             '33 941 13 66',  'academie-plus.com'),
  ('Lycée Maba Diakhou Bâ',                  'Lycée Public',  'Nioro du Rip','Kaolack',     'Nioro du Rip',                              '33 944 61 11',  'academie-plus.com'),
  ('Lycée El Hadj Mamadou Diouf',            'Lycée Public',  'Foundiougne', 'Fatick',      'Foundiougne',                               '33 948 12 31',  'academie-plus.com'),
  ('Lycée Coumba Ndoffene Diouf',            'Lycée Public',  'Fatick',      'Fatick',      'Fatick',                                    '33 949 10 30',  'academie-plus.com'),
  ('Lycée Darou Salam',                      'Lycée Public',  'Fatick',      'Fatick',      'Darou Salam',                               '33 949 14 84',  'academie-plus.com'),

-- ── LOUGA ────────────────────────────────────────────────────────────────────
  ('Lycée El Malick Sall',                   'Lycée Public',  'Louga',       'Louga',       'Grand Louga',                               '33 967 49 40',  'academie-plus.com'),
  ('Lycée Malick Sall',                      'Lycée Public',  'Louga',       'Louga',       'Louga',                                     '33 967 12 57',  'academie-plus.com'),
  ('Lycée Massamba Siga Diouf',              'Lycée Public',  'Louga',       'Louga',       'Louga',                                     '33 967 10 99',  'academie-plus.com'),
  ('Lycée Modou Awa Balla Mbacké',           'Lycée Public',  'Louga',       'Louga',       'Louga',                                     '33 967 10 51',  'academie-plus.com'),

-- ── TAMBACOUNDA / MATAM ──────────────────────────────────────────────────────
  ('Lycée Tambacounda',                      'Lycée Public',  'Tambacounda', 'Tambacounda', 'Tambacounda ville',                         '33 981 12 09',  'academie-plus.com'),
  ('Lycée de Matam',                         'Lycée Public',  'Matam',       'Matam',       'Matam',                                     '33 965 62 56',  'academie-plus.com'),

-- ── ZIGUINCHOR / KOLDA / SÉDHIOU ─────────────────────────────────────────────
  ('Lycée Djignabo',                         'Lycée Public',  'Ziguinchor',  'Ziguinchor',  'Avenue Djignabo',                           '33 991 11 18',  'academie-plus.com'),
  ('Lycée Aline Sitoé Diatta',               'Lycée Public',  'Oussouye',    'Ziguinchor',  'Harlem Oussouye',                           '33 993 11 16',  'academie-plus.com'),
  ('Lycée Ahoune Sané',                      'Lycée Public',  'Bignona',     'Ziguinchor',  'Escale, Bignona',                           '33 994 11 09',  'academie-plus.com'),
  ('Lycée Chérif Samsedine Aïdara',          'Lycée Public',  'Ziguinchor',  'Ziguinchor',  'Ziguinchor',                                '33 997 11 39',  'academie-plus.com'),
  ('Lycée Alpha Molo Baldé',                 'Lycée Public',  'Kolda',       'Kolda',       'Escale',                                    '33 996 12 41',  'academie-plus.com'),
  ('Lycée Ibou Diallo',                      'Lycée Public',  'Sédhiou',     'Sédhiou',     'Santassou',                                 '33 995 12 02',  'academie-plus.com');


-- ============================================================
-- CEM RÉGION DE DAKAR — source : openstreetmap.org
-- ============================================================

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES

-- Dakar commune ───────────────────────────────────────────────
  ('CEM de Hann',                            'CEM Public', 'Dakar',       'Dakar', 'Route de Rufisque, Hann Bel-Air',                   NULL, 'openstreetmap.org'),
  ('CEM Ouakam 2',                           'CEM Public', 'Dakar',       'Dakar', 'Rue Ouakam OKM-215, Ouakam',                        NULL, 'openstreetmap.org'),
  ('CEM El Hadj Mamadou Ndiaye',             'CEM Public', 'Dakar',       'Dakar', 'Av. Cheikh Anta Diop, Almadies',                   NULL, 'openstreetmap.org'),
  ('CEM Mansour Sy Malick',                  'CEM Public', 'Dakar',       'Dakar', 'Rue Imam Assane N''Doye, Médina',                   NULL, 'openstreetmap.org'),
  ('CEM Scat Urbam',                         'CEM Public', 'Dakar',       'Dakar', 'Grand Yoff, SCAT URBAM',                            NULL, 'openstreetmap.org'),
  ('CEM Ibrahima Thiaw',                     'CEM Public', 'Dakar',       'Dakar', 'Parcelles Assainies Unité 8',                       NULL, 'openstreetmap.org'),
  ('CEM HLM Grand Yoff',                     'CEM Public', 'Dakar',       'Dakar', 'HLM Grand Yoff, Rue GY-250',                        NULL, 'openstreetmap.org'),
  ('CEM Unité 19',                           'CEM Public', 'Dakar',       'Dakar', 'VDN, Parcelles Assainies',                          NULL, 'openstreetmap.org'),
  ('CEM Patte d''Oie',                       'CEM Public', 'Dakar',       'Dakar', 'La Corniche Patte d''Oie',                          NULL, 'openstreetmap.org'),
  ('CEM Mame Thierno Birahim Mbacké',        'CEM Public', 'Dakar',       'Dakar', 'Bvd Mamadou Dia, Médina',                          NULL, 'openstreetmap.org'),
  ('CEM Seydina Issa Laye',                  'CEM Public', 'Dakar',       'Dakar', 'Allée Seydina Limoulaye, Cambérène',               NULL, 'openstreetmap.org'),
  ('CEM Adama Ndiaye',                       'CEM Public', 'Dakar',       'Dakar', 'Rue BIS-82, Biscuiterie',                           NULL, 'openstreetmap.org'),

-- Pikine ──────────────────────────────────────────────────────
  ('CEM Camp Thiaroye',                      'CEM Public', 'Thiaroye',    'Dakar', 'Thiaroye-Gare',                                     NULL, 'openstreetmap.org'),
  ('CEM Thiaroye',                           'CEM Public', 'Thiaroye',    'Dakar', 'Rue 2, Thiaroye-Gare',                              NULL, 'openstreetmap.org'),
  ('CEM Ndiawar Diagne',                     'CEM Public', 'Thiaroye',    'Dakar', 'Rue 2, Thiaroye-Gare',                              NULL, 'openstreetmap.org'),
  ('CEM Ndiarka Diagne',                     'CEM Public', 'Pikine',      'Dakar', 'Djidah Thiaroye Kaw, Pikine',                       NULL, 'openstreetmap.org'),
  ('CEM Pikine 9',                           'CEM Public', 'Pikine',      'Dakar', 'Pikine Nord',                                       NULL, 'openstreetmap.org'),
  ('CEM Diamaguene SICAP Mbao',              'CEM Public', 'Pikine',      'Dakar', 'Rue DSM 678, Diamaguène SICAP Mbao',                NULL, 'openstreetmap.org'),

-- Mbao ────────────────────────────────────────────────────────
  ('CEM Mbao',                               'CEM Public', 'Mbao',        'Dakar', 'Deuxième Pont, Mbao',                               NULL, 'openstreetmap.org'),
  ('CEM Mbao Extension',                     'CEM Public', 'Mbao',        'Dakar', 'Deuxième Pont, Mbao',                               NULL, 'openstreetmap.org'),

-- Guédiawaye ──────────────────────────────────────────────────
  ('CEM Josef Korea',                        'CEM Public', 'Guédiawaye',  'Dakar', 'Sam Notaire, Guédiawaye',                           NULL, 'openstreetmap.org'),
  ('CEM Pikine Est A',                       'CEM Public', 'Guédiawaye',  'Dakar', 'Wakhinane Nimzatt, Guédiawaye',                     NULL, 'openstreetmap.org'),
  ('CEM Banque Islamique',                   'CEM Public', 'Guédiawaye',  'Dakar', 'Sam Notaire, Guédiawaye',                           NULL, 'openstreetmap.org'),
  ('CEM Ndiarka Diane',                      'CEM Public', 'Guédiawaye',  'Dakar', 'Golf Sud, Guédiawaye',                              NULL, 'openstreetmap.org'),

-- Keur Massar ─────────────────────────────────────────────────
  ('CEM Keur Massar 1',                      'CEM Public', 'Keur Massar', 'Dakar', 'Route de Malika, Keur Massar',                      NULL, 'openstreetmap.org'),
  ('CEM Samba Khandji',                      'CEM Public', 'Keur Massar', 'Dakar', 'Route de Malika, Keur Massar',                      NULL, 'openstreetmap.org'),
  ('CEM Ainoumady',                          'CEM Public', 'Keur Massar', 'Dakar', 'Avenue Sotrac, Keur Massar Sud',                    NULL, 'openstreetmap.org'),
  ('CEM Momar Mareme Diop',                  'CEM Public', 'Yeumbeul',    'Dakar', 'Route de la Marine, Yeumbeul Nord',                 NULL, 'openstreetmap.org'),

-- Rufisque ────────────────────────────────────────────────────
  ('CEM Momar Séne Waly',                    'CEM Public', 'Rufisque',    'Dakar', 'Rufisque Est',                                      NULL, 'openstreetmap.org'),
  ('CEM Camp Marchand',                      'CEM Public', 'Rufisque',    'Dakar', 'Contournement Sococim, Rufisque Est',               NULL, 'openstreetmap.org'),
  ('CEM Darou Salam',                        'CEM Public', 'Rufisque',    'Dakar', 'Rufisque Nord',                                     NULL, 'openstreetmap.org'),
  ('CEM Pionnier du Syndicalisme Africain',  'CEM Public', 'Rufisque',    'Dakar', 'Rufisque Nord',                                     NULL, 'openstreetmap.org'),
  ('CEM Mansour Sy',                         'CEM Public', 'Rufisque',    'Dakar', 'Rue Ousmane Socé Diop, Rufisque Est',               NULL, 'openstreetmap.org'),
  ('CEM Académiciens',                       'CEM Public', 'Rufisque',    'Dakar', 'Rue Léon Armand, Rufisque Est',                     NULL, 'openstreetmap.org'),
  ('CEM Bargny',                             'CEM Public', 'Bargny',      'Dakar', 'Rue de Bargny Guedj, Bargny',                       NULL, 'openstreetmap.org'),
  ('CEM Niaga',                              'CEM Public', 'Rufisque',    'Dakar', 'Route du Lac Rose, Niaga',                          NULL, 'openstreetmap.org'),
  ('CEM de Tivaouane Peulh',                 'CEM Public', 'Rufisque',    'Dakar', 'Cité APIX, Tivaouane Peulh',                        NULL, 'openstreetmap.org'),
  ('CEM APIX',                               'CEM Public', 'Rufisque',    'Dakar', 'Cité APIX, Tivaouane Peulh',                        NULL, 'openstreetmap.org'),
  ('CEM Sebi Ponty',                         'CEM Public', 'Sébikhotane', 'Dakar', 'Sebi Ponty, Sébikhotane',                           NULL, 'openstreetmap.org'),
  ('CEM Dougar',                             'CEM Public', 'Diamniadio',  'Dakar', 'Dougar, Diamniadio',                                NULL, 'openstreetmap.org');


-- ============================================================
-- CEM RÉGION DE SAINT-LOUIS — source : openstreetmap.org
-- ============================================================

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES
  ('CEM Pikine Sor',                         'CEM Public', 'Saint-Louis', 'Saint-Louis', 'Sor, Diaminar, Saint-Louis',          NULL, 'openstreetmap.org'),
  ('CEM Amadou Fara Mbodj',                  'CEM Public', 'Saint-Louis', 'Saint-Louis', 'Bvd El Hadj Momar Sourang, Sor',      NULL, 'openstreetmap.org'),
  ('CEM Amadou Mar Diop',                    'CEM Public', 'Saint-Louis', 'Saint-Louis', 'Av. Jean Mermoz, Île Nord',           NULL, 'openstreetmap.org'),
  ('CEM Ndiawar Sarr',                       'CEM Public', 'Saint-Louis', 'Saint-Louis', 'Rue Maître Babacar Seye, Île Sud',    NULL, 'openstreetmap.org'),
  ('CEM Amadou Dugay Cledor Ndiaye',         'CEM Public', 'Saint-Louis', 'Saint-Louis', 'Rue Maître Babacar Seye, Île Sud',    NULL, 'openstreetmap.org'),
  ('CEM 1 de Richard-Toll',                  'CEM Public', 'Richard-Toll','Saint-Louis', 'Sanda, Richard-Toll',                 NULL, 'openstreetmap.org'),
  ('CEM Richard-Toll 2',                     'CEM Public', 'Richard-Toll','Saint-Louis', 'Richard-Toll',                        NULL, 'openstreetmap.org'),
  ('CEM de Rosso-Sénégal',                   'CEM Public', 'Rosso',       'Saint-Louis', 'Rosso Sénégal, Dagana',               NULL, 'openstreetmap.org');


-- ============================================================
-- CEM RÉGION DE ZIGUINCHOR — source : openstreetmap.org
-- ============================================================

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES
  ('CEM Boucotte Sud',                       'CEM Public', 'Ziguinchor', 'Ziguinchor', 'Boucotte Sud, Ziguinchor',              NULL, 'openstreetmap.org'),
  ('CEM Malick Fall',                        'CEM Public', 'Ziguinchor', 'Ziguinchor', 'Rue Révéran Père Jean Esvan, Escale',   NULL, 'openstreetmap.org'),
  ('CEM Marie Curie Annexe',                 'CEM Public', 'Ziguinchor', 'Ziguinchor', 'Av. Émile Badiane, Boucotte Nord',     NULL, 'openstreetmap.org'),
  ('CEM Technique Amical Cabral',            'CEM Public', 'Ziguinchor', 'Ziguinchor', 'Tilène, Djibock, Ziguinchor',          NULL, 'openstreetmap.org'),
  ('CEM Arfang Bessire Sonko',               'CEM Public', 'Ziguinchor', 'Ziguinchor', 'Ziguinchor',                           NULL, 'openstreetmap.org'),
  ('CEM Tété Diadhiou',                      'CEM Public', 'Ziguinchor', 'Ziguinchor', 'Ziguinchor',                           NULL, 'openstreetmap.org'),
  ('CEM Aline Sitoé Diatta',                 'CEM Public', 'Oussouye',   'Ziguinchor', 'Route de Loudia, Oussouye',            NULL, 'openstreetmap.org'),
  ('CEM Ahoune Sané',                        'CEM Public', 'Bignona',    'Ziguinchor', 'Bignona',                              NULL, 'openstreetmap.org');


-- ============================================================
-- ÉTABLISSEMENTS À VILLE NON CONFIRMÉE — À VÉRIFIER
-- Décommenter et compléter la ville après vérification
-- ============================================================

-- ('Lycée Mayoro Wéllé',           'Lycée Public', '??? (33 963)', 'Louga ?',    NULL, '33 963 11 71', 'academie-plus.com'),
-- ('Lycée Baba Ndiongue',          'Lycée Public', '??? (33 965)', 'Matam ?',    NULL, '33 965 12 17', 'academie-plus.com'),
-- ('Lycée Serigne Khassim Mbacké', 'Lycée Public', '??? (33 947)', 'Kaffrine ?', NULL, '33 947 31 47', 'academie-plus.com'),


-- ============================================================
-- ÉCOLES PRIVÉES — classement vérifié BAC
-- source : classement vérifié
-- ============================================================
-- NOTE : Maison d'Éducation Mariama Bâ (Gorée) est déjà présente
-- sous le nom "Lycée Mariama Bâ" (public) — pas de doublon ajouté.

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES

-- ── DAKAR ────────────────────────────────────────────────────────────────────
  ('Institution Notre-Dame',                       'Lycée Privé', 'Dakar',       'Dakar',       'Av. Georges Pompidou, Plateau',              NULL, 'classement vérifié'),
  ('École Catholique Notre-Dame du Liban',          'Lycée Privé', 'Dakar',       'Dakar',       'Mermoz',                                     NULL, 'classement vérifié'),
  ('Cours Secondaire Sacré-Cœur',                  'Lycée Privé', 'Dakar',       'Dakar',       'Sacré-Cœur 2',                               NULL, 'classement vérifié'),
  ('École Privée Anne-Marie Javouhey',             'Lycée Privé', 'Dakar',       'Dakar',       'Dakar',                                      NULL, 'classement vérifié'),
  ('École Privée Mame Abdou Dabakh',               'Lycée Privé', 'Dakar',       'Dakar',       'Dakar',                                      NULL, 'classement vérifié'),
  ('Mikado',                                        'Lycée Privé', 'Dakar',       'Dakar',       'Hann Maristes',                              NULL, 'classement vérifié'),
  ('Complexe Scolaire Avenir Apprenti Sage',        'Lycée Privé', 'Dakar',       'Dakar',       'Dakar',                                      NULL, 'classement vérifié'),
  ('Lycée d''Excellence Privé Birago Diop',         'Lycée Privé', 'Dakar',       'Dakar',       'Quartier Golf, Guédiawaye',                  NULL, 'classement vérifié'),

-- ── PIKINE ───────────────────────────────────────────────────────────────────
  ('École Privée Chamsoudine',                     'Lycée Privé', 'Pikine',      'Dakar',       'Pikine',                                     NULL, 'classement vérifié'),

-- ── SAINT-LOUIS ──────────────────────────────────────────────────────────────
  ('École Privée Didier Marie',                    'Lycée Privé', 'Saint-Louis', 'Saint-Louis', 'Saint-Louis',                                NULL, 'classement vérifié'),
  ('Lycée d''Excellence Privé Aimé Césaire',        'Lycée Privé', 'Saint-Louis', 'Saint-Louis', 'Saint-Louis',                                NULL, 'classement vérifié'),

-- ── LOUGA ────────────────────────────────────────────────────────────────────
  ('Lycée d''Excellence Privé Léon Gontran Damas',  'Lycée Privé', 'Louga',       'Louga',       'Louga',                                      NULL, 'classement vérifié');


-- ============================================================
-- ÉCOLES PRÉCÉDEMMENT MENTIONNÉES — vérification et activation
-- source : vérifié web
-- ============================================================

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES
  ('Collège Bilingue de Dakar',                    'CEM Privé',   'Dakar', 'Dakar', 'Sacré-Cœur 3, Keur Gorgui',   '33 860 60 10', 'vérifié web'),
  ('CASE (Collège Africain Sports-Études)',         'Lycée Privé', 'Dakar', 'Dakar', 'Sotrac Mermoz n°37C',          NULL,           'vérifié web'),
  ('Cours Privés Seydina Mandione Laye',           'Lycée Privé', 'Dakar', 'Dakar', 'Yoff',                         NULL,           'vérifié web'),
  ('Groupe Scolaire Les Flamboyants',              'Lycée Privé', 'Dakar', 'Dakar', 'Dakar',                        NULL,           'vérifié web');


-- ============================================================
-- CEM ET COLLÈGES PRIORITAIRES ZONE MERMOZ/SACRÉ-CŒUR ET DAKAR
-- source : vérifié web
-- ============================================================

INSERT INTO etablissements_senegal (nom, type, ville, region, adresse, telephone, source) VALUES

-- ── Zone Mermoz – Sacré-Cœur ─────────────────────────────────────────────────
  ('CEM Adama Diallo',                             'CEM Public',               'Dakar', 'Dakar', 'Sicap Karack, Mermoz-Sacré-Cœur', NULL, 'vérifié web'),
  ('Collège Galandou Diouf',                       'Collège Public',           'Dakar', 'Dakar', 'Mermoz Sacré-Cœur',               NULL, 'vérifié web'),
  ('Cours Sacré-Cœur',                             'Collège Privé Catholique', 'Dakar', 'Dakar', 'Sacré-Cœur 1',                    NULL, 'vérifié web'),

-- ── Autres CEM publics de Dakar ──────────────────────────────────────────────
  ('CEM Ousmane Socé Diop',                        'CEM Public',               'Dakar', 'Dakar', 'Dakar',                           NULL, 'vérifié web'),
  ('CEM Manguier 1',                               'CEM Public',               'Dakar', 'Dakar', 'Manguier, Dakar',                 NULL, 'vérifié web'),
  ('CEM El Hadji Ibrahima Thiaw',                  'CEM Public',               'Dakar', 'Dakar', 'Dakar',                           NULL, 'vérifié web'),

-- ── Écoles privées réputées de Dakar ─────────────────────────────────────────
  ('Collège Cardinal Hyacinthe Thiandoum',         'Collège Privé Catholique', 'Dakar', 'Dakar', 'Grand Yoff',                      NULL, 'vérifié web'),
  ('Les Pédagogues',                               'Groupe Scolaire Privé',    'Dakar', 'Dakar', 'Dakar',                           NULL, 'vérifié web'),
  ('Yavuz Sélim',                                  'Groupe Scolaire Privé',    'Dakar', 'Dakar', 'Dakar',                           NULL, 'vérifié web'),
  ('Collège 3ème Millénaire',                      'Collège Privé',            'Dakar', 'Dakar', 'Dakar',                           NULL, 'vérifié web');
