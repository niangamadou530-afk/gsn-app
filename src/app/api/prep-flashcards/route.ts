import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { getCompetences } from "@/data/competences";

/* ── Supabase + contenu officiel ───────────────────────── */

function sbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type ContenuOfficiel = { contenu: string; points_cles: string[] | null; formules: string[] | null } | null;

async function fetchContenu(examType: string, serie: string, matiere: string, chapitre: string): Promise<ContenuOfficiel> {
  if (!chapitre || chapitre === "Autre") return null;
  try {
    const { data } = await sbClient()
      .from("programmes_contenu")
      .select("contenu, points_cles, formules")
      .eq("examen", examType)
      .eq("serie", serie)
      .eq("matiere", matiere)
      .eq("chapitre", chapitre)
      .maybeSingle();
    return data as ContenuOfficiel;
  } catch {
    return null;
  }
}

function buildContenuCtx(contenu: ContenuOfficiel): string {
  if (!contenu?.contenu) return "";
  const parts = [`\n\nCONTENU OFFICIEL DU PROGRAMME SÉNÉGALAIS:\n${contenu.contenu}`];
  if (contenu.points_cles?.length) parts.push(`\nPOINTS CLÉS:\n${contenu.points_cles.join("\n")}`);
  if (contenu.formules?.length)    parts.push(`\nFORMULES:\n${contenu.formules.join("\n")}`);
  return parts.join("");
}

/* ── Route ─────────────────────────────────────────────── */

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const chapter         = body?.chapter         || "Révision générale";
  const subject         = body?.subject         || "Maths";
  const examType        = body?.examType        || "BAC";
  const serie           = body?.serie           || "";
  const count           = Math.min(body?.count || 10, 20);
  const programmeContenu: string = body?.programmeContenu || "";

  // Récupérer contenu officiel depuis Supabase
  const contenuOfficiel = await fetchContenu(examType, serie, subject, chapter);
  const contenuCtx = buildContenuCtx(contenuOfficiel);

  const competences = getCompetences(subject, serie, chapter || "");
  const contextCompetences = competences.length > 0
    ? `\n\nCOMPÉTENCES EXIGIBLES OFFICIELLES DU MINISTÈRE DE L'ÉDUCATION DU SÉNÉGAL\n(Ce sont les compétences EXACTES sur lesquelles l'élève sera évalué au BAC/BFEM)\n${competences.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nINSTRUCTION STRICTE : Ton contenu doit porter EXCLUSIVEMENT sur ces compétences officielles. Ne génère rien qui ne soit pas dans cette liste. Chaque question, flashcard ou explication doit correspondre à au moins une compétence de cette liste.`
    : "";

  // Combiner : contenu DB (prioritaire) + contenu passé par le client (fallback) + compétences
  const contexteFinal = (contenuCtx
    || (programmeContenu ? `\n\nPROGRAMME OFFICIEL DU CHAPITRE :\n${programmeContenu}\n\nBase-toi sur ce contenu pour générer des flashcards précises et fidèles au programme.` : "")) + contextCompetences;

  const prompt = `Génère ${count} flashcards pour le chapitre "${chapter}" en ${subject}, niveau ${examType}${serie ? " série " + serie : ""}.${contexteFinal}

Retourne UNIQUEMENT ce JSON valide :
{
  "flashcards": [
    {
      "id": 1,
      "recto": "Question ou notion à mémoriser",
      "verso": "Réponse complète et claire",
      "explication": "Explication détaillée, exemples si nécessaire",
      "difficulte": "facile",
      "chapitre": "${chapter}"
    }
  ]
}

Règles :
- difficulte = "facile" | "moyen" | "difficile"
- recto : formulation courte (question, définition à compléter, formule à restituer)
- verso : réponse directe et précise
- explication : contexte, exemple d'application, astuce mnémotechnique
- Exactement ${count} flashcards
- Mix de difficultés : 30% facile, 40% moyen, 30% difficile
- Adapté au programme officiel du ${examType} sénégalais
- Tout en français`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 2000,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Pas de JSON dans la réponse");

    const result = JSON.parse(match[0]);
    if (!Array.isArray(result.flashcards)) throw new Error("Structure invalide");

    return NextResponse.json(result);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-flashcards error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
