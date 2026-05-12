import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { getMatieres, getChapitres } from "@/data/programmes";
import { getCompetences } from "@/data/competences";

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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { systemPrompt, message, history = [], examen = "BAC", serie = "" } = body;

  // ── Détection côté serveur de la matière et du chapitre ─
  const matieresList = getMatieres(examen, serie || undefined);
  let detectedMatiere = "";
  let detectedChapitre = "";
  const msgLower = message.toLowerCase();

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

  // ── Contenu Supabase (si chapitre détecté) ──────────────
  const contenuOfficiel = await fetchContenu(examen, serie, detectedMatiere, detectedChapitre);
  const contenuCtx = buildContenuCtx(contenuOfficiel);

  // ── Bloc programme officiel (si matière détectée) ───────
  let programmeBlock = "";
  if (detectedMatiere) {
    const chapitres = getChapitres(examen, serie, detectedMatiere).filter(c => c !== "Autre");

    // Compétences : chapitre précis si détecté, sinon tous les chapitres (max 30)
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
    parts.push("Base ta réponse EXCLUSIVEMENT sur ce programme officiel.");
    programmeBlock = parts.join("\n");
  }

  const enrichedSystemPrompt = `${systemPrompt}${contenuCtx}${programmeBlock}`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: enrichedSystemPrompt },
        ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: message },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 500,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content ?? "Désolé, je n'ai pas pu répondre.";
    return NextResponse.json({ message: text });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
