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


def upsert(sb: Client, record: dict) -> None:
    sb.table("sujets_extraits").upsert(
        record, on_conflict="epreuve_id"
    ).execute()


# ── Phase 1 : BAC PDFs ────────────────────────────────────────────────────────

def process_bac(sb: Client, session: requests.Session, limit: int, dry: bool) -> tuple[int, int]:
    query = (
        sb.table("epreuves_bac")
        .select("id, annee, serie, matiere, type, url_storage, examen")
        .neq("examen", "BFEM")
        .not_.is_("url_storage", "null")
        .order("annee", ascending=False)
    )
    if limit:
        query = query.limit(limit)
    rows = query.execute().data or []
    print(f"\n── Phase 1 BAC : {len(rows)} PDFs\n")

    ok = err = 0
    for i, row in enumerate(rows, 1):
        label = f"[{i:03d}/{len(rows)}] BAC {row['annee']} {row['serie']} · {row['matiere']} · {row['type']}"
        print(label)
        if dry:
            print("  [dry-run]")
            continue

        try:
            r = session.get(row["url_storage"], timeout=30)
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
            "examen":        row.get("examen", "BAC"),
            "annee":         row["annee"],
            "serie":         row["serie"],
            "matiere":       row["matiere"],
            "groupe":        detect_groupe(row["matiere"], row["url_storage"]),
            "type":          row["type"],
            "contenu_texte": text[:MAX_TEXT],
            "exercices":     exercises,
            "epreuve_id":    row["id"],
        }
        try:
            upsert(sb, record)
            print("  [db-ok]")
            ok += 1
        except Exception as e:
            print(f"  [db-err] {e}")
            err += 1

        time.sleep(0.2)

    return ok, err


# ── Phase 2 : BFEM HTML ───────────────────────────────────────────────────────

def process_bfem(sb: Client, limit: int, dry: bool) -> tuple[int, int]:
    query = (
        sb.table("epreuves_bac")
        .select("id, annee, serie, matiere, type, contenu_html, url_originale, examen")
        .eq("examen", "BFEM")
        .not_.is_("contenu_html", "null")
        .order("annee", ascending=False)
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

        try:
            text = html_to_text(row["contenu_html"])
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
            upsert(sb, record)
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

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"Connecté : {SUPABASE_URL}")

    session = requests.Session()
    session.headers.update(HEADERS)

    total_ok = total_err = 0

    if not args.bfem_only:
        ok, err = process_bac(sb, session, args.limit, args.dry_run)
        total_ok += ok
        total_err += err

    if not args.bac_only:
        ok, err = process_bfem(sb, args.limit, args.dry_run)
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
