import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getProgramme } from "@/data/programmes";

/* ══════════════════════════════════════════════════════════
   Programmes officiels BAC / BFEM Sénégal (Office du BAC)
   Fallback inline data (kept for legacy compatibility)
   ══════════════════════════════════════════════════════════ */

const PROGRAMMES_OFFICIELS: Record<string, Record<string, string>> = {

  "Maths": {
    "S1": `Programme officiel Maths BAC S1 Sénégal :
• Suites numériques : suites arithmétiques et géométriques, formule Un, somme Sn, convergence
• Limites et continuité : limites usuelles, théorème des gendarmes, continuité sur un intervalle, TVI
• Dérivabilité : dérivée en un point, fonction dérivée, règles de calcul, dérivée composée
• Étude de fonctions : tableau de variations, extrema, asymptotes, courbes représentatives
• Fonctions logarithme et exponentielle : ln, exp, propriétés, équations et inéquations
• Fonctions circulaires : sin, cos, tan, dérivées, équations trigonométriques
• Primitives et intégrales : calcul d'intégrales, intégration par parties, changement de variable, aires
• Équations différentielles : y' = ay + b, y'' = ay' + by
• Probabilités : dénombrement, loi binomiale, loi normale centrée réduite, espérance, variance
• Géométrie dans l'espace : vecteurs 3D, plans, droites, sphères, coplanarité, orthogonalité
• Nombres complexes : forme algébrique et trigonométrique, module, argument, racines nièmes`,

    "S2": `Programme officiel Maths BAC S2 Sénégal :
• Suites numériques : suites arithmétiques, géométriques, récurrentes, convergence
• Limites, continuité, dérivabilité : mêmes notions que S1
• Fonctions log et exponentielle, fonctions circulaires
• Primitives et intégrales : calcul d'aires, intégration par parties
• Probabilités : loi binomiale, loi de Poisson, loi normale, tests statistiques simples
• Géométrie dans l'espace et nombres complexes`,

    "S3": `Programme officiel Maths BAC S3 Sénégal :
• Algèbre : suites, limites, fonctions (log, exp), dérivées, intégrales
• Probabilités et statistiques descriptives
• Géométrie dans l'espace
• Applications aux sciences de l'ingénieur`,

    "S4": `Programme officiel Maths BAC S4 Sénégal :
• Suites numériques, fonctions usuelles, dérivées
• Statistiques et probabilités appliquées à l'agronomie
• Géométrie analytique`,

    "G": `Programme officiel Maths BAC G Sénégal :
• Suites numériques (intérêts simples et composés, annuités)
• Fonctions du 1er et 2nd degré, valeur absolue
• Statistiques descriptives : moyenne, médiane, écart-type, droite de régression
• Probabilités élémentaires
• Fonctions logarithme et exponentielle (applications financières)`,

    "BFEM": `Programme officiel Maths BFEM Sénégal :
• Arithmétique : PGCD, PPCM, nombres premiers, divisibilité
• Algèbre : équations du 1er et 2nd degré, systèmes linéaires 2×2, inéquations
• Fonctions numériques : représentation graphique, f(x) = ax + b, f(x) = ax²
• Trigonométrie : sin, cos, tan dans le triangle rectangle, théorème de Pythagore
• Géométrie plane : triangles (Thalès, Pythagore), cercles, quadrilatères, constructions
• Géométrie dans l'espace : volumes et aires (cube, pavé, cylindre, cône, sphère)
• Statistiques simples : moyennes, effectifs, fréquences, tableaux`,
  },

  "Sciences Physiques": {
    "S1": `Programme officiel Sciences Physiques BAC S1 Sénégal :
PHYSIQUE :
• Mécanique : cinématique (MRU, MRUA, chute libre, mouvements courbes), dynamique (lois de Newton : inertie, F=ma, actions réciproques), travail et énergie, quantité de mouvement
• Oscillations mécaniques : oscillateur harmonique, pendule simple, ressort-masse, résonance
• Ondes mécaniques : célérité, fréquence, longueur d'onde, diffraction, interférences
• Optique géométrique : réflexion, réfraction (Snell-Descartes), miroirs, lentilles convergentes et divergentes, formule de conjugaison, grandissement
• Électricité — courant continu : loi d'Ohm, associations résistances, puissance, énergie
• Électricité — régimes transitoires : circuit RC (charge/décharge), circuit RL, constante de temps τ
• Circuits sinusoïdaux : impédance, déphasage, circuit RLC série, résonance, puissance
• Électromagnétisme : champ magnétique, force de Laplace, induction électromagnétique (loi de Faraday, loi de Lenz)
• Physique nucléaire : radioactivité (α, β, γ), loi de décroissance, demi-vie, réactions nucléaires, énergie de liaison

CHIMIE :
• Cinétique chimique : vitesse de réaction, ordre de réaction, temps de demi-réaction, facteurs influençant la vitesse
• Équilibres chimiques : loi d'action de masse, constante d'équilibre Kc et Kp, principe de Le Chatelier
• Acides et bases : théorie de Brønsted, Ka, Kb, pKa, pH, titrage acido-basique, courbe de neutralisation
• Oxydoréduction : potentiel redox, équation de Nernst, piles électrochimiques, électrolyse
• Chimie organique : nomenclature, alcanes, alcènes, alcools, acides carboxyliques, esters, réactions principales`,

    "S2": `Programme officiel Sciences Physiques BAC S2 Sénégal :
PHYSIQUE :
• Mécanique newtonienne, oscillations, ondes, optique (identique à S1)
• Électricité : circuits RC, RL, RLC, courant sinusoïdal
• Physique nucléaire (identique à S1)

CHIMIE :
• Cinétique chimique, équilibres, acido-basique (identique à S1)
• Notions de chimie organique : alcools, acides, estérification`,

    "BFEM": `Programme officiel Sciences Physiques BFEM Sénégal :
• Électricité : circuit simple, loi d'Ohm (U=RI), association résistances série et parallèle, puissance P=UI
• Magnétisme : champ magnétique, aimants, électroaimants, boussole
• Forces et mouvement : force gravitationnelle, poids, force normale, frottements, loi d'inertie
• Optique : réflexion (loi de réflexion, miroir plan), réfraction (Snell-Descartes), lentilles convergentes simples
• États de la matière : solide, liquide, gaz, changements d'état, température de fusion/vaporisation
• Chimie : atomes, molécules, ions, liaisons chimiques, réactions simples (combustion, oxydation)
• Solutions : dissolution, concentration, dilution, indicateurs colorés`,
  },

  "Sciences Naturelles": {
    "S2": `Programme officiel SVT BAC S2 Sénégal :
GÉNÉTIQUE ET BIOLOGIE MOLÉCULAIRE :
• Méiose : phases (prophase I/II, métaphase, anaphase, télophase), brassage interchromosomique et intrachromosomique (crossing-over)
• Lois de Mendel : monohybridisme, dihybridisme, codominance, dominance incomplète
• Hérédité liée au sexe : gènes liés aux chromosomes sexuels, cas pratiques
• ADN : structure en double hélice, bases azotées (A, T, G, C), réplication semi-conservative
• Transcription et traduction : ARNm, ARNt, code génétique, synthèse des protéines
• Mutations génétiques : types (substitution, délétion, insertion), conséquences

IMMUNOLOGIE :
• Système immunitaire : organes (thymus, rate, ganglions), cellules (lymphocytes B et T, macrophages)
• Réponse immunitaire non spécifique : phagocytose, inflammation
• Réponse immunitaire spécifique : anticorps (immunité humorale), lymphocytes T cytotoxiques (immunité cellulaire)
• Vaccination et sérothérapie : principe, types de vaccins, immunité passive/active
• Maladies auto-immunes et allergies : mécanismes

NEUROPHYSIOLOGIE :
• Message nerveux : potentiel de repos, potentiel d'action, propagation le long d'un axone
• Synapse : transmission chimique (neurotransmetteurs), synapse excitatrice/inhibitrice
• Réflexe médullaire : arc réflexe, réflexe myotatique, réflexe ostéo-tendineux
• Cortex cérébral : aires sensitives et motrices, plasticité cérébrale

REPRODUCTION ET DÉVELOPPEMENT :
• Reproduction sexuée : gamétogenèse (spermatogenèse, ovogenèse), fécondation, développement embryonnaire
• Régulation hormonale : axe hypothalamo-hypophysaire, FSH, LH, œstrogènes, progestérone, testostérone
• Contraception : modes d'action des contraceptifs hormonaux et mécaniques

GÉOLOGIE ET ÉVOLUTION :
• Roches sédimentaires, métamorphiques, magmatiques : formation et caractéristiques
• Tectonique des plaques : dérive des continents, rifting, zones de subduction
• Évolution des espèces : sélection naturelle (Darwin), spéciation, phylogénèse
• Fossiles et datation : stratigraphie, datation radiométrique`,

    "BFEM": `Programme officiel Sciences Naturelles BFEM Sénégal :
• Nutrition végétale : photosynthèse (réactifs CO₂ + H₂O, produits glucides + O₂), minéralisation, nutrition minérale
• Nutrition animale : appareil digestif, digestion chimique et mécanique, absorption des nutriments, nutriments essentiels
• Respiration : échanges gazeux (O₂/CO₂), appareil respiratoire, respiration cellulaire
• Circulation : cœur et vaisseaux, grande et petite circulation, rôle du sang (transport)
• Reproduction humaine : appareils reproducteurs, cycle menstruel, fécondation, grossesse, accouchement
• Hérédité : chromosomes, gènes, transmission caractères héréditaires, génétique mendélienne simple
• Microbiologie et santé : bactéries, virus, système immunitaire simplifié, vaccination, hygiène
• Écologie : chaînes et réseaux alimentaires, biomes, cycles biogéochimiques, impact de l'homme`,
  },

  "Français": {
    "L1": `Programme officiel Français BAC L1 Sénégal :
ŒUVRES AU PROGRAMME (textes africains et français) :
• Sembène Ousmane : "Ô Pays, mon beau peuple !" (1957) — thèmes : néocolonialisme, retour au pays, identité, résistance
• Sembène Ousmane : "Les Bouts de bois de Dieu" (1960) — thèmes : grève, solidarité, émancipation féminine
• Birago Diop : "Les Contes d'Amadou Koumba" — thèmes : tradition orale, sagesse africaine, morale
• Cheikh Hamidou Kane : "L'Aventure ambiguë" (1961) — thèmes : dualité tradition/modernité, foi islamique, déracinement
• Léopold Sédar Senghor (poésie) — Négritude, identité africaine, réconciliation des cultures
• Voltaire : "Candide" — thèmes : optimisme, critique de l'Église, liberté de pensée
• Victor Hugo (poésie, théâtre) — humanisme, romantisme

TECHNIQUES D'EXPRESSION :
• Dissertation littéraire : structure thèse/antithèse/synthèse, argumentation, illustrations textuelles
• Commentaire composé : introduction (présentation, problématique, plan), axes d'étude, conclusion
• Résumé de texte : réduction au 1/4, fidélité, style indirect, sans ajout personnel
• Discussion : prise de position, arguments, contre-arguments, exemples concrets
• Figures de style : métaphore, métonymie, anaphore, antithèse, hyperbole, litote, euphémisme, oxymore

GRAMMAIRE ET STYLISTIQUE :
• Subjonctif présent et passé : emplois
• Concordance des temps : modes et temps dans les propositions subordonnées
• Registres littéraires : lyrique, épique, comique, tragique, didactique, polémique`,

    "L2": `Programme officiel Français BAC L2 Sénégal :
Identique à L1 avec accent sur la maîtrise des langues étrangères et la traduction littéraire.
Mêmes œuvres, mêmes techniques avec approfondissement de l'analyse linguistique.`,

    "S1": `Programme officiel Français BAC S1 Sénégal :
• Commentaire composé et dissertation (notions de base)
• Résumé de texte (textes scientifiques et littéraires)
• Principales figures de style
• Œuvres recommandées : textes africains au programme`,

    "S2": `Programme officiel Français BAC S2 Sénégal (identique à S1 avec accent sur les textes scientifiques)`,

    "BFEM": `Programme officiel Français BFEM Sénégal :
• Compréhension de texte : identification de l'idée principale, des arguments, du registre
• Résumé : réduction au 1/4 du texte, reformulation sans paraphrase
• Questions de grammaire : nature et fonction des mots et groupes, analyse logique
• Conjugaison : tous les temps et modes, concordance des temps, discours indirect
• Orthographe : accord participe passé, homophones, pluriels irréguliers
• Vocabulaire : synonymes, antonymes, familles de mots, sens contextuel
• Production écrite : lettre formelle, récit, rédaction argumentative (15-20 lignes)`,
  },

  "Philosophie": {
    "L1": `Programme officiel Philosophie BAC L1 Sénégal :
NOTIONS FONDAMENTALES AU PROGRAMME :
• La conscience et l'inconscient : conscience de soi (Descartes "cogito"), inconscient freudien, rapport entre les deux
• La perception : réalisme naïf vs idéalisme, illusions des sens, phénoménologie
• La liberté : libre arbitre (Descartes), déterminisme, liberté existentielle (Sartre "l'existence précède l'essence")
• La responsabilité morale : conditions de la responsabilité, culpabilité, punition
• Le langage : fonctions du langage, relation langue/pensée, langage et vérité
• La vérité : vérité et certitude, doute méthodique, vérité scientifique vs opinion
• La raison et le réel : rationalisme (Descartes, Leibniz) vs empirisme (Locke, Hume)
• La démonstration : types de raisonnements, syllogisme, déduction/induction
• Le travail : aliénation chez Marx, travail et dignité, technique et humanité (Heidegger)
• L'art : beauté et goût (Kant), art et nature, fonction sociale de l'art
• La religion : rapport foi/raison, preuves de l'existence de Dieu, critique de la religion (Marx, Feuerbach)
• L'État et la politique : contrat social (Rousseau, Hobbes, Locke), légitimité du pouvoir, droit naturel
• La justice et le droit : droit naturel vs droit positif, justice commutative et distributive
• L'histoire : sens de l'histoire, progrès (Hegel, Marx), philosophie de l'histoire

AUTEURS CLÉS :
Platon, Aristote, Descartes, Spinoza, Hume, Kant, Hegel, Marx, Nietzsche, Sartre, Simone de Beauvoir`,

    "S1": `Programme officiel Philosophie BAC S1 Sénégal :
Mêmes notions fondamentales que L1 avec accent sur les notions scientifiques.
• Rapport science/philosophie, méthode scientifique, limites de la science
• Technologie et condition humaine
• Vérité, démonstration, hypothèse en sciences`,

    "S2": `Programme officiel Philosophie BAC S2 Sénégal : identique à S1.`,
  },

  "Histoire-Géographie": {
    "L1": `Programme officiel Histoire-Géographie BAC L1/L2 Sénégal :
HISTOIRE :
• Les empires africains médiévaux : Ghana, Mali (Soundjata Keïta, Kankou Moussa), Songhaï — organisation politique, économie transsaharienne
• La traite négrière : traite atlantique et orientale, rôle des européens, impact sur l'Afrique (dépopulation, guerres)
• La colonisation de l'Afrique : conférence de Berlin (1884-85), partage, résistances africaines (Lat Dior, Samory Touré, El Hadj Omar)
• Le Sénégal colonial : les 4 communes, Blaise Diagne, l'arachide, Dakar capitale de l'AOF
• Décolonisation africaine (1945-1975) : naissance des partis nationalistes, indépendances, figures clés (Nkrumah, Houphouët-Boigny, Sékou Touré, Senghor, Modibo Keïta)
• Le Sénégal indépendant : Léopold Sédar Senghor (1960-1980), Abdou Diouf, Abdoulaye Wade, Macky Sall — institutions, économie
• La Guerre Froide (1947-1991) : blocs Est/Ouest, doctrine Truman, plan Marshall, crise de Cuba (1962), Ostpolitik, chute du mur de Berlin
• Le monde bipolaire : ONU, OTAN, Pacte de Varsovie, guerres locales (Corée, Vietnam, Angola)
• Panafricanisme : W.E.B. Du Bois, Marcus Garvey, congrès panafricains, OUA (1963), UA (2002)
• Le monde multipolaire actuel : émergence Chine, BRICS, mondialisation

GÉOGRAPHIE :
• Géographie physique du Sénégal : relief (plaines, Fouta Djalon), fleuves (Sénégal, Gambie, Casamance, Sine-Saloum), climat (sahélien, soudanien, subéquatorial), végétation
• Population du Sénégal : démographie, ethnies, urbanisation (Dakar, Thiès, Saint-Louis, Ziguinchor)
• Économie du Sénégal : arachide, pêche, phosphates, tourisme, Plan Sénégal Émergent (PSE), SENBUS
• Géographie de l'Afrique de l'Ouest : CEDEAO, ressources naturelles, intégration régionale
• La mondialisation : échanges commerciaux, FMN, OMC, déséquilibres Nord-Sud
• Les grandes puissances : USA, Chine, Union Européenne, Russie — géopolitique actuelle`,

    "S1": `Programme officiel Histoire-Géographie BAC S1/S2 Sénégal :
Identique à L1/L2 — mêmes chapitres d'histoire et de géographie. L'accent est mis sur la compréhension des relations de causalité et l'analyse de documents.`,
  },

  "Anglais": {
    "L1": `Programme officiel Anglais BAC L1/L2 Sénégal :
COMPRÉHENSION ÉCRITE :
• Textes argumentatifs : droits civiques (Martin Luther King, Malcolm X), environnement, mondialisation, technologie, éducation en Afrique
• Identification des idées principales, des arguments, du registre, du point de vue de l'auteur
• Vocabulaire thématique : globalisation, media, politics, environment, education, health

EXPRESSION ÉCRITE :
• Essay / article de journal : introduction (hook + thesis), corps (3 paragraphes argumentés), conclusion
• Lettre formelle : présentation, objet, corps, formule de politesse
• Rapport simple

GRAMMAIRE AVANCÉE :
• Temps : present perfect vs preterit, past perfect, future perfect, conditionnels (0, 1, 2, 3)
• Voix passive : tous les temps
• Discours indirect (reported speech) : transformations temporelles et pronominales
• Propositions relatives (defining and non-defining)
• Modal verbs : can, could, may, might, must, shall, should, will, would

VOCABULAIRE :
• Collocations, expressions idiomatiques
• Synonymes et antonymes académiques`,

    "S1": `Programme officiel Anglais BAC S1/S2/S3/S4 Sénégal :
• Compréhension de textes scientifiques et d'actualité
• Expression écrite : essai argumentatif, letter to the editor
• Grammaire : conditionnels, voix passive, discours indirect, modaux
• Vocabulaire : science and technology, environment, health, Africa`,

    "BFEM": `Programme officiel Anglais BFEM Sénégal :
• Compréhension de textes simples (narratifs, descriptifs) : qui, quoi, où, quand
• Expression orale : se présenter, décrire, exprimer ses goûts et opinions, dialogues courants
• Grammaire : présent simple/progressif, prétérit simple/progressif, futur (will/going to), can/could/must
• Questions en anglais (WH questions, yes/no questions, question tags)
• Vocabulaire quotidien : famille, école, maison, nourriture, transport, ville, sport
• Lettre informelle simple, carte postale`,
  },

  "Comptabilité": {
    "G": `Programme officiel Comptabilité BAC G Sénégal :
• Plan Comptable SYSCOHADA : classes 1 à 7, principes de base, nomenclature des comptes
• Bilan : actif (immobilisations, stocks, créances, trésorerie) et passif (capitaux propres, dettes), équilibre fondamental
• Compte de résultat : produits d'exploitation et charges d'exploitation, résultat net
• Comptabilisation des opérations courantes : achats, ventes, règlements, TVA collectée et déductible
• Amortissements : amortissement linéaire, dégressif, calcul de la dotation annuelle, tableau d'amortissement
• Provisions : pour dépréciation, pour risques et charges
• Régularisations : charges et produits constatés d'avance, charges à payer, produits à recevoir
• Opérations financières : emprunts, intérêts, effets de commerce (lettre de change, billet à ordre)
• Analyse financière : fonds de roulement (FR), besoin en fonds de roulement (BFR), trésorerie nette
• Ratios financiers : liquidité générale, solvabilité, rentabilité commerciale et économique
• Tableaux de bord : tableau de financement, tableau des flux de trésorerie (notion)`,
  },
};

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let body: { subject: string; examType: string; serie?: string; questionCount?: number; count?: number; annee?: string; examBlanc?: boolean };
  try {
    body = await req.json();
    if (!body.subject || !body.examType) throw new Error("subject et examType requis");
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Requête invalide" }, { status: 400 });
  }

  const { subject, examType, serie = "", questionCount, count, annee } = body;
  const n = Math.min(count || questionCount || 10, 20);

  // First try new programmes.ts, fallback to inline data
  const serieKey = serie || (examType === "BFEM" ? "BFEM" : "S1");
  const prog = getProgramme(subject, serieKey);
  let programSection = "";
  if (prog) {
    programSection = `\nPROGRAMME OFFICIEL (Office du BAC Sénégal) :\n${prog.contenu.slice(0, 2500)}\n`;
  } else {
    const subjectProgs = PROGRAMMES_OFFICIELS[subject] ?? {};
    const progForSerie = subjectProgs[serieKey] ?? subjectProgs[Object.keys(subjectProgs)[0]] ?? "";
    programSection = progForSerie ? `\nPROGRAMME OFFICIEL (Office du BAC Sénégal) :\n${progForSerie}\n` : "";
  }

  const anneeContext = annee ? ` (session ${annee})` : "";

  const prompt = `Génère ${n} questions d'examen pour la matière "${subject}", niveau ${examType}${serie ? " série " + serie : ""}${anneeContext} au Sénégal.${programSection}
Questions variées : QCM (4 choix), vrai/faux, calculs, définitions.
Difficulté progressive : 30% facile, 40% moyen, 30% difficile.
Les questions doivent être précisément basées sur le programme officiel ci-dessus.

Retourne UNIQUEMENT ce JSON valide :
{
  "questions": [
    {
      "id": 1,
      "type": "qcm",
      "question": "Énoncé précis de la question ?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Explication détaillée de la bonne réponse.",
      "points": 2,
      "difficulty": "moyen",
      "chapter": "Nom du chapitre exact du programme"
    }
  ]
}

Règles :
- type = "qcm" (4 choix), "vrai_faux" (choices=["Vrai","Faux"]), "calcul" (choices=[]), "definition" (choices=[])
- Exactement ${n} questions
- Tout en français
- chapter doit correspondre à un chapitre réel du programme officiel`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.1-8b-instant",
      max_tokens: 2000,
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
