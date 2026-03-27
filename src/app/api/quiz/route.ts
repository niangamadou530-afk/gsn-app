import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });
  }

  let courseTitle: string;
  let weeks: any[];
  try {
    const body = await req.json();
    courseTitle = body.courseTitle;
    weeks = body.weeks;
    if (!Array.isArray(weeks)) throw new Error("weeks doit être un tableau");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  // Build a compact summary using only titles and keywords
  const summary = weeks
    .slice(0, 16)
    .map((w: any) =>
      `Semaine ${w.week}: ${w.title}. Modules: ${w.modules
        ?.map((m: any) => `${m.title} (${m.keywords?.join(", ")})`)
        .join(" | ")}`
    )
    .join("\n");

  const prompt = `Génère un test de certification de 20 questions basé sur ce cours: "${courseTitle}".

Contenu du cours:
${summary}

Réponds UNIQUEMENT avec ce JSON (sans texte autour):
{
  "questions": [
    {
      "id": 1,
      "question": "Question en français?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Explication courte de la bonne réponse."
    }
  ]
}

Règles strictes:
- Exactement 20 questions
- 4 options par question
- answer = index (0 à 3) de la bonne réponse
- Questions variées couvrant l'ensemble du cours
- Tout en français`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 3000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Pas de JSON dans la réponse");

    const quiz = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error("Structure de quiz invalide");
    }

    return NextResponse.json(quiz);
  } catch (error: any) {
    const detail = error?.message ?? String(error);
    console.error("Quiz generation error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
