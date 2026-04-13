import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const JSON_PROMPT = (matiere: string) => `Tu es un professeur expert en ${matiere || "toutes matières"}.
Analyse ce cours et génère en JSON :
{
  "titre": "titre du cours",
  "matiere": "${matiere || "Matière non précisée"}",
  "resume": "résumé en 5 lignes maximum, clair et concis",
  "points_cles": ["point essentiel 1", "point essentiel 2", "point essentiel 3", "point essentiel 4", "point essentiel 5"],
  "formules": ["formule ou règle 1", "formule 2"],
  "definitions": [
    {"terme": "Terme important", "definition": "Définition claire et concise"}
  ],
  "flashcards": [
    {"question": "Question de révision ?", "reponse": "Réponse complète"}
  ],
  "conseils_exam": ["Conseil pratique pour l'examen 1", "Conseil 2"]
}
Retourne UNIQUEMENT le JSON valide, sans markdown.`;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const matiere = (formData.get("matiere") as string) || "";

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const groq = new Groq({ apiKey });
  const fileType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    let content: string;

    if (fileType === "application/pdf") {
      // Extract text from PDF
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text?.slice(0, 8000) || "";
      if (!text.trim()) {
        return NextResponse.json({ error: "Impossible d'extraire le texte du PDF. Essaie une image (JPG/PNG)." }, { status: 422 });
      }

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide." },
          { role: "user", content: `${JSON_PROMPT(matiere)}\n\nVoici le contenu du cours :\n${text}` },
        ],
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        temperature: 0.3,
      });
      content = completion.choices[0]?.message?.content ?? "";
    } else if (fileType.startsWith("image/")) {
      // Use Groq vision model
      const base64 = buffer.toString("base64");
      const mimeType = fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: JSON_PROMPT(matiere),
              },
            ],
          },
        ],
        model: "llama-3.2-11b-vision-preview",
        max_tokens: 3000,
        temperature: 0.3,
      });
      content = completion.choices[0]?.message?.content ?? "";
    } else {
      return NextResponse.json({ error: "Format non supporté. Utilise PDF, JPG ou PNG." }, { status: 400 });
    }

    const cleaned = content.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Pas de JSON dans la réponse IA");

    const result = JSON.parse(match[0]);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-resumeur error:", detail);
    return NextResponse.json({ error: `Erreur IA: ${detail}` }, { status: 502 });
  }
}
