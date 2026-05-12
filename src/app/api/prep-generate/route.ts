import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { getMatiereData } from "@/data/programmes";
import { getCompetences } from "@/data/competences";

const groqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquante");
  return new Groq({ apiKey });
};

function sbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

const isAnglais = (m: string) => m.toLowerCase().includes("anglais") || m.toLowerCase().includes("english");

/* ── Contenu officiel Supabase ───────────────────────────── */

type ContenuOfficiel = { contenu: string; points_cles: string[] | null; formules: string[] | null } | null;

async function fetchContenu(examType: string, serie: string, matiere: string, chapitre: string): Promise<ContenuOfficiel> {
  if (!chapitre || chapitre === "Autre") return null;
  try {
    const { data } = await sbClient()
      .from("programmes_contenu")
      .select("contenu, points_cles, formules")
      .eq("examen", examType)
      .eq("serie", serie)
      .eq("matiere", matiere)
      .eq("chapitre", chapitre)
      .maybeSingle();
    return data as ContenuOfficiel;
  } catch {
    return null;
  }
}

function buildContenuCtx(contenu: ContenuOfficiel): string {
  if (!contenu?.contenu) return "";
  const parts = [`\n\nCONTENU OFFICIEL DU PROGRAMME SÉNÉGALAIS:\n${contenu.contenu}`];
  if (contenu.points_cles?.length) parts.push(`\nPOINTS CLÉS:\n${contenu.points_cles.join("\n")}`);
  if (contenu.formules?.length)    parts.push(`\nFORMULES:\n${contenu.formules.join("\n")}`);
  return parts.join("");
}

/* ── Prompts ─────────────────────────────────────────────── */

function buildProgCtx(matiere: string, chapitre: string, examType: string, serie: string): string {
  const data = getMatiereData(examType, serie, matiere);
  if (!data) return "";
  const parts: string[] = [];
  if (data.coefficient) parts.push(`Coefficient : ${data.coefficient} | Durée : ${data.duree_epreuve}`);
  return parts.length ? `\n[PROGRAMME OFFICIEL — ${examType}${serie ? " " + serie : ""}]\n${parts.join("\n")}\n` : "";
}

function flashcardsPrompt(matiere: string, chapitre: string, examType: string, serie: string, fromDoc: boolean, contenuCtx = ""): string {
  const src = fromDoc
    ? "based ONLY on the content of the provided document"
    : `based on the official Senegalese ${examType}${serie ? " " + serie : ""} curriculum`;
  const progCtx = fromDoc ? "" : buildProgCtx(matiere, chapitre, examType, serie);

  if (isAnglais(matiere)) {
    const ctx = chapitre ? ` on the exact topic: "${chapitre}"` : "";
    return `You are an English teacher for the Senegalese ${examType}.
Generate 12 flashcards for English${ctx} ${src}.
RECTO: question or key notion in ENGLISH ONLY. One short sentence.
VERSO: English answer, then the separator |||, then French explanation. All on one line, no line breaks.
${progCtx}${contenuCtx}
Return ONLY this JSON:
{
  "flashcards": [
    { "recto": "What is the Present Perfect used for?", "verso": "It expresses a past action with a present result. ||| S'utilise pour exprimer une action passée avec un résultat présent." }
  ]
}
CRITICAL: The verso value must be a single-line string with no line breaks. Use ||| as the only separator.
Exactly 12 flashcards. Recto in English only. Focus on what is evaluated in the exam.`;
  }

  const ctx = chapitre ? `, sur le thème exact : "${chapitre}"` : "";
  return `Tu es un professeur expert du ${examType} sénégalais.
Génère 12 flashcards pour ${matiere}${ctx} ${src}.
Recto : notion ou question clé courte.
Verso : explication claire et complète.
Contenu fidèle au programme officiel sénégalais.
${progCtx}${contenuCtx}
Retourne UNIQUEMENT ce JSON :
{
  "flashcards": [
    { "recto": "Question ou notion ?", "verso": "Réponse complète et claire." }
  ]
}
Exactement 12 flashcards. Tout en français. Privilégie les notions souvent évaluées aux examens.`;
}

function quizPrompt(matiere: string, chapitre: string, examType: string, serie: string, quizMode: string, fromDoc: boolean, contenuCtx = ""): string {
  const src = fromDoc
    ? "based ONLY on the content of the provided document"
    : `from the official Senegalese ${examType}${serie ? " " + serie : ""} curriculum`;
  const progCtx = fromDoc ? "" : buildProgCtx(matiere, chapitre, examType, serie);

  if (isAnglais(matiere)) {
    const ctx = chapitre ? ` on the exact topic: "${chapitre}"` : "";
    if (quizMode === "redaction") {
      return `You are an English teacher for the Senegalese ${examType}.
Generate 5 open-ended questions for English${ctx} ${src}.
ALL questions must be in ENGLISH ONLY. Focus on what is evaluated in the exam.
${progCtx}${contenuCtx}
Return ONLY this JSON:
{
  "questions": [
    { "id": 1, "question": "Describe the difference between the Present Simple and Present Continuous." }
  ]
}
Exactly 5 questions. ALL in English only.`;
    }
    return `You are an English teacher for the Senegalese ${examType}.
Generate 10 multiple choice questions for English${ctx} ${src}.
ALL questions and ALL answer choices must be in ENGLISH ONLY.
Focus on what is most evaluated in the actual exam.
${progCtx}${contenuCtx}
ABSOLUTE RULE: each element in "choices" must be the COMPLETE TEXT of the answer, never a single letter.
ABSOLUTE RULE: "correct_answer" must be the COMPLETE TEXT identical to one of the "choices" elements.

Return ONLY this JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Which tense is used to describe a habitual action in the present?",
      "choices": ["Present Simple", "Present Continuous", "Present Perfect", "Past Simple"],
      "correct_answer": "Present Simple",
      "explanation": "The Present Simple is used for habits and routines.",
      "difficulty": "easy"
    }
  ]
}
Exactly 10 QCM questions with 4 choices each. ALL in English only.`;
  }

  const ctx = chapitre ? `, sur le thème exact : "${chapitre}"` : "";
  if (quizMode === "redaction") {
    return `Tu es un professeur expert du ${examType} sénégalais.
Génère 5 questions de développement pour ${matiere}${ctx} ${src}.
Questions ouvertes qui demandent une rédaction argumentée, du type de celles qui tombent au ${examType}.
${progCtx}${contenuCtx}
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
Porte sur les notions réellement évaluées au ${examType} sénégalais.
${progCtx}${contenuCtx}
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

function resumePrompt(matiere: string, chapitre: string, examType: string, serie: string, fromDoc: boolean, contenuCtx = ""): string {
  const src = fromDoc
    ? "en te basant UNIQUEMENT sur le contenu du document fourni"
    : `en te basant sur le programme officiel sénégalais du ${examType}${serie ? " série " + serie : ""}`;
  const progCtx = fromDoc ? "" : buildProgCtx(matiere, chapitre, examType, serie);

  // Anglais : format bilingue
  if (isAnglais(matiere)) {
    const topicLine = chapitre
      ? `SUJET EXACT ET OBLIGATOIRE : "${chapitre}". Tu dois traiter UNIQUEMENT ce sujet précis.`
      : `Matière : ${matiere}`;
    return `Tu es un professeur d'anglais expert du ${examType} sénégalais.
${topicLine}
Génère un résumé bilingue complet ${src}.
Réponds en texte brut structuré, pas en JSON.
${progCtx}${contenuCtx}
FORMAT OBLIGATOIRE pour chaque section :
- Explications en français
- Exemples en anglais en italique (*exemple en anglais*)
- Traduction en français entre parenthèses

Structure avec ces sections :

## Introduction
Présente le sujet en français, avec exemple en anglais et traduction.

## Notions essentielles
Explique les notions en français. Pour chaque notion : *English example* (traduction française).

## Définitions importantes
Définis les termes clés en français avec exemples anglais traduits.

## Formules et règles grammaticales
Donne les règles en français avec formules en anglais (*Subject + Verb + ...*) et exemples traduits.

## Exemples concrets
*English example sentence.* (Traduction française.)
Pour chaque exemple : phrase anglaise puis traduction.

## Ce qui tombe aux examens
Conseils en français sur ce qui est évalué, avec exemples de questions en anglais.

## Points clés à retenir
5 points en français avec exemple anglais pour chacun.

Sois précis et pédagogique.`;
  }

  // Autres matières
  const topicLine = chapitre
    ? `SUJET EXACT ET OBLIGATOIRE : "${chapitre}". Tu dois traiter UNIQUEMENT ce sujet précis, pas un autre.`
    : `Matière : ${matiere}`;

  return `Tu es un professeur expert du ${examType} sénégalais.
${topicLine}
Génère un résumé complet, détaillé et structuré ${src}.
Réponds en texte brut structuré, pas en JSON.
${progCtx}${contenuCtx}
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
): Promise<{ saved: boolean; resumeId: string | null }> {
  if (!token || !contenu) {
    console.error("saveResumeServer: token manquant ou contenu vide", { hasToken: !!token, hasContenu: !!contenu });
    return { saved: false, resumeId: null };
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("saveResumeServer: variables Supabase manquantes");
    return { saved: false, resumeId: null };
  }
  const sb = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) {
    console.error("saveResumeServer: getUser échoué", authErr?.message);
    return { saved: false, resumeId: null };
  }
  console.log("saveResumeServer: insertion pour user_id=", user.id, "matiere=", matiere, "chapitre=", chapitre);
  const { data: inserted, error } = await sb
    .from("prep_resumes")
    .insert({ user_id: user.id, matiere, chapitre, contenu })
    .select("id")
    .single();
  if (error) {
    console.error("saveResumeServer: erreur insert", error.code, error.message, error.details, error.hint);
    return { saved: false, resumeId: null };
  }
  console.log("saveResumeServer: succès, id=", inserted?.id);
  return { saved: true, resumeId: inserted?.id ?? null };
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

  // Log du thème pour debug
  if (type === "resume") {
    console.log("prep-generate resume: matiere=", matiere, "chapitre=", JSON.stringify(chapitre));
  }

  try {
    const groq = groqClient();

    // Récupérer le contenu officiel du chapitre en base (mode B uniquement, pas document)
    const contenuOfficiel = (mode !== "document" && chapitre && chapitre !== "Autre")
      ? await fetchContenu(examType, serie, matiere, chapitre)
      : null;
    const contenuCtx = buildContenuCtx(contenuOfficiel);

    const competences = getCompetences(matiere, serie, chapitre || "");
    const contextCompetences = competences.length > 0
      ? `\n\nCOMPÉTENCES EXIGIBLES OFFICIELLES DU MINISTÈRE DE L'ÉDUCATION DU SÉNÉGAL\n(Ce sont les compétences EXACTES sur lesquelles l'élève sera évalué au BAC/BFEM)\n${competences.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nINSTRUCTION STRICTE : Ton contenu doit porter EXCLUSIVEMENT sur ces compétences officielles. Ne génère rien qui ne soit pas dans cette liste. Chaque question, flashcard ou explication doit correspondre à au moins une compétence de cette liste.`
      : "";
    const fullCtx = contenuCtx + contextCompetences;

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
      else                            prompt = resumePrompt(matiere, chapitre, examType, serie, true);

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
        const { saved, resumeId } = await saveResumeServer(jwtToken, matiere, chapitre, texte);
        return NextResponse.json({ texte, saved, resumeId });
      }
      return NextResponse.json(parseJson(content));
    }

    /* ── Knowledge mode (Mode B) — fullCtx injecté ── */
    if (type === "resume") {
      const prompt = resumePrompt(matiere, chapitre, examType, serie, false, fullCtx);
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: 3000,
        temperature: 0.4,
      });
      const texte = (completion.choices[0]?.message?.content ?? "").trim();
      const { saved, resumeId } = await saveResumeServer(jwtToken, matiere, chapitre, texte);
      return NextResponse.json({ texte, saved, resumeId });
    }

    let prompt: string;
    if (type === "flashcards") prompt = flashcardsPrompt(matiere, chapitre, examType, serie, false, fullCtx);
    else                       prompt = quizPrompt(matiere, chapitre, examType, serie, quizMode, false, fullCtx);

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
