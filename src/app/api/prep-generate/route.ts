import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquante");
  return new Groq({ apiKey });
};

function sysJson() {
  return { role: "system" as const, content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown ni backticks." };
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Pas de JSON dans la réponse");
  return JSON.parse(match[0]);
}

/* ── Prompts ─────────────────────────────────────────────── */

function flashcardsPrompt(matiere: string, chapitre: string, examType: string, serie: string, fromDoc: boolean): string {
  const ctx = chapitre ? `, sur le thème "${chapitre}"` : "";
  const src = fromDoc
    ? "en te basant UNIQUEMENT sur le contenu du document fourni"
    : `en te basant sur ta connaissance du programme officiel sénégalais du ${examType}${serie ? " série " + serie : ""}`;
  return `Tu es un professeur expert du ${examType} sénégalais.
Génère 12 flashcards pour ${matiere}${ctx} ${src}.
Recto : notion ou question clé courte.
Verso : explication claire et complète.
Contenu fidèle au programme officiel sénégalais.

Retourne UNIQUEMENT ce JSON :
{
  "flashcards": [
    { "recto": "Question ou notion ?", "verso": "Réponse complète et claire." }
  ]
}
Exactement 12 flashcards. Tout en français.`;
}

function quizPrompt(matiere: string, chapitre: string, examType: string, serie: string, quizMode: string, fromDoc: boolean): string {
  const ctx = chapitre ? `, sur le thème "${chapitre}"` : "";
  const src = fromDoc
    ? "en te basant UNIQUEMENT sur le contenu du document fourni"
    : `fidèle au programme officiel sénégalais du ${examType}${serie ? " série " + serie : ""}`;
  if (quizMode === "redaction") {
    return `Tu es un professeur expert du ${examType} sénégalais.
Génère 5 questions de développement pour ${matiere}${ctx} ${src}.
Questions ouvertes qui demandent une rédaction argumentée.

Retourne UNIQUEMENT ce JSON :
{
  "questions": [
    { "id": 1, "question": "Question ouverte ?" }
  ]
}
Exactement 5 questions. Tout en français.`;
  }
  return `Tu es un professeur expert du ${examType} sénégalais.
Génère 10 questions QCM pour ${matiere}${ctx} ${src}.
Difficulté progressive : 30% facile, 40% moyen, 30% difficile.

Retourne UNIQUEMENT ce JSON :
{
  "questions": [
    {
      "id": 1,
      "question": "Énoncé ?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explication de la bonne réponse.",
      "difficulty": "moyen"
    }
  ]
}
Exactement 10 questions QCM avec 4 choix chacune. Tout en français.`;
}

function resumePrompt(matiere: string, chapitre: string, examType: string, serie: string, fromDoc: boolean): string {
  const ctx = chapitre ? ` — ${chapitre}` : "";
  const src = fromDoc
    ? "en te basant UNIQUEMENT sur le contenu du document fourni"
    : `en te basant sur le programme officiel sénégalais du ${examType}${serie ? " série " + serie : ""}`;
  return `Tu es un professeur expert du ${examType} sénégalais.
Produis un résumé complet, détaillé et structuré pour ${matiere}${ctx} ${src}.
Tu dois inclure : 1) Introduction et contexte 2) Toutes les notions essentielles expliquées clairement 3) Définitions importantes 4) Formules ou règles clés 5) Exemples concrets 6) Points difficiles expliqués simplement 7) Ce qui tombe souvent aux examens au Sénégal 8) Résumé final en 5 points clés.
Sois précis, complet et pédagogique.

Retourne UNIQUEMENT ce JSON :
{
  "titre": "Titre du cours ou chapitre",
  "resume": "Introduction et contexte, puis toutes les notions essentielles expliquées clairement avec exemples concrets et points difficiles simplifiés. Rédige plusieurs paragraphes détaillés.",
  "points_cles": ["Résumé point clé 1", "Point clé 2", "Point clé 3", "Point clé 4", "Point clé 5"],
  "formules": ["Formule ou règle 1 avec explication complète", "Règle 2", "Exemple concret 1", "Exemple concret 2"],
  "definitions": [
    { "terme": "Terme important", "definition": "Définition complète et claire avec contexte." }
  ],
  "conseils_exam": ["Ce qui tombe souvent aux examens sénégalais : point 1", "Point difficile expliqué simplement", "Conseil méthodologique 1", "Conseil méthodologique 2"]
}
Tout en français. Sois très détaillé et complet dans chaque section.`;
}

function evaluatePrompt(
  questions: Array<{ id: number; question: string }>,
  answers: Record<number, string>,
  matiere: string,
  chapitre: string,
  examType: string,
  serie: string
): string {
  const qas = questions.map((q, i) => `Q${i + 1}: ${q.question}\nRéponse: ${answers[i] ?? "(pas de réponse)"}`).join("\n\n");
  return `Tu es un professeur expert du ${examType}${serie ? " série " + serie : ""} sénégalais, corrigeant une copie de ${matiere}${chapitre ? " — " + chapitre : ""}.

Évalue chaque réponse de l'élève sur 10 et donne un feedback détaillé et constructif.

${qas}

Retourne UNIQUEMENT ce JSON :
{
  "feedback": [
    { "score": 7, "feedback": "Bonne réponse mais il manque..." }
  ]
}
Exactement ${questions.length} éléments dans feedback. Tout en français.`;
}

/* ── Route ─────────────────────────────────────────────── */

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const mode      = body.mode as string;
  const type      = body.type as string;
  const matiere   = (body.matiere as string) || "Matière générale";
  const chapitre  = (body.chapitre as string) || "";
  const examType  = (body.examType as string) || "BAC";
  const serie     = (body.serie as string) || "";
  const quizMode  = (body.quizMode as string) || "qcm";
  const fileBase64 = body.fileBase64 as string | undefined;
  const fileType   = body.fileType as string | undefined;

  try {
    const groq = groqClient();

    /* ── Evaluate rédaction ── */
    if (mode === "evaluate") {
      const questions = body.questions as Array<{ id: number; question: string }>;
      const answers   = body.answers as Record<number, string>;
      const prompt = evaluatePrompt(questions, answers, matiere, chapitre, examType, serie);
      const completion = await groq.chat.completions.create({
        messages: [sysJson(), { role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: 2000,
        temperature: 0.3,
      });
      return NextResponse.json(parseJson(completion.choices[0]?.message?.content ?? ""));
    }

    /* ── Document mode (Mode A) ── */
    if (mode === "document" && fileBase64 && fileType) {
      let prompt: string;
      if (type === "flashcards")      prompt = flashcardsPrompt(matiere, "", examType, serie, true);
      else if (type === "quiz")       prompt = quizPrompt(matiere, "", examType, serie, quizMode, true);
      else                            prompt = resumePrompt(matiere, "", examType, serie, true);

      let content: string;

      if (fileType.startsWith("image/")) {
        const mimeType = fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const completion = await groq.chat.completions.create({
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
              { type: "text", text: prompt },
            ],
          }],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          max_tokens: 3000,
          temperature: 0.3,
        });
        content = completion.choices[0]?.message?.content ?? "";
      } else {
        // PDF: decode base64 to text
        const buf  = Buffer.from(fileBase64, "base64");
        const text = buf.toString("utf-8")
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);

        const completion = await groq.chat.completions.create({
          messages: [
            sysJson(),
            { role: "user", content: `${prompt}\n\nContenu du document :\n${text}` },
          ],
          model: "llama-3.1-8b-instant",
          max_tokens: 3000,
          temperature: 0.3,
        });
        content = completion.choices[0]?.message?.content ?? "";
      }

      return NextResponse.json(parseJson(content));
    }

    /* ── Knowledge mode (Mode B) ── */
    let prompt: string;
    if (type === "flashcards")      prompt = flashcardsPrompt(matiere, chapitre, examType, serie, false);
    else if (type === "quiz")       prompt = quizPrompt(matiere, chapitre, examType, serie, quizMode, false);
    else                            prompt = resumePrompt(matiere, chapitre, examType, serie, false);

    const completion = await groq.chat.completions.create({
      messages: [sysJson(), { role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      max_tokens: 3000,
      temperature: 0.4,
    });

    return NextResponse.json(parseJson(completion.choices[0]?.message?.content ?? ""));

  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-generate error:", detail);
    return NextResponse.json({ error: `Erreur IA: ${detail}` }, { status: 502 });
  }
}
