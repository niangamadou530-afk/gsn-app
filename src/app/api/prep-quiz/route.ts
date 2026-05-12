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

/* ── Fallback inline data (legacy) ─────────────────────── */

const PROGRAMMES_OFFICIELS: Record<string, Record<string, string>> = {
  "Maths": {
    "S1": `Programme officiel Maths BAC S1 Sénégal :
• Suites numériques : suites arithmétiques et géométriques, formule Un, somme Sn, convergence
• Limites et continuité : limites usuelles, théorème des gendarmes, continuité sur un intervalle, TVI
• Dérivabilité : dérivée en un point, fonction dérivée, règles de calcul, dérivée composée
• Étude de fonctions : tableau de variations, extrema, asymptotes, courbes représentatives
• Fonctions logarithme et exponentielle : ln, exp, propriétés, équations et inéquations
• Primitives et intégrales : calcul d'intégrales, intégration par parties, aires
• Probabilités : dénombrement, loi binomiale, espérance, variance
• Géométrie dans l'espace : vecteurs 3D, plans, droites
• Nombres complexes : forme algébrique et trigonométrique, module, argument`,
    "S2": `Programme officiel Maths BAC S2 Sénégal :
• Suites numériques, limites, continuité, dérivabilité
• Fonctions log et exponentielle, fonctions circulaires
• Primitives et intégrales
• Probabilités : loi binomiale, loi normale
• Géométrie dans l'espace et nombres complexes`,
    "G": `Programme officiel Maths BAC G Sénégal :
• Suites numériques (intérêts simples et composés, annuités)
• Statistiques descriptives : moyenne, médiane, écart-type, droite de régression
• Probabilités élémentaires
• Fonctions logarithme et exponentielle (applications financières)
• Programmation linéaire`,
    "BFEM": `Programme officiel Maths BFEM Sénégal :
• Arithmétique : PGCD, PPCM, divisibilité
• Algèbre : équations du 1er et 2nd degré, systèmes linéaires
• Trigonométrie : sin, cos, tan, Pythagore, Thalès
• Géométrie plane et dans l'espace
• Statistiques simples`,
  },
};

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: { subject: string; examType: string; serie?: string; chapitre?: string; questionCount?: number; count?: number; annee?: string; examBlanc?: boolean };
  try {
    body = await req.json();
    if (!body.subject || !body.examType) throw new Error("subject et examType requis");
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Requête invalide" }, { status: 400 });
  }

  const { subject, examType, serie = "", chapitre = "", questionCount, count, annee } = body;
  const n = Math.min(count || questionCount || 10, 20);

  // Récupérer contenu officiel depuis Supabase
  const contenuOfficiel = await fetchContenu(examType, serie, subject, chapitre);
  const contenuCtx = buildContenuCtx(contenuOfficiel);

  const competences = getCompetences(subject, serie, chapitre || "");
  const contextCompetences = competences.length > 0
    ? `\n\nCOMPÉTENCES EXIGIBLES OFFICIELLES DU MINISTÈRE DE L'ÉDUCATION DU SÉNÉGAL\n(Ce sont les compétences EXACTES sur lesquelles l'élève sera évalué au BAC/BFEM)\n${competences.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nINSTRUCTION STRICTE : Ton contenu doit porter EXCLUSIVEMENT sur ces compétences officielles. Ne génère rien qui ne soit pas dans cette liste. Chaque question, flashcard ou explication doit correspondre à au moins une compétence de cette liste.`
    : "";

  // Fallback inline si rien en base
  const serieKey = serie || (examType === "BFEM" ? "BFEM" : "S1");
  const subjectProgs = PROGRAMMES_OFFICIELS[subject] ?? {};
  const progForSerie = subjectProgs[serieKey] ?? subjectProgs[Object.keys(subjectProgs)[0]] ?? "";
  const programSection = (!contenuCtx && progForSerie)
    ? `\nPROGRAMME OFFICIEL (Office du BAC Sénégal) :\n${progForSerie}\n`
    : "";

  const anneeContext = annee ? ` (session ${annee})` : "";
  const chapitreContext = chapitre ? `, chapitre : "${chapitre}"` : "";

  const prompt = `Génère ${n} questions d'examen pour la matière "${subject}"${chapitreContext}, niveau ${examType}${serie ? " série " + serie : ""}${anneeContext} au Sénégal.${programSection}${contenuCtx}${contextCompetences}
Questions variées : QCM (4 choix), vrai/faux, calculs, définitions.
Difficulté progressive : 30% facile, 40% moyen, 30% difficile.
Les questions doivent être précisément basées sur le programme officiel sénégalais.

Retourne UNIQUEMENT ce JSON valide :
{
  "questions": [
    {
      "id": 1,
      "type": "qcm",
      "question": "Énoncé précis de la question ?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explication détaillée de la bonne réponse.",
      "points": 2,
      "difficulty": "moyen",
      "chapter": "Nom du chapitre exact du programme"
    }
  ]
}

Règles :
- type = "qcm" (4 choix), "vrai_faux" (choices=["Vrai","Faux"]), "calcul" (choices=[]), "definition" (choices=[])
- Exactement ${n} questions
- Tout en français
- chapter doit correspondre à un chapitre réel du programme officiel`;

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

    const quiz = JSON.parse(match[0]);
    if (!Array.isArray(quiz.questions)) throw new Error("Structure invalide");

    return NextResponse.json(quiz);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-quiz error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
