"""
Scraper épreuves & corrigés BFEM — sunudaara.com
Scrape le contenu HTML de chaque page et l'insère dans la table epreuves_bac.

Usage:
    pip install -r requirements.txt
    python scrape_sunudaara.py [--dry-run] [--no-db]

Options:
    --dry-run   Affiche les entrées sans rien faire
    --no-db     Ne touche pas à la base de données

Variables d'environnement (fichier .env) :
    NEXT_PUBLIC_SUPABASE_URL      URL du projet Supabase
    SUPABASE_SERVICE_ROLE_KEY     Clé service role

Avant de lancer ce script, exécute ce SQL dans Supabase :
    ALTER TABLE epreuves_bac ADD COLUMN IF NOT EXISTS examen text DEFAULT 'BAC';
    ALTER TABLE epreuves_bac ADD COLUMN IF NOT EXISTS contenu_html text;
    UPDATE epreuves_bac SET examen = 'BAC' WHERE examen IS NULL;
"""

import os
import re
import time
import argparse
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DELAY_SEC    = 2.0
HEADERS      = {"User-Agent": "Mozilla/5.0 (compatible; GSN-BFEM-Scraper/1.0; educational)"}
BASE_URL     = "https://www.sunudaara.com"

# ── Manifest complet ──────────────────────────────────────────────────────────
# (annee, matiere, type, groupe, url)

MANIFEST = [

    # ══════════════════════════════════════════════════════════
    # MATHÉMATIQUES — ÉPREUVES
    # ══════════════════════════════════════════════════════════
    (2025, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/mathematiques/bfem-math%C3%A9matiques-2025"),
    (2024, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-1er-groupe-2024"),
    (2023, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-1er-groupe-2023"),
    (2022, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2022"),
    (2021, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2021"),
    (2020, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2020"),
    (2019, "Mathématiques", "epreuve", "2e",  "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2019-2i%C3%A8me-groupe"),
    (2019, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2019"),
    (2018, "Mathématiques", "epreuve", "2e",  "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2018-2i%C3%A8me-groupe"),
    (2018, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2018"),
    (2017, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2017"),
    (2016, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2016"),
    (2015, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2015"),
    (2014, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2014"),
    (2013, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2013"),
    (2012, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2012"),
    (2011, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2011"),
    (2010, "Mathématiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-math%C3%A9matiques-2010"),

    # MATHÉMATIQUES — CORRIGÉS
    (2022, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2022"),
    (2021, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2021"),
    (2019, "Mathématiques", "corrige", "2e",  "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2019-2i%C3%A8me-groupe"),
    (2019, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2019"),
    (2018, "Mathématiques", "corrige", "2e",  "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2018-2i%C3%A8me-groupe"),
    (2018, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2018"),
    (2017, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2017"),
    (2016, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2016"),
    (2015, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2015"),
    (2014, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2014"),
    (2013, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2013"),
    (2012, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2012"),
    (2011, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2011"),
    (2010, "Mathématiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-maths-2010"),

    # ══════════════════════════════════════════════════════════
    # SVT — ÉPREUVES
    # ══════════════════════════════════════════════════════════
    (2022, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2022"),
    (2021, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2021"),
    (2020, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2020"),
    (2019, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2019"),
    (2018, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2018"),
    (2017, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2017"),
    (2016, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2016"),
    (2015, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2015"),
    (2014, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2014"),
    (2013, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2013"),
    (2012, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2012"),
    (2011, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2011"),
    (2010, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2010"),
    (2009, "SVT", "epreuve", "1er", "https://www.sunudaara.com/node/1156"),
    (2008, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2008"),
    (2005, "SVT", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-svt-2005"),

    # SVT — CORRIGÉS
    (2019, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2019"),
    (2018, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2018"),
    (2017, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2017"),
    (2016, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2016"),
    (2015, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2015"),
    (2014, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2014"),
    (2013, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2013"),
    (2010, "SVT", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-svt-2010"),

    # ══════════════════════════════════════════════════════════
    # PHYSIQUE-CHIMIE — ÉPREUVES
    # ══════════════════════════════════════════════════════════
    (2022, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2022"),
    (2021, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2021"),
    (2020, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2020"),
    (2019, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2019"),
    (2018, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2018"),
    (2017, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2017"),
    (2016, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2016"),
    (2015, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2015"),
    (2014, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2014"),
    (2013, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2013"),
    (2012, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2012"),
    (2011, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2011"),
    (2010, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2010"),
    (2009, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2009"),
    (2008, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2008"),
    (2007, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2007"),
    (2006, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2006"),
    (2005, "Sciences Physiques", "epreuve", "1er", "https://www.sunudaara.com/bfem/bfem-physique-chimie-2005"),

    # PHYSIQUE-CHIMIE — CORRIGÉS
    (2019, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2019"),
    (2018, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2018"),
    (2017, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2017"),
    (2016, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2016"),
    (2015, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2015"),
    (2013, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2013"),
    (2012, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2012"),
    (2011, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2011"),
    (2010, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2010"),
    (2009, "Sciences Physiques", "corrige", "1er", "https://www.sunudaara.com/bfem/corrig%C3%A9-bfem-physique-chimie-2009"),
]


# ── Extraction HTML ───────────────────────────────────────────────────────────

CONTENT_SELECTORS = [
    "div.field-name-body",
    "div.field-items",
    "div.node-content",
    "div.content.clearfix",
    "article.node",
    "div#content-area",
    "div.region-content",
]

def extract_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    # Supprime les éléments parasites
    for tag in soup.find_all(["script", "style", "nav", "header", "footer", "aside",
                               "form", "noscript"]):
        tag.decompose()

    # Cherche le conteneur principal
    content_el = None
    for sel in CONTENT_SELECTORS:
        el = soup.select_one(sel)
        if el and len(el.get_text(strip=True)) > 80:
            content_el = el
            break

    if content_el is None:
        content_el = soup.find("body") or soup

    # Réécrit les URLs relatives des images en absolues
    for img in content_el.find_all("img"):
        src = img.get("src", "")
        if src.startswith("/"):
            img["src"] = BASE_URL + src
        elif src.startswith("//"):
            img["src"] = "https:" + src

    # Supprime les liens de navigation internes du site
    for a in content_el.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/") and "bfem" not in href and "corrig" not in href:
            a.unwrap()

    return str(content_el)


# ── Base de données ───────────────────────────────────────────────────────────

def upsert_record(sb: Client, record: dict) -> None:
    sb.table("epreuves_bac").upsert(
        record, on_conflict="url_originale"
    ).execute()


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-db",   action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print(f"DRY-RUN — {len(MANIFEST)} entrees :\n")
        for annee, matiere, typ, groupe, url in MANIFEST:
            label = "Corrige" if typ == "corrige" else "Epreuve"
            gr    = f" [{groupe}]" if groupe != "1er" else ""
            print(f"  {annee} | {label:<8} | {matiere:<20}{gr} -> {url}")
        print(f"\n{len(MANIFEST)} entrees au total.")
        return

    sb: Client | None = None
    if not args.no_db:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.")
            print("Ajoute un fichier .env ou exporte les variables.")
            return
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"Connecte a Supabase : {SUPABASE_URL}\n")

    print(f"{len(MANIFEST)} entrees — demarrage...\n")

    ok_count  = 0
    err_count = 0
    session   = requests.Session()
    session.headers.update(HEADERS)

    for i, (annee, matiere, typ, groupe, url) in enumerate(MANIFEST, 1):
        label = "Corrige" if typ == "corrige" else "Epreuve"
        gr    = f" [{groupe} gr]" if groupe != "1er" else ""
        print(f"[{i:03d}/{len(MANIFEST)}] {annee} · {label} · {matiere}{gr}")

        # Fetch HTML
        try:
            resp = session.get(url, timeout=15)
            resp.raise_for_status()
            contenu = extract_content(resp.text)
            print(f"  [fetch-ok]  {len(contenu):,} caracteres")
            ok_count += 1
        except Exception as e:
            print(f"  [fetch-err] {e}")
            err_count += 1
            time.sleep(DELAY_SEC)
            continue

        # Upsert en DB
        if not args.no_db and sb:
            record = {
                "annee":        annee,
                "serie":        "3e",
                "matiere":      matiere,
                "type":         typ,
                "url_originale": url,
                "url_storage":  None,
                "nom_fichier":  None,
                "examen":       "BFEM",
                "contenu_html": contenu,
            }
            try:
                upsert_record(sb, record)
                print(f"  [db-ok]")
            except Exception as e:
                print(f"  [db-err]    {e}")

        time.sleep(DELAY_SEC)

    print(f"""
Résumé ─────────────────────────────────
  Pages scrapees : {ok_count} OK / {err_count} erreurs
  Total manifest : {len(MANIFEST)}
─────────────────────────────────────────
Terminé.
""")


if __name__ == "__main__":
    main()
