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

function getFormatResume(matiere: string): string {
  const m = matiere;
  if (["Mathématiques", "Sciences Physiques", "SVT"].some(n => m.includes(n))) {
    return `Structure ton résumé avec exactement ces sections HTML :
<section id="notions"><h2>Notions essentielles</h2>...</section>
<section id="formules"><h2>Formules et lois clés</h2>...</section>
<section id="definitions"><h2>Définitions importantes</h2>...</section>
<section id="methodes"><h2>Méthodes de résolution</h2>...</section>
<section id="examen"><h2>Ce qui tombe aux examens</h2>...</section>`;
  }
  if (["Français", "Philosophie"].some(n => m.includes(n))) {
    return `Structure ton résumé avec exactement ces sections HTML :
<section id="contexte"><h2>Contexte et présentation</h2>...</section>
<section id="idees"><h2>Idées et thèses principales</h2>...</section>
<section id="auteurs"><h2>Auteurs et œuvres clés</h2>...</section>
<section id="concepts"><h2>Concepts à maîtriser</h2>...</section>
<section id="examen"><h2>Types de sujets au BAC/BFEM</h2>...</section>`;
  }
  if (["Histoire", "Géographie", "Histoire-Géographie"].some(n => m.includes(n))) {
    return `Structure ton résumé avec exactement ces sections HTML :
<section id="contexte"><h2>Contexte historique/géographique</h2>...</section>
<section id="evenements"><h2>Dates et événements clés</h2>...</section>
<section id="acteurs"><h2>Acteurs principaux</h2>...</section>
<section id="causes"><h2>Causes et conséquences</h2>...</section>
<section id="examen"><h2>Méthodologie et sujets types au BAC/BFEM</h2>...</section>`;
  }
  if (["Anglais"].some(n => m.includes(n))) {
    return `Structure ton résumé avec exactement ces sections HTML :
<section id="vocabulaire"><h2>Vocabulaire clé</h2>...</section>
<section id="grammaire"><h2>Points de grammaire essentiels</h2>...</section>
<section id="exemples"><h2>Exemples en anglais avec traduction</h2>...</section>
<section id="expressions"><h2>Expressions utiles pour l'épreuve</h2>...</section>
<section id="examen"><h2>Ce qui est évalué</h2>...</section>`;
  }
  if (["Économie Générale", "Étude de Cas"].some(n => m.includes(n))) {
    return `Structure ton résumé avec exactement ces sections HTML :
<section id="definitions"><h2>Définitions des concepts clés</h2>...</section>
<section id="mecanismes"><h2>Mécanismes économiques</h2>...</section>
<section id="donnees"><h2>Données et exemples concrets</h2>...</section>
<section id="analyses"><h2>Analyses et arguments</h2>...</section>
<section id="examen"><h2>Ce qui tombe au BAC/BFEM</h2>...</section>`;
  }
  return `Structure ton résumé avec exactement ces sections HTML :
<section id="notions"><h2>Notions essentielles</h2>...</section>
<section id="points-cles"><h2>Points clés</h2>...</section>
<section id="definitions"><h2>Définitions importantes</h2>...</section>
<section id="examen"><h2>Ce qui tombe aux examens</h2>...</section>`;
}

function resumePrompt(matiere: string, chapitre: string, examType: string, serie: string, fromDoc: boolean, contenuCtx = "", sujetsBlock = ""): string {
  const formatStr = getFormatResume(matiere);

  // Mode document : prompt minimal basé uniquement sur le document fourni
  if (fromDoc) {
    const topicLine = chapitre
      ? `SUJET EXACT ET OBLIGATOIRE : "${chapitre}". Tu dois traiter UNIQUEMENT ce sujet précis.`
      : `Matière : ${matiere}`;
    return `Tu es un professeur expert du ${examType} sénégalais.
${topicLine}
Génère un résumé complet et structuré en te basant UNIQUEMENT sur le contenu du document fourni.
${formatStr}
Remplis chaque section avec du texte clair et des listes à tirets (-). Pas de HTML à l'intérieur des sections.${isAnglais(matiere) ? "\n- Pour la section exemples : *phrase anglaise* (traduction française entre parenthèses)." : ""}
Sois précis et pédagogique.${isAnglais(matiere) ? "" : " Tout en français."}`;
  }

  // ── Compétences exigibles ──────────────────────────────
  const competences = getCompetences(matiere, serie, chapitre || "");
  const competencesBlock = competences.length > 0
    ? competences.map((c, i) => `${i + 1}. ${c}`).join("\n")
    : "(non disponibles pour cette matière/série)";

  const sujetsSection = sujetsBlock
    ? `\nSUJETS ET CORRIGÉS RÉELS :\n${sujetsBlock.replace(/^\n+/, "")}`
    : "";

  return `Tu es un professeur expert du BAC et BFEM sénégalais. Tu génères un résumé complet et exhaustif sur ${matiere}${serie ? ` série ${serie}` : ""}${chapitre ? ` chapitre ${chapitre}` : ""}.

COMPÉTENCES EXIGIBLES OFFICIELLES :
${competencesBlock}
${sujetsSection}
INSTRUCTIONS PAR MATIÈRE :

Si la matière est Mathématiques ou Sciences Physiques :
Pour chaque notion du chapitre tu dois obligatoirement écrire :
- L'énoncé complet de la notion, loi ou théorème avec toutes ses conditions
- La formule exacte avec chaque variable expliquée et son unité
- Les conditions d'application de la formule
- Un exemple numérique résolu étape par étape avec tous les calculs détaillés, de préférence tiré d'un vrai sujet BAC sénégalais. Si aucun sujet disponible créer un exemple cohérent et pertinent avec le niveau BAC
- Un deuxième exemple plus difficile également résolu complètement, de préférence tiré d'un vrai sujet BAC. Mentionner l'année et le groupe si disponible
- Les erreurs fréquentes que font les élèves sénégalais sur cette notion
- Ce qui est demandé exactement au BAC sur cette notion avec les formulations types des sujets

Si la matière est SVT :
- L'explication détaillée de chaque mécanisme biologique avec tous les acteurs cellulaires et moléculaires nommés
- Les schémas décrits complètement en texte avec toutes les structures nommées et leurs rôles
- Les expériences classiques à connaître avec protocole complet, résultats attendus et conclusions
- Les définitions précises de chaque terme scientifique
- Les tableaux comparatifs quand c'est pertinent : par exemple immunité humorale vs cellulaire
- Les sujets types qui tombent au BAC avec exemples réels si disponibles

Si la matière est Philosophie :
- La problématique centrale du chapitre formulée clairement
- La biographie courte de chaque auteur au programme : dates, nationalité, œuvres principales, contexte historique
- La thèse de chaque auteur avec ses arguments principaux développés en paragraphes explicatifs détaillés
- Les concepts clés définis et expliqués avec des exemples concrets de la vie quotidienne
- Les distinctions philosophiques importantes : par exemple liberté positive vs liberté négative
- Les citations courtes et exactes des auteurs clés avec leur source
- Un plan de dissertation type complet sur ce chapitre avec introduction développement et conclusion
- Les sujets types qui tombent au BAC au Sénégal avec formulations exactes

Si la matière est Français :
- La présentation complète du mouvement littéraire avec contexte historique, social et culturel
- Les caractéristiques stylistiques avec exemples tirés des œuvres au programme
- La biographie de chaque auteur au programme : vie, œuvres, style, place dans l'histoire littéraire
- L'analyse détaillée des œuvres principales avec thèmes, personnages, procédés narratifs et stylistiques
- Les figures de style à identifier avec définition et exemples tirés des textes au programme
- La méthodologie complète du type d'exercice : dissertation, commentaire composé ou résumé de texte avec exemple rédigé
- Les sujets types qui tombent au BAC avec exemples de sujets réels si disponibles

Si la matière est Histoire :
- La chronologie détaillée avec toutes les dates importantes et leur signification
- Les causes approfondies avec distinction claire entre causes profondes à long terme et causes immédiates
- La biographie détaillée de chaque acteur historique important : origine, rôle exact, actions décisives, héritage
- Les faits et événements développés en paragraphes explicatifs complets avec contexte
- Les conséquences analysées à court terme, moyen terme et long terme
- Les documents et sources historiques classiques utilisés dans les épreuves sénégalaises
- La méthodologie de la dissertation historique et du commentaire de document
- Les sujets types qui tombent au BAC au Sénégal avec formulations exactes des sujets réels si disponibles

Si la matière est Géographie :
- Les données statistiques importantes avec chiffres précis, pourcentages, rangs mondiaux et années de référence
- Les cartes décrites complètement en texte avec localisation précise des éléments : pays, villes, fleuves, reliefs
- Les mécanismes géographiques expliqués en détail avec causes et conséquences
- Les exemples concrets avec noms précis de pays, villes, régions, organisations
- Les notions et concepts géographiques définis avec précision
- La méthodologie du commentaire de carte et du commentaire de document géographique avec exemple
- Les sujets types qui tombent au BAC au Sénégal

Si la matière est Anglais :
- Le vocabulaire thématique complet avec traduction française et exemple d'utilisation dans une phrase en contexte
- Les structures grammaticales importantes avec exemples en anglais et traduction
- Deux ou trois paragraphes en anglais sur le thème avec traduction complète en français
- Les expressions idiomatiques et phrasal verbs utiles pour l'épreuve avec traduction et exemple
- Un exemple complet de réponse à une question de compréhension en anglais
- Un exemple de production écrite courte sur le thème : lettre ou essai de 150 mots minimum

Si la matière est Économie Générale :
- Les définitions précises et complètes de tous les concepts économiques du chapitre
- Les mécanismes économiques expliqués avec schémas décrits en texte et exemples chiffrés
- Les données statistiques importantes avec sources : Banque Mondiale, FMI, ANSD Sénégal
- Les exemples concrets tirés de l'économie sénégalaise et de l'économie mondiale avec noms précis
- Les théories économiques avec leurs auteurs, dates et thèses principales
- Les sujets types qui tombent au BAC avec formulations exactes si disponibles

RÈGLE ABSOLUE POUR TOUTES LES MATIÈRES :
Ce résumé doit être suffisamment complet pour qu'un élève puisse réviser uniquement avec lui sans avoir besoin d'aucun autre document.
Il doit couvrir 100% des compétences exigibles officielles listées ci-dessus.
Minimum 800 mots. Pas de limite maximale.
Pour tous les exemples : utiliser en priorité les vrais sujets BAC ou BFEM sénégalais disponibles avec l'année et le groupe. Si aucun sujet disponible créer un exemple cohérent, pertinent et au niveau exact du BAC ou BFEM sénégalais.
Tous les exemples d'exercices doivent être résolus complètement avec toutes les étapes détaillées.

${formatStr}
Remplis chaque section avec du texte clair et des listes à tirets (-). Pas de HTML à l'intérieur des sections. Tout en français sauf si la matière est Anglais.`;
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
        return NextResponse.json({ texte: content.trim() });
      }
      return NextResponse.json(parseJson(content));
    }

    /* ── Knowledge mode (Mode B) — fullCtx injecté ── */
    if (type === "resume") {
      // Chercher les sujets réels pour cette matière et série (BAC + BFEM)
      let sujetsBlock = "";
      try {
        const { data: sujets } = await sbClient()
          .from("sujets_extraits")
          .select("annee, groupe, type, contenu_texte, exercices")
          .eq("matiere", matiere)
          .eq("serie", serie)
          .eq("examen", examType)
          .order("annee", { ascending: false })
          .limit(6);

        if (sujets && sujets.length > 0) {
          sujetsBlock = `\n\nSUJETS ET CORRIGÉS RÉELS DU ${examType} SÉNÉGALAIS SUR CETTE MATIÈRE :\n${
            sujets.map((s: { annee: number; groupe: string; type: string; contenu_texte?: string }) =>
              `${s.annee} ${s.groupe} — ${s.type === "corrige" ? "CORRIGÉ" : "ÉPREUVE"} :\n${s.contenu_texte?.slice(0, 800) ?? ""}`
            ).join("\n\n")
          }\n\nUtilise ces vrais sujets et corrigés pour enrichir la section "Ce qui tombe au ${examType}" de ton résumé. Cite les années et types de questions réels. Pour les matières scientifiques inclus des exercices similaires aux vrais sujets avec leurs corrigés détaillés.`;
        }
      } catch {
        // table pas encore peuplée, on continue sans
      }

      const prompt = resumePrompt(matiere, chapitre, examType, serie, false, fullCtx, sujetsBlock);
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: 3000,
        temperature: 0.4,
      });
      const texte = (completion.choices[0]?.message?.content ?? "").trim();
      return NextResponse.json({ texte });
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
