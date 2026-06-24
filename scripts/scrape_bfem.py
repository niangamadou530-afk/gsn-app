"""
Scraper épreuves & corrigés BFEM Sénégal — 3 sources
  1. niangprogrammeur.com   (PDF, priorité 1 — épreuves + corrigés, 2000-2025)
  2. sujetcorrige.com       (PDF, priorité 2 — épreuves uniquement, 2014-2023)
  3. banquedesepreuves.com  (PDF, priorité 3 — épreuves + corrigés, 2014-2021)

Usage:
    pip install -r requirements.txt
    python scrape_bfem.py --dry-run           # aperçu 10 docs, aucun téléchargement
    python scrape_bfem.py                     # scraping complet
    python scrape_bfem.py --no-storage        # sans upload Storage (insertion DB seulement)
    python scrape_bfem.py --no-db             # sans insertion DB (téléchargement local seulement)

Variables d'environnement (fichier scripts/.env) :
    NEXT_PUBLIC_SUPABASE_URL      URL du projet Supabase
    SUPABASE_SERVICE_ROLE_KEY     Clé service role (Settings > API)

Prérequis SQL (exécuter prep_bfem_migration.sql d'abord) :
    ALTER TABLE epreuves_bac ADD COLUMN IF NOT EXISTS examen text DEFAULT 'BAC';
    ALTER TABLE epreuves_bac ADD COLUMN IF NOT EXISTS contenu_html text;
    ALTER TABLE epreuves_bac DROP CONSTRAINT IF EXISTS epreuves_bac_type_check;
    ALTER TABLE epreuves_bac ADD CONSTRAINT epreuves_bac_type_check
      CHECK (type IN ('epreuve', 'corrige', 'annale_preparation'));
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('epreuves-bfem', 'epreuves-bfem', true) ON CONFLICT (id) DO UPDATE SET public = true;
"""

import os
import re
import sys
import time
import argparse
import unicodedata
from pathlib import Path
from urllib.parse import urlparse, urljoin

# Forcer UTF-8 sur Windows (évite les UnicodeEncodeError avec les caractères spéciaux)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET_BFEM  = "epreuves-bfem"
DELAY_SEC    = 1.5
BASE_DIR     = Path(__file__).parent / "downloads" / "bfem"
HEADERS      = {"User-Agent": "Mozilla/5.0 (compatible; GSN-BFEM-Scraper/1.0; educational)"}

# ── Session HTTP ────────────────────────────────────────────────────────────

_session = requests.Session()
_session.headers.update(HEADERS)

def http_get(url: str, timeout: int = 25) -> requests.Response | None:
    try:
        r = _session.get(url, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
        return r
    except requests.exceptions.HTTPError as e:
        print(f"  [HTTP {e.response.status_code}] {url[:80]}")
        return None
    except Exception as e:
        print(f"  [err] {url[:80]} → {type(e).__name__}: {e}")
        return None

# ── Normalisation ────────────────────────────────────────────────────────────

def _strip_accents(s: str) -> str:
    n = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in n if unicodedata.category(c) != "Mn")

MATIERE_RULES: list[tuple[list[str], str]] = [
    (["mathematiques", "maths"],                            "Mathématiques"),
    (["svt", "sciences naturelles", "biologie", "sciences de la vie"],  "SVT"),
    (["physique-chimie", "physique chimie", "sciences physiques",
      "science physique", "physique", "chimie"],             "Sciences Physiques"),
    (["tsq", "texte suivi", "composition francaise",
      "composition française", "dictee", "dictée",
      "francais", "français"],                               "Français"),
    (["histoire-geographie", "histoire geographie",
      "histoire géographie", "geographie", "géographie",
      "histoire geo", "hg"],                                 "Histoire-Géographie"),
    (["anglais"],                                            "Anglais"),
    (["espagnol"],                                           "Espagnol"),
    (["arabe"],                                              "Arabe"),
    (["education technologique", "éducation technologique"], "Éducation Technologique"),
]

def normalize_matiere(text: str) -> str:
    # Normalise : accents + tirets → espaces pour que "texte-suivi" == "texte suivi"
    t = _strip_accents(text).replace("-", " ")
    for keywords, matiere in MATIERE_RULES:
        for kw in keywords:
            if _strip_accents(kw).replace("-", " ") in t:
                return matiere
    return "Autre"

def extract_annee(text: str) -> int | None:
    m = re.search(r'\b(20\d{2})\b', text)
    return int(m.group(1)) if m else None

def detect_type(title: str, annee: int | None, source: str) -> str:
    """
    Règle :
    - Slug/titre contient "probable" → annale_preparation (quelle que soit l'année)
    - niangprogrammeur.com, année 2026  → annale_preparation
    - Titre contient "correction"/"corrigé"/"corrige" → corrige
    - Sinon → epreuve
    """
    t = _strip_accents(title).replace("-", " ")
    if "probable" in t:
        return "annale_preparation"
    if source == "niangprogrammeur" and annee == 2026:
        return "annale_preparation"
    if any(kw in t for kw in ["correction", "corrige", "corriges"]):
        return "corrige"
    return "epreuve"

def slugify(text: str) -> str:
    t = unicodedata.normalize("NFD", text)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w\-]", "_", t)
    return t[:60]

def storage_path(annee: int, matiere: str, fname: str) -> str:
    return f"bfem/{annee}/{slugify(matiere)}/{fname}"

# ── SOURCE 1 : niangprogrammeur.com ─────────────────────────────────────────

NIANGP_BASE       = "https://www.niangprogrammeur.com"
NIANGP_LIST_URL   = "https://www.niangprogrammeur.com/epreuves/examen/bfem?exam=bfem&page={page}"
NIANGP_PAGES      = 7

def _niangp_clean_title(a_tag) -> str:
    """
    Sur niangprogrammeur.com, les balises <a> des cartes contiennent beaucoup
    de texte parasite (catégories, prix, compteurs). On reconstruit le titre
    depuis le slug URL, plus fiable.
    """
    href: str = a_tag.get("href", "")
    slug = href.rstrip("/").split("/")[-1]
    # "espagnol-bfem-2026-senegal-prepa-annales" → "Espagnol Bfem 2026 Senegal Prepa Annales"
    return slug.replace("-", " ").title()


def crawl_niangprogrammeur() -> list[dict]:
    docs: list[dict] = []
    print("▶ niangprogrammeur.com (7 pages)…")
    for page in range(1, NIANGP_PAGES + 1):
        url = NIANGP_LIST_URL.format(page=page)
        print(f"  page {page}/{NIANGP_PAGES}…", end=" ", flush=True)
        resp = http_get(url)
        if not resp:
            print("échec")
            time.sleep(DELAY_SEC)
            continue
        soup = BeautifulSoup(resp.text, "html.parser")

        seen: set[str] = set()
        for a in soup.find_all("a", href=True):
            href: str = a["href"]
            # Filtre : lien vers /epreuves/{slug} uniquement
            if not re.search(r"/epreuves/[a-z0-9\-]+$", href):
                continue
            if "/examen/" in href or "/telecharger" in href:
                continue
            full = urljoin(NIANGP_BASE, href)
            if full in seen:
                continue
            seen.add(full)

            # Titre nettoyé depuis le slug (pas le get_text() bruité)
            title = _niangp_clean_title(a)
            if "bfem" not in title.lower():
                continue

            # Annee et type extraits du slug (fiable)
            slug_lower = href.rstrip("/").split("/")[-1].lower()
            annee      = extract_annee(slug_lower)
            matiere    = normalize_matiere(slug_lower)

            # Type depuis le slug — même règle que detect_type()
            slug_spaced = slug_lower.replace("-", " ")
            if "probable" in slug_spaced or annee == 2026:
                typ = "annale_preparation"
            elif any(kw in slug_spaced for kw in ["correction", "corrige", "corriges"]):
                typ = "corrige"
            else:
                typ = "epreuve"

            docs.append({
                "source":       "niangprogrammeur",
                "page_url":     full,
                "title":        title,
                "annee":        annee,
                "matiere":      matiere,
                "type":         typ,
                "download_url": None,
            })

        print(f"{len(seen)} docs")
        time.sleep(DELAY_SEC)

    print(f"  → {len(docs)} documents (niangprogrammeur.com)\n")
    return docs

def resolve_niangp_dl(page_url: str) -> str | None:
    """Visite la page détail et extrait le lien /telecharger."""
    resp = http_get(page_url)
    if not resp:
        return None
    soup = BeautifulSoup(resp.text, "html.parser")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/telecharger" in href or "/download" in href:
            return urljoin(NIANGP_BASE, href)
    return None

# ── SOURCE 2 : sujetcorrige.com ─────────────────────────────────────────────

SUJET_BASE     = "https://sujetcorrige.com"
SUJET_LIST_URL = "https://sujetcorrige.com/sujets-bfem-senegal?start={start}"
SUJET_TOTAL    = 60  # 6 pages × 10

def crawl_sujetcorrige() -> list[dict]:
    docs: list[dict] = []
    print("▶ sujetcorrige.com (6 pages × 10)…")
    for start in range(0, SUJET_TOTAL, 10):
        url = SUJET_LIST_URL.format(start=start)
        print(f"  start={start}…", end=" ", flush=True)
        resp = http_get(url)
        if not resp:
            print("échec")
            time.sleep(DELAY_SEC)
            continue
        soup = BeautifulSoup(resp.text, "html.parser")

        count = 0
        seen: set[str] = set()
        for a in soup.find_all("a", href=True):
            href: str = a["href"]
            if "/sujets-bfem-senegal/" not in href:
                continue
            full = urljoin(SUJET_BASE, href)
            if full in seen or full.rstrip("/") == SUJET_BASE + "/sujets-bfem-senegal":
                continue
            seen.add(full)

            title = a.get_text(strip=True)
            if len(title) < 5:
                continue

            annee   = extract_annee(title)
            matiere = normalize_matiere(title)
            typ     = detect_type(title, annee, "sujetcorrige")

            # URL de téléchargement : /{slug}/download
            slug = href.rstrip("/").split("/")[-1]
            dl_url = f"{SUJET_BASE}/{slug}/download"

            docs.append({
                "source":       "sujetcorrige",
                "page_url":     full,
                "title":        title,
                "annee":        annee,
                "matiere":      matiere,
                "type":         typ,
                "download_url": dl_url,
            })
            count += 1

        print(f"{count} docs")
        time.sleep(DELAY_SEC)

    print(f"  → {len(docs)} documents (sujetcorrige.com)\n")
    return docs

# ── SOURCE 3 : banquedesepreuves.com ────────────────────────────────────────

BANQUE_BASE     = "https://banquedesepreuves.com"
BANQUE_LIST_URL = "https://banquedesepreuves.com/senegal/bfem/?start={start}"
BANQUE_MAX_DOCS = 50   # ~9 pages × 5

def crawl_banquedesepreuves() -> list[dict]:
    docs: list[dict] = []
    print("▶ banquedesepreuves.com (~9 pages × 5)…")
    for start in range(0, BANQUE_MAX_DOCS, 5):
        url = BANQUE_LIST_URL.format(start=start)
        print(f"  start={start}…", end=" ", flush=True)
        resp = http_get(url)
        if not resp:
            print("échec")
            time.sleep(DELAY_SEC)
            continue
        soup = BeautifulSoup(resp.text, "html.parser")

        count = 0
        seen: set[str] = set()
        for a in soup.find_all("a", href=True):
            href: str = a["href"]
            # Pattern : /senegal/bfem/{slug} ou /index.php/senegal/bfem/{slug}
            if not re.search(r"/(index\.php/)?senegal/bfem/[a-z0-9\-]+", href):
                continue
            full = urljoin(BANQUE_BASE, href)
            if full in seen:
                continue
            seen.add(full)

            title = a.get_text(strip=True)
            if len(title) < 5:
                continue

            slug = href.rstrip("/").split("/")[-1]
            # Filtre : pages catégorie (ex: "epreuves-et-corriges-bfem-2021-senegal")
            # n'ont pas d'endpoint /download — seuls les docs individuels en ont un.
            if slug.startswith("epreuves-et-corriges") or slug.startswith("epreuves-bfem"):
                continue

            annee   = extract_annee(title)
            matiere = normalize_matiere(title)
            typ     = detect_type(title, annee, "banquedesepreuves")

            # URL de téléchargement : /index.php/{slug}/download
            dl_url = f"{BANQUE_BASE}/index.php/{slug}/download"

            docs.append({
                "source":       "banquedesepreuves",
                "page_url":     full,
                "title":        title,
                "annee":        annee,
                "matiere":      matiere,
                "type":         typ,
                "download_url": dl_url,
            })
            count += 1

        print(f"{count} docs")
        # Si la page est vide → on a atteint la fin de la pagination
        if count == 0:
            break
        time.sleep(DELAY_SEC)

    print(f"  → {len(docs)} documents (banquedesepreuves.com)\n")
    return docs

# ── Déduplication cross-source ────────────────────────────────────────────────

def build_existing_set(sb: Client) -> set[tuple]:
    """Charge toutes les combinaisons (annee, matiere, type) déjà en base pour BFEM."""
    try:
        resp = (
            sb.table("epreuves_bac")
              .select("annee, matiere, type")
              .eq("examen", "BFEM")
              .execute()
        )
        return {(r["annee"], r["matiere"], r["type"]) for r in (resp.data or [])}
    except Exception as e:
        print(f"  [warn] Impossible de charger l'index de dédup : {e}")
        return set()

# ── Téléchargement PDF ────────────────────────────────────────────────────────

def download_pdf(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1_000:
        print(f"  [skip-dl] {dest.name} ({dest.stat().st_size // 1024} KB)")
        return True
    try:
        r = _session.get(url, timeout=45, stream=True)
        r.raise_for_status()
        ct = r.headers.get("content-type", "")
        if "html" in ct:
            print(f"  [warn] réponse HTML (pas un PDF) : {url[:70]}")
            return False
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        size = dest.stat().st_size
        if size < 500:
            dest.unlink()
            print(f"  [dl-tiny] fichier trop petit ({size} octets), ignoré")
            return False
        print(f"  [dl-ok] {dest.name} ({size // 1024} KB)")
        return True
    except Exception as e:
        print(f"  [dl-err] {url[:70]} → {e}")
        return False

# ── Supabase Storage ─────────────────────────────────────────────────────────

def upload_pdf(sb: Client, local: Path, spath: str) -> str | None:
    try:
        # Vérifie si le fichier existe déjà dans Storage
        try:
            sb.storage.from_(BUCKET_BFEM).download(spath)
            pub = sb.storage.from_(BUCKET_BFEM).get_public_url(spath)
            print(f"  [skip-up] {spath}")
            return pub
        except Exception:
            pass  # pas encore présent → on uploade

        with open(local, "rb") as f:
            sb.storage.from_(BUCKET_BFEM).upload(
                path=spath,
                file=f,
                file_options={"content-type": "application/pdf"},
            )
        pub = sb.storage.from_(BUCKET_BFEM).get_public_url(spath)
        print(f"  [up-ok] {spath}")
        return pub
    except Exception as e:
        print(f"  [up-err] {spath} → {e}")
        return None

# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Scraper BFEM Sénégal — 3 sources")
    parser.add_argument("--dry-run",     action="store_true", help="Aperçu 10 docs, aucun téléchargement")
    parser.add_argument("--no-download", action="store_true", help="Pas de téléchargement local")
    parser.add_argument("--no-storage",  action="store_true", help="Pas d'upload Supabase Storage")
    parser.add_argument("--no-db",       action="store_true", help="Pas d'insertion en base")
    parser.add_argument("--banque-only", action="store_true", help="Re-crawl banquedesepreuves.com uniquement")
    args = parser.parse_args()

    # ── PHASE 1 : Manifest ───────────────────────────────────────────────────
    print("\n═══════════════════════════════════════════════════")
    print("PHASE 1 — Crawl des listings…")
    print("═══════════════════════════════════════════════════\n")

    if args.banque_only:
        niangp_docs = []
        sujet_docs  = []
        banque_docs = crawl_banquedesepreuves()
    else:
        niangp_docs  = crawl_niangprogrammeur()
        sujet_docs   = crawl_sujetcorrige()
        banque_docs  = crawl_banquedesepreuves()
    all_docs     = niangp_docs + sujet_docs + banque_docs

    nb_niangp    = len(niangp_docs)
    nb_sujet     = len(sujet_docs)
    nb_banque    = len(banque_docs)
    nb_2026      = sum(1 for d in all_docs if d["annee"] == 2026)
    nb_corrige   = sum(1 for d in all_docs if d["type"] == "corrige")
    nb_annale    = sum(1 for d in all_docs if d["type"] == "annale_preparation")

    print(f"Manifest total : {len(all_docs)} documents")
    print(f"  niangprogrammeur  : {nb_niangp}")
    print(f"  sujetcorrige      : {nb_sujet}")
    print(f"  banquedesepreuves : {nb_banque}")
    print(f"  dont annale 2026  : {nb_annale}")
    print(f"  dont corrigés     : {nb_corrige}")

    # ── DRY-RUN ──────────────────────────────────────────────────────────────
    if args.dry_run:
        print("\n═══════════════════════════════════════════════════")
        print("DRY-RUN — 10 premiers documents qui seraient insérés")
        print("═══════════════════════════════════════════════════\n")
        print(f"{'#':<4} {'Source':<22} {'Année':<6} {'Type':<24} {'Matière':<28} Stockage")
        print("─" * 110)
        for i, doc in enumerate(all_docs[:10], 1):
            storage_label = "PDF → Supabase Storage"
            print(f"{i:<4} {doc['source']:<22} {str(doc['annee'] or '?'):<6} "
                  f"{doc['type']:<24} {doc['matiere']:<28} {storage_label}")
            print(f"     Titre : {doc['title'][:80]}")
            print(f"     URL   : {doc['page_url'][:90]}")
            print()
        print("─" * 110)
        print(f"Stockage PDF total estimé  : {len(all_docs)} documents → bucket '{BUCKET_BFEM}'")
        print(f"Stockage HTML              : 0 (toutes les 3 sources n'exposent que des PDFs)")
        print(f"Annales prépa 2026         : {nb_annale} → type='annale_preparation'")
        print(f"\n→ Lance sans --dry-run pour démarrer le vrai scraping.")
        return

    # ── PHASE 2 : Scraping réel ──────────────────────────────────────────────

    # Connexion Supabase
    sb: Client | None = None
    if not (args.no_storage and args.no_db):
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("⚠ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env")
            sys.exit(1)
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"\n✓ Connecté à Supabase : {SUPABASE_URL}\n")

    # Charge les combinaisons existantes pour déduplication cross-source
    existing: set[tuple] = set()
    if sb and not args.no_db:
        existing = build_existing_set(sb)
        print(f"  Entrées BFEM déjà en base : {len(existing)}\n")

    BASE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n═══════════════════════════════════════════════════")
    print("PHASE 2 — Traitement document par document…")
    print("═══════════════════════════════════════════════════\n")

    inserted      = 0
    skipped_dedup = 0
    dl_ok         = 0
    dl_err        = 0
    up_ok         = 0
    up_err        = 0
    pdf_stored    = 0
    annale_count  = 0

    for i, doc in enumerate(all_docs, 1):
        source   = doc["source"]
        title    = doc["title"]
        annee    = doc["annee"] or 0
        matiere  = doc["matiere"]
        doc_type = doc["type"]

        print(f"\n[{i:03d}/{len(all_docs)}] {source} · {annee} · {doc_type} · {matiere}")
        print(f"  {title[:85]}")

        # ── Déduplication cross-source ─────────────────────────────────────
        key = (annee, matiere, doc_type)
        if key in existing:
            print(f"  [skip-dedup] ({annee}, {matiere}, {doc_type}) déjà en base")
            skipped_dedup += 1
            continue

        if doc_type == "annale_preparation":
            annale_count += 1

        # ── Résolution lien téléchargement (niangprogrammeur uniquement) ───
        dl_url = doc.get("download_url")
        if source == "niangprogrammeur" and not dl_url:
            dl_url = resolve_niangp_dl(doc["page_url"])
            time.sleep(DELAY_SEC)
            if not dl_url:
                print(f"  [skip] lien de téléchargement introuvable")
                dl_err += 1
                continue

        if not dl_url:
            print(f"  [skip] pas d'URL de téléchargement")
            dl_err += 1
            continue

        # ── Nom de fichier & chemin ────────────────────────────────────────
        fname = f"bfem_{annee}_{slugify(matiere)}_{slugify(doc_type)}_{i:04d}.pdf"
        dest  = BASE_DIR / str(annee) / fname
        dest.parent.mkdir(parents=True, exist_ok=True)
        spath = storage_path(annee, matiere, fname)

        # ── Téléchargement local ──────────────────────────────────────────
        if not args.no_download:
            ok = download_pdf(dl_url, dest)
            if ok:
                dl_ok += 1
            else:
                dl_err += 1
                time.sleep(DELAY_SEC)
                continue
            time.sleep(DELAY_SEC)

        # ── Upload Supabase Storage ────────────────────────────────────────
        storage_url: str | None = None
        if not args.no_storage and sb and dest.exists():
            storage_url = upload_pdf(sb, dest, spath)
            if storage_url:
                up_ok += 1
                pdf_stored += 1
            else:
                up_err += 1

        # ── Insertion en base ─────────────────────────────────────────────
        if not args.no_db and sb:
            # Pour les annales 2026 : mention explicite dans le titre
            display_title = (
                f"{title} (Annale de préparation, pas une épreuve officielle)"
                if doc_type == "annale_preparation"
                else title
            )
            record: dict = {
                "annee":         annee,
                "serie":         "3e",
                "matiere":       matiere,
                "type":          doc_type,
                "examen":        "BFEM",
                "url_originale": doc["page_url"],
                "nom_fichier":   display_title,
                "contenu_html":  None,
            }
            if storage_url:
                record["url_storage"] = storage_url

            try:
                sb.table("epreuves_bac").upsert(
                    record, on_conflict="url_originale"
                ).execute()
                print(f"  [db-ok]")
                inserted += 1
                existing.add(key)  # dédup local en temps réel
            except Exception as e:
                print(f"  [db-err] {e}")

        time.sleep(DELAY_SEC)

    # ── Rapport final ─────────────────────────────────────────────────────────
    print(f"""
═══════════════════════════════════════════════════════════
RAPPORT FINAL — Scraping BFEM Sénégal
═══════════════════════════════════════════════════════════

  Manifest total          : {len(all_docs)} documents
  ├─ niangprogrammeur.com : {nb_niangp}
  ├─ sujetcorrige.com     : {nb_sujet}
  └─ banquedesepreuves.com: {nb_banque}

  Résultats :
  ├─ Nouveaux insérés     : {inserted}
  ├─ Doublons évités      : {skipped_dedup}
  ├─ Annales prépa 2026   : {annale_count}
  ├─ PDF stockés Storage  : {pdf_stored} → bucket '{BUCKET_BFEM}'
  └─ HTML stocké          : 0 (toutes sources → PDFs uniquement)

  Téléchargements  : {dl_ok} OK / {dl_err} erreurs
  Uploads Storage  : {up_ok} OK / {up_err} erreurs
  Dossier local    : {BASE_DIR.resolve()}

═══════════════════════════════════════════════════════════
✅ Terminé.
""")


if __name__ == "__main__":
    main()
