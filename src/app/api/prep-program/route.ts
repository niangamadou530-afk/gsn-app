import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: {
    country: string;
    examType: string;
    serie?: string;
    levels: string;
    examDate: string;
    daysLeft: number;
  };

  try {
    body = await req.json();
    if (!body.examType || !body.examDate) throw new Error("examType et examDate requis");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Requête invalide";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { country, examType, serie, levels, examDate, daysLeft } = body;

  const prompt = `Tu es un expert en éducation de ${country}.
Génère un programme de révision personnalisé en JSON pour un élève préparant le ${examType}${serie ? " série " + serie : ""}.
Niveaux par matière : ${levels}
Date de l'examen : ${examDate}
Il reste ${daysLeft} jours.

Adapte le programme selon le curriculum officiel de ${country} pour ${examType}.
Priorise les matières où l'élève est "Faible", puis "Moyen".

Retourne UNIQUEMENT ce JSON valide (sans texte autour, sans markdown) :
{
  "total_days": ${Math.min(daysLeft, 60)},
  "daily_program": [
    {
      "day": 1,
      "date": "${examDate}",
      "subjects": [
        {
          "name": "Maths",
          "duration_minutes": 90,
          "priority": "haute",
          "topics": ["Algèbre", "Géométrie"],
          "exercises": ["Exercice 1", "Exercice 2"]
        }
      ],
      "total_hours": 3.5
    }
  ],
  "weekly_goals": ["Objectif semaine 1", "Objectif semaine 2"],
  "key_advice": ["Conseil 1", "Conseil 2", "Conseil 3"]
}

Génère exactement ${Math.min(daysLeft, 14)} jours de programme (les 2 premières semaines).
Chaque jour : 2 à 4 matières, 3 à 5 heures total selon le niveau de l'élève.
Tout en français.`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown, sans texte autour." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Pas de JSON dans la réponse");

    const program = JSON.parse(match[0]);
    if (!Array.isArray(program.daily_program)) throw new Error("Structure invalide");

    return NextResponse.json(program);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-program error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
