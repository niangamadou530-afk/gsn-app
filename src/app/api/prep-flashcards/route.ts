import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const chapter  = body?.chapter  || "Révision générale";
  const subject  = body?.subject  || "Maths";
  const examType = body?.examType || "BAC";
  const serie    = body?.serie    || "";
  const count    = Math.min(body?.count || 10, 20);

  const prompt = `Génère ${count} flashcards pour le chapitre "${chapter}" en ${subject}, niveau ${examType}${serie ? " série " + serie : ""}.

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
- Adapté au programme officiel du ${examType}
- Tout en français`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
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
