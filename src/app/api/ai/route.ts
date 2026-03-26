import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    // Vérification de la clé
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: '[{"title": "Erreur Configuration", "description": "Clé API manquante dans .env.local"}]' });
    }

    const groq = new Groq({ apiKey });
    const { message } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "llama3-8b-8192",
    });

    const reply = completion.choices[0]?.message?.content || "[]";
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("DEBUG API:", error);
    // En cas d'erreur, on renvoie un faux parcours pour ne pas bloquer l'utilisateur
    return NextResponse.json({ 
      reply: '[{"title": "Module de secours", "description": "L\'IA est indisponible, mais tu peux commencer ici."}]' 
    });
  }
}
