import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY manquante dans les variables d'environnement");
    return NextResponse.json(
      { error: "Configuration manquante: GROQ_API_KEY non définie" },
      { status: 500 }
    );
  }

  let message: string;
  try {
    const body = await req.json();
    message = body.message;
    if (!message) throw new Error("Champ 'message' manquant dans la requête");
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans texte, sans markdown." },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
      temperature: 0.2,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ reply });

  } catch (error: any) {
    const detail = error?.message ?? String(error);
    console.error("Groq API error:", detail);
    return NextResponse.json(
      { error: `Groq API error: ${detail}` },
      { status: 502 }
    );
  }
}
