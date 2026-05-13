"""
Scraper épreuves & corrigés BAC sénégalais — officedubac.sn
Télécharge les PDFs, les uploade dans Supabase Storage, et insère les métadonnées.

Usage:
    pip install -r requirements.txt
    python scrape_bac.py [--dry-run] [--no-download] [--no-storage] [--no-db]

Options:
    --dry-run      Affiche les entrées sans rien faire
    --no-download  Ne télécharge pas les PDFs localement (utilise les fichiers existants)
    --no-storage   Ne uploade pas dans Supabase Storage
    --no-db        N'insère pas en base de données

Variables d'environnement requises :
    NEXT_PUBLIC_SUPABASE_URL      URL de ton projet Supabase
    SUPABASE_SERVICE_ROLE_KEY     Clé service role (Settings > API)
"""

import os
import time
import argparse
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(Path(__file__).parent / ".env")

# ── Configuration ───────────────────────────────────────────────────────────

BASE_DIR      = Path(__file__).parent / "downloads"
BUCKET        = "epreuves-bac"
DELAY_SEC     = 1.5   # délai entre requêtes (politesse envers officedubac.sn)
HEADERS       = {"User-Agent": "Mozilla/5.0 (compatible; GSN-BAC-Scraper/1.0; educational)"}

SUPABASE_URL  = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY  = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# ── Manifest complet de toutes les URLs trouvées ─────────────────────────────
#
# Format de chaque entrée :
#   (annee, serie, matiere, type, url)
#
# type  = "epreuve" | "corrige"
# serie = "L" | "S1" | "S2" | "L-AR" | "LA" | "S1A" | "S2A" | "STEG" | "STIDD" | "F6" | "T1" | "T2" | "S3" | "LV1" | "LV2" | "toutes"

MANIFEST = [

    # ═══════════════════════════════════════════════════════════════
    # 2025 — SESSION NORMALE — 1er GROUPE — ÉPREUVES
    # ═══════════════════════════════════════════════════════════════

    (2025, "S1/S1A/S3", "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/EPREUVE-MATHS-S1S1AS3.pdf"),
    (2025, "S2/S2A/S4/S5", "Mathématiques",    "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/EPREUVE-MATHS-S2S2AS4S5-2025.pdf"),
    (2025, "L",          "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/MATHS-L-1.pdf"),
    (2025, "L-AR",       "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/maths-L-ar-1.pdf"),
    (2025, "S2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Sujet-SVT-S2-2025.pdf"),
    (2025, "L2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Sujet-SVT-L2-1er-groupe.pdf"),
    (2025, "S2",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Sciences-PHYSIQUES-S2_-SUJET-1er-groupe25.pdf"),
    (2025, "S1",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/sujet-S1_SCPH-2025.pdf"),
    (2025, "L2",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/SPCH-L2-1er-gr-2025.pdf"),
    (2025, "L",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/philo-L.pdf"),
    (2025, "L-AR",       "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/SUJET-philo-l-ar-2025-1er-gr.pdf"),
    (2025, "S",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/PHILO-S.pdf"),
    (2025, "L",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/francais-S-1.pdf"),
    (2025, "S1A/S2A",    "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Francais-S1A-S2A-1.pdf"),
    (2025, "L-AR",       "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/HG-L-AR.pdf"),
    (2025, "L/S",        "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/HG-L-S.pdf"),
    (2025, "L2",         "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ECONOMI-GENERALE-L2.pdf"),
    (2025, "toutes",     "Anglais LV1",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/anglais-lv1.pdf"),
    (2025, "L-AR",       "Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/anglais-l-ar.pdf"),
    (2025, "S3",         "Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ANGLAIS_S3-2025.pdf"),
    (2025, "S1/S2/S4/S5","Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ANGLAIS-S1-S1A-S2-S2A-S4-et-S5.pdf"),
    (2025, "toutes",     "Arabe LV1",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ARABE-LV1.pdf"),
    (2025, "toutes",     "Espagnol LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ESPAGN-LV1.pdf"),
    (2025, "toutes",     "Portugais LV1",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/PORTUGAIS-LV1.pdf"),
    (2025, "toutes",     "Allemand LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ALL-LV1.pdf"),
    (2025, "toutes",     "Anglais LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ANGLAIS-LV2.pdf"),
    (2025, "toutes",     "Arabe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ARABE-LV2.pdf"),
    (2025, "toutes",     "Espagnol LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ESPAGNOL-LV2.pdf"),
    (2025, "toutes",     "Italien LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ITALIEN-LV2.pdf"),
    (2025, "toutes",     "Russe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/RUSSE-LV2.pdf"),
    (2025, "toutes",     "Portugais LV2",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/PORT-LV2.pdf"),
    (2025, "toutes",     "Allemand LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ALL-LV2.pdf"),
    (2025, "L2",         "Études Islamiques",   "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ETUDES-ISLAMIQUES.pdf"),
    (2025, "L2",         "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ECONOMI-GENERALE-L2.pdf"),
    (2025, "L-AR",       "LLA",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/LLA-L-AR-.pdf"),
    (2025, "LA/S1A/S2A", "LLA",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/LLA-LA-S1A-et-S2A.pdf"),
    (2025, "LA",         "Civilisation",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/CIVILISATION-LA.pdf"),
    (2025, "S1A/S2A",    "Civilisation",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Civilisation-Arabo-Islamique-S1A-et-S2A.pdf"),
    (2025, "toutes",     "Latin",               "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Latin.pdf"),
    (2025, "toutes",     "Grec",                "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/grec1.pdf"),

    # ── 2025 SESSION NORMALE — 2e GROUPE — ÉPREUVES ──
    (2025, "S1/S3",      "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/maths-s1-s3.pdf"),
    (2025, "S2",         "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/maths-S2.pdf"),
    (2025, "L",          "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/maths-L.pdf"),
    (2025, "L-AR",       "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/maths-l-ar.pdf"),
    (2025, "S2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/svt-s2-2e-gr.pdf"),
    (2025, "L2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Sujet-SVT-L2-2eme-groupe.pdf"),
    (2025, "L2",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/SCIENECES-PHYSIQUES-L2.pdf"),
    (2025, "S",          "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/SCPH-S-GP2.pdf"),
    (2025, "S1",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Sujet-SVT-S1-2E-TOUR-2025.pdf"),
    (2025, "L",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/philo-L.pdf"),
    (2025, "L-AR",       "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/PHILO-L-AR.pdf"),
    (2025, "S",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/PHILO-S-1.pdf"),
    (2025, "L",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/FRANCAIS-L-2e-Gr-.pdf"),
    (2025, "S",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/FRANCAIS-S.pdf"),
    (2025, "L-AR",       "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/HG-L-AR.pdf"),
    (2025, "L/S",        "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/HG-L-S.pdf"),
    (2025, "L2",         "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ECONOMIE-L2.pdf"),
    (2025, "toutes",     "Anglais LV1",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ANGL-LV1-2E-GR.pdf"),
    (2025, "toutes",     "Arabe LV1",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ARBE-LV1-2E-GR.pdf"),
    (2025, "toutes",     "Espagnol LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/esp-lv-1-2-egr.pdf"),
    (2025, "toutes",     "Portugais LV1",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/port-lv1-2e-gr.pdf"),
    (2025, "toutes",     "Allemand LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ALLEMAND-LV1-2e-GR-.pdf"),
    (2025, "toutes",     "Anglais LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ANGL-LVII.pdf"),
    (2025, "L-AR",       "Anglais LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ANGL-LVII-L-AR.pdf"),
    (2025, "toutes",     "Arabe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ARA-LVII.pdf"),
    (2025, "toutes",     "Espagnol LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ESPA-LVII.pdf"),
    (2025, "toutes",     "Italien LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/ITALIEN-LVII.pdf"),
    (2025, "toutes",     "Portugais LV2",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/PORT-LVII.pdf"),
    (2025, "toutes",     "Russe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/RUSSE-LVII.pdf"),
    (2025, "L-AR",       "LLA",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/LLA-L-AR-2E-GR.pdf"),
    (2025, "LA/S1A/S2A", "LLA",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/LLA-LA-ET-SA-2E-GR.pdf"),
    (2025, "L-AR",       "Français LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/FRAN-LVI-L-AR.pdf"),
    (2025, "LA",         "Français LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/FRA-LVI-LA.pdf"),
    (2025, "toutes",     "Études Islamiques",   "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/Etudes-Islamiques.pdf"),
    (2025, "toutes",     "Grec",                "epreuve", "https://officedubac.sn/wp-content/uploads/2025/07/grec.pdf"),

    # ── 2025 BAC TECHNIQUE — ÉPREUVES ──
    (2025, "STEG",       "Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/Anglais_STEG-2025.pdf"),
    (2025, "STIDD/T1/T2","Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/ANGLAIS_STIDD-T1T2_2025.pdf"),
    (2025, "F6",         "Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/ANGLAIS_F6_2025.pdf"),
    (2025, "STEG",       "Droit",               "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/DROIT-STEG-GP1-2025.pdf"),
    (2025, "STEG",       "Management",          "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/Management-STEG-GP1-20250021.pdf"),
    (2025, "STEG",       "Espagnol",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/ESPAGNOL-STEG-GP1-2025.pdf"),
    (2025, "STEG/STIDD", "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/FRANCAIS-TEC-STIDD-TF6-GP1-2025.pdf"),
    (2025, "F6",         "Physique",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/Epreuve-physique-F6-2025.pdf"),
    (2025, "F6",         "Chimie",              "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/SUJET_1_2_F6_CHIMIE-2025.pdf"),
    (2025, "STEG/STIDD", "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/Philosophie-STEG-STIDD-GP1-2025.pdf"),
    (2025, "STEG",       "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/ECONOMIE-STEG-GP1-2025.pdf"),
    (2025, "STIDD",      "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/MATHS-STIDD_T-G1-2025.pdf"),
    (2025, "F6",         "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/MATHS-F6_G1-2025.pdf"),
    (2025, "T1",         "Mécanique",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/06/Mecanique-T1-GP1-2025.pdf"),

    # ── 2025 SESSION REMPLACEMENT — ÉPREUVES ──
    (2025, "S2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/SVT-S2-1ER-GR-.pdf"),
    (2025, "S2",         "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/MATHS-S2_RGR12025.pdf"),
    (2025, "S2",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/Sciences-Physiques-S2-1er-gr.pdf"),
    (2025, "L",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/FRANCAIS-L-1ER-GR.pdf"),
    (2025, "LA",         "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/francais-LA-1ER-GR-.pdf"),
    (2025, "L-AR",       "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/francais-L-AR-1ER-GR-.pdf"),
    (2025, "L/S",        "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/HG-L-S-1ER-GR-.pdf"),
    (2025, "L-AR",       "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/HG-L-AR-1ER-GR.pdf"),
    (2025, "L",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/PHILO-L-1er-gr.pdf"),
    (2025, "L-AR",       "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/phio-L-AR-1ER-GR.pdf"),
    (2025, "S",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/PHILO-S-1ER-GR.pdf"),
    (2025, "STEG",       "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/philo-STEG-1ER-GR.pdf"),
    (2025, "L-AR",       "Anglais",             "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/ANGLAIS-L-AR-1ER-GR.pdf"),
    (2025, "toutes",     "Anglais LV1",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/LV1-ANGLAIS-1ER-GR.pdf"),
    (2025, "toutes",     "Arabe LV1",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/LV1-ARABE-1ER-GR.pdf"),
    (2025, "toutes",     "Espagnol LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/LV1-ESPAGNOL-1ER-GR.pdf"),
    (2025, "toutes",     "Portugais LV1",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/portugais-lv1-1er-gr.pdf"),
    (2025, "toutes",     "Allemand LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/LV1-ALLEMAND.pdf"),
    (2025, "toutes",     "Anglais LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/ANGLAIS-LV2-1ER-GR-.pdf"),
    (2025, "toutes",     "Arabe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/lv2-arabe-1er-gr-.pdf"),
    (2025, "toutes",     "Espagnol LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/LV2-ESPAGNOL-1ER-GR.pdf"),
    (2025, "toutes",     "Italien LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/lv2-IITALIEN-.pdf"),
    (2025, "toutes",     "Portugais LV2",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/LV2-PORT-1ER-GR-.pdf"),
    (2025, "toutes",     "Allemand LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/lv2-allmand-1er-gr-.pdf"),
    (2025, "STEG",       "Sciences Économiques","epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/SCIE-ECO-STEG-1ER-GR.pdf"),
    (2025, "LA",         "Civilisation",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/civilisation-LA.pdf"),
    (2025, "L-AR",       "Études Islamiques",   "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/ETUDES-ISLAMIQUES-L-AR-1ER-GR-.pdf"),
    (2025, "STEG",       "GCF",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/GCF-GP1-R-2025.pdf"),
    (2025, "STEG",       "Informatique",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/10/Informatique-R-2025.pdf"),

    # ═══════════════════════════════════════════════════════════════
    # 2025 — CORRIGÉS
    # ═══════════════════════════════════════════════════════════════

    # Session normale - 1er groupe
    (2025, "S1",         "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Corrige_MATHS-S1G1.pdf"),
    (2025, "S2",         "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGES2_12025.pdf"),
    (2025, "S1",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Corrige-SVT-S1-2025.pdf"),
    (2025, "S2",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Corrige-SVT-S2-2025.pdf"),
    (2025, "L2",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Corrige-SVT-L2-1er-groupe-1.pdf"),
    (2025, "S1",         "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrigeS1_PC2025-1.pdf"),
    (2025, "S2",         "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige_S2_1ergroupe-SCPH.pdf"),
    (2025, "L2",         "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Corrige-SCPH-Bac-L2-1er-gr-2025-1.pdf"),
    (2025, "L",          "Philosophie",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Canevas-Bac-philo-L-2025-1-1.pdf"),
    (2025, "S",          "Philosophie",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CANEVAS-SERIE-S-BAC-2025.pdf"),
    (2025, "L-AR",       "Philosophie",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/grille-de-correction-philososphie-L-AR.pdf"),
    (2025, "L/S",        "Histoire-Géographie", "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Grille-de-correction-Bac-Juillet-2025.pdf"),
    (2025, "L-AR",       "Histoire-Géographie", "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/EXEMPLE-DE-GRILLE-DE-CORRECTION-POUR-HG-L-AR.pdf"),
    (2025, "L",          "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/BAC-2025-SESSION-NORMAL-SERIES-L-CORRIGES-EPREUVES-PREMIER-GROUPE-1.pdf"),
    (2025, "LA",         "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/BAC_2025_SESSION-NORMAL_SERIES-LA_CORRIGES-EPREUVES_PREMIER-GROUPE.pdf"),
    (2025, "L-AR",       "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/BAC-2025_SERIE-L-AR_CORRIGE-EPREUVE-FRANCAIS_SESSION-NORMALE_PREMIER-GROUPE.pdf"),
    (2025, "S1A/S2A",    "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/FrancaisSERIES_S1AS2A_CORRIGES_EPREUVES_PREMIER_GROUPE.docx.pdf"),
    (2025, "toutes",     "Anglais LV1",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-anglais-lv1.pdf"),
    (2025, "toutes",     "Arabe LV1",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-ARABE-LV1.pdf"),
    (2025, "toutes",     "Espagnol LV1",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-ESP-LV1.pdf"),
    (2025, "toutes",     "Portugais LV1",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-PORTUGAIS-LV1.pdf"),
    (2025, "toutes",     "Allemand LV1",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-ALL-LV1.pdf"),
    (2025, "toutes",     "Anglais LV2",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-ANGLAIS-LV2.pdf"),
    (2025, "toutes",     "Arabe LV2",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-ARABE-LV2.pdf"),
    (2025, "toutes",     "Espagnol LV2",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-ESP-LV2.pdf"),
    (2025, "toutes",     "Italien LV2",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-ITALIEN-LV2.pdf"),
    (2025, "toutes",     "Portugais LV2",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-PORT-LV2.pdf"),
    (2025, "toutes",     "Russe LV2",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/CORRIGE-RUSSE-LV2.pdf"),
    (2025, "toutes",     "Latin",               "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-LATIN.pdf"),
    (2025, "L/S",        "LLA",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/GRILLE-DE-COERRECTION-DISSSERTATION-LLA-TTES-SERIES.pdf"),
    (2025, "L-AR",       "Études Islamiques",   "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/grille-de-correction-ETUDES-ISLAMIQUES-L-AR-Dissertation.pdf"),
    (2025, "LA/SA",      "Civilisation",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/grille-de-correction-de-civilisation-LA-ou-SA-Dissertation.pdf"),
    # Session normale - 2e groupe
    (2025, "S2",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-SVT-S2-2e-gr.pdf"),
    (2025, "S1",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-SVT-S1-2E-TOUR-2025.pdf"),
    (2025, "S",          "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Corrige-S-2eme-gr-2025-2.pdf"),
    (2025, "L",          "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/FRANCAIS_SERIES-L_CORRIGES-EPREUVES_SECOND-GROUPE.pdf"),
    (2025, "S",          "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Fran-SERIES-S_CORRIGES-EPREUVES_SECOND-GROUPE.pdf"),
    (2025, "S2A",        "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Fran-SERIES-S2A_CORRIGES-EPREUVES_SECOND-GROUPE.pdf"),
    (2025, "toutes",     "Anglais LV1 2eGr",    "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-angl-lv1-2e-gr.pdf"),
    (2025, "toutes",     "Arabe LV1 2eGr",      "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-ARA-LV1-2E-GR.pdf"),
    (2025, "toutes",     "Espagnol LV1 2eGr",   "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-esp-lv1-2e-gr.pdf"),
    (2025, "toutes",     "Portugais LV1 2eGr",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/corrige-port-lv1-2e-gr.pdf"),
    (2025, "L/S",        "Histoire-Géographie", "corrige", "https://officedubac.sn/wp-content/uploads/2025/07/Grille-HG-2eme-groupe.pdf"),
    # Session remplacement
    (2025, "S2",         "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/corrige1er-Sc-ph-S2-1ER-gr-1-1.pdf"),
    (2025, "S2",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-SVT-S2-1ER-GR.pdf"),
    (2025, "S2",         "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-MATHS-S2_RGR12025.pdf"),
    (2025, "L-AR",       "Anglais",             "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/corrige-ANGL-L-AR-1ER-GR.pdf"),
    (2025, "toutes",     "Anglais LV1",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV1-ANGLAIS-1ER-GR.pdf"),
    (2025, "toutes",     "Arabe LV1",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV1-ARABE-1ER-GR.pdf"),
    (2025, "toutes",     "Espagnol LV1",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV1-ESPAGNOL-1ER-GR.pdf"),
    (2025, "toutes",     "Portugais LV1",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/corrige-lv1-port-1r-er-gr.pdf"),
    (2025, "toutes",     "Anglais LV2",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV2-ANG-1ER-GR.pdf"),
    (2025, "toutes",     "Arabe LV2",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/Corrige-lv2-arabe-1er-gr.pdf"),
    (2025, "toutes",     "Espagnol LV2",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV2-ESP-1ER-GR.pdf"),
    (2025, "toutes",     "Italien LV2",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV2-ITALIEN-1ER-GR.pdf"),
    (2025, "toutes",     "Portugais LV2",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV2-PORT-1ER-GR.pdf"),
    (2025, "L-AR",       "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-FR-L-AR-1ER-GR.pdf"),
    (2025, "LA",         "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-FR-LA-1ER-GR.pdf"),
    # Bac Technique - corrigés
    (2025, "F6",         "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/06/corrige-physique-F6.pdf"),
    (2025, "F6",         "Chimie",              "corrige", "https://officedubac.sn/wp-content/uploads/2025/06/SUJET_1_2_F6_CHIMIE-2025_CORRIGE.pdf"),
    (2025, "F6",         "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/06/Corrige_MATHS-F6_G1-2025.pdf"),
    (2025, "T1",         "Mécanique",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/06/Corrige-Mecanique-Bac-t1.pdf"),
    (2025, "STIDD",      "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/06/Corrige_-MATHS-STIDD-T-_G1-2025.pdf"),

    # ═══════════════════════════════════════════════════════════════
    # 2024 — ÉPREUVES
    # ═══════════════════════════════════════════════════════════════

    (2024, "toutes",     "Anglais LV1",         "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/anglais-lv1-1er-gr-.pdf"),
    (2024, "toutes",     "Arabe LV1",           "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/arabe-lv1-1er-gr-24.pdf"),
    (2024, "toutes",     "Espagnol LV1",        "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/espagnol-lv1-1er-gr-.pdf"),
    (2024, "toutes",     "Portugais LV1",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/portugais-lv1-1er-gr-.pdf"),
    (2024, "toutes",     "Anglais LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/anglais-lv2-1er-gr-.pdf"),
    (2024, "toutes",     "Arabe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/arabe-lv2.pdf"),
    (2024, "toutes",     "Espagnol LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/espagnol-lv2-1er-gr-.pdf"),
    (2024, "toutes",     "Italien LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/Italien-lv2-1er-gr-.pdf"),
    (2024, "toutes",     "Portugais LV2",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/PORTUGAIS-LV2-1ER-GR-.pdf"),
    (2024, "toutes",     "Russe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/RUSSE-LV2-1ER-GR-.pdf"),
    (2024, "toutes",     "Allemand LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ALLEMAND-LV2-2024.pdf"),
    (2024, "toutes",     "Grec",                "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/Grec1er-gr-.pdf"),
    (2024, "toutes",     "Latin",               "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/LATIN-1ER-GR-24.pdf"),
    (2024, "L",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FRANCAIS-L.pdf"),
    (2024, "LA",         "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FRANCAIS-LA.pdf"),
    (2024, "L-AR",       "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FRANCAIS-LAR.pdf"),
    (2024, "S",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/Epreuve-S2A.pdf"),
    (2024, "L-AR",       "LLA",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/LLA-L-AR-1ER-GR-24.pdf"),
    (2024, "LA/S1A/S2A", "LLA",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/LLA-LA-S1A-ET-S2A-1ER-GR-24.pdf"),
    (2024, "L",          "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/Maths-L-1er-groupe.pdf"),
    (2024, "L-AR",       "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/maths-l-ar-1er-gr.pdf"),
    (2024, "S1/S3",      "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/MATHS-S1S3.pdf"),
    (2024, "S2/S4/S5",   "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/MATHS-S2S4S5.pdf"),
    (2024, "L2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/SVT-L2-1ER-GR.pdf"),
    (2024, "S1",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/SVT-S1-1ER-GR-.pdf"),
    (2024, "S2",         "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/SVT-S2-1ER-GR-.pdf"),
    (2024, "L2",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/SCIENECES-PHYSIQUES-L2-1ER-GR-24.pdf"),
    (2024, "S1",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/epreuve-S1.pdf"),
    (2024, "S2",         "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/Epreuve-S2.pdf"),
    (2024, "L",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/PHILOSOPHIE-L.pdf"),
    (2024, "L-AR",       "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/OHILO-LAR-1ER-24.pdf"),
    (2024, "S",          "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/philo-s-1er-gr-.pdf"),
    (2024, "L/S",        "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/histo-geo-LS-1ER-GR-.pdf"),
    (2024, "L-AR",       "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/HG-L-AR-1ER-GR.pdf"),
    (2024, "L2",         "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ECONOMIE-L2-1ER-GR-.pdf"),
    # 2024 - 2e groupe
    (2024, "toutes",     "Anglais LV1 2eGr",    "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/anglais-lv1-2e-gr.pdf"),
    (2024, "toutes",     "Arabe LV1 2eGr",      "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/arabe-lv1-2e-gr-.pdf"),
    (2024, "toutes",     "Espagnol LV1 2eGr",   "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/espagnol-lv1-2e-gr-.pdf"),
    (2024, "toutes",     "Allemand LV1 2eGr",   "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/allemand-lv1.pdf"),
    (2024, "toutes",     "Anglais LV2 2eGr",    "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/anglais-lv2-1er-gr-.pdf"),
    (2024, "toutes",     "Allemand LV2 2eGr",   "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ALLEMAND-LV2-2E-GR-.pdf"),
    (2024, "toutes",     "Arabe LV2 2eGr",      "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ARABE-LV2-2E-GR.pdf"),
    (2024, "toutes",     "Espagnol LV2 2eGr",   "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ESP-LV2-2E-GR-.pdf"),
    (2024, "toutes",     "Italien LV2 2eGr",    "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ITALIEN-LV2-2E-GR-.pdf"),
    (2024, "toutes",     "Portugais LV2 2eGr",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/PORT-LV2-2E-GR-.pdf"),
    (2024, "toutes",     "Russe LV2 2eGr",      "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/RUSSE-LV2-2E-GR-.pdf"),
    (2024, "L",          "Français 2eGr",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/francais-L-2e-gr.pdf"),
    (2024, "LA",         "Français 2eGr",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FR-LA-2E-GR-24.pdf"),
    (2024, "L-AR",       "Français 2eGr",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FRAN-L-AR-2E-GR-.pdf"),
    (2024, "S",          "Français 2eGr",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FRANCAIS-S-2E-GR-.pdf"),
    (2024, "S1A/S2A",    "Français 2eGr",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/FRANCAIS-S1A-S2A-2E-GR-.pdf"),
    (2024, "L",          "Mathématiques 2eGr",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/MATHS-L-2E-GR-.pdf"),
    (2024, "L-AR",       "Mathématiques 2eGr",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/MATHS-L-AR-2E-GR.pdf"),
    (2024, "S1/S1A/S2A", "Mathématiques 2eGr",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/maths-s1-s1a-s2a-2e-gr-.pdf"),
    (2024, "S2",         "Mathématiques 2eGr",  "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/maths-s2-2e-gr.pdf"),
    (2024, "L2",         "SVT 2eGr",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/SVT-L2-2E-GR-.pdf"),
    (2024, "S1",         "SVT 2eGr",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/SVT-S1-2E-GR.pdf"),
    (2024, "S2",         "SVT 2eGr",            "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/svt-s2-2e-gr.pdf"),
    (2024, "L2",         "Sciences Physiques 2eGr","epreuve","https://officedubac.sn/wp-content/uploads/2024/07/Sujet-L2_2024_2e-groupe-1.pdf"),
    (2024, "S",          "Sciences Physiques 2eGr","epreuve","https://officedubac.sn/wp-content/uploads/2024/07/SCIENCES-PHYSIQUES-S-2E-GR-.pdf"),
    (2024, "L",          "Philosophie 2eGr",    "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/Philio-L-2e-gr.pdf"),
    (2024, "L-AR",       "Philosophie 2eGr",    "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/philo-l-ar-2r-gr.pdf"),
    (2024, "S",          "Philosophie 2eGr",    "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/PHILO-S-2E-GR-.pdf"),
    (2024, "L/S",        "Histoire-Géo 2eGr",   "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/HISTO-GEO-L-S-2E-GR-.pdf"),
    (2024, "L-AR",       "Histoire-Géo 2eGr",   "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/HISTO-GEO-L-AR-2E-GR-.pdf"),
    (2024, "L2",         "Économie 2eGr",       "epreuve", "https://officedubac.sn/wp-content/uploads/2024/07/ECONOMIE-L2-2E-GR.pdf"),

    # ═══════════════════════════════════════════════════════════════
    # 2023 — ÉPREUVES
    # ═══════════════════════════════════════════════════════════════

    (2023, "S1/S3",      "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/EPREUVE-MATH-S1S3.pdf"),
    (2023, "S2",         "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/Epreuve-et-Corrige-MATHS-S2-2023.pdf"),
    (2023, "L",          "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/maths-L-1ER-GR-2023.pdf"),
    (2023, "L-AR",       "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/Maths-L-AR-1er-Gr-2023.pdf"),
    (2023, "STEG",       "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/EPREUVE-Maths-STEG-1ER-GR-2023.pdf"),
    (2023, "F6",         "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/Maths-F6-GP1-2023.pdf"),
    (2023, "STIDD",      "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/Maths-STIDD-GP1-2023.pdf"),
    (2023, "T1/T2",      "Mathématiques",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/Maths-T1T2-GP1-2023.pdf"),
    (2023, "S",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/francais-s-1er-gr-2023.pdf"),
    (2023, "S1A/S2A",    "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/francais-s1a-s2a-1er-2023.pdf"),
    (2023, "L",          "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/FRANCAIS-L.pdf"),
    (2023, "LA",         "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/FRANCAIS-LA.pdf"),
    (2023, "L-AR",       "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/FRANCAIS-L-AR.pdf"),
    (2023, "STEG/STIDD", "Français",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/EPREUVE-DE-FRANCAIS-STEG-STIDD.pdf"),
    (2023, "toutes",     "Anglais LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-ANGLAIS.pdf"),
    (2023, "toutes",     "Allemand LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-ALLEMAND.pdf"),
    (2023, "toutes",     "Arabe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-ARABE.pdf"),
    (2023, "toutes",     "Espagnol LV2",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-ESPAGNOL.pdf"),
    (2023, "toutes",     "Italien LV2",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-ITALIEN.pdf"),
    (2023, "toutes",     "Portugais LV2",       "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-PORTUGAIS.pdf"),
    (2023, "toutes",     "Russe LV2",           "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/LV2-RUSSE.pdf"),
    (2023, "toutes",     "Grec",                "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/GREC.pdf"),
    (2023, "S1/S1A",     "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/SVT-S1S1A.pdf"),
    (2023, "S2/S2A",     "SVT",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/SVT-S2S2A.pdf"),
    (2023, "toutes",     "Histoire-Géographie", "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/SUJET-HG-2023.pdf"),
    (2023, "L-AR",       "Études Islamiques",   "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/ETUDE-ISLAMIQUE-LAR.pdf"),
    (2023, "LA",         "Civilisation",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/civivlsation-Arabo-Islamique-LA-1ER-GR-2023.pdf"),
    (2023, "L2",         "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/ECONOMIE-L2.pdf"),
    (2023, "S4/S5",      "CMC",                 "epreuve", "https://officedubac.sn/wp-content/uploads/2025/02/Eprueve-CMC-S4S5-1er-gr-2023.pdf"),
    (2023, "S3",         "Construction Mécanique","epreuve","https://officedubac.sn/wp-content/uploads/2025/02/af-tg-auto-TG-S3-1-er-gr-2023.pdf"),
    (2023, "F6",         "Chimie",              "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/Chimie-F6-GP1-2023.pdf"),
    (2023, "F6",         "Physique",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/EPREUVE-Physique-F6-GP1-2023.pdf"),
    (2023, "STIDD",      "Sciences Physiques",  "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/SPH-STIDD-1ER-GR-2023.pdf"),
    (2023, "STEG",       "Philosophie",         "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/Philo-STEG-STIDD-GP1-2023.pdf"),
    (2023, "STEG",       "Informatique",        "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/EPREUVE-Informatique-STEG-1ER-GR-2023.pdf"),
    (2023, "STEG",       "Économie",            "epreuve", "https://officedubac.sn/wp-content/uploads/2025/03/Economie-SETG-GP1-2023.pdf"),

    # ═══════════════════════════════════════════════════════════════
    # 2023 — CORRIGÉS
    # ═══════════════════════════════════════════════════════════════

    (2023, "S1/S3",      "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/Corrige_MATHS-S1S3-G1.pdf"),
    (2023, "L-AR",       "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/corrige-maths-l-ar-1er-gr-23.pdf"),
    (2023, "STEG",       "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/Corrige_STEG1-Maths-GP1-2023.pdf"),
    (2023, "F6",         "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/Corrige_F6-Maths-GP1-2023.pdf"),
    (2023, "STIDD",      "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/Corrige_STIDD-Maths-GP1-2023.pdf"),
    (2023, "T1/T2",      "Mathématiques",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/Corrige_T-Maths-GP1-2023.pdf"),
    (2023, "L-AR",       "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORR-FRANCAIS-L-AR.pdf"),
    (2023, "L 2eGr",     "Français",            "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/corrige-Francais-l-2e-gr-23.pdf"),
    (2023, "toutes",     "Anglais LV2",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-LV2-A-N-G-L-A-I-S-1.pdf"),
    (2023, "toutes",     "Allemand LV2",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-LV2-ALLEMAND1.pdf"),
    (2023, "toutes",     "Arabe LV2",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-LV2-ARABE.pdf"),
    (2023, "toutes",     "Espagnol LV2",        "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-LV2-E-S-P-A-G-N-O-L1.pdf"),
    (2023, "toutes",     "Portugais LV2",       "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-LV2-PORTUGAIS-1.pdf"),
    (2023, "toutes",     "Russe LV2",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-LV2-R-U-S-S-E1.pdf"),
    (2023, "toutes",     "Grec",                "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-GREC-1er-01.pdf"),
    (2023, "toutes",     "Italien LV2",         "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-ITALIEN-LV2.pdf"),
    (2023, "S1",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-SVT-S1-1ER-GR-2023.pdf"),
    (2023, "S2",         "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/CORRIGE-SVT-S2-1ER-2023.pdf"),
    (2023, "S2 2eGr",    "SVT",                 "corrige", "https://officedubac.sn/wp-content/uploads/2025/02/Corrige-svt-s2-2e-gr-2023.pdf"),
    (2023, "F6",         "Chimie",              "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/Corrige-Chimie-F6-GP1-2023.pdf"),
    (2023, "STIDD",      "Sciences Physiques",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/CORRIGE-SPH-STIDD-1ER-GR-2023.pdf"),
    (2023, "T1",         "Construction Mécanique","corrige","https://officedubac.sn/wp-content/uploads/2025/03/Corrige-CMECA-T1-1ER-GR-2023.pdf"),
    (2023, "T2",         "Construction Électromécanique","corrige","https://officedubac.sn/wp-content/uploads/2025/03/Corrige-CONS-ELMECA-T2-1ER-GR-2023.pdf"),
    (2023, "T2",         "Électrotechnologie",  "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/Corrige-ELECTRO-TECH-T2-1ER-GR-2023.pdf"),
    (2023, "T1",         "Mécanique",           "corrige", "https://officedubac.sn/wp-content/uploads/2025/03/corrigee-meca-bac-T1-2023.pdf"),
    (2023, "STEG",       "Gestion Comptabilité","corrige", "https://officedubac.sn/wp-content/uploads/2025/03/CORRIGE-GESTION-COMTP-1-ER-GR-2023.pdf"),
    (2023, "L-AR",       "Études Islamiques 2eGr","corrige","https://officedubac.sn/wp-content/uploads/2025/02/ETUDES-ISLAMIQUES.pdf"),
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def filename_from_url(url: str) -> str:
    return urlparse(url).path.split("/")[-1]

def slugify(text: str) -> str:
    """Transforme un texte en slug utilisable dans un chemin de stockage."""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")  # retire les accents
    text = text.replace("/", "-").replace(" ", "_").replace(".", "")
    return text

def storage_path(annee: int, serie: str, matiere: str, fname: str) -> str:
    """Chemin dans Supabase Storage : annee/serie/matiere/fichier.pdf"""
    return f"{annee}/{slugify(serie)}/{slugify(matiere)}/{fname}"

def local_dest(annee: int, type_: str, fname: str) -> Path:
    dest = BASE_DIR / str(annee) / type_
    dest.mkdir(parents=True, exist_ok=True)
    return dest / fname

def download_pdf(url: str, dest: Path) -> bool:
    if dest.exists():
        print(f"  [skip-dl]  {dest.name}")
        return True
    try:
        r = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        print(f"  [dl-ok]    {dest.name}")
        return True
    except Exception as e:
        print(f"  [dl-err]   {url} → {e}")
        return False

def upload_to_storage(sb: Client, local_file: Path, spath: str) -> str | None:
    """Upload vers Supabase Storage. Retourne l'URL publique ou None si erreur."""
    try:
        # Vérifie si le fichier existe déjà dans le bucket (évite les doublons)
        try:
            sb.storage.from_(BUCKET).download(spath)
            print(f"  [skip-up]  {spath} (déjà dans Storage)")
            return sb.storage.from_(BUCKET).get_public_url(spath)
        except Exception:
            pass  # pas encore dans Storage → on uploade

        with open(local_file, "rb") as f:
            sb.storage.from_(BUCKET).upload(
                path=spath,
                file=f,
                file_options={"content-type": "application/pdf"},
            )
        public_url = sb.storage.from_(BUCKET).get_public_url(spath)
        print(f"  [up-ok]    {spath}")
        return public_url
    except Exception as e:
        print(f"  [up-err]   {spath} → {e}")
        return None

def insert_batch(sb: Client, records: list[dict]) -> None:
    resp = sb.table("epreuves_bac").upsert(
        records,
        on_conflict="url_originale",
    ).execute()
    print(f"  ✓ {len(resp.data)} lignes upsert OK")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper épreuves BAC sénégalais")
    parser.add_argument("--dry-run",     action="store_true", help="Affiche sans rien faire")
    parser.add_argument("--no-download", action="store_true", help="Pas de téléchargement local")
    parser.add_argument("--no-storage",  action="store_true", help="Pas d'upload Supabase Storage")
    parser.add_argument("--no-db",       action="store_true", help="Pas d'insertion en base")
    args = parser.parse_args()

    if args.dry_run:
        print(f"📋 DRY-RUN — {len(MANIFEST)} entrées :\n")
        for annee, serie, matiere, type_, url in MANIFEST:
            fname = filename_from_url(url)
            spath = storage_path(annee, serie, matiere, fname)
            print(f"  {annee} | {type_:8} | {serie:15} | {matiere:30} → {spath}")
        print(f"\n{len(MANIFEST)} entrées au total.")
        return

    # Connexion Supabase (nécessaire pour storage et/ou db)
    sb: Client | None = None
    if not args.no_storage or not args.no_db:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("⚠  NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.")
            print("   Exporte ces variables ou ajoute un fichier .env avant de continuer.")
            return
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✓ Connecté à Supabase : {SUPABASE_URL}\n")

    print(f"📋 {len(MANIFEST)} entrées — démarrage…\n")

    records   = []
    dl_ok = dl_err = up_ok = up_err = 0

    for i, (annee, serie, matiere, type_, url) in enumerate(MANIFEST, 1):
        fname = filename_from_url(url)
        dest  = local_dest(annee, type_, fname)
        spath = storage_path(annee, serie, matiere, fname)

        print(f"[{i:03}/{len(MANIFEST)}] {annee} · {type_} · {serie} · {matiere}")

        # 1. Téléchargement local
        if not args.no_download:
            ok = download_pdf(url, dest)
            if ok:
                dl_ok += 1
            else:
                dl_err += 1
                time.sleep(DELAY_SEC)
                continue   # si dl échoue, pas la peine d'uploader
            time.sleep(DELAY_SEC)

        # 2. Upload Supabase Storage
        storage_url: str | None = None
        if not args.no_storage and sb and dest.exists():
            storage_url = upload_to_storage(sb, dest, spath)
            if storage_url:
                up_ok += 1
            else:
                up_err += 1

        # 3. Prépare l'enregistrement DB
        record: dict = {
            "annee":         annee,
            "serie":         serie,
            "matiere":       matiere,
            "type":          type_,
            "url_originale": url,
            "nom_fichier":   fname,
        }
        if storage_url:
            record["url_storage"] = storage_url

        records.append(record)

    # 4. Upsert en base (batch unique)
    if not args.no_db and sb and records:
        # dédupliquer par url_originale (évite ON CONFLICT sur la même ligne dans un batch)
        seen: set[str] = set()
        unique_records: list[dict] = []
        for r in records:
            key = r["url_originale"]
            if key not in seen:
                seen.add(key)
                unique_records.append(r)
        print(f"\n→ Upsert de {len(unique_records)} enregistrements ({len(records) - len(unique_records)} doublons ignorés)…")
        batch_size = 50
        for start in range(0, len(unique_records), batch_size):
            insert_batch(sb, unique_records[start:start + batch_size])

    print(f"""
── Résumé ──────────────────────────────
  Téléchargements : {dl_ok} OK / {dl_err} erreurs
  Uploads Storage : {up_ok} OK / {up_err} erreurs
  Enregistrements : {len(records)} préparés
  Dossier local   : {BASE_DIR.resolve()}
────────────────────────────────────────
✅ Terminé.
""")


if __name__ == "__main__":
    main()
