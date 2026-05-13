"""
Extracteur de texte BAC + BFEM → table sujets_extraits

Phase 1 — BAC  : télécharge chaque PDF depuis Supabase Storage, extrait le texte
                  avec PyMuPDF, découpe en exercices, insère dans sujets_extraits.
Phase 2 — BFEM : lit le contenu_html stocké en base, extrait le texte propre avec
                  BeautifulSoup, même découpage, même table.

SQL à exécuter AVANT ce script dans Supabase :
─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sujets_extraits (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  examen       text NOT NULL,
  annee        integer,
  serie        text,
  matiere      text,
  groupe       text,
  type         text,
  contenu_texte text,
  exercices    jsonb DEFAULT '[]',
  created_at   timestamptz DEFAULT now(),
  epreuve_id   uuid REFERENCES epreuves_bac(id)
);
ALTER TABLE sujets_extraits ADD CONSTRAINT sujets_extraits_epreuve_id_key UNIQUE (epreuve_id);
ALTER TABLE sujets_extraits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON sujets_extraits FOR SELECT USING (true);
─────────────────────────────────────────────

Usage :
    pip install -r requirements.txt
    python extract_sujets.py [--dry-run] [--limit N] [--bac-only] [--bfem-only]
"""

import os
import re
import io
import argparse
import time
from pathlib import Path

import requests
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

HEADERS     = {"User-Agent": "Mozilla/5.0 (compatible; GSN-Extract/1.0; educational)"}
MAX_TEXT    = 12_000   # caractères stockés dans contenu_texte
MAX_EXER    = 2_000    # caractères max par exercice dans le JSON

# ── Regex de découpage ────────────────────────────────────────────────────────

EXERCISE_RE = re.compile(
    r'(exercice\s+\d+|partie\s+(?:[ivxlcdmIVXLCDM]+|\d+)|probl[eè]me\s*\d*'
    r'|activit[eé]\s+\d+|question\s+\d+(?:\s*[:\.])?)',
    re.IGNORECASE,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def detect_groupe(matiere: str, url: str | None) -> str:
    if re.search(r'2eGr', matiere or "", re.IGNORECASE):
        return "2eme"
    if url and re.search(r'/uploads/\d{4}/(09|10|11|12)/', url):
        return "remplacement"
    return "1er"


def split_exercises(text: str) -> list[dict]:
    matches = list(EXERCISE_RE.finditer(text))
    if not matches:
        return [{"titre": "Contenu", "texte": text.strip()[:MAX_EXER]}]
    exercises = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        bloc = text[m.start():end].strip()
        exercises.append({"titre": m.group(0).strip(), "texte": bloc[:MAX_EXER]})
    return exercises


def pdf_to_text(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf")
    pages = [doc[p].get_text() for p in range(len(doc))]
    doc.close()
    return "\n".join(pages)


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def new_sb() -> Client:
    """Crée un client Supabase frais (nouvelle connexion HTTP) à chaque appel."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upsert(record: dict) -> None:
    new_sb().table("sujets_extraits").upsert(
        record, on_conflict="epreuve_id"
    ).execute()


# ── Phase 1 : BAC PDFs ────────────────────────────────────────────────────────

def fetch_bac_rows(limit: int) -> list[dict]:
    """
    Retourne les entrées BAC en essayant examen='BAC' puis examen IS NULL.
    Utilise url_storage en priorité, url_originale en fallback (PDF original).
    """
    sel = "id, annee, serie, matiere, type, url_storage, url_originale, examen"

    # Tentative 1 : examen explicitement 'BAC'
    q1 = new_sb().table("epreuves_bac").select(sel).eq("examen", "BAC").order("annee", desc=True)
    if limit: q1 = q1.limit(limit)
    rows = q1.execute().data or []
    if not rows:
        # Tentative 2 : examen IS NULL (migration pas encore appliquée)
        q2 = new_sb().table("epreuves_bac").select(sel).is_("examen", "null").order("annee", desc=True)
        if limit: q2 = q2.limit(limit)
        rows = q2.execute().data or []
        print(f"  (filtre examen IS NULL → {len(rows)} lignes)")
    else:
        print(f"  (filtre examen='BAC' → {len(rows)} lignes)")

    # Résout l'URL effective : url_storage sinon url_originale (PDF source)
    result = []
    for r in rows:
        pdf_url = r.get("url_storage") or r.get("url_originale") or ""
        if pdf_url.lower().endswith(".pdf"):
            r["_pdf_url"] = pdf_url
            result.append(r)
    return result


def process_bac(session: requests.Session, limit: int, dry: bool) -> tuple[int, int]:
    rows = fetch_bac_rows(limit)
    print(f"\n── Phase 1 BAC : {len(rows)} PDFs\n")

    ok = err = 0
    for i, row in enumerate(rows, 1):
        label = f"[{i:03d}/{len(rows)}] BAC {row['annee']} {row['serie']} · {row['matiere']} · {row['type']}"
        print(label)
        if dry:
            print("  [dry-run]")
            continue

        pdf_url = row["_pdf_url"]
        try:
            r = session.get(pdf_url, timeout=30)
            r.raise_for_status()
            text = pdf_to_text(r.content)
            text = text.replace("\x00", " ").strip()
        except Exception as e:
            print(f"  [err] {e}")
            err += 1
            continue

        exercises = split_exercises(text)
        print(f"  {len(text):,} car · {len(exercises)} exercice(s)")

        record = {
            "examen":        row.get("examen") or "BAC",
            "annee":         row["annee"],
            "serie":         row["serie"],
            "matiere":       row["matiere"],
            "groupe":        detect_groupe(row["matiere"], pdf_url),
            "type":          row["type"],
            "contenu_texte": text[:MAX_TEXT],
            "exercices":     exercises,
            "epreuve_id":    row["id"],
        }
        try:
            upsert(record)
            print("  [db-ok]")
            ok += 1
        except Exception as e:
            print(f"  [db-err] {e}")
            err += 1

        time.sleep(0.2)

    return ok, err


# ── Phase 2 : BFEM HTML ───────────────────────────────────────────────────────

def process_bfem(limit: int, dry: bool) -> tuple[int, int]:
    # Connexion fraîche ; on ne sélectionne PAS contenu_html en bulk (payload trop lourd)
    query = (
        new_sb().table("epreuves_bac")
        .select("id, annee, serie, matiere, type, examen")
        .eq("examen", "BFEM")
        .order("annee", desc=True)
    )
    if limit:
        query = query.limit(limit)
    rows = query.execute().data or []
    print(f"\n── Phase 2 BFEM : {len(rows)} pages HTML\n")

    ok = err = 0
    for i, row in enumerate(rows, 1):
        label = f"[{i:03d}/{len(rows)}] BFEM {row['annee']} · {row['matiere']} · {row['type']}"
        print(label)
        if dry:
            print("  [dry-run]")
            continue

        # Fetch contenu_html individuellement (connexion fraîche) pour éviter le crash HTTP/2
        try:
            res = new_sb().table("epreuves_bac").select("contenu_html").eq("id", row["id"]).single().execute()
            contenu_html = (res.data or {}).get("contenu_html") or ""
            if not contenu_html:
                print("  [skip] contenu_html vide")
                continue
            text = html_to_text(contenu_html)
            text = text.strip()
        except Exception as e:
            print(f"  [err] {e}")
            err += 1
            continue

        exercises = split_exercises(text)
        print(f"  {len(text):,} car · {len(exercises)} exercice(s)")

        record = {
            "examen":        "BFEM",
            "annee":         row["annee"],
            "serie":         row.get("serie", "3e"),
            "matiere":       row["matiere"],
            "groupe":        "1er",
            "type":          row["type"],
            "contenu_texte": text[:MAX_TEXT],
            "exercices":     exercises,
            "epreuve_id":    row["id"],
        }
        try:
            upsert(record)
            print("  [db-ok]")
            ok += 1
        except Exception as e:
            print(f"  [db-err] {e}")
            err += 1

    return ok, err


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",   action="store_true", help="N'écrit rien en base")
    parser.add_argument("--limit",     type=int, default=0, help="Limite par phase (0 = tout)")
    parser.add_argument("--bac-only",  action="store_true")
    parser.add_argument("--bfem-only", action="store_true")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env")
        return

    print(f"Connecté : {SUPABASE_URL}")

    session = requests.Session()
    session.headers.update(HEADERS)

    total_ok = total_err = 0

    if not args.bfem_only:
        ok, err = process_bac(session, args.limit, args.dry_run)
        total_ok += ok
        total_err += err

    if not args.bac_only:
        ok, err = process_bfem(args.limit, args.dry_run)
        total_ok += ok
        total_err += err

    print(f"""
Résumé ─────────────────────────────────
  Insérés : {total_ok} OK / {total_err} erreurs
─────────────────────────────────────────
Terminé.
""")


if __name__ == "__main__":
    main()
