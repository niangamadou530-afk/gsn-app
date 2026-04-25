/**
 * Programmes officiels BAC et BFEM sénégalais
 * Source: Ministère de l'Éducation du Sénégal — programmes consolidés 2004-2009
 */

export type ProgrammeMatiere = {
  chapitres: string[];
  examFormat?: string;   // Format et structure de l'épreuve
  pointsCles?: string[]; // Points souvent évalués / ce qui tombe
};

export const PROGRAMMES: {
  BFEM: Record<string, ProgrammeMatiere>;
  BAC: Record<string, Record<string, ProgrammeMatiere>>;
} = {

  /* ════════════════════════════════════════
     BFEM — 3ème
  ════════════════════════════════════════ */
  BFEM: {

    "Mathématiques": {
      chapitres: [
        "Racine carrée",
        "Calcul algébrique : identités remarquables, factorisation",
        "Application affine et application affine par intervalle",
        "Équations et inéquations du 1er degré à une inconnue",
        "Équations et inéquations du 1er degré à deux inconnues",
        "Systèmes d'inéquations à deux inconnues",
        "Vecteurs : définition, addition, multiplication par un réel",
        "Repérage dans le plan : coordonnées, milieu, distance",
        "Relations trigonométriques dans le triangle rectangle",
        "Théorème de Thalès et réciproque",
        "Angle inscrit et angle au centre",
        "Transformations du plan : translation, homothétie, symétrie",
        "Géométrie dans l'espace : solides, sections planes",
        "Statistique : moyenne, médiane, mode, diagrammes",
        "Autre"
      ],
      examFormat: "Épreuve de 3h sur 20 points. Exercice 1 (calcul numérique/algébrique), Exercice 2 (géométrie plane), Problème (analyse de situation avec plusieurs parties progressives).",
      pointsCles: [
        "Résolution d'équations et inéquations du 1er degré",
        "Construction et calcul vectoriel",
        "Propriétés des triangles (Thalès, trigonométrie)",
        "Transformations géométriques (translation, symétrie)",
        "Calcul statistique (moyenne pondérée, fréquences)",
        "Géométrie dans l'espace (sections de solides)"
      ]
    },

    "Sciences Physiques": {
      chapitres: [
        "Les lentilles minces : convergentes et divergentes",
        "Dispersion de la lumière blanche : prisme, spectre",
        "Notions de force : caractéristiques, représentation",
        "Équilibre d'un solide soumis à deux forces",
        "Principe des actions réciproques (3ème loi de Newton)",
        "Électrisation par frottement : charges électriques",
        "Le courant électrique : continu, alternatif",
        "La résistance électrique : loi d'Ohm",
        "Association de résistances (série, parallèle)",
        "Énergie et puissance électrique ; rendement",
        "La calorimétrie : chaleur, capacité thermique",
        "Notions de solutions : solvant, soluté, concentration",
        "Solutions acides et solutions basiques : pH",
        "Les métaux : action de l'air et oxydation",
        "Les hydrocarbures : alcanes, alcènes",
        "Action des acides dilués sur les métaux",
        "Autre"
      ],
      examFormat: "Épreuve de 3h sur 20 points. Partie Physique (10 pts) : 2 exercices sur optique/électricité/mécanique. Partie Chimie (10 pts) : 2 exercices sur solutions/réactions chimiques.",
      pointsCles: [
        "Construction d'images à travers une lentille convergente",
        "Calcul de résistance équivalente (série/parallèle)",
        "Application de la loi d'Ohm et calcul de puissance",
        "Équilibre des forces (solide en équilibre)",
        "Calcul de pH et identification acide/base",
        "Équations de réactions chimiques (oxydation des métaux)"
      ]
    },

    "SVT": {
      chapitres: [
        "La respiration chez l'espèce humaine",
        "Les phénomènes énergétiques accompagnant la respiration",
        "La fermentation : un autre moyen de se procurer de l'énergie",
        "Le rôle du rein dans l'excrétion urinaire et la régulation du milieu intérieur",
        "L'immunité et la réponse immunitaire",
        "Le système immunitaire : organes et cellules",
        "Les groupes sanguins et la transfusion sanguine",
        "L'aide à l'immunité : vaccination et sérothérapie",
        "Dysfonctionnement du système immunitaire : VIH/SIDA",
        "La puberté et le rôle des organes génitaux",
        "De la fécondation à l'accouchement",
        "Comment éviter une grossesse ? (contraception)",
        "La transmission des caractères héréditaires",
        "Caryotype, chromosomes et détermination du sexe",
        "La contamination par les microorganismes",
        "La tectonique des plaques",
        "La formation des roches métamorphiques",
        "Le cycle des roches",
        "La chronologie en géologie",
        "Autre"
      ],
      examFormat: "Épreuve de 2h sur 20 points. Partie SVT : 2 exercices (Sciences de la Vie + Sciences de la Terre). Questions sur documents (observations, schémas, graphiques), questions de cours, réalisation de schémas.",
      pointsCles: [
        "Mécanisme de la réponse immunitaire (anticorps, antigènes)",
        "Étapes de la respiration et échanges gazeux",
        "Différence respiration/fermentation",
        "Rôle du rein : filtration, réabsorption, excrétion",
        "Reproduction humaine : fécondation, nidation, développement",
        "Transmission des caractères héréditaires : chromosomes, gènes",
        "Tectonique des plaques : preuves et conséquences",
        "Interprétation de schémas anatomiques et graphiques"
      ]
    },

    "Histoire": {
      chapitres: [
        "L'impérialisme et les rivalités coloniales (Congrès de Berlin)",
        "Les systèmes coloniaux en Afrique : français et britannique",
        "Les résistances africaines : formes, exemples, bilan",
        "Les missions et les explorations",
        "Les découvertes scientifiques et les mutations économiques (XIXe s.)",
        "Le développement du capitalisme et les mutations sociales",
        "Les doctrines sociales : syndicalisme et socialisme",
        "L'impérialisme japonais et américain",
        "L'impérialisme européen en Asie",
        "La Première Guerre mondiale : causes, déroulement, conséquences",
        "La Révolution russe et la consolidation du régime soviétique",
        "La crise des années 1930",
        "La Deuxième Guerre mondiale : causes et conséquences",
        "Bandung et l'émergence du Tiers-monde",
        "Les relations Est-Ouest de 1945 aux années 1990",
        "La décolonisation : causes et formes",
        "Le Sénégal : vie politique de 1944 à 1962",
        "Autre"
      ],
      examFormat: "Épreuve de 3h sur 20 points. Question de cours (5 pts), Commentaire de document historique (7 pts), Composition/Dissertation (8 pts). Sujets au programme des classes de 4ème et 3ème.",
      pointsCles: [
        "La Première et Deuxième Guerre mondiale (causes, conséquences)",
        "Le colonialisme et les résistances africaines",
        "La Guerre Froide et les relations Est-Ouest",
        "La décolonisation (causes générales et cas particuliers)",
        "Le Sénégal colonial et post-colonial",
        "Méthode du commentaire de document"
      ]
    },

    "Géographie": {
      chapitres: [
        "La Terre dans le système solaire : caractéristiques, mouvements",
        "La Terre, une planète menacée : surexploitation des ressources",
        "Les conséquences climatiques de l'exploitation économique",
        "Les inégalités de développement dans le monde",
        "Les systèmes économiques : capitalisme, socialisme",
        "La coopération bilatérale et multilatérale",
        "Les formes et problèmes de communication",
        "La Terre, un village planétaire : mondialisation",
        "Méthodologie : commentaire de document géographique",
        "Autre"
      ],
      examFormat: "Épreuve de 3h sur 20 points (combinée avec Histoire). Commentaire de document géographique (carte, graphique, tableau statistique) avec questions guidées. Composition géographique.",
      pointsCles: [
        "Commentaire de carte géographique ou graphique",
        "Inégalités de développement : indicateurs (PIB, IDH)",
        "Les ressources naturelles et leur exploitation",
        "Mondialisation et interdépendances",
        "Méthode de composition et de commentaire de document"
      ]
    },

    "Français": {
      chapitres: [
        "Le résumé de texte",
        "La dissertation et la discussion",
        "Le commentaire de texte",
        "La lecture d'un texte narratif (conte, nouvelle)",
        "La lecture d'un texte poétique",
        "La lecture d'un texte théâtral",
        "Les figures de style",
        "La grammaire : propositions subordonnées, modes et temps",
        "L'orthographe et la conjugaison",
        "La littérature africaine et francophone",
        "Autre"
      ],
      examFormat: "Épreuve de 3h sur 20 points. Texte suivi de questions (compréhension, vocabulaire, grammaire) puis production écrite (résumé, dissertation ou lettre).",
      pointsCles: [
        "Compréhension et explication de texte",
        "Résumé (reformulation, proportion respectée)",
        "Questions de grammaire (propositions, modes, temps)",
        "Production écrite guidée (plan, arguments, exemples)"
      ]
    },

    "Anglais": {
      chapitres: [
        "Compréhension de texte en anglais",
        "Vocabulaire : vie quotidienne, école, famille, environnement",
        "Le Present Simple et le Present Continuous",
        "Le Present Perfect",
        "Le Past Simple et le Past Continuous",
        "Les modaux : can, could, must, should, would",
        "Les questions directes et indirectes",
        "Le discours rapporté (Reported Speech)",
        "Les conditionnels (type 1, 2, 3)",
        "La voix passive",
        "La comparaison des adjectifs et adverbes",
        "Rédaction : lettre, description, narration",
        "Autre"
      ],
      examFormat: "Épreuve de 2h sur 20 points. Compréhension de texte en anglais (questions en anglais), exercices de langue (grammaire, vocabulaire), production écrite guidée.",
      pointsCles: [
        "Compréhension de texte : répondre en anglais",
        "Emploi des temps (Simple, Perfect, Continuous)",
        "Voix passive et discours rapporté",
        "Modaux (must, should, can, could, would)",
        "Production écrite : lettre formelle ou informelle"
      ]
    },

    "Éducation Civique": {
      chapitres: [
        "La citoyenneté et les droits de l'Homme",
        "Les institutions du Sénégal",
        "La démocratie et les élections",
        "L'État de droit",
        "Autre"
      ],
      examFormat: "Questions de cours et cas pratique. Épreuve courte (1h30).",
      pointsCles: ["Droits et devoirs du citoyen", "Institutions sénégalaises"]
    }
  },

  /* ════════════════════════════════════════
     BAC — par série
  ════════════════════════════════════════ */
  BAC: {

    /* ── Série L (L1/L2 — Littéraire) ── */
    "L": {
      "Mathématiques": {
        chapitres: [
          "Rappel des méthodes de factorisation d'un polynôme",
          "Composition de fonctions",
          "Continuité et limites des fonctions",
          "Dérivation : règles, applications",
          "Étude de fonctions : variations, extrema, tangentes",
          "Fonction logarithme népérien",
          "Fonction exponentielle",
          "Suites numériques : arithmétiques, géométriques",
          "Primitives et calcul intégral",
          "Dénombrement et probabilité",
          "Statistique à deux variables : régression linéaire",
          "Autre"
        ],
        examFormat: "Épreuve de 3h (coef 2 en L2). 2 exercices + 1 problème. Calcul différentiel, étude de fonctions, probabilités.",
        pointsCles: [
          "Étude complète d'une fonction (dérivée, variations, tableau)",
          "Calcul de limites et continuité",
          "Suites arithmétiques et géométriques (terme général, somme)",
          "Calcul de primitives et d'intégrales",
          "Probabilités : loi binomiale, espérance, variance"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Production, transport, utilisation de l'énergie électrique",
          "Énergie nucléaire : réactions spontanées, fusion et fission",
          "Généralités sur les signaux et ondes mécaniques",
          "Aspect ondulatoire de la lumière : réflexion, réfraction, interférences",
          "Aspect corpusculaire de la lumière : effet photoélectrique, dualité onde-corpuscule",
          "Matières plastiques : polymères, thermoplastiques, thermodurcissables",
          "Les textiles : artificiels et synthétiques",
          "Les savons : estérification, saponification",
          "Les lessives, les antiseptiques et les désinfectants",
          "La pollution de l'air et de l'eau",
          "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). 4 parties de 5 pts chacune : (1) définitions de contenus, (2) QCM/phrases à trous/phrases à rectifier, (3) schémas ou exercice d'application, (4) texte scientifique avec questions. Pas d'exercice sur les chapitres traités en exposés (C4, C5).",
        pointsCles: [
          "Alternateur, transformateur, production d'électricité (P1)",
          "Radioactivité : lois de conservation, demi-vie, énergie (P2)",
          "Ondes mécaniques : célérité, période, réflexion, lois (P3)",
          "Nature ondulatoire de la lumière : interférences (P4)",
          "Effet photoélectrique : théorie des photons, E=hν (P5)",
          "Polymérisation : équations-bilan, motifs (C1, C2)",
          "Saponification : réaction, caractéristiques (C3)"
        ]
      },
      "SVT": {
        chapitres: [
          "Tissu nerveux et ses propriétés : neurone, influx nerveux",
          "Système nerveux et comportement moteur",
          "Activité cardiaque et régulation de la pression artérielle",
          "Immunologie : réponse immunitaire, anticorps, vaccins",
          "Reproduction chez les mammifères",
          "Reproduction chez les spermaphytes",
          "Hérédité et génétique : lois de Mendel",
          "Hérédité humaine : maladies héréditaires, caryotype",
          "Régulation de la glycémie : insuline, glucagon",
          "Milieu intérieur : rein, homéostasie",
          "Activité du muscle squelettique",
          "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Exercice 1 : biologie humaine (neurosciences, immunologie, génétique). Exercice 2 : physiologie (régulations, reproduction). Documents à exploiter (graphiques, schémas).",
        pointsCles: [
          "Transmission de l'influx nerveux (synapse, potentiel d'action)",
          "Réponse immunitaire spécifique et non spécifique",
          "Régulation glycémique : rôle pancréas, foie",
          "Lois de Mendel : croisements, ratios phénotypiques",
          "Régulation de la pression artérielle"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques (Métaphysique)",
          "L'État : formes, légitimité, rôle",
          "L'art et le réel",
          "Le travail : aliénation, émancipation",
          "Langage et communication",
          "Nature et culture",
          "La liberté : déterminisme, libre-arbitre",
          "Conscient et inconscient",
          "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 3 en L1, coef 2 en L2). Dissertation philosophique ou explication de texte. Plan structuré en 3 parties avec thèse, antithèse, synthèse.",
        pointsCles: [
          "Méthode de la dissertation (problématique, plan dialectique)",
          "Explication de texte : thèse, arguments, portée",
          "Liberté vs déterminisme",
          "L'État, le droit, la justice",
          "Travail et technique"
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme : Apollinaire, Aragon, Éluard, Césaire, Senghor",
          "Esthétique des genres : La poésie (Classicisme, Romantisme, Symbolisme, Négritude)",
          "Esthétique des genres : Le roman (Réalisme, Naturalisme, Roman africain)",
          "Esthétique des genres : Le théâtre (classique, moderne)",
          "La dissertation littéraire",
          "Le commentaire composé",
          "Le résumé de texte suivi de discussion",
          "La littérature africaine et francophone",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 3 en L1, coef 2 en L2). Texte littéraire avec : résumé (1/4 du texte), commentaire composé ou dissertation, questions de langue. Oeuvres étudiées en classe obligatoires.",
        pointsCles: [
          "Résumé : proportion exacte, reformulation fidèle",
          "Commentaire composé : axes de lecture, analyse stylistique",
          "Dissertation littéraire : courants, genres, oeuvres",
          "Le surréalisme et la Négritude : auteurs, thèmes",
          "Analyse des figures de style et effets de sens"
        ]
      },
      "Histoire": {
        chapitres: [
          "Les causes générales de la décolonisation",
          "La décolonisation en Asie : Inde et Indochine",
          "La décolonisation au Maghreb et en Algérie",
          "La décolonisation au Proche-Orient et la question palestinienne",
          "Les formes et bilan de la décolonisation",
          "Les relations Est-Ouest et la Guerre Froide",
          "La Chine de 1975 aux années 1990",
          "Les conséquences de la Deuxième Guerre mondiale",
          "Méthodologie de dissertation en histoire",
          "Autre"
        ],
        examFormat: "Épreuve de 3h (combinée Hist-Géo, coef 2). Sujet 1 : Dissertation historique avec plan détaillé. Sujet 2 : Commentaire de document (texte, carte, photo). Le candidat traite 1 sujet au choix.",
        pointsCles: [
          "La décolonisation : causes, formes, bilan (Afrique, Asie)",
          "Guerre Froide : blocs, crises, détente",
          "Question palestinienne",
          "Méthode de dissertation (introduction, plan, conclusion)",
          "Commentaire de document historique"
        ]
      },
      "Géographie": {
        chapitres: [
          "Le système-monde : des espaces interdépendants",
          "L'espace Nord-Américain : présentation, modèle américain",
          "L'espace européen : construction européenne, France/Allemagne",
          "L'Asie-Pacifique : Japon, Chine",
          "L'Amérique latine : Brésil",
          "L'Afrique : problèmes et perspectives",
          "Le Sénégal : milieux naturels, eau, problèmes économiques",
          "Autre"
        ],
        examFormat: "Épreuve de 3h (combinée Hist-Géo). Dissertation géographique ou commentaire de document (carte, graphique, tableau statistique).",
        pointsCles: [
          "Analyse d'une carte géographique ou d'un graphique",
          "Modèle américain, japonais, européen : caractéristiques",
          "Problèmes de développement de l'Afrique et du Sénégal",
          "Mondialisation et interdépendances",
          "Méthode du commentaire de document géographique"
        ]
      },
      "Anglais": {
        chapitres: [
          "Comprehension of written texts",
          "Vocabulary: social issues, politics, economy, environment",
          "Grammar: tenses review (all tenses)",
          "The Passive Voice",
          "Reported Speech",
          "Conditionals (type 1, 2, 3)",
          "Modal verbs (must, should, would, could, might)",
          "Articles, determiners, pronouns",
          "Argumentative writing",
          "Letter writing (formal and informal)",
          "African and world literature in English",
          "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Texte en anglais suivi de : questions de compréhension (en anglais), exercices de langue (grammaire, vocabulaire), production écrite guidée.",
        pointsCles: [
          "Compréhension et résumé d'un texte en anglais",
          "Emploi des temps et des modaux",
          "Voix passive et discours rapporté",
          "Production écrite : essai argumentatif ou lettre formelle"
        ]
      },
      "Économie Générale": {
        chapitres: [
          "Croissance et développement économique",
          "Le sous-développement : caractéristiques, théories",
          "Indicateurs de développement (PIB, IDH, IPH)",
          "La mondialisation des échanges : balance des paiements",
          "Libre-échangisme et protectionnisme",
          "Mouvements internationaux de capitaux",
          "Organismes économiques internationaux (FMI, BM, OMC)",
          "L'intégration économique : formes, UEMOA, difficultés en Afrique",
          "Le rôle de l'État dans le développement",
          "Politiques économiques : budgétaire, monétaire",
          "Méthodologie : commentaire dirigé de texte et tableau statistique",
          "Autre"
        ],
        examFormat: "Épreuve de 3h (coef 3 en L2). Commentaire dirigé d'un texte économique OU d'un tableau statistique. Questions guidées : présentation, analyse, commentaire, conclusion.",
        pointsCles: [
          "Calcul et interprétation du taux de croissance",
          "Indicateurs de développement : PIB, IDH, IPH",
          "Balance des paiements : soldes significatifs",
          "Libre-échange vs protectionnisme (Smith, Ricardo, List)",
          "Rôle de l'État : Keynes, politiques budgétaire et monétaire",
          "Méthode du commentaire dirigé de tableau statistique"
        ]
      }
    },

    /* ── Série S1 (Sciences expérimentales + Maths avancées) ── */
    "S1": {
      "Mathématiques": {
        chapitres: [
          "Barycentre de points pondérés",
          "Géométrie plane : calcul vectoriel, isométries, similitudes",
          "Produit scalaire et applications",
          "Courbes paramétrées",
          "Coniques : ellipse, parabole, hyperbole",
          "Géométrie dans l'espace : vecteurs, plans, droites",
          "Probabilités et dénombrement : loi binomiale",
          "Nombres complexes : forme algébrique, trigonométrique, exponentielle",
          "Systèmes d'équations linéaires",
          "Arithmétique : PGCD, congruences",
          "Suites numériques : convergence, récurrence",
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonctions logarithme et exponentielle",
          "Calcul intégral : primitives, applications géométriques",
          "Équations différentielles linéaires",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Problème en 2 ou 3 parties : analyse/géométrie analytique + probabilités/statistiques. Questions progressives avec guidage.",
        pointsCles: [
          "Étude de fonctions avec ln et exp (dérivée, variations, limites)",
          "Calcul intégral : primitives, aire entre courbes",
          "Nombres complexes : opérations, forme trigonométrique",
          "Probabilités : loi binomiale, espérance, variance",
          "Suites : terme général, limite, raisonnement par récurrence",
          "Équations différentielles y' + ay = b"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique du point : vitesse, accélération, chute libre",
          "Bases de la dynamique : lois de Newton",
          "Applications : plan incliné, pendule, satellite",
          "Gravitation universelle",
          "Champ magnétique : propriétés, sources",
          "Mouvement d'une particule chargée dans un champ magnétique",
          "Loi de Laplace : force sur un conducteur",
          "Induction magnétique : dipôle RL",
          "Dipôle RC : charge et décharge",
          "Oscillations électriques libres et forcées (RLC)",
          "Oscillations mécaniques libres (pendule, ressort)",
          "Interférences lumineuses : fentes de Young",
          "Effet photoélectrique",
          "Niveaux d'énergie de l'atome : spectre de l'hydrogène",
          "Réactions nucléaires : fission, fusion, radioactivité",
          "Alcools : nomenclature, propriétés, réactions",
          "Amines : nomenclature, basicité",
          "Acides carboxyliques et dérivés : estérification",
          "Cinétique chimique : vitesse, facteurs",
          "Autoprotolyse de l'eau, pH, indicateurs colorés",
          "Réactions acide-base : dosage",
          "Acides alpha-aminés et stéréochimie",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Problème de physique (10 pts) + Problème de chimie (10 pts). Chaque problème comprend plusieurs exercices avec questions progressives.",
        pointsCles: [
          "Lois de Newton : équation du mouvement, chute libre, plan incliné",
          "Circuits RLC : oscillations, résonance",
          "Loi de Faraday : induction, force électromotrice",
          "Fentes de Young : franges d'interférence (λ = ax/D)",
          "Réactions nucléaires : écriture, bilan énergétique",
          "Titrages acido-basiques : pH, équivalence",
          "Estérification : équation, caractéristiques, rendement"
        ]
      },
      "SVT": {
        chapitres: [
          "Tissu nerveux et ses propriétés : neurones, myéline, sinaotransmetteurs",
          "Système nerveux et comportement moteur : arc réflexe, motricité volontaire",
          "Activité cardiaque : révolution cardiaque, régulation",
          "Immunologie : immunité innée, immunité adaptative",
          "Reproduction chez les mammifères : hormones, cycles",
          "Hérédité et génétique : lois de Mendel, dihybridisme",
          "Hérédité liée au sexe et maladies héréditaires",
          "Régulation de la glycémie : pancréas endocrine",
          "Milieu intérieur : composition, régulations",
          "Activité du muscle squelettique : contraction, énergie",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). 2 exercices de 10 pts chacun avec exploitation de documents (graphiques, schémas, résultats expérimentaux). Raisonnement scientifique attendu.",
        pointsCles: [
          "Synapse et transmission synaptique",
          "Immunité : cellules impliquées, mémoire immunitaire",
          "Génétique : résolution de problèmes de croisements",
          "Régulation glycémique : boucle de régulation",
          "Contraction musculaire : filaments d'actine et myosine"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
          "L'État", "L'art et le réel", "Le travail",
          "Langage et communication", "Nature et culture",
          "La liberté", "Conscient et inconscient", "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Dissertation ou explication de texte.",
        pointsCles: ["Méthode dissertation", "Textes à expliquer", "Liberté, État, Travail"]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte littéraire + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Histoire": {
        chapitres: [
          "Les causes générales de la décolonisation",
          "La décolonisation au Proche-Orient et la question palestinienne",
          "La décolonisation au Maghreb et en Algérie",
          "La décolonisation en Asie : Inde et Indochine",
          "Les formes de décolonisation",
          "Les relations Est-Ouest et la Guerre Froide",
          "La Chine de 1975 aux années 1990",
          "Méthodologie de dissertation", "Autre"
        ],
        examFormat: "Épreuve 3h (Hist-Géo, coef 2). Dissertation ou commentaire de document.",
        pointsCles: ["Décolonisation", "Guerre Froide", "Commentaire de document"]
      },
      "Géographie": {
        chapitres: [
          "Le système-monde : des espaces interdépendants",
          "L'espace Nord-Américain", "L'espace européen",
          "L'Asie-Pacifique", "L'Amérique latine : Brésil",
          "L'Afrique : problèmes de développement",
          "Le Sénégal : milieux, eau, économie", "Autre"
        ],
        examFormat: "Épreuve 3h (Hist-Géo, coef 2). Composition géographique ou commentaire de document.",
        pointsCles: ["Commentaire de carte/graphique", "Développement en Afrique", "Mondialisation"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: sciences, society, environment",
          "Grammar: all tenses, passive, reported speech",
          "Conditionals", "Modal verbs",
          "Writing: essay, formal letter", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices de langue + production écrite.",
        pointsCles: ["Compréhension de texte scientifique", "Passif", "Production écrite argumentée"]
      }
    },

    /* ── Série S2 (Sciences avec accent Maths/Physique) ── */
    "S2": {
      "Mathématiques": {
        chapitres: [
          "Fonctions numériques : continuité, dérivation",
          "Fonctions logarithme et exponentielle",
          "Suites numériques : arithmétiques, géométriques, récurrence",
          "Calcul intégral : primitives, intégrales définies",
          "Équations différentielles linéaires du 1er ordre",
          "Statistique : corrélation, régression",
          "Probabilités et dénombrement : loi binomiale, loi normale",
          "Nombres complexes",
          "Géométrie plane : barycentre, coniques",
          "Géométrie dans l'espace",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 6). Problème en 2 à 3 parties progressives : analyse + probabilités/statistiques.",
        pointsCles: [
          "Étude de fonctions (ln, exp, dérivée, variations, limites)",
          "Calcul intégral : primitives, aires",
          "Loi binomiale : espérance, variance, probabilités",
          "Suites arithmétiques et géométriques : sommes, limites",
          "Équations différentielles y' + ay = f(x)"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique du point", "Lois de Newton et applications",
          "Gravitation universelle",
          "Champ magnétique", "Mouvement d'une particule chargée",
          "Loi de Laplace", "Induction magnétique : dipôle RL",
          "Dipôle RC", "Oscillations RLC",
          "Oscillations mécaniques libres",
          "Interférences lumineuses",
          "Effet photoélectrique", "Niveaux d'énergie de l'atome",
          "Réactions nucléaires",
          "Alcools", "Amines", "Acides carboxyliques et dérivés",
          "Cinétique chimique",
          "pH, autoprotolyse de l'eau, indicateurs",
          "Dosages acido-basiques",
          "Acides alpha-aminés", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 6). Problème de physique (10 pts) + Problème de chimie (10 pts).",
        pointsCles: [
          "Mécanique newtonienne (chute libre, plan incliné, satellite)",
          "Oscillations RLC : énergie, résonance",
          "Réactions nucléaires : écriture et bilan énergétique",
          "Titrages pH-métriques : point d'équivalence",
          "Interférences lumineuses : calcul de λ"
        ]
      },
      "SVT": {
        chapitres: [
          "Tissu nerveux et ses propriétés",
          "Système nerveux et comportement moteur",
          "Activité cardiaque et régulation",
          "Immunologie",
          "Reproduction chez les mammifères",
          "Reproduction chez les spermaphytes",
          "Hérédité et génétique",
          "Hérédité humaine : maladies héréditaires",
          "Régulation de la glycémie",
          "Milieu intérieur",
          "Activité du muscle squelettique",
          "Biotechnologies",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 3). 2 exercices avec documents à exploiter.",
        pointsCles: [
          "Synapse chimique : neurotransmetteurs",
          "Immunité : phagocytose, anticorps, vaccination",
          "Génétique mendélienne : croisements mono et dihybrides",
          "Biotechnologies : PCR, OGM, applications médicales"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
          "L'État", "L'art et le réel", "Le travail",
          "Langage et communication", "Nature et culture",
          "La liberté", "Conscient et inconscient", "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Dissertation ou explication de texte.",
        pointsCles: ["Méthode dissertation", "Liberté, État, Travail"]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé fidèle", "Commentaire composé", "Dissertation"]
      },
      "Histoire": {
        chapitres: [
          "Les causes générales de la décolonisation",
          "La décolonisation au Proche-Orient",
          "La décolonisation au Maghreb",
          "La décolonisation en Asie",
          "Les formes de décolonisation",
          "Les relations Est-Ouest et la Guerre Froide",
          "La Chine de 1975 aux années 1990",
          "Méthodologie de dissertation", "Autre"
        ],
        examFormat: "Épreuve 3h (Hist-Géo, coef 2). Dissertation ou commentaire de document.",
        pointsCles: ["Décolonisation", "Guerre Froide", "Commentaire de document"]
      },
      "Géographie": {
        chapitres: [
          "Le système-monde", "L'espace Nord-Américain",
          "L'espace européen", "L'Asie-Pacifique",
          "L'Amérique latine : Brésil",
          "L'Afrique", "Le Sénégal", "Autre"
        ],
        examFormat: "Épreuve 3h (Hist-Géo, coef 2). Composition ou commentaire de document.",
        pointsCles: ["Commentaire de carte", "Développement Afrique/Sénégal"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Grammar: passive, reported speech, conditionals",
          "Vocabulary: sciences, environment, society",
          "Writing: essay, formal letter", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices + production écrite.",
        pointsCles: ["Compréhension de texte", "Passif, discours rapporté", "Production écrite"]
      }
    },

    /* ── Série S3 (Sciences techniques industrielles) ── */
    "S3": {
      "Mathématiques": {
        chapitres: [
          "Barycentre de points pondérés",
          "Géométrie plane : calcul vectoriel, isométries, similitudes",
          "Produit scalaire et applications",
          "Courbes paramétrées",
          "Coniques : ellipse, parabole, hyperbole",
          "Géométrie dans l'espace : vecteurs, plans, droites",
          "Probabilités et dénombrement : loi binomiale",
          "Nombres complexes : forme algébrique, trigonométrique, exponentielle",
          "Systèmes d'équations linéaires",
          "Arithmétique : PGCD, congruences",
          "Suites numériques : convergence, récurrence",
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonctions logarithme et exponentielle",
          "Calcul intégral : primitives, applications géométriques",
          "Équations différentielles linéaires",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Problème d'analyse + exercice de géométrie/probabilités.",
        pointsCles: [
          "Étude de fonctions (ln, exp, dérivée, variations)",
          "Calcul intégral : primitives, aires",
          "Nombres complexes : opérations, forme trigonométrique",
          "Probabilités : loi binomiale, espérance",
          "Suites : terme général, récurrence"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique du point : vitesse, accélération, chute libre",
          "Bases de la dynamique : lois de Newton",
          "Applications : plan incliné, pendule, satellite",
          "Gravitation universelle",
          "Champ magnétique : propriétés, sources",
          "Mouvement d'une particule chargée dans un champ magnétique",
          "Loi de Laplace : force sur un conducteur",
          "Induction magnétique : dipôle RL",
          "Dipôle RC : charge et décharge",
          "Oscillations électriques libres et forcées (RLC)",
          "Oscillations mécaniques libres (pendule, ressort)",
          "Interférences lumineuses : fentes de Young",
          "Effet photoélectrique",
          "Niveaux d'énergie de l'atome : spectre de l'hydrogène",
          "Réactions nucléaires : fission, fusion, radioactivité",
          "Alcools : nomenclature, propriétés, réactions",
          "Amines : nomenclature, basicité",
          "Acides carboxyliques et dérivés : estérification",
          "Cinétique chimique : vitesse, facteurs",
          "Autoprotolyse de l'eau, pH, indicateurs colorés",
          "Réactions acide-base : dosage",
          "Acides alpha-aminés et stéréochimie",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Problème de physique (10 pts) + Problème de chimie (10 pts).",
        pointsCles: [
          "Lois de Newton : équation du mouvement",
          "Circuits RLC : oscillations, résonance",
          "Réactions nucléaires : écriture et bilan énergétique",
          "Titrages acido-basiques",
          "Interférences lumineuses : calcul de λ"
        ]
      },
      "Construction Mécanique": {
        chapitres: [
          "C1T : Conception de liaison pivot par roulement",
          "C2T : Introduction à la transmission de puissance",
          "C3T : Roues de friction",
          "C4T : Engrenages",
          "C5T : Transmission par liens flexibles",
          "C6T : Variateurs de vitesses",
          "C7T : Réducteurs et boîtes de vitesses",
          "C8T : Accouplements",
          "C9T : Systèmes de transformation de mouvement",
          "C10T : Hydraulique et pneumatique",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Dossier technique avec analyse de solutions constructives.",
        pointsCles: [
          "Liaisons mécaniques et guidage en rotation",
          "Transmissions de puissance (engrenages, courroies, chaînes)",
          "Réducteurs : rapport de réduction, rendement",
          "Systèmes bielle-manivelle, vis-écrou",
          "Circuits hydrauliques et pneumatiques"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
          "L'État", "L'art et le réel", "Le travail",
          "Langage et communication", "Nature et culture",
          "La liberté", "Conscient et inconscient", "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Dissertation ou explication de texte.",
        pointsCles: ["Méthode dissertation", "Liberté, État, Travail"]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte littéraire + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: sciences, technology, environment",
          "Grammar: all tenses, passive, reported speech",
          "Conditionals", "Modal verbs",
          "Writing: essay, formal letter", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices de langue + production écrite.",
        pointsCles: ["Compréhension de texte", "Passif", "Production écrite"]
      }
    },

    /* ── Série S4 (Sciences agro-environnementales) ── */
    "S4": {
      "Mathématiques": {
        chapitres: [
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonction réciproque d'une fonction bijective",
          "Fonctions logarithme et exponentielle",
          "Fonctions puissances et irrationnelles",
          "Primitives et calcul intégral : définition, propriétés",
          "Applications du calcul intégral (aires, volumes)",
          "Équations différentielles du 1er ordre",
          "Suites numériques : convergence, limites",
          "Probabilités : dénombrement, loi binomiale, espérance",
          "Statistiques à deux variables : corrélation, régression linéaire",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Exercices d'analyse (fonctions, intégrales) + probabilités/statistiques.",
        pointsCles: [
          "Étude de fonctions (ln, exp) : dérivée, variations, tableau",
          "Calcul intégral : primitives, aires entre deux courbes",
          "Probabilités : loi binomiale, espérance, variance",
          "Statistiques à deux variables : droite de régression",
          "Suites : terme général, convergence"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique du point : vitesse, accélération, mouvements",
          "Bases de la dynamique : lois de Newton",
          "Applications : plan incliné, pendule, satellite",
          "Gravitation universelle",
          "Champ magnétique : propriétés, sources",
          "Induction magnétique : dipôle RL",
          "Dipôle RC : charge et décharge",
          "Oscillations électriques et mécaniques",
          "Réactions nucléaires : radioactivité, fission, fusion",
          "Alcools : propriétés, nomenclature, réactions",
          "Acides carboxyliques et dérivés : estérification",
          "Réactions acide-base : pH, dosage",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Problème de physique + problème de chimie.",
        pointsCles: [
          "Lois de Newton : équations du mouvement",
          "Radioactivité : lois de conservation, demi-vie",
          "Circuits RC/RL : charge, décharge, constante de temps",
          "Estérification : équilibre, rendement",
          "Titrages acido-basiques"
        ]
      },
      "SVT": {
        chapitres: [
          "Organisation du système nerveux cérébro-spinal",
          "Tissu nerveux : neurone, propriétés, influx nerveux",
          "Activité cardiaque et régulation de la pression artérielle",
          "Immunologie : réponse immunitaire, vaccins",
          "Régulation de la glycémie : insuline, glucagon, diabète",
          "Milieu intérieur : rein, homéostasie",
          "Reproduction chez les mammifères",
          "Génétique : lois de Mendel, hérédité",
          "Hérédité humaine : maladies héréditaires",
          "Notions fondamentales d'écologie : biocénose, biotope",
          "Les ressources naturelles et leur gestion durable",
          "L'aménagement de l'espace : agriculture durable",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Exercice 1 (biologie : physiologie, immunologie) + Exercice 2 (écologie, agronomie). Documents à exploiter.",
        pointsCles: [
          "Transmission de l'influx nerveux : synapse, neurotransmetteurs",
          "Immunité spécifique et non spécifique",
          "Génétique mendélienne : croisements mono et dihybrides",
          "Régulation glycémique : rôle pancréas et foie",
          "Écologie : cycles biogéochimiques, ressources naturelles"
        ]
      },
      "Phyto-technique": {
        chapitres: [
          "Le sol : composition, propriétés physico-chimiques, fertilité",
          "Les plantes cultivées : principales cultures du Sénégal",
          "Techniques de semis et de plantation",
          "Irrigation et gestion de l'eau agricole",
          "Engrais et fertilisation des sols",
          "Protection des cultures : maladies, ravageurs, pesticides",
          "Production végétale : céréales, légumineuses, tubercules",
          "L'horticulture : maraîchage et arboriculture fruitière",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Analyse de situation agronomique, exploitation de données techniques.",
        pointsCles: [
          "Fertilité du sol et correction des déficiences",
          "Calendrier cultural des principales cultures sénégalaises",
          "Techniques d'irrigation : goutte-à-goutte, aspersion",
          "Lutte intégrée contre les ravageurs",
          "Calcul de doses d'engrais et de rendement"
        ]
      },
      "Écologie et Environnement": {
        chapitres: [
          "Notions fondamentales d'écologie : écosystème, biome",
          "Chaînes alimentaires et réseaux trophiques",
          "Cycles biogéochimiques : carbone, azote, eau",
          "Biodiversité : définition, niveaux, menaces",
          "La dégradation des écosystèmes : désertification, déforestation",
          "Les ressources naturelles renouvelables et non renouvelables",
          "La gestion durable de l'environnement",
          "Changements climatiques : causes, conséquences, adaptation",
          "Législation environnementale au Sénégal",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 4). Étude de cas environnemental avec exploitation de données.",
        pointsCles: [
          "Structure et fonctionnement d'un écosystème",
          "Impact de l'agriculture sur l'environnement",
          "Désertification au Sénégal : causes et solutions",
          "Biodiversité : menaces et conservation",
          "Développement durable : principes et applications"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
          "L'État", "L'art et le réel", "Le travail",
          "Langage et communication", "Nature et culture",
          "La liberté", "Conscient et inconscient", "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Dissertation ou explication de texte.",
        pointsCles: ["Méthode dissertation", "Liberté, État, Travail", "Nature et culture"]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte littéraire + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: environment, agriculture, sciences",
          "Grammar: all tenses, passive, reported speech",
          "Conditionals", "Modal verbs",
          "Writing: essay, formal letter", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices de langue + production écrite.",
        pointsCles: ["Compréhension de texte", "Passif", "Production écrite"]
      }
    },

    /* ── Série S5 (Sciences de l'alimentation et de la nutrition) ── */
    "S5": {
      "Mathématiques": {
        chapitres: [
          "Fonctions numériques : limites, dérivation, étude",
          "Fonctions logarithme et exponentielle",
          "Primitives et calcul intégral",
          "Équations différentielles du 1er ordre",
          "Suites numériques",
          "Probabilités : dénombrement, loi binomiale",
          "Statistiques à deux variables : corrélation, régression",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Exercices d'analyse et de statistiques.",
        pointsCles: [
          "Étude de fonctions (ln, exp)",
          "Calcul intégral : primitives et aires",
          "Probabilités : loi binomiale",
          "Statistiques : régression linéaire"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique et dynamique : lois de Newton",
          "Thermodynamique : chaleur, échanges thermiques, calorimétrie",
          "Réactions chimiques : cinétique, catalyse",
          "Acides et bases : pH, dosage, solutions tampons",
          "Oxydoréduction : piles électrochimiques",
          "Glucides : structure, propriétés chimiques",
          "Lipides : structure, propriétés, saponification",
          "Protéines : acides aminés, liaisons peptidiques",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Problème de physique-chimie + chimie organique (alimentation).",
        pointsCles: [
          "Calorimétrie : calculs de chaleur échangée",
          "Dosages acido-basiques et pH",
          "Glucides : hydrolyse de l'amidon",
          "Lipides : saponification, indice d'acide",
          "Protéines : structure et dénaturation"
        ]
      },
      "SVT": {
        chapitres: [
          "Digestion et absorption des nutriments",
          "Alimentation et besoins nutritionnels de l'homme",
          "Régulation de la glycémie : insuline, glucagon",
          "Immunologie : défenses de l'organisme",
          "Microbiologie alimentaire : bactéries, levures, moisissures",
          "Fermentations : lactique, alcoolique",
          "Hygiène alimentaire et maladies d'origine alimentaire (TIAC)",
          "Génétique : hérédité et mutations",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Exercices sur la physiologie digestive, microbiologie et nutrition.",
        pointsCles: [
          "Besoins nutritionnels : protéines, glucides, lipides, vitamines",
          "Fermentations : conditions, micro-organismes, produits",
          "Hygiène HACCP : points critiques de contrôle",
          "Immunité et défenses contre les agents pathogènes",
          "Régulation glycémique et diabète"
        ]
      },
      "Techniques de transformation et de conservation": {
        chapitres: [
          "Composition et valeur nutritive des aliments",
          "Altération des aliments : causes microbiologiques, enzymatiques",
          "Techniques de conservation par la chaleur : pasteurisation, stérilisation",
          "Conservation par le froid : réfrigération, congélation",
          "Conservation par déshydratation : séchage, lyophilisation",
          "Conservation par le sel, le sucre, les acides (fermentation)",
          "Conditionnement et emballage des aliments",
          "Procédés de transformation des céréales et légumineuses",
          "Transformation laitière : pasteurisation, fromage, yaourt",
          "Transformation de la viande et du poisson",
          "Contrôle de qualité et analyse sensorielle",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Analyse de procédés de transformation/conservation + données techniques.",
        pointsCles: [
          "Traitements thermiques : pasteurisation (72°C/15s), stérilisation (121°C)",
          "Chaîne du froid : températures de conservation",
          "Activité de l'eau (aw) et conservation",
          "Fermentations lactique et alcoolique",
          "Normes d'hygiène et HACCP"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
          "L'État", "Le travail", "Langage et communication",
          "Nature et culture", "La liberté", "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Dissertation ou explication de texte.",
        pointsCles: ["Méthode dissertation", "Liberté, État, Travail"]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: food, health, environment",
          "Grammar: tenses, passive, reported speech",
          "Conditionals", "Writing: essay, formal letter", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices + production écrite.",
        pointsCles: ["Compréhension de texte", "Passif", "Production écrite"]
      }
    },

    /* ── Série F6 (Chimie industrielle) ── */
    "F6": {
      "Mathématiques": {
        chapitres: [
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonctions logarithme et exponentielle",
          "Calcul intégral : primitives, intégrales définies",
          "Équations différentielles linéaires du 1er ordre",
          "Nombres complexes : forme algébrique, trigonométrique, exponentielle",
          "Géométrie dans l'espace : produit scalaire, produit vectoriel",
          "Statistiques à deux variables : corrélation, régression linéaire",
          "Probabilités : dénombrement, loi binomiale",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Exercices de calcul différentiel, intégral + statistiques.",
        pointsCles: [
          "Primitives et équations différentielles (applications en chimie)",
          "Nombres complexes : forme exponentielle",
          "Statistiques : corrélation et régression (traitement de données exp.)",
          "Calcul intégral : intégrale définie et ses applications",
          "Fonctions ln et exp : propriétés et dérivées"
        ]
      },
      "Physique": {
        chapitres: [
          "Électrostatique : loi de Coulomb, champ électrique",
          "Courant électrique : loi d'Ohm, puissance, énergie",
          "Circuits en régime continu : lois de Kirchhoff",
          "Électromagnétisme : champ magnétique, induction",
          "Dipôle RC et RL : régime transitoire",
          "Oscillations électriques libres et forcées (RLC)",
          "Thermodynamique : chaleur, dilatation, états de la matière",
          "Optique : réflexion, réfraction, lentilles",
          "Mécanique des fluides : pression, écoulement",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Problème de physique (électricité + thermodynamique).",
        pointsCles: [
          "Lois de Kirchhoff : calcul de courants et tensions",
          "Circuits RC/RL : constante de temps, régime transitoire",
          "Thermodynamique : bilan énergétique",
          "Optique : construction d'images, lentilles convergentes",
          "Mécanique des fluides : poussée d'Archimède, Bernoulli"
        ]
      },
      "Chimie": {
        chapitres: [
          "Cinétique chimique : vitesse de réaction, facteurs, catalyse",
          "Équilibres chimiques : loi d'action de masse, Kéq",
          "Acides et bases : théorie de Brønsted, pH, dosages",
          "Oxydoréduction : potentiels d'électrode, piles, électrolyse",
          "Chimie des solutions : solubilité, produit de solubilité",
          "Chimie organique : nomenclature générale, isomérie",
          "Alcools, aldéhydes, cétones : propriétés et réactions",
          "Acides carboxyliques et dérivés : estérification, amidification",
          "Amines et acides aminés : propriétés acido-basiques",
          "Polymères : polyaddition, polycondensation",
          "Chimie industrielle : procédés Haber, Contact, Solvay",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 5). Problème de chimie générale + chimie organique.",
        pointsCles: [
          "Cinétique : loi de vitesse, énergie d'activation (Arrhenius)",
          "Équilibres : calcul de Kéq, déplacement d'équilibre (Le Chatelier)",
          "Oxydoréduction : équations redox, électrolyse",
          "Estérification : rendement, catalyse, facteurs",
          "Polymérisation : monomère, motif, degré de polymérisation"
        ]
      },
      "TP de Chimie": {
        chapitres: [
          "Techniques de base : filtration, distillation, recristallisation",
          "Dosages acido-basiques : courbes de neutralisation",
          "Dosages par oxydoréduction : permanganométrie, iodométrie",
          "Synthèse organique : estérification, saponification",
          "Identification de groupes fonctionnels",
          "Chromatographie sur couche mince (CCM)",
          "Spectrophotométrie et colorimétrie",
          "Mesure de pH et conductimétrie",
          "Autre"
        ],
        examFormat: "TP pratique de 4h (coef 3). Manipulation + compte-rendu expérimental.",
        pointsCles: [
          "Dosage acido-basique : point d'équivalence",
          "Synthèse organique : calcul de rendement",
          "Identification de fonctions chimiques : tests caractéristiques",
          "Lecture et interprétation d'une courbe de dosage",
          "Rédaction d'un protocole expérimental"
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: science, industry, technology",
          "Grammar: tenses, passive, reported speech",
          "Conditionals", "Writing: essay, formal letter", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices + production écrite.",
        pointsCles: ["Compréhension de texte", "Passif", "Production écrite"]
      }
    },

    /* ── Série T1 (Génie mécanique) ── */
    "T1": {
      "Mathématiques": {
        chapitres: [
          "Nombres complexes : forme algébrique, trigonométrique, exponentielle",
          "Racines n-ièmes, équations dans C",
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonctions logarithme, exponentielle et puissances",
          "Calcul intégral : primitives, intégrales, applications",
          "Équations différentielles linéaires du 1er ordre",
          "Géométrie dans l'espace : vecteurs, produit scalaire, produit vectoriel",
          "Produit mixte, volumes dans l'espace",
          "Statistiques à deux variables : corrélation, régression",
          "Probabilités : loi binomiale, espérance",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Exercices de calcul (analyse, géométrie) + statistiques.",
        pointsCles: [
          "Nombres complexes : forme exponentielle, formules d'Euler",
          "Étude de fonctions (dérivée, variations, tableau de signe)",
          "Calcul intégral : primitives et intégrales définies",
          "Produit scalaire et vectoriel : applications géométriques",
          "Équations différentielles : applications en mécanique/électricité"
        ]
      },
      "Mécanique": {
        chapitres: [
          "Cinématique du point : position, vitesse, accélération",
          "Cinématique du solide : translations, rotations",
          "Dynamique : 2ème loi de Newton, équation du mouvement",
          "Statique : équilibre des solides, conditions d'équilibre",
          "Frottement : glissement, roulement",
          "Travail et puissance : rendement des mécanismes",
          "Énergie cinétique et théorème de l'énergie cinétique",
          "Résistance des matériaux : traction, compression, flexion",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Problème de statique ou de dynamique avec application technique.",
        pointsCles: [
          "Équilibre d'un solide : bilan des forces, théorème des moments",
          "Cinématique : calcul de vitesses et d'accélérations",
          "Dynamique : application des lois de Newton",
          "Travail, puissance, rendement",
          "RDM : contrainte normale, flèche en flexion"
        ]
      },
      "Construction Mécanique": {
        chapitres: [
          "Dessin technique : lecture et interprétation de plans",
          "Cotation fonctionnelle et tolérances dimensionnelles",
          "Liaisons mécaniques : nature, représentation normalisée",
          "Guidage en rotation : roulements, paliers lisses",
          "Guidage en translation : glissières, rails",
          "Transmissions de puissance : engrenages, courroies, chaînes",
          "Réducteurs : rapport de réduction, rendement",
          "Systèmes bielle-manivelle, vis-écrou, came",
          "Étanchéité, lubrification, maintenance",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Dossier technique avec analyse de solutions constructives et dessin.",
        pointsCles: [
          "Lecture de plans : vues, coupes, sections",
          "Liaisons mécaniques : identification et représentation",
          "Calcul du rapport de réduction d'un engrenage",
          "Roulements : choix selon effort et vitesse",
          "Cotation : ajustement, tolérance, jeu"
        ]
      },
      "Analyse de fabrication et Étude d'outillage": {
        chapitres: [
          "Processus de fabrication : gamme d'usinage",
          "Mise en position (MIP) et maintien en position (MAP)",
          "Les opérations d'usinage : tournage, fraisage, perçage",
          "Outillage de coupe : géométrie des outils, matériaux",
          "Porte-pièces et porte-outils",
          "Contrôle dimensionnel : instruments de mesure",
          "Assemblage et montage : conditions de serrage",
          "Moulage et fonderie : procédés de base",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 4). Analyse d'un processus de fabrication + étude d'outillage sur dossier.",
        pointsCles: [
          "Gamme d'usinage : ordre des opérations, choix des surfaces de référence",
          "MIP/MAP : isostatisme, mécanismes de bridage",
          "Géométrie des outils : angles de coupe, dépouille",
          "Contrôle : micromètre, pied à coulisse, calibres",
          "Tolérances géométriques : planéité, cylindricité, perpendicularité"
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: technology, mechanics, industry",
          "Grammar: tenses, passive, reported speech",
          "Conditionals", "Writing: essay, technical text", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices + production écrite.",
        pointsCles: ["Compréhension de texte technique", "Passif", "Production écrite"]
      }
    },

    /* ── Série T2 (Génie électronique/électrotechnique) ── */
    "T2": {
      "Mathématiques": {
        chapitres: [
          "Nombres complexes : formes algébrique, trigonométrique, exponentielle",
          "Racines n-ièmes d'un nombre complexe",
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonctions logarithme, exponentielle et puissances",
          "Calcul intégral : primitives, intégrales définies",
          "Équations différentielles linéaires du 1er et 2ème ordre",
          "Géométrie dans l'espace : produit scalaire, produit vectoriel",
          "Statistiques à deux variables : corrélation, régression",
          "Probabilités : loi binomiale, espérance",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 4). Exercices de calcul (analyse, nombres complexes) + statistiques.",
        pointsCles: [
          "Nombres complexes : forme exponentielle (applications circuits AC)",
          "Équations différentielles : régimes transitoires",
          "Calcul intégral : primitives et applications",
          "Probabilités : loi binomiale",
          "Statistiques : régression linéaire"
        ]
      },
      "Construction Électromécanique": {
        chapitres: [
          "Moteurs électriques à courant continu : principe, courbes caractéristiques",
          "Moteurs asynchrones triphasés : principe, glissement",
          "Transformateurs : principe, rapport de transformation, pertes",
          "Générateurs : alternateurs, dynamos",
          "Démarrage des moteurs : étoile-triangle, variateurs",
          "Protection des moteurs : disjoncteurs, fusibles, relais thermiques",
          "Variateurs de vitesse : convertisseurs de fréquence",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Problème sur les machines électriques avec calculs.",
        pointsCles: [
          "Moteur asynchrone : couple, vitesse, glissement",
          "Transformateur : rapport de transformation, rendement",
          "Démarrage étoile-triangle : courant, couple de démarrage",
          "Moteur DC : courbes caractéristiques (couple-vitesse)",
          "Protection : calcul du courant de court-circuit"
        ]
      },
      "Électronique et Électrotechnique": {
        chapitres: [
          "Les composants électroniques : diodes, transistors, thyristors",
          "Redressement : monophasé et triphasé, pont de diodes",
          "Amplificateurs opérationnels : montages fondamentaux",
          "Filtres électroniques : RC, LC, passe-bas, passe-haut",
          "Régulation : boucles ouvertes et fermées",
          "Circuits triphasés : étoile, triangle, puissances",
          "Compensation d'énergie réactive : facteur de puissance",
          "Distribution électrique : câbles, protections, normes",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 5). Problème d'électronique + électrotechnique avec calculs et schémas.",
        pointsCles: [
          "Redressement : tension ondulée, valeur moyenne",
          "Amplificateur opérationnel : montages inverseur et non-inverseur",
          "Circuits triphasés : puissance active, réactive, apparente",
          "Facteur de puissance : cos φ, compensation par condensateurs",
          "Transistor en régime de commutation (saturé/bloqué)"
        ]
      },
      "Schéma Automatique et Informatique": {
        chapitres: [
          "Analyse fonctionnelle : FAST, SADT, GRAFCET",
          "Logique combinatoire : algèbre de Boole, tables de vérité",
          "Logique séquentielle : bascules, compteurs, registres",
          "Automates programmables industriels (API) : structure, programmation",
          "Capteurs et actionneurs : classification, caractéristiques",
          "Systèmes asservis en boucle fermée : régulateurs PID",
          "Réseaux de communication industriels : protocoles",
          "Informatique : algorithmes, programmation de base",
          "Autre"
        ],
        examFormat: "Épreuve technique de 4h (coef 4). Analyse d'un système automatisé + GRAFCET + programmation API.",
        pointsCles: [
          "GRAFCET : étapes, transitions, divergences",
          "Algèbre de Boole : simplification, logigramme",
          "API : structure, langage ladder, FBD",
          "Asservissement : erreur statique, régulateur P, PI, PID",
          "Capteurs : tout ou rien, analogiques, numériques"
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: electronics, computing, automation",
          "Grammar: tenses, passive, reported speech",
          "Conditionals", "Writing: essay, technical text", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices + production écrite.",
        pointsCles: ["Compréhension de texte technique", "Passif", "Production écrite"]
      }
    },

    /* ── Série G (Gestion/Économie) ── */
    "G": {
      "Mathématiques": {
        chapitres: [
          "Calculs numériques : équations, inéquations, systèmes",
          "Statistique : série statistique, caractéristiques de position et de dispersion",
          "Dénombrement : principes de multiplication et addition",
          "Géométrie analytique : vecteurs, équations de droites",
          "Algèbre linéaire : systèmes, programmation linéaire",
          "Analyse : trinôme du second degré, fonctions polynômes",
          "Fonctions logarithme et exponentielle",
          "Suites arithmétiques et géométriques",
          "Mathématiques financières : intérêts, annuités, emprunts",
          "Autre"
        ],
        examFormat: "Épreuve de 3h (coef 4). Exercice 1 (statistiques/probabilités), Exercice 2 (analyse/algèbre), Problème (programmation linéaire ou mathématiques financières).",
        pointsCles: [
          "Programmation linéaire : modélisation et résolution graphique",
          "Mathématiques financières : intérêts composés, valeur actuelle",
          "Suites géométriques et arithmétiques : applications économiques",
          "Statistiques : variance, écart-type, corrélation",
          "Résolution de systèmes linéaires"
        ]
      },
      "Économie Générale": {
        chapitres: [
          "Éléments de comptabilité nationale : comptes d'opération, TES, TEE",
          "La répartition des revenus : formes, théories, inégalités",
          "La consommation des ménages : déterminants, comportement",
          "L'épargne des ménages : définition, formes, déterminants",
          "L'investissement : types, mesure, déterminants, effets",
          "Monnaie et crédit : formes, fonctions, masse monétaire",
          "Institutions financières au Sénégal (BCEAO, banques)",
          "Méthodologie : commentaire dirigé de tableau statistique",
          "Autre"
        ],
        examFormat: "Épreuve de 3h (coef 4). Exercice de calcul/comptabilité nationale (10 pts) + commentaire dirigé de tableau statistique (10 pts).",
        pointsCles: [
          "Comptes d'opération des secteurs institutionnels",
          "Calcul et interprétation du multiplicateur keynésien",
          "Déterminants de la consommation (Keynes, Friedman)",
          "Création monétaire par les banques",
          "Méthode du commentaire dirigé de tableau statistique"
        ]
      },
      "Étude de Cas": {
        chapitres: ["Autre"],
        examFormat: "Épreuve pratique de gestion d'entreprise.",
        pointsCles: []
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
          "L'État", "Le travail", "Langage et communication",
          "Nature et culture", "La liberté", "Individu et société",
          "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Dissertation ou explication de texte.",
        pointsCles: ["Méthode dissertation", "Liberté, État, Travail"]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ],
        examFormat: "Épreuve de 4h (coef 2). Texte + résumé + commentaire + questions de langue.",
        pointsCles: ["Résumé (1/4)", "Commentaire composé", "Dissertation littéraire"]
      },
      "Anglais": {
        chapitres: [
          "Reading comprehension", "Vocabulary: business, economics, management",
          "Grammar: tenses, passive, reported speech",
          "Conditionals", "Modal verbs",
          "Writing: formal letter, business report", "Autre"
        ],
        examFormat: "Épreuve de 2h (coef 2). Compréhension + exercices de langue + production écrite.",
        pointsCles: ["Compréhension de texte", "Passif", "Lettre formelle/commerciale"]
      }
    }
  }
};

/* ══════════════════════════════════════════════════════════
   Fonctions utilitaires
══════════════════════════════════════════════════════════ */

export function getMatieres(examen: string, serie?: string): string[] {
  if (examen === "BFEM") return Object.keys(PROGRAMMES.BFEM);
  if (!serie) return [];
  const serieData = PROGRAMMES.BAC[serie as keyof typeof PROGRAMMES.BAC];
  if (!serieData) return [];
  return Object.keys(serieData);
}

export function getChapitres(examen: string, serie: string, matiere: string): string[] {
  if (examen === "BFEM") {
    const m = PROGRAMMES.BFEM[matiere as keyof typeof PROGRAMMES.BFEM];
    return m?.chapitres ?? ["Autre"];
  }
  const serieData = PROGRAMMES.BAC[serie as keyof typeof PROGRAMMES.BAC];
  if (!serieData) return ["Autre"];
  const matiereData = (serieData as Record<string, ProgrammeMatiere>)[matiere];
  return matiereData?.chapitres ?? ["Autre"];
}

export function getMatiereData(examen: string, serie: string, matiere: string): ProgrammeMatiere | null {
  if (examen === "BFEM") {
    return PROGRAMMES.BFEM[matiere as keyof typeof PROGRAMMES.BFEM] ?? null;
  }
  const serieData = PROGRAMMES.BAC[serie as keyof typeof PROGRAMMES.BAC];
  if (!serieData) return null;
  return (serieData as Record<string, ProgrammeMatiere>)[matiere] ?? null;
}

export function getProgramme(examen: string, serie: string, matiere: string, chapitre?: string): string {
  const data = getMatiereData(examen, serie, matiere);
  const chapitres = data?.chapitres ?? ["Autre"];
  const examFormat = data?.examFormat ? ` | Format: ${data.examFormat}` : "";
  const pointsCles = data?.pointsCles?.length
    ? ` | Points souvent évalués: ${data.pointsCles.join(", ")}`
    : "";
  return `Matière: ${matiere} | Série: ${serie} | Examen: ${examen}${chapitre ? ` | Chapitre: ${chapitre}` : ""} | Chapitres: ${chapitres.filter(c => c !== "Autre").join(", ")}${examFormat}${pointsCles}`;
}

export const MATIERES_BY_SERIE = PROGRAMMES;
