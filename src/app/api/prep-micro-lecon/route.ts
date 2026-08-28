import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { acquireGroqSlot, rateLimitResponse } from "@/lib/groqRateLimit";
import { buildCacheKey, getCached, setCached } from "@/lib/groqCache";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { subject, chapter, serie } = await req.json();

    if (!subject || !chapter) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const cacheKey = buildCacheKey("micro-lecon", subject, serie, chapter);
    const cached = await getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    if (!(await acquireGroqSlot())) return rateLimitResponse();

    const prompt = `Tu es un professeur sénégalais expert en ${subject}. Génère une micro-leçon claire et concise sur ce chapitre, fidèle au programme officiel du BAC sénégalais.

Matière: ${subject} | Série: ${serie}
Chapitre à expliquer: ${chapter}

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans explication):
{
  "chapter": "${chapter}",
  "subject": "${subject}",
  "explanation": "<explication claire du chapitre en 3-5 phrases, adaptée au niveau BAC sénégalais>",
  "key_points": ["<point clé 1>", "<point clé 2>", "<point clé 3>"],
  "exemple": "<un exemple concret ou exercice type BAC sur ce chapitre>"
}`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse IA invalide.");

    const lecon = JSON.parse(jsonMatch[0]);
    const result = { lecon };
    await setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[prep-micro-lecon]", err);
    return NextResponse.json({ error: "Erreur de génération." }, { status: 500 });
  }
}
