/**
 * GARDE-FOU DE CONFIDENTIALITÉ PREP :
 * Cette route est réservée exclusivement à l'élève connecté via son jeton Bearer.
 * Les parents n'y ont AUCUN accès. Aucun contenu de message ou document n'est consigné dans les logs.
 * Si les tables de base de données ne sont pas encore créées, la génération fonctionne
 * normalement sans persistance et sans faire planter l'application.
 */

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { getMatieres, getChapitres } from "@/data/programmes";
import { getCompetences } from "@/data/competences";
import { checkUsage, incrementUsage, limitMessage } from "@/lib/prepUsage";
import { acquireGroqSlot, rateLimitResponse } from "@/lib/groqRateLimit";
import { GROQ_MODELS } from "@/lib/groqModels";
import { createGroqChatCompletionWithRetry } from "@/lib/groqRetry";
import { PREP_COACH_CONFIG } from "@/lib/prep-config";
import {
  getServiceSupabase,
  isTableMissingError,
  purgeExpiredCoachData,
} from "../prep/coach/helper";

export const maxDuration = 60;

/* ── Supabase + contenu officiel ───────────────────────── */

function sbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type ContenuOfficiel = { contenu: string; points_cles: string[] | null; formules: string[] | null } | null;

async function fetchContenu(examType: string, serie: string, matiere: string, chapitre: string): Promise<ContenuOfficiel> {
  if (!matiere || !chapitre || chapitre === "Autre") return null;
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

/* ── Détection de demande de fichier ──────────────────── */

function detectFileIntent(msg: string): { wantsFile: boolean; kind: "exercice" | "fiche" | "methode" | "planning" | "corrige" } {
  const m = msg.toLowerCase();
  if (/\b(exercice|exercices|problème|sujet)\b/i.test(m)) {
    return { wantsFile: true, kind: "exercice" };
  }
  if (/\b(fiche|fiches|résumé|synthese|synthèse)\b/i.test(m)) {
    return { wantsFile: true, kind: "fiche" };
  }
  if (/\b(méthode|methode|dissertation|commentaire|méthodologie)\b/i.test(m)) {
    return { wantsFile: true, kind: "methode" };
  }
  if (/\b(planning|programme de révision|calendrier)\b/i.test(m)) {
    return { wantsFile: true, kind: "planning" };
  }
  if (/\b(corrigé détaillé|correction détaillée)\b/i.test(m)) {
    return { wantsFile: true, kind: "corrige" };
  }
  return { wantsFile: false, kind: "fiche" };
}

/* ── Route ─────────────────────────────────────────────── */

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: {
    systemPrompt: string;
    message: string;
    history?: Array<{ role: string; content: string }>;
    matiere?: string;
    chapitre?: string;
    examen?: string;
    serie?: string;
    conversationId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const {
    systemPrompt,
    message,
    history = [],
    examen = "BAC",
    serie = "",
    conversationId: clientConvId,
  } = body;

  // 1. Vérification quota quotidien
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const check = await checkUsage(token, "coach_count");
  if (!check.allowed) {
    const status = check.reason === "auth" ? 401 : 429;
    const error  = check.reason === "auth" ? "Non authentifié" : limitMessage("coach_count");
    return NextResponse.json({ error }, { status });
  }

  if (!(await acquireGroqSlot())) return rateLimitResponse();

  const userId = check.userId;

  // 2. Détection matière et chapitre
  const matieresList = getMatieres(examen, serie || undefined);
  let detectedMatiere = body.matiere || "";
  let detectedChapitre = body.chapitre || "";
  const msgLower = message.toLowerCase();

  if (!detectedMatiere) {
    for (const mat of matieresList) {
      const keywords = mat.toLowerCase().split(/[\s\-]+/).filter(k => k.length > 3);
      if (keywords.some(k => msgLower.includes(k))) {
        detectedMatiere = mat;
        const chaps = getChapitres(examen, serie, mat).filter(c => c !== "Autre");
        for (const ch of chaps) {
          if (msgLower.includes(ch.toLowerCase().slice(0, 10))) {
            detectedChapitre = ch;
            break;
          }
        }
        break;
      }
    }
  }

  // 3. Détection d'intention de fichier
  const fileIntent = detectFileIntent(message);

  // 4. Contenu Supabase (si chapitre détecté)
  const contenuOfficiel = await fetchContenu(examen, serie, detectedMatiere, detectedChapitre);
  const contenuCtx = buildContenuCtx(contenuOfficiel);

  // 5. Bloc programme officiel
  let programmeBlock = "";
  if (detectedMatiere) {
    const chapitres = getChapitres(examen, serie, detectedMatiere).filter(c => c !== "Autre");
    const allComps: string[] = [];
    const chapsPourComps = detectedChapitre ? [detectedChapitre] : chapitres;
    for (const ch of chapsPourComps) {
      allComps.push(...getCompetences(detectedMatiere, serie, ch));
    }
    const uniqueComps = [...new Set(allComps)].slice(0, 30);

    const parts: string[] = [
      `\n\nPROGRAMME OFFICIEL DE ${detectedMatiere.toUpperCase()}${serie ? ` SÉRIE ${serie}` : ""} :`,
    ];
    if (chapitres.length > 0) {
      parts.push(`Chapitres : ${chapitres.map(c => `• ${c}`).join(", ")}`);
    }
    if (uniqueComps.length > 0) {
      parts.push(`Compétences exigibles officielles :\n${uniqueComps.map((c, i) => `${i + 1}. ${c}`).join("\n")}`);
    }
    parts.push("Base ta réponse EXCLUSIVEMENT sur ce programme officiel sénégalais.");
    programmeBlock = parts.join("\n");
  }

  // Si demande de document : instructions de balisage strictes
  let fileFormatInstructions = "";
  if (fileIntent.wantsFile) {
    fileFormatInstructions = `\n\nCONSIGNE SPÉCIALE GÉNÉRATION DE DOCUMENT :
L'élève demande un document de révision structuré (type : ${fileIntent.kind}).
Tu dois IMPÉRATIVEMENT formuler ta réponse sous cette structure exacte :
Une courte phrase d'accompagnement (1 phrase polie).
Puis le bloc délimité suivant :
<<<FILE_START>>>
KIND: ${fileIntent.kind}
TITLE: [Titre clair du document, max 60 caractères]
<<<CONTENT>>>
[Le contenu Markdown du document : titres # et ##, listes, gras, formules en texte lisible x², √, ∑, tableaux simples. Pas de code HTML brut.]
<<<CORRECTION>>>
[Si le type est exercice : la correction détaillée étape par étape. Si un autre type, laisse ce bloc vide.]
<<<FILE_END>>>`;
  }

  const enrichedSystemPrompt = `${systemPrompt}${contenuCtx}${programmeBlock}${fileFormatInstructions}`;
  const maxTokens = fileIntent.wantsFile
    ? PREP_COACH_CONFIG.fileMaxTokens
    : PREP_COACH_CONFIG.chatMaxTokens;

  try {
    const groq = new Groq({ apiKey });
    // Limiter l'historique aux derniers messages (jamais tout l'historique)
    const recentHistory = history.slice(-PREP_COACH_CONFIG.recentHistoryLimit);

    const completion = await createGroqChatCompletionWithRetry(groq, {
      messages: [
        { role: "system", content: enrichedSystemPrompt },
        ...recentHistory.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: message },
      ],
      model: GROQ_MODELS.DEFAULT,
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const finishReason = completion.choices[0]?.finish_reason;
    const rawText = completion.choices[0]?.message?.content?.trim() || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Le Coach IA n'a pas pu formuler sa réponse. Aucun crédit n'a été décompté." },
        { status: 502 }
      );
    }

    // ── Extraction du fichier si présent ──
    let accompanyingText = rawText;
    let generatedFile: {
      id?: string;
      kind: "exercice" | "fiche" | "methode" | "planning" | "corrige";
      title: string;
      content_md: string;
      correction_md: string;
      created_at?: string;
    } | null = null;

    const fileStartIdx = rawText.indexOf("<<<FILE_START>>>");
    const fileEndIdx   = rawText.indexOf("<<<FILE_END>>>");

    if (fileStartIdx !== -1) {
      // Vérifier si la sortie a été coupée par dépassement de tokens
      if (fileEndIdx === -1 || finishReason === "length") {
        // RÈGLE : Un fichier dont la sortie a été coupée n'est JAMAIS enregistré : préviens l'élève, aucun quota débité.
        return NextResponse.json({
          message:
            "La génération du document a été interrompue car son contenu dépassait la longueur maximale. Réessaie en demandant un exercice ou un chapitre plus précis !",
          file: null,
          cutOff: true,
        });
      }

      accompanyingText = rawText.slice(0, fileStartIdx).trim();
      const fileBlock = rawText.slice(fileStartIdx + "<<<FILE_START>>>".length, fileEndIdx).trim();

      const kindMatch = fileBlock.match(/KIND:\s*([^\n\r]+)/i);
      const titleMatch = fileBlock.match(/TITLE:\s*([^\n\r]+)/i);
      const contentMatch = fileBlock.match(/<<<CONTENT>>>([\s\S]*?)(?:<<<CORRECTION>>>|$)/i);
      const corrMatch = fileBlock.match(/<<<CORRECTION>>>([\s\S]*?)$/i);

      const parsedKind = (kindMatch?.[1]?.trim() || fileIntent.kind) as any;
      const parsedTitle = titleMatch?.[1]?.trim().slice(0, 60) || "Fiche de révision";
      const parsedContent = contentMatch?.[1]?.trim() || "";
      const parsedCorr = corrMatch?.[1]?.trim() || "";

      if (parsedContent.length > 0 && parsedContent.length <= PREP_COACH_CONFIG.maxFileCharLength) {
        generatedFile = {
          kind: parsedKind,
          title: parsedTitle,
          content_md: parsedContent,
          correction_md: parsedCorr,
        };
      } else if (!parsedContent) {
        // Extraction échouée -> affiche la réponse comme un message normal sans fichier vide et sans débiter le quota
        return NextResponse.json({
          message: rawText.replace(/<<<[^>]+>>>/g, "").trim(),
          file: null,
        });
      }
    }

    // ── Débit du quota uniquement après succès ──
    await incrementUsage(token, userId, "coach_count", check.current, check.rowExists);

    // ── Persistance serveur (conversations, messages, fichiers) ──
    let activeConversationId = clientConvId || null;
    let historyUnavailable = false;

    const sb = getServiceSupabase();
    if (sb && userId) {
      try {
        // Purge opportuniste des données inactives de l'élève
        purgeExpiredCoachData(userId).catch(() => {});

        const nowIso = new Date().toISOString();

        // 1. Assurer une conversation active
        if (!activeConversationId) {
          // Créer une nouvelle conversation avec titre automatique tiré du premier message (60 caractères max)
          let autoTitle = message.trim().replace(/\s+/g, " ");
          if (autoTitle.length > PREP_COACH_CONFIG.titleMaxLength) {
            autoTitle = autoTitle.slice(0, PREP_COACH_CONFIG.titleMaxLength).trim();
          }

          const { data: convData, error: convErr } = await sb
            .from("prep_coach_conversations")
            .insert({
              user_id: userId,
              title: autoTitle || "Nouvelle discussion",
              created_at: nowIso,
              updated_at: nowIso,
            })
            .select("id")
            .single();

          if (convErr) {
            if (isTableMissingError(convErr)) historyUnavailable = true;
          } else if (convData) {
            activeConversationId = convData.id;
          }
        } else {
          // Mettre à jour l'horodatage de la conversation
          await sb
            .from("prep_coach_conversations")
            .update({ updated_at: nowIso })
            .eq("id", activeConversationId)
            .eq("user_id", userId);
        }

        // 2. Sauvegarder les messages si la conversation est disponible
        if (activeConversationId && !historyUnavailable) {
          // Message utilisateur
          await sb.from("prep_coach_messages").insert({
            conversation_id: activeConversationId,
            user_id: userId,
            role: "user",
            content: message,
            created_at: nowIso,
          });

          // Message assistant (texte d'accompagnement ou réponse brute)
          const assistantContent = accompanyingText || rawText;
          await sb.from("prep_coach_messages").insert({
            conversation_id: activeConversationId,
            user_id: userId,
            role: "assistant",
            content: assistantContent,
            created_at: new Date(Date.now() + 50).toISOString(),
          });

          // 3. Sauvegarder le fichier généré s'il y en a un
          if (generatedFile) {
            const { data: savedFile, error: fileErr } = await sb
              .from("prep_coach_files")
              .insert({
                conversation_id: activeConversationId,
                user_id: userId,
                kind: generatedFile.kind,
                title: generatedFile.title,
                content_md: generatedFile.content_md,
                correction_md: generatedFile.correction_md,
                created_at: nowIso,
              })
              .select("id, created_at")
              .single();

            if (!fileErr && savedFile) {
              generatedFile.id = savedFile.id;
              generatedFile.created_at = savedFile.created_at;
            }
          }
        }
      } catch (dbErr: any) {
        if (isTableMissingError(dbErr)) {
          historyUnavailable = true;
        }
      }
    } else {
      historyUnavailable = true;
    }

    return NextResponse.json({
      message: accompanyingText || rawText,
      file: generatedFile,
      conversationId: activeConversationId,
      historyUnavailable,
    });
  } catch (error: unknown) {
    console.error("[prep-coach error]", error);
    return NextResponse.json(
      { error: "Le Coach IA prend une courte pause pour recharger ses fiches. Réessaie dans quelques instants !" },
      { status: 502 }
    );
  }
}
