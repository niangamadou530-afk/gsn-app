import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { PROGRAMMES } from "@/data/programmes";

const SEED_KEY = "gsn-prep-seed-2024";

// Utilise la service role key pour bypasser RLS (seed admin uniquement)
function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function groqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquante");
  return new Groq({ apiKey });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeJsonStrings(jsonStr: string): string {
  return jsonStr.replace(/"(?:[^"\\]|\\.)*"/gs, (strVal) =>
    strVal
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/\\([^"\\/bfnrtu])/g, "$1")
      .replace(/\\u(?![0-9a-fA-F]{4})/g, "u")
  );
}

function parseJson(raw: string): unknown {
  let cleaned = raw.replace(/```json|```/g, "");
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Pas de JSON dans la réponse");
  const jsonStr = match[0];

  // Pass 1: standard escape sanitization
  try { return JSON.parse(sanitizeJsonStrings(jsonStr)); } catch { /* fall through */ }

  // Pass 2: nuclear — strip ALL backslashes from string values, collapse whitespace
  try {
    const nuclear = jsonStr.replace(/"(?:[^"\\]|\\.)*"/gs, (strVal) =>
      '"' + strVal.slice(1, -1)
        .replace(/[\n\r\t]/g, " ")
        .replace(/\\./gs, (seq) =>
          /^\\["\\/bfnrt]$/.test(seq) || /^\\u[0-9a-fA-F]{4}$/.test(seq) ? seq : seq[1]
        ) + '"'
    );
    return JSON.parse(nuclear);
  } catch { /* fall through */ }

  // Pass 3: extract fields by raw regex, ignore structure errors
  const contenu = (jsonStr.match(/"contenu"\s*:\s*"((?:[^"\\]|\\.)*)"/s)?.[1] ?? "")
    .replace(/[\n\r\t\\]/g, " ").trim();
  if (!contenu) throw new Error("Pas de JSON dans la réponse");
  const rawArr = jsonStr.match(/"points_cles"\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const points_cles = (rawArr.match(/"[^"]*"/g) ?? []).map(s => s.slice(1,-1)).slice(0,5);
  return { contenu, points_cles, formules: [] };
}

type ContenuRow = {
  examen: string;
  serie: string;
  matiere: string;
  chapitre: string;
  contenu: string;
  points_cles: string[];
  formules: string[];
};

/* ── Collecte tous les chapitres à traiter ──────────────── */
function collectChapitres(filterExamen?: string, filterSerie?: string): ContenuRow[] {
  const rows: ContenuRow[] = [];

  // BFEM
  if (!filterExamen || filterExamen === "BFEM") {
    if (!filterSerie || filterSerie === "") {
      for (const [matiere, data] of Object.entries(PROGRAMMES.BFEM)) {
        for (const chapitre of data.chapitres) {
          if (chapitre === "Autre") continue;
          rows.push({ examen: "BFEM", serie: "", matiere, chapitre, contenu: "", points_cles: [], formules: [] });
        }
      }
    }
  }

  // BAC
  if (!filterExamen || filterExamen === "BAC") {
    for (const [serie, serieData] of Object.entries(PROGRAMMES.BAC)) {
      if (filterSerie && filterSerie !== serie) continue;
      for (const [matiere, data] of Object.entries(serieData as Record<string, { chapitres: string[] }>)) {
        for (const chapitre of data.chapitres) {
          if (chapitre === "Autre") continue;
          rows.push({ examen: "BAC", serie, matiere, chapitre, contenu: "", points_cles: [], formules: [] });
        }
      }
    }
  }

  return rows;
}

/* ── Génère le contenu pédagogique via Groq ─────────────── */
async function genererContenu(
  groq: Groq,
  examen: string,
  serie: string,
  matiere: string,
  chapitre: string
): Promise<{ contenu: string; points_cles: string[]; formules: string[] }> {
  const makePrompt = (simple: boolean) => simple
    ? `Réponds en JSON strict. Pas de formules LaTeX, pas de caractères spéciaux, pas de backslash.
Génère pour ${examen}${serie ? ` série ${serie}` : ""} — ${matiere} — ${chapitre} :
{"contenu":"texte de 200 mots sans backslash ni guillemets","points_cles":["p1","p2","p3","p4","p5"],"formules":[]}`
    : `Tu es un professeur expert du programme officiel sénégalais.
Génère un contenu pédagogique détaillé pour :
- Examen : ${examen}${serie ? ` série ${serie}` : ""}
- Matière : ${matiere}
- Chapitre : ${chapitre}

Le contenu doit faire 300 à 500 mots, être clair, structuré, avec définitions, notions clés et exemples concrets adaptés au niveau ${examen} sénégalais.

Retourne UNIQUEMENT ce JSON valide (sans markdown) :
{
  "contenu": "Contenu pédagogique complet de 300-500 mots...",
  "points_cles": ["Point essentiel 1", "Point essentiel 2", "Point essentiel 3", "Point essentiel 4", "Point essentiel 5"],
  "formules": ["Formule 1 si applicable", "Formule 2"]
}

Si la matière n'a pas de formules (ex: Philosophie, Français, Histoire), renvoie formules: [].
Exactement 5 points_cles. Tout en français. N'utilise pas de backslash dans le texte.`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(3000);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown ni backticks ni backslash dans les valeurs." },
          { role: "user", content: makePrompt(attempt === 2) },
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: attempt === 2 ? 800 : 1200,
        temperature: attempt === 0 ? 0.3 : 0.1,
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = parseJson(raw) as { contenu?: string; points_cles?: string[]; formules?: string[] };
      if (!parsed.contenu) throw new Error("Contenu vide");
      return {
        contenu: parsed.contenu,
        points_cles: Array.isArray(parsed.points_cles) ? parsed.points_cles.slice(0, 5) : [],
        formules: Array.isArray(parsed.formules) ? parsed.formules : [],
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/* ── Route POST ─────────────────────────────────────────── */
export async function POST(req: Request) {
  // Auth
  if (req.headers.get("x-seed-key") !== SEED_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { examen?: string; serie?: string; limit?: number; force?: boolean } = {};
  try { body = await req.json(); } catch { /* params optionnels */ }

  const filterExamen = body.examen;
  const filterSerie  = body.serie;
  const limit        = Math.min(body.limit ?? 20, 50);
  const force        = body.force ?? false;

  const supabase = sb();
  const groq = groqClient();

  // Collect all chapters matching filters
  const allChapitres = collectChapitres(filterExamen, filterSerie);

  // Check which already exist (unless force=true)
  let toProcess = allChapitres;
  if (!force) {
    const { data: existing } = await supabase
      .from("programmes_contenu")
      .select("examen, serie, matiere, chapitre")
      .in("examen", filterExamen ? [filterExamen] : ["BFEM", "BAC"]);

    const existingSet = new Set(
      (existing ?? []).map((r: { examen: string; serie: string; matiere: string; chapitre: string }) =>
        `${r.examen}|${r.serie}|${r.matiere}|${r.chapitre}`
      )
    );
    toProcess = allChapitres.filter(
      r => !existingSet.has(`${r.examen}|${r.serie}|${r.matiere}|${r.chapitre}`)
    );
  }

  const total     = allChapitres.length;
  const remaining = toProcess.length;
  const batch     = toProcess.slice(0, limit);

  const results: { ok: string[]; errors: string[] } = { ok: [], errors: [] };

  for (const row of batch) {
    const key = `${row.examen}|${row.serie || "BFEM"}|${row.matiere}|${row.chapitre}`;
    try {
      const { contenu, points_cles, formules } = await genererContenu(
        groq, row.examen, row.serie, row.matiere, row.chapitre
      );

      if (!contenu) throw new Error("Contenu vide");

      const { error } = await supabase.from("programmes_contenu").upsert(
        { examen: row.examen, serie: row.serie, matiere: row.matiere, chapitre: row.chapitre, contenu, points_cles, formules },
        { onConflict: "examen,serie,matiere,chapitre" }
      );
      if (error) throw new Error(error.message);

      results.ok.push(key);
    } catch (err) {
      results.errors.push(`${key}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Throttle : 2.5s entre chaque appel Groq (réduit les 429 TPM)
    await sleep(2500);
  }

  return NextResponse.json({
    processed: results.ok.length,
    errors: results.errors.length,
    error_details: results.errors,
    total_chapitres: total,
    remaining_after: remaining - batch.length,
    hint: remaining - batch.length > 0
      ? `Relance avec les mêmes paramètres pour continuer (${remaining - batch.length} chapitres restants)`
      : "Seeding terminé pour ce filtre",
  });
}

/* ── Route GET — stats ──────────────────────────────────── */
export async function GET(req: Request) {
  if (req.headers.get("x-seed-key") !== SEED_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = sb();
  const { count: seeded } = await supabase
    .from("programmes_contenu")
    .select("*", { count: "exact", head: true });

  const all = collectChapitres();

  return NextResponse.json({
    total_chapitres: all.length,
    seeded: seeded ?? 0,
    remaining: all.length - (seeded ?? 0),
    by_serie: Object.fromEntries(
      ["BFEM", "L", "S1", "S2", "S3", "S4", "S5", "F6", "T1", "T2", "G"].map(s => [
        s,
        collectChapitres(s === "BFEM" ? "BFEM" : "BAC", s === "BFEM" ? "" : s).length,
      ])
    ),
  });
}
