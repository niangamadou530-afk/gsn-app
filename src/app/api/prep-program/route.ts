import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/* ── Fréquences historiques par matière (examens 2000-2025) ── */
const CHAPTER_FREQ: Record<string, Record<string, { frequency_score: number; last_appeared: number; probability: string; years: number[]; tip: string }>> = {
  "Maths": {
    "Suites numériques": { frequency_score: 22, last_appeared: 2024, probability: "Très haute", years: [2024,2022,2021,2019,2018,2017,2016], tip: "Maîtrise la formule Un et la somme Sn pour suites arithmétiques et géométriques. Toujours présent." },
    "Dérivées et études de fonctions": { frequency_score: 25, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2022,2021,2020,2019,2018], tip: "Tableau de variations obligatoire. Maîtrise dérivée composée et étude complète." },
    "Intégrales": { frequency_score: 20, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2021,2020,2019,2018], tip: "Calcul d'aire entre courbes. IPP (intégration par parties) souvent demandée." },
    "Probabilités": { frequency_score: 18, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2020,2019,2018], tip: "Loi binomiale et normale. Variable aléatoire discrète très fréquente." },
    "Géométrie dans l'espace": { frequency_score: 15, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2019,2018,2017], tip: "Plans, droites, sphères. Savoir démontrer coplanéité et orthogonalité." },
    "Nombres complexes": { frequency_score: 12, last_appeared: 2022, probability: "Moyenne", years: [2022,2021,2019,2018,2017], tip: "Module, argument, forme trigonométrique et exponentielle. Racines nièmes." },
  },
  "Physique-Chimie": {
    "Circuits RC/RL/RLC": { frequency_score: 22, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2022,2021,2020,2019], tip: "Régimes transitoire et sinusoïdal. Savoir tracer et analyser les courbes u(t) et i(t)." },
    "Mécanique newtonienne": { frequency_score: 20, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2022,2021,2020,2019], tip: "Chute libre, plan incliné, mouvement projectile. Lois de Newton indispensables." },
    "Optique géométrique": { frequency_score: 18, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2020,2019,2018], tip: "Réfraction, lentilles convergentes/divergentes. Formule de conjugaison et grandissement." },
    "Ondes mécaniques": { frequency_score: 15, last_appeared: 2023, probability: "Haute", years: [2023,2022,2020,2019,2018,2017], tip: "Ondes sonores, célérité, fréquence. Interférences et diffraction." },
    "Réactions acido-basiques": { frequency_score: 14, last_appeared: 2022, probability: "Haute", years: [2022,2021,2020,2019,2018], tip: "pH, Ka, taux d'avancement. Courbe de titrage obligatoire à connaître." },
  },
  "Français": {
    "Dissertation littéraire": { frequency_score: 25, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2022,2021,2020,2019,2018], tip: "Toujours en sujet A. Structure thèse/antithèse/synthèse. Citer les œuvres du programme." },
    "Commentaire composé": { frequency_score: 20, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2022,2021,2020,2019], tip: "Sujet B classique. Identifier les figures de style et le registre litttéraire." },
    "Sembène Ousmane": { frequency_score: 15, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2020,2019,2018], tip: "O Pays, mon beau peuple! et Xala souvent cités. Thèmes: néocolonialisme, identité africaine." },
    "Cheikh Hamidou Kane": { frequency_score: 12, last_appeared: 2022, probability: "Moyenne", years: [2022,2021,2019,2018,2017], tip: "L'Aventure ambiguë. Dualité tradition/modernité, foi et déracinement." },
    "Résumé et discussion": { frequency_score: 18, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2020,2019,2018], tip: "Résumer en 1/4 du texte original. Discussion: argumenter avec exemples concrets." },
  },
  "Histoire-Géographie": {
    "Décolonisation africaine": { frequency_score: 20, last_appeared: 2024, probability: "Très haute", years: [2024,2023,2022,2021,2020,2019], tip: "Mouvements indépendantistes 1945-1975. Rôle de Nkrumah, Houphouët, Senghor." },
    "Guerre froide": { frequency_score: 18, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2020,2019,2018], tip: "Blocs Est/Ouest, doctrine Truman, plan Marshall, crise de Cuba. Chronologie précise." },
    "Sénégal post-indépendance": { frequency_score: 15, last_appeared: 2023, probability: "Haute", years: [2023,2022,2021,2019,2018], tip: "De Senghor à Macky Sall. Institutions de la République, arachide, économie." },
    "Mondialisation": { frequency_score: 12, last_appeared: 2022, probability: "Moyenne", years: [2022,2021,2020,2019,2018], tip: "Échanges commerciaux, FMN, OMC. Avantages et limites de la mondialisation." },
  },
};

function getFreqData(examType: string, serie: string): string {
  const subjects = examType === "BAC" && (serie === "S1" || serie === "S2")
    ? ["Maths", "Physique-Chimie"]
    : examType === "BAC" && serie === "L"
    ? ["Français", "Histoire-Géographie"]
    : ["Maths", "Français", "Histoire-Géographie", "Physique-Chimie"];

  const lines: string[] = [];
  for (const subj of subjects) {
    const chapters = CHAPTER_FREQ[subj];
    if (!chapters) continue;
    lines.push(`\n${subj} :`);
    for (const [ch, data] of Object.entries(chapters)) {
      lines.push(`  - "${ch}": apparu ${data.frequency_score} fois, dernière fois ${data.last_appeared}, probabilité ${data.probability}. Astuce: ${data.tip}`);
    }
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  console.log("=== PREP PROGRAM START ===");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("ERROR: GROQ_API_KEY manquante");
    return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });
  }
  console.log("GROQ_API_KEY présente:", apiKey.slice(0, 8) + "...");

  const body = await request.json().catch((e: unknown) => {
    console.log("Body parse error:", e);
    return {};
  });
  console.log("Body:", JSON.stringify(body));

  const examType = body?.examType || body?.exam_type || "BAC";
  const examDate = body?.examDate || body?.exam_date || "2026-06-25";
  const serie    = body?.serie || "S1";
  const country  = body?.country || "Sénégal";
  const levelsRaw = body?.levels || {};

  // Handle levels as object or string
  const levels = typeof levelsRaw === "string"
    ? levelsRaw
    : Object.entries(levelsRaw as Record<string, { level: string; score: number }>)
        .map(([s, l]) => `${s}: ${l.level} (${l.score}%)`)
        .join(", ") || "Non évalué";

  const daysLeft = body?.daysLeft ?? Math.max(1, Math.ceil(
    (new Date(examDate).getTime() - Date.now()) / 86400000
  ));

  console.log("examType:", examType);
  console.log("examDate:", examDate);
  console.log("serie:", serie);
  console.log("country:", country);
  console.log("levels:", levels);
  console.log("daysLeft:", daysLeft);

  const freqData = getFreqData(examType, serie);

  const prompt = `Tu es un expert en éducation de ${country}.
Génère un programme de révision personnalisé en JSON pour un élève préparant le ${examType}${serie ? " série " + serie : ""}.
Niveaux par matière : ${levels}
Date de l'examen : ${examDate}
Il reste ${daysLeft} jours.

Adapte le programme selon le curriculum officiel de ${country} pour ${examType}.
Priorise les matières où l'élève est "Faible", puis "Moyen".

DONNÉES DE FRÉQUENCE HISTORIQUE (examens 2000-2025) :
${freqData}

Pour chaque chapitre planifié, utilise ces données pour évaluer sa fréquence.
Ajoute un champ "chapter_stats" dans le JSON final avec, pour les chapitres planifiés :
- frequency_score : nombre de fois apparu aux examens (utilise les données ci-dessus ou estime)
- last_appeared : dernière année d'apparition
- probability : "Très haute" | "Haute" | "Moyenne" | "Faible"
- tip : astuce spécifique

Retourne UNIQUEMENT ce JSON valide (sans texte autour, sans markdown) :
{
  "total_days": ${Math.min(daysLeft, 60)},
  "daily_program": [
    {
      "day": 1,
      "date": "${new Date().toISOString().slice(0, 10)}",
      "subjects": [
        {
          "name": "Maths",
          "duration_minutes": 90,
          "priority": "haute",
          "topics": ["Suites numériques", "Dérivées"],
          "exercises": ["Exercice 1", "Exercice 2"]
        }
      ],
      "total_hours": 3.5
    }
  ],
  "weekly_goals": ["Objectif semaine 1"],
  "key_advice": ["Conseil 1"],
  "chapter_stats": {
    "Suites numériques": {
      "frequency_score": 22,
      "last_appeared": 2024,
      "probability": "Très haute",
      "tip": "Astuce pour ce chapitre"
    }
  }
}

Génère exactement ${Math.min(daysLeft, 14)} jours de programme (les 2 premières semaines).
Chaque jour : 2 à 4 matières, 3 à 5 heures total.
Tout en français.`;

  console.log("Calling Groq... prompt length:", prompt.length, "chars");
  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown, sans texte autour." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    console.log("Groq raw response (first 500 chars):", raw.slice(0, 500));
    console.log("Groq raw response length:", raw.length);
    console.log("finish_reason:", completion.choices[0]?.finish_reason);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.log("ERROR: Pas de JSON dans la réponse. Full raw:", raw);
      throw new Error("Pas de JSON dans la réponse");
    }

    let program;
    try {
      program = JSON.parse(match[0]);
    } catch (parseErr) {
      console.log("ERROR: JSON.parse failed:", parseErr);
      console.log("match[0] start:", match[0].slice(0, 300));
      throw new Error("JSON malformé: " + String(parseErr));
    }

    if (!Array.isArray(program.daily_program)) {
      console.log("ERROR: daily_program n'est pas un array. Keys:", Object.keys(program));
      throw new Error("Structure invalide: daily_program manquant");
    }

    console.log("SUCCESS: program days:", program.daily_program.length);
    console.log("=== PREP PROGRAM END ===");
    return NextResponse.json(program);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-program error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
