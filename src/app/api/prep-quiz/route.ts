import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: {
    subject: string;
    examType: string;
    serie?: string;
    country?: string;
    questionCount: number;
  };

  try {
    body = await req.json();
    if (!body.subject || !body.examType) throw new Error("subject et examType requis");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Requête invalide";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { subject, examType, serie, country = "Sénégal", questionCount } = body;
  const n = Math.min(questionCount || 20, 30);

  const prompt = `Génère ${n} questions d'examen pour ${subject}, niveau ${examType}${serie ? " série " + serie : ""} de ${country}.
Questions variées : QCM, vrai/faux, calculs, définitions.
Difficulté progressive : 30% facile, 40% moyen, 30% difficile.

Retourne UNIQUEMENT ce JSON valide :
{
  "questions": [
    {
      "id": 1,
      "type": "qcm",
      "question": "Énoncé de la question ?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explication détaillée de la bonne réponse.",
      "points": 2,
      "difficulty": "moyen"
    }
  ]
}

Règles :
- type = "qcm" (4 choix), "vrai_faux" (Vrai/Faux), "calcul" (réponse numérique), "definition"
- Pour vrai_faux : choices = ["Vrai", "Faux"]
- Pour calcul et definition : choices = []
- Exactement ${n} questions
- Tout en français
- Adapté au programme officiel de ${country}`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
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
