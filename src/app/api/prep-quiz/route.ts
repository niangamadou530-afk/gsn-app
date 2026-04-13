import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: {
    subject: string;
    examType: string;
    serie?: string;
    country?: string;
    questionCount: number;
  };

  try {
    body = await req.json();
    if (!body.subject || !body.examType) throw new Error("subject et examType requis");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Requête invalide";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { subject, examType, serie, country = "Sénégal", questionCount } = body;
  const n = Math.min(questionCount || 20, 30);

  // Thèmes fréquents par matière et type d'examen
  const FREQUENT_TOPICS: Record<string, Record<string, string>> = {
    "Maths": {
      "BAC": "Suites numériques et récurrences, Dérivées et études de fonctions, Intégrales et primitives, Probabilités et dénombrement, Géométrie dans l'espace (plans, droites, sphères), Nombres complexes, Statistiques et probabilités, Équations différentielles du 1er ordre, Limites et continuité.",
      "BFEM": "Équations du 2nd degré, Trigonométrie (sin, cos, tan), Géométrie (triangles, cercles, théorème de Thalès et Pythagore), Systèmes d'équations, Proportionnalité et pourcentages, Volumes et aires, Statistiques simples.",
    },
    "Français": {
      "BAC": "Dissertation littéraire sur des œuvres africaines (Sembène Ousmane, Cheikh Hamidou Kane, Birago Diop), Commentaire composé, Résumé de texte, Figures de style (métaphore, anaphore, antithèse), Argumentation et rhétorique, Grammaire : subjonctif, concordance des temps.",
      "BFEM": "Résumé de texte, Questions de compréhension, Conjugaison (passé composé, imparfait, futur, subjonctif présent), Orthographe grammaticale, Production écrite (lettre formelle, récit), Vocabulaire et synonymes.",
    },
    "Physique-Chimie": {
      "BAC": "Circuits RC/RL/RLC en régime transitoire et sinusoïdal, Lois de Newton et mécanique (chute libre, plan incliné, projectile), Ondes mécaniques et sonores, Réactions acido-basiques et pH, Cinétique chimique (ordres de réaction), Électromagnétisme (champ magnétique, force de Laplace), Optique géométrique (réfraction, lentilles).",
      "BFEM": "Circuit électrique (loi d'Ohm, résistances série/parallèle), Forces et mouvement (Newton), Optique (réflexion, lentilles convergentes), Chimie : atomes, molécules, réactions simples, États de la matière.",
    },
    "Sciences Physiques": {
      "BAC": "Circuits RC/RL/RLC, Mécanique newtonienne, Ondes mécaniques, Réactions chimiques, Électromagnétisme.",
      "BFEM": "Circuit électrique, Loi d'Ohm, Forces, Optique de base, États de la matière.",
    },
    "Sciences Naturelles": {
      "BAC": "Génétique mendélienne et non-mendélienne, ADN, réplication et synthèse des protéines, Immunologie (réponse immunitaire, anticorps, vaccins), Nutrition et digestion chez les mammifères, Système nerveux et hormones, Écologie et biomes, Évolution des espèces (sélection naturelle).",
      "BFEM": "Reproduction humaine, Photosynthèse et respiration, Classification du vivant, Hygiène et santé (maladies, parasites), Nutrition végétale, Respiration cellulaire.",
    },
    "Histoire-Géographie": {
      "BAC": "Décolonisation en Afrique et en Asie (1945-1975), Guerre froide (1947-1991) et blocs géopolitiques, Panafricanisme et OUA, Géographie : ressources naturelles d'Afrique, Organisation spatiale de l'Afrique de l'Ouest, Mondialisation économique, Grandes puissances actuelles (USA, Chine, Union Européenne).",
      "BFEM": "Histoire du Sénégal et de l'Afrique de l'Ouest (traite négrière, colonisation, indépendances), Géographie du Sénégal (régions, fleuves, agriculture), Organisations africaines (CEDEAO, UA), Grandes découvertes et empires africains médiévaux.",
    },
    "Philosophie": {
      "BAC": "La liberté et le déterminisme, La conscience et l'inconscient, L'État et la société (Hobbes, Rousseau, Locke), La morale et l'éthique (Kant, utilitarisme), Le langage et la pensée, La vérité et la connaissance (Descartes, empirisme), La technique et le travail (Marx, Heidegger).",
      "BFEM": "N/A",
    },
    "Anglais": {
      "BAC": "Compréhension de textes argumentatifs (droits civiques, environnement, technologie), Expression écrite (essai, lettre formelle), Grammaire avancée (conditionnels, discours indirect, voix passive), Vocabulaire thématique (globalisation, media, éducation).",
      "BFEM": "Compréhension de textes simples, Présent simple/progressif, Prétérit, Questions en anglais, Vocabulaire quotidien, Dialogue et expressions courantes.",
    },
    "Comptabilité": {
      "BAC": "Bilan et compte de résultat, Amortissements (linéaire, dégressif), Provisions, TVA et déclarations fiscales, États financiers, Analyse financière (ratios de liquidité, rentabilité), Plan comptable SYSCOHADA.",
      "BFEM": "N/A",
    },
  };

  const topicsForSubject = FREQUENT_TOPICS[subject]?.[examType] || FREQUENT_TOPICS[subject]?.["BAC"] || "";
  const topicsLine = topicsForSubject && topicsForSubject !== "N/A"
    ? `\nConcentre-toi sur ces thèmes fréquents au ${examType} ${serie ? "série " + serie + " " : ""}de ${country} :\n${topicsForSubject}\n`
    : "";

  const prompt = `Génère ${n} questions d'examen pour ${subject}, niveau ${examType}${serie ? " série " + serie : ""} de ${country}.${topicsLine}
Questions variées : QCM, vrai/faux, calculs, définitions.
Difficulté progressive : 30% facile, 40% moyen, 30% difficile.

Retourne UNIQUEMENT ce JSON valide :
{
  "questions": [
    {
      "id": 1,
      "type": "qcm",
      "question": "Énoncé de la question ?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explication détaillée de la bonne réponse.",
      "points": 2,
      "difficulty": "moyen",
      "chapter": "Nom du chapitre concerné"
    }
  ]
}

Règles :
- type = "qcm" (4 choix), "vrai_faux" (Vrai/Faux), "calcul" (réponse numérique), "definition"
- Pour vrai_faux : choices = ["Vrai", "Faux"]
- Pour calcul et definition : choices = []
- Exactement ${n} questions
- Tout en français
- Adapté au programme officiel de ${country}
- Inclure "chapter" (le chapitre ou thème exact de la question)`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Pas de JSON dans la réponse");

    const quiz = JSON.parse(match[0]);
    if (!Array.isArray(quiz.questions)) throw new Error("Structure invalide");

    return NextResponse.json(quiz);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-quiz error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
