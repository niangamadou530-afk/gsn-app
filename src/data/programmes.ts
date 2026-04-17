/**
 * Programmes officiels BAC et BFEM sénégalais
 * Source: Office du Baccalauréat du Sénégal
 */

export type ProgrammeMatiere = {
  chapitres: string[];
};

export const PROGRAMMES: {
  BFEM: Record<string, ProgrammeMatiere>;
  BAC: Record<string, Record<string, ProgrammeMatiere>>;
} = {

  BFEM: {
    "Mathématiques": {
      chapitres: [
        "Racine carrée",
        "Calcul algébrique",
        "Équation et inéquation à une seule inconnue",
        "Statistique",
        "Application affine et application affine par intervalle",
        "Équations et inéquations du 1er degré à deux inconnues",
        "Vecteurs",
        "Repérage dans le plan",
        "Relations trigonométriques dans un triangle rectangle",
        "Théorème de Thalès",
        "Angle inscrit et angle au centre",
        "Géométrie dans l'espace",
        "Construction de triangles",
        "Partage d'un segment en trois parties égales",
        "Comment montrer qu'un quadrilatère est un parallélogramme",
        "Autre"
      ]
    },
    "Sciences Physiques": {
      chapitres: [
        "Les lentilles minces",
        "Dispersion de la lumière blanche",
        "Notions de force",
        "Équilibre d'un solide soumis à l'action de deux forces",
        "Principes des actions réciproques",
        "Électrisation par frottement",
        "Le courant électrique",
        "La résistance électrique",
        "La loi d'Ohm",
        "Énergie et rendement",
        "La calorimétrie",
        "Notions de solutions",
        "Solutions acides et solutions basiques",
        "Les métaux : action de l'air et combustion",
        "Les hydrocarbures",
        "Action à froid des acides dilués sur les métaux usuels",
        "Autre"
      ]
    },
    "SVT": {
      chapitres: [
        "Le système nerveux",
        "L'étude de la vision",
        "La respiration chez l'espèce humaine",
        "Les phénomènes énergétiques accompagnant la respiration",
        "La fermentation : un autre moyen de se procurer de l'énergie",
        "Le rôle du rein dans l'excrétion urinaire et la régulation du milieu intérieur",
        "L'immunité et la réponse immunitaire",
        "Les groupes sanguins",
        "Aide à l'immunité",
        "Dysfonctionnement du système immunitaire : VIH/SIDA",
        "La tectonique des plaques",
        "La formation des roches métamorphiques",
        "Le cycle des roches",
        "La chronologie en géologie",
        "Autre"
      ]
    },
    "Histoire": {
      chapitres: [
        "L'impérialisme japonais",
        "L'impérialisme européen en Asie",
        "La première guerre mondiale : causes et conséquences",
        "Les relations Est-Ouest de 1945 aux années 90",
        "Les rivalités coloniales : le Congrès de Berlin et ses conséquences",
        "Les découvertes scientifiques et les mutations économiques",
        "Le développement du capitalisme et les mutations sociales",
        "Les doctrines sociales : syndicalisme et socialisme",
        "Bandung et émergence du Tiers-monde",
        "Les systèmes coloniaux en Afrique : système français et britannique",
        "Les missions et les explorations",
        "L'impérialisme américain",
        "La décolonisation : causes et formes",
        "La révolution russe et la consolidation du régime",
        "La deuxième guerre mondiale : causes et conséquences",
        "La crise des années 30",
        "Le Sénégal : vie politique de 1944 à 1962",
        "Les résistances en Afrique : formes, exemples et bilan",
        "Autre"
      ]
    },
    "Géographie": {
      chapitres: [
        "La terre dans le système solaire",
        "Méthodologie de commentaire histoire et géographie",
        "Potentiel et équilibres",
        "La surexploitation des ressources et ses conséquences",
        "Les conséquences climatiques de l'exploitation économique de la planète",
        "Inégalités de développement",
        "Les systèmes économiques : structures économiques et sociales et leur évolution",
        "La coopération bilatérale",
        "La coopération multilatérale",
        "Les formes et problèmes de communication",
        "La Terre, un village planétaire",
        "Autre"
      ]
    },
    "Français": { chapitres: ["Autre"] },
    "Anglais": { chapitres: ["Autre"] },
    "Éducation Civique": { chapitres: ["Autre"] }
  },

  BAC: {
    "L": {
      "Mathématiques": {
        chapitres: [
          "Rappel des méthodes de factorisation d'un polynôme",
          "Composition de fonctions",
          "Compléments sur les limites et la continuité",
          "Dérivation",
          "Étude de fonctions",
          "Fonction logarithme népérien",
          "Suites numériques",
          "Fonction exponentielle",
          "Primitives et intégrales",
          "Dénombrement et probabilité",
          "Statistique à deux variables",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Production, transport, utilisation de l'énergie électrique",
          "Énergie nucléaire : réactions spontanées, fusion et fission",
          "Généralités sur les signaux et ondes mécaniques",
          "Aspect ondulatoire de la lumière",
          "Aspect corpusculaire de la lumière : dualité onde-corpuscule",
          "Matières plastiques",
          "Les textiles",
          "Les savons",
          "Les lessives, les antiseptiques et les désinfectants",
          "La pollution de l'air et de l'eau",
          "Autre"
        ]
      },
      "SVT": {
        chapitres: [
          "Tissu nerveux et ses propriétés",
          "Système nerveux et comportement moteur",
          "Activité cardiaque et régulation de la pression artérielle",
          "Immunologie",
          "Reproduction chez les mammifères",
          "Reproduction chez les spermaphytes",
          "Hérédité et génétique",
          "Hérédité humaine",
          "Régulation de la glycémie",
          "Milieu intérieur",
          "Activité du muscle squelettique",
          "Autre"
        ]
      },
      "Philosophie": {
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques (Métaphysique)",
          "Enjeux, perspectives et finalités de la philosophie",
          "L'État",
          "L'art et le réel",
          "Le travail",
          "Langage et communication",
          "Nature et culture",
          "La liberté",
          "Conscient et inconscient",
          "Individu et société",
          "Autre"
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme",
          "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman",
          "Esthétique des genres : Le théâtre",
          "La dissertation littéraire",
          "Le commentaire composé",
          "Le résumé de texte",
          "La littérature africaine et francophone",
          "Autre"
        ]
      },
      "Histoire": {
        chapitres: [
          "La décolonisation au Proche-Orient et la question palestinienne",
          "La décolonisation au Maghreb et en Algérie",
          "La décolonisation en Asie : Inde et Indochine",
          "Les causes générales de la décolonisation",
          "Les formes de décolonisation",
          "Les relations Est-Ouest et la guerre froide",
          "La Chine de 1975 aux années 1990",
          "Les conséquences de la guerre et le règlement du conflit",
          "Méthodologie de dissertation en histoire et géographie",
          "Autre"
        ]
      },
      "Géographie": {
        chapitres: [
          "Le Sénégal : problèmes économiques et politiques de développement",
          "Les problèmes et perspectives de développement du continent africain",
          "La Chine : problèmes démographiques et modèle économique",
          "Le modèle économique américain",
          "L'Amérique latine : présentation générale",
          "Le modèle économique japonais",
          "L'Asie-Pacifique : facteurs d'émergence",
          "L'espace Nord-Américain",
          "Le Brésil : une puissance du tiers-monde",
          "La construction européenne",
          "Le système-monde : des espaces interdépendants",
          "Autre"
        ]
      },
      "Anglais": { chapitres: ["Autre"] },
      "Économie Générale": {
        chapitres: [
          "Croissance et développement",
          "Investissement et progrès technique",
          "Répartition du revenu et inégalités",
          "Les échanges internationaux",
          "Les politiques économiques",
          "Autre"
        ]
      }
    },

    "S1": {
      "Mathématiques": {
        chapitres: [
          "Barycentre",
          "Géométrie plane : calcul vectoriel, isométrie, similitude, application affine",
          "Produit vectoriel et produit mixte",
          "Courbes paramétrées",
          "Coniques",
          "Géométrie dans l'espace",
          "Probabilité et dénombrement",
          "Nombres complexes",
          "Systèmes d'équations linéaires",
          "Arithmétique",
          "Suites numériques",
          "Fonctions numériques : généralités, exponentielle, logarithme, dérivation, primitives",
          "Calcul intégral",
          "Équations différentielles",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique du point",
          "Bases de la dynamique",
          "Applications des bases de la dynamique",
          "Gravitation universelle",
          "Généralités sur les champs magnétiques",
          "Mouvement d'une particule chargée dans un champ magnétique uniforme",
          "Loi de Laplace",
          "Induction magnétique : étude d'un dipôle (R, L)",
          "Étude du dipôle (R, C)",
          "Oscillations électriques libres et forcées",
          "Oscillations mécaniques libres",
          "Interférences lumineuses",
          "Effet photoélectrique",
          "Niveaux d'énergie de l'atome",
          "Réactions nucléaires",
          "Alcools",
          "Amines",
          "Acides carboxyliques et dérivés",
          "Cinétique chimique",
          "Autoprotolyse de l'eau, pH, indicateurs colorés",
          "Acide fort / Base forte : réaction et dosage",
          "Acides et bases faibles : constante d'acidité",
          "Réaction acide faible/base forte : effet tampon et dosage",
          "Acides alpha aminés et éléments de stéréochimie",
          "Autre"
        ]
      },
      "SVT": {
        chapitres: [
          "Tissu nerveux et ses propriétés",
          "Système nerveux et comportement moteur",
          "Activité cardiaque et régulation de la pression artérielle",
          "Immunologie",
          "Reproduction chez les mammifères",
          "Hérédité et génétique",
          "Hérédité humaine",
          "Régulation de la glycémie",
          "Milieu intérieur",
          "Activité du muscle squelettique",
          "Autre"
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
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme",
          "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman",
          "Esthétique des genres : Le théâtre",
          "La dissertation littéraire",
          "Le commentaire composé",
          "Le résumé de texte",
          "Autre"
        ]
      },
      "Histoire": {
        chapitres: [
          "La décolonisation au Proche-Orient et la question palestinienne",
          "La décolonisation au Maghreb et en Algérie",
          "La décolonisation en Asie : Inde et Indochine",
          "Les causes générales de la décolonisation",
          "Les formes de décolonisation",
          "Les relations Est-Ouest et la guerre froide",
          "La Chine de 1975 aux années 1990",
          "Méthodologie de dissertation",
          "Autre"
        ]
      },
      "Géographie": {
        chapitres: [
          "Le Sénégal : problèmes économiques et politiques de développement",
          "Les problèmes et perspectives de développement du continent africain",
          "La Chine : problèmes démographiques et modèle économique",
          "Le modèle économique américain",
          "Le modèle économique japonais",
          "L'Asie-Pacifique",
          "L'espace Nord-Américain",
          "La construction européenne",
          "Le système-monde",
          "Autre"
        ]
      },
      "Anglais": { chapitres: ["Autre"] }
    },

    "S2": {
      "Mathématiques": {
        chapitres: [
          "Fonctions numériques : logarithme et exponentielle",
          "Suites numériques",
          "Calcul intégral",
          "Équations différentielles linéaires",
          "Statistique",
          "Probabilité et dénombrement",
          "Nombres complexes",
          "Géométrie plane et dans l'espace",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        chapitres: [
          "Cinématique du point", "Bases de la dynamique",
          "Applications des bases de la dynamique", "Gravitation universelle",
          "Généralités sur les champs magnétiques",
          "Mouvement d'une particule chargée dans un champ magnétique uniforme",
          "Loi de Laplace", "Induction magnétique : étude d'un dipôle (R, L)",
          "Étude du dipôle (R, C)", "Oscillations électriques libres et forcées",
          "Oscillations mécaniques libres", "Interférences lumineuses",
          "Effet photoélectrique", "Niveaux d'énergie de l'atome",
          "Réactions nucléaires", "Alcools", "Amines",
          "Acides carboxyliques et dérivés", "Cinétique chimique",
          "Autoprotolyse de l'eau, pH, indicateurs colorés",
          "Acide fort / Base forte : réaction et dosage",
          "Acides et bases faibles : constante d'acidité",
          "Réaction acide faible/base forte : effet tampon et dosage",
          "Acides alpha aminés et éléments de stéréochimie",
          "Autre"
        ]
      },
      "SVT": {
        chapitres: [
          "Tissu nerveux et ses propriétés",
          "Système nerveux et comportement moteur",
          "Activité cardiaque et régulation de la pression artérielle",
          "Immunologie", "Reproduction chez les mammifères",
          "Reproduction chez les spermaphytes",
          "Hérédité et génétique", "Hérédité humaine",
          "Régulation de la glycémie", "Milieu intérieur",
          "Activité du muscle squelettique", "Biotechnologies",
          "Autre"
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
        ]
      },
      "Français": {
        chapitres: [
          "Le Surréalisme", "Esthétique des genres : La poésie",
          "Esthétique des genres : Le roman", "Esthétique des genres : Le théâtre",
          "La dissertation littéraire", "Le commentaire composé",
          "Le résumé de texte", "Autre"
        ]
      },
      "Histoire": {
        chapitres: [
          "La décolonisation au Proche-Orient et la question palestinienne",
          "La décolonisation au Maghreb et en Algérie",
          "La décolonisation en Asie : Inde et Indochine",
          "Les causes générales de la décolonisation",
          "Les formes de décolonisation",
          "Les relations Est-Ouest et la guerre froide",
          "La Chine de 1975 aux années 1990",
          "Méthodologie de dissertation", "Autre"
        ]
      },
      "Géographie": {
        chapitres: [
          "Le Sénégal : problèmes économiques et politiques de développement",
          "Les problèmes et perspectives de développement du continent africain",
          "La Chine : problèmes démographiques et modèle économique",
          "Le modèle économique américain", "Le modèle économique japonais",
          "L'Asie-Pacifique", "L'espace Nord-Américain",
          "La construction européenne", "Le système-monde", "Autre"
        ]
      },
      "Anglais": { chapitres: ["Autre"] }
    },

    "S3": {
      "Mathématiques": { chapitres: ["Autre"] },
      "Sciences Physiques": { chapitres: ["Autre"] },
      "Construction Mécanique": { chapitres: ["Autre"] },
      "Philosophie": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    },

    "S4": {
      "SVT": { chapitres: ["Autre"] },
      "Sciences Physiques": { chapitres: ["Autre"] },
      "Mathématiques": { chapitres: ["Autre"] },
      "Phyto-technique": { chapitres: ["Autre"] },
      "Écologie et Environnement": { chapitres: ["Autre"] },
      "Philosophie": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    },

    "S5": {
      "SVT": { chapitres: ["Autre"] },
      "Sciences Physiques": { chapitres: ["Autre"] },
      "Mathématiques": { chapitres: ["Autre"] },
      "Techniques de transformation et de conservation": { chapitres: ["Autre"] },
      "Philosophie": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    },

    "F6": {
      "Mathématiques": { chapitres: ["Autre"] },
      "Physique": { chapitres: ["Autre"] },
      "Chimie": { chapitres: ["Autre"] },
      "TP de Chimie": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    },

    "T1": {
      "Mathématiques": { chapitres: ["Autre"] },
      "Mécanique": { chapitres: ["Autre"] },
      "Construction Mécanique": { chapitres: ["Autre"] },
      "Analyse de fabrication et Étude d'outillage": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    },

    "T2": {
      "Mathématiques": { chapitres: ["Autre"] },
      "Construction Électromécanique": { chapitres: ["Autre"] },
      "Électronique et Électrotechnique": { chapitres: ["Autre"] },
      "Schéma Automatique et Informatique": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    },

    "G": {
      "Mathématiques": { chapitres: ["Autre"] },
      "Économie Générale": {
        chapitres: [
          "Croissance et développement",
          "Investissement et progrès technique",
          "Répartition du revenu et inégalités",
          "Les échanges internationaux",
          "Les politiques économiques",
          "Autre"
        ]
      },
      "Étude de Cas": { chapitres: ["Autre"] },
      "Philosophie": { chapitres: ["Autre"] },
      "Français": { chapitres: ["Autre"] },
      "Anglais": { chapitres: ["Autre"] }
    }
  }
};

export function getMatieres(examType: string, serie?: string): string[] {
  if (examType === "BFEM") return Object.keys(PROGRAMMES.BFEM);
  if (examType === "BAC" && serie && PROGRAMMES.BAC[serie]) {
    return Object.keys(PROGRAMMES.BAC[serie]);
  }
  return [];
}

export function getChapitres(examType: string, serie: string | undefined, matiere: string): string[] {
  if (examType === "BFEM") return PROGRAMMES.BFEM[matiere]?.chapitres ?? ["Autre"];
  if (examType === "BAC" && serie && PROGRAMMES.BAC[serie]) {
    return PROGRAMMES.BAC[serie][matiere]?.chapitres ?? ["Autre"];
  }
  return ["Autre"];
}
