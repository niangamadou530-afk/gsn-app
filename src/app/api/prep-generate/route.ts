import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const groqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquante");
  return new Groq({ apiKey });
};

function sysJson() {
  return { role: "system" as const, content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown ni backticks." };
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/```json|```/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .trim();
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

RÈGLE ABSOLUE : dans "choices", chaque élément doit être le TEXTE COMPLET de l'option, jamais une lettre seule.
RÈGLE ABSOLUE : "correct_answer" doit être le TEXTE COMPLET identique à l'un des éléments de "choices".

Retourne UNIQUEMENT ce JSON :
{
  "questions": [
    {
      "id": 1,
      "question": "Quel organite contient l'ADN de la cellule ?",
      "choices": ["Le noyau cellulaire", "Les mitochondries", "La membrane plasmique", "Le cytoplasme"],
      "correct_answer": "Le noyau cellulaire",
      "explanation": "Le noyau contient l'ADN organisé en chromosomes.",
      "difficulty": "facile"
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
Réponds en texte brut structuré, pas en JSON.

Structure ton résumé avec ces sections :

## Introduction
Présente le contexte et l'importance du sujet.

## Notions essentielles
Explique toutes les notions clés clairement et en détail.

## Définitions importantes
Liste et définis les termes clés avec leur contexte.

## Formules et règles
Donne les formules, règles et méthodes importantes avec explications.

## Exemples concrets
Illustre avec des exemples pratiques et concrets.

## Ce qui tombe aux examens
Conseils spécifiques pour les examens sénégalais, points souvent évalués.

## Points clés à retenir
Résume en 5 points essentiels.

Sois précis, complet et pédagogique. Tout en français.`;
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

/* ── Supabase server-side save ──────────────────────────── */

async function saveResumeServer(
  token: string | null,
  matiere: string, chapitre: string, contenu: string
): Promise<boolean> {
  if (!token || !contenu) {
    console.error("saveResumeServer: token manquant ou contenu vide");
    return false;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("saveResumeServer: variables Supabase manquantes");
    return false;
  }
  const sb = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    console.error("saveResumeServer: getUser échoué", authErr?.message);
    return false;
  }
  console.log("saveResumeServer: insertion pour", user.id, matiere, chapitre);
  const { error } = await sb.from("prep_resumes").insert({
    user_id: user.id, matiere, chapitre, contenu,
  });
  if (error) {
    console.error("saveResumeServer: erreur insert", error.code, error.message, error.details, error.hint);
    return false;
  }
  console.log("saveResumeServer: succès");
  return true;
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

  // JWT pour sauvegarde côté serveur (uniquement pour resume)
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwtToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

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
      const isResume = type === "resume";
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
        const buf  = Buffer.from(fileBase64, "base64");
        const text = buf.toString("utf-8")
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);

        const msgs = isResume
          ? [{ role: "user" as const, content: `${prompt}\n\nContenu du document :\n${text}` }]
          : [sysJson(), { role: "user" as const, content: `${prompt}\n\nContenu du document :\n${text}` }];

        const completion = await groq.chat.completions.create({
          messages: msgs,
          model: "llama-3.1-8b-instant",
          max_tokens: 3000,
          temperature: 0.3,
        });
        content = completion.choices[0]?.message?.content ?? "";
      }

      if (isResume) {
        const texte = content.trim();
        const saved = await saveResumeServer(jwtToken, matiere, "", texte);
        return NextResponse.json({ texte, saved });
      }
      return NextResponse.json(parseJson(content));
    }

    /* ── Knowledge mode (Mode B) ── */
    if (type === "resume") {
      const prompt = resumePrompt(matiere, chapitre, examType, serie, false);
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: 3000,
        temperature: 0.4,
      });
      const texte = (completion.choices[0]?.message?.content ?? "").trim();
      const saved = await saveResumeServer(jwtToken, matiere, chapitre, texte);
      return NextResponse.json({ texte, saved });
    }

    let prompt: string;
    if (type === "flashcards") prompt = flashcardsPrompt(matiere, chapitre, examType, serie, false);
    else                       prompt = quizPrompt(matiere, chapitre, examType, serie, quizMode, false);

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
