import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: any;
  try {
    body = await req.json();
    if (!body.moduleTitle) throw new Error("moduleTitle requis");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const { moduleTitle, weekTitle, domain, level, description } = body;

  const prompt = `Tu es un expert formateur en "${domain}".
Génère le contenu pédagogique complet d'un module de formation.

Module: "${moduleTitle}"
Semaine thématique: "${weekTitle}"
Niveau: ${level ?? "tous niveaux"}
Résumé: ${description ?? ""}

Réponds UNIQUEMENT avec ce JSON valide (sans texte autour, sans markdown):
{
  "sections": [
    {
      "title": "Titre de la sous-section",
      "content": "Contenu pédagogique détaillé. Utilise le markdown dans le contenu : **texte important** pour les termes clés, \`concept\` pour les mots techniques, ## Sous-titre pour les sous-parties, - item pour les listes. Minimum 200 mots par section."
    }
  ],
  "quiz": [
    {
      "question": "Question de compréhension précise et pertinente ?",
      "options": ["Option A correcte ou incorrecte", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Explication claire de pourquoi cette réponse est correcte et pourquoi les autres sont incorrectes."
    }
  ]
}

Règles strictes:
- Exactement 5 sous-sections dans "sections"
- Chaque sous-section: minimum 200 mots avec du markdown (**gras**, \`code\`, - listes, ## titres)
- Exactement 5 questions dans "quiz"
- Les questions doivent tester la compréhension, pas la mémorisation
- answer = index (0 à 3) de la bonne réponse
- Tout en français
- Niveau adapté: ${level ?? "intermédiaire"}`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown, sans texte autour." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Pas de JSON dans la réponse");

    const content = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(content.sections) || !Array.isArray(content.quiz)) {
      throw new Error("Structure de contenu invalide");
    }

    return NextResponse.json(content);
  } catch (error: any) {
    const detail = error?.message ?? String(error);
    console.error("Module content error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
