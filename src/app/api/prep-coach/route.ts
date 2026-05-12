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
  if (!matiere || !chapitre || chapitre === "Autre") return null;
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

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: {
    systemPrompt: string;
    message: string;
    history?: Array<{ role: string; content: string }>;
    matiere?: string;
    chapitre?: string;
    examen?: string;
    serie?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { systemPrompt, message, history = [], matiere = "", chapitre = "", examen = "BAC", serie = "" } = body;

  // Récupérer contenu officiel si matiere + chapitre disponibles
  const contenuOfficiel = await fetchContenu(examen, serie, matiere, chapitre);
  const contenuCtx = buildContenuCtx(contenuOfficiel);

  const competences = getCompetences(matiere, serie, chapitre || "");
  const contextCompetences = competences.length > 0
    ? `\n\nCOMPÉTENCES EXIGIBLES OFFICIELLES DU MINISTÈRE DE L'ÉDUCATION DU SÉNÉGAL\n(Ce sont les compétences EXACTES sur lesquelles l'élève sera évalué au BAC/BFEM)\n${competences.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nINSTRUCTION STRICTE : Ton contenu doit porter EXCLUSIVEMENT sur ces compétences officielles. Ne génère rien qui ne soit pas dans cette liste. Chaque question, flashcard ou explication doit correspondre à au moins une compétence de cette liste.`
    : "";

  // Injecter à la fin du systemPrompt
  const enrichedSystemPrompt = (contenuCtx || contextCompetences)
    ? `${systemPrompt}${contenuCtx}${contextCompetences}`
    : systemPrompt;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: enrichedSystemPrompt },
        ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: message },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 500,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content ?? "Désolé, je n'ai pas pu répondre.";
    return NextResponse.json({ message: text });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
