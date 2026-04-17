import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { subject, serie, examType, questions } = await req.json();

    if (!subject || !questions?.length) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const chapitres = subject;

    const wrongChapters = questions
      .filter((q: { is_correct: boolean; chapter?: string }) => !q.is_correct && q.chapter)
      .map((q: { chapter?: string }) => q.chapter)
      .filter(Boolean);

    const correctCount = questions.filter((q: { is_correct: boolean }) => q.is_correct).length;
    const totalCount = questions.length;

    const prompt = `Tu es un coach pédagogique pour le BAC sénégalais. Analyse les résultats d'un élève.

Matière: ${subject} | Série: ${serie} | Examen: ${examType}
Score: ${correctCount}/${totalCount} questions correctes
Chapitres du programme: ${chapitres}

Détail question par question:
${questions.map((q: { question: string; correct_answer: string; user_answer: string; is_correct: boolean; chapter?: string }, i: number) =>
  `${i + 1}. [${q.is_correct ? "CORRECT" : "FAUX"}] ${q.question}\n   Réponse correcte: ${q.correct_answer}\n   Réponse élève: ${q.user_answer || "(aucune)"}\n   Chapitre: ${q.chapter || "?"}`
).join("\n")}

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans explication):
{
  "pret_bac_percent": <entier 0-100 représentant le % de préparation pour le BAC>,
  "chapitres_faibles": [<liste des 2-3 chapitres les plus faibles parmi: ${chapitres}>],
  "message_coach": "<message personnalisé encourageant en français, 2-3 phrases, basé sur les vrais résultats>"
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse IA invalide.");

    const analysis = JSON.parse(jsonMatch[0]);

    // Ensure chapitres_faibles uses wrong chapters if available
    if (wrongChapters.length > 0 && (!analysis.chapitres_faibles || analysis.chapitres_faibles.length === 0)) {
      analysis.chapitres_faibles = [...new Set(wrongChapters)].slice(0, 3);
    }

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    console.error("[prep-analyse]", err);
    return NextResponse.json({ error: "Erreur d'analyse." }, { status: 500 });
  }
}
