/**
 * Programmes officiels BAC et BFEM sénégalais
 * Source: Ministère de l'Éducation du Sénégal
 */

export type ProgrammeMatiere = {
  coefficient?: number;
  duree_epreuve: string;
  hidden?: true;
  chapitres: string[];
  note?: string;
};

export const PROGRAMMES: {
  BFEM: Record<string, ProgrammeMatiere>;
  BAC: Record<string, Record<string, ProgrammeMatiere>>;
} = {

  BFEM: {
    "Mathématiques": {
      coefficient: 3,
      duree_epreuve: "2h",
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
        "Quadrilatères : parallélogramme, rectangle, losange, carré",
        "Autre"
      ]
    },
    "Sciences Physiques": {
      coefficient: 2,
      duree_epreuve: "2h",
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
      coefficient: 2,
      duree_epreuve: "2h",
      chapitres: [
        "Le système nerveux",
        "Étude de la vision",
        "La respiration chez l'espèce humaine",
        "Les phénomènes énergétiques accompagnant la respiration",
        "La fermentation : un autre moyen de se procurer de l'énergie",
        "Le rôle du rein dans l'excrétion urinaire et la régulation du milieu intérieur",
        "L'immunité et la réponse immunitaire",
        "Le système immunitaire",
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
      coefficient: 2,
      duree_epreuve: "2h",
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
      coefficient: 2,
      duree_epreuve: "2h",
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
    "Français": {
      coefficient: 4,
      duree_epreuve: "3h",
      chapitres: [
        "Lecture méthodique et analyse de textes",
        "Résumé de texte",
        "Dictée et orthographe",
        "Grammaire et conjugaison",
        "Expression écrite : rédaction et récit",
        "Vocabulaire et sens des mots",
        "Correspondance et lettre",
        "Textes littéraires africains et francophones",
        "Autre"
      ]
    },
    "Anglais": {
      coefficient: 2,
      duree_epreuve: "2h",
      chapitres: [
        "Compréhension écrite",
        "Vocabulaire en contexte",
        "Grammaire : temps verbaux",
        "Grammaire : modaux et auxiliaires",
        "Grammaire : passif et discours rapporté",
        "Expression écrite : lettre et essai court",
        "Civilisation anglophone",
        "Fonctions communicatives",
        "Thèmes : environnement, santé, éducation",
        "Thèmes : famille, société, travail",
        "Autre"
      ]
    },
    "Éducation Civique": {
      coefficient: 1,
      duree_epreuve: "1h",
      chapitres: [
        "Le milieu proche et les structures décentralisées",
        "Nation, Patrie et Citoyenneté",
        "Les institutions de la République du Sénégal",
        "Démocratie et Droits de l'Homme",
        "Paix, solidarité et développement",
        "L'Afrique face à ses défis",
        "Autre"
      ]
    }
  },

  BAC: {
    "L": {
      "Mathématiques": {
        duree_epreuve: "3h",
        hidden: true,
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
          "Statistique à deux variables (ajustement linéaire)",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        duree_epreuve: "2h",
        hidden: true,
        note: "Matière à option L2",
        chapitres: [
          "Production, transport et utilisation de l'énergie électrique",
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
        duree_epreuve: "2h",
        hidden: true,
        note: "Matière à option L2",
        chapitres: [
          "Organisation du système nerveux cérébro-spinal des mammifères",
          "Organisation de l'encéphale",
          "Organisation de la moelle épinière",
          "Activité cardiaque et régulation de la pression artérielle",
          "Régulation de la glycémie",
          "Système immunitaire",
          "Réponse immunitaire spécifique",
          "Infection à VIH/SIDA",
          "Reproduction chez les mammifères : gamétogenèse",
          "Reproduction chez les mammifères : fécondation",
          "Régulation du fonctionnement des appareils génitaux",
          "Hérédité humaine",
          "Autre"
        ]
      },
      "Philosophie": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Les origines et la spécificité de la philosophie par rapport aux mythes et religions",
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
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Le Surréalisme : Apollinaire, Aragon, Éluard, Césaire, Senghor",
          "Esthétique des genres : La poésie (Boileau, Hugo, La Fontaine, Senghor, David Diop)",
          "Esthétique des genres : Le roman (Abbé Prévost, Camus, Kourouma, Hampaté Bâ)",
          "Esthétique des genres : Le théâtre (Corneille, Hugo, Musset, Anouilh, Sartre, Seydou Badian)",
          "La dissertation littéraire",
          "Le commentaire composé",
          "Le résumé de texte",
          "La littérature africaine et francophone",
          "Autre"
        ]
      },
      "Histoire": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Les conséquences de la guerre et les règlements du conflit",
          "Les relations Est-Ouest et la guerre froide",
          "La Chine de 1945 aux années 1990",
          "Causes générales de la décolonisation",
          "Les formes de la décolonisation",
          "La décolonisation en Asie : Inde et Indochine",
          "La décolonisation au Proche-Orient : la question palestinienne et les relations israélo-arabes",
          "La décolonisation au Maghreb : l'Algérie",
          "La décolonisation en Afrique noire : Gold Coast, Sénégal, Guinée-Bissau et Angola",
          "Introduction à l'étude des civilisations",
          "Les civilisations négro-africaines : cadre géographique et étude historique",
          "Les civilisations négro-africaines : organisation sociale, politique et économique",
          "Les religions traditionnelles africaines",
          "L'évolution du monde négro-africain : influence de l'islam, du christianisme et de la décolonisation",
          "La naissance de l'islam",
          "Le Coran et les fondements de l'islam",
          "La constitution du monde musulman : expansion et organisation",
          "La culture musulmane : pensée religieuse, vie intellectuelle et artistique",
          "Unité et diversité du monde musulman",
          "Méthodologie de la dissertation en histoire et géographie",
          "Autre"
        ]
      },
      "Géographie": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Le système-monde : des espaces interdépendants",
          "L'espace Nord-Américain : atouts et handicaps de la nature",
          "L'espace Nord-Américain : populations, villes et sociétés",
          "La construction de l'espace économique : États-Unis, Canada et Mexique",
          "Le modèle économique américain : caractéristiques et problèmes",
          "L'espace européen : milieux naturels et populations",
          "La construction européenne : réalités et perspectives",
          "Étude monographique : France ou Allemagne",
          "L'espace asiatique : milieux naturels",
          "L'espace asiatique : populations et sociétés",
          "Le modèle de développement japonais",
          "La Chine, puissance émergente",
          "Les dragons asiatiques",
          "L'Afrique : milieux naturels et populations",
          "L'Afrique subsaharienne : ressources et problèmes de développement",
          "Étude monographique d'un pays africain : Nigeria ou Afrique du Sud",
          "Le Sénégal : cadre physique et humain",
          "Le Sénégal : ressources économiques",
          "Les grands problèmes du Sénégal",
          "Le Sénégal et le monde",
          "Énergie et environnement",
          "Alimentation et développement",
          "La pauvreté dans le monde",
          "Méthodologie du commentaire de carte et de document géographique",
          "Autre"
        ]
      },
      "Anglais": {
        duree_epreuve: "2h",
        hidden: true,
        chapitres: [
          "Compréhension écrite de textes en anglais",
          "Vocabulaire thématique en contexte",
          "Grammaire : temps verbaux avancés",
          "Grammaire : modaux, conditionnel, subjonctif",
          "Grammaire : passif et discours rapporté",
          "Grammaire : relatives, quantifieurs, comparatifs",
          "Expression écrite : essai et lettre formelle",
          "Thèmes : droits de l'homme et démocratie",
          "Thèmes : environnement et développement durable",
          "Thèmes : science, technologie et mondialisation",
          "Civilisation anglophone : USA, UK, pays africains anglophones",
          "Autre"
        ]
      },
      "Économie Générale": {
        duree_epreuve: "3h",
        hidden: true,
        note: "Matière à option L2",
        chapitres: [
          "Croissance et développement",
          "Investissement et progrès technique",
          "Répartition du revenu et inégalités",
          "Les échanges internationaux",
          "Les politiques économiques",
          "Prix et marché",
          "Consommation et épargne des ménages",
          "Monnaie et crédit",
          "Autre"
        ]
      }
    },

    "S1": {
      "Mathématiques": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Probabilité et dénombrement",
          "Nombres complexes",
          "Systèmes d'équations linéaires",
          "Arithmétique dans Z : divisibilité, PGCD, congruences",
          "Suites numériques : arithmétiques, géométriques, récurrentes",
          "Fonctions numériques : généralités, limites, continuité",
          "Fonction logarithme népérien et fonction exponentielle",
          "Dérivation et applications",
          "Primitives et calcul intégral",
          "Équations différentielles",
          "Barycentre",
          "Géométrie plane : calcul vectoriel, isométrie, similitude",
          "Produit vectoriel et produit mixte",
          "Courbes paramétrées",
          "Coniques",
          "Géométrie dans l'espace",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Cinématique du point",
          "Bases de la dynamique : lois de Newton",
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
          "Acides alpha-aminés et éléments de stéréochimie",
          "Autre"
        ]
      },
      "SVT": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Organisation du système nerveux cérébro-spinal des mammifères",
          "Organisation de l'encéphale",
          "Organisation de la moelle épinière",
          "Structure du tissu nerveux",
          "Propriétés du tissu nerveux : excitabilité et conductibilité",
          "Phénomènes électriques : potentiel de repos et potentiel d'action",
          "La synapse",
          "Activité du muscle strié squelettique",
          "Activité cardiaque et régulation de la pression artérielle",
          "Régulation de la glycémie",
          "Système immunitaire",
          "Réponse immunitaire spécifique",
          "Infection à VIH/SIDA",
          "Reproduction chez les mammifères : gamétogenèse",
          "Reproduction chez les mammifères : fécondation et développement",
          "Régulation du fonctionnement des appareils génitaux",
          "Génétique : lois de Mendel",
          "Génétique : liaison génétique et crossing-over",
          "Hérédité humaine",
          "Autre"
        ]
      },
      "Philosophie": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
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
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Le Surréalisme et les mouvements littéraires",
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
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Les conséquences de la guerre et les règlements du conflit",
          "Les relations Est-Ouest et la guerre froide",
          "La Chine de 1945 aux années 1990",
          "Causes générales de la décolonisation",
          "Les formes de la décolonisation",
          "La décolonisation en Asie : Inde et Indochine",
          "La décolonisation au Proche-Orient : la question palestinienne et les relations israélo-arabes",
          "La décolonisation au Maghreb : l'Algérie",
          "La décolonisation en Afrique noire : Gold Coast, Sénégal, Guinée-Bissau et Angola",
          "Introduction à l'étude des civilisations",
          "Les civilisations négro-africaines : cadre géographique et étude historique",
          "Les civilisations négro-africaines : organisation sociale, politique et économique",
          "Les religions traditionnelles africaines",
          "L'évolution du monde négro-africain : influence de l'islam, du christianisme et de la décolonisation",
          "La naissance de l'islam",
          "Le Coran et les fondements de l'islam",
          "La constitution du monde musulman : expansion et organisation",
          "La culture musulmane : pensée religieuse, vie intellectuelle et artistique",
          "Unité et diversité du monde musulman",
          "Méthodologie de la dissertation en histoire et géographie",
          "Autre"
        ]
      },
      "Géographie": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Le système-monde : des espaces interdépendants",
          "L'espace Nord-Américain : atouts et handicaps de la nature",
          "L'espace Nord-Américain : populations, villes et sociétés",
          "La construction de l'espace économique : États-Unis, Canada et Mexique",
          "Le modèle économique américain : caractéristiques et problèmes",
          "L'espace européen : milieux naturels et populations",
          "La construction européenne : réalités et perspectives",
          "Étude monographique : France ou Allemagne",
          "L'espace asiatique : milieux naturels",
          "L'espace asiatique : populations et sociétés",
          "Le modèle de développement japonais",
          "La Chine, puissance émergente",
          "Les dragons asiatiques",
          "L'Afrique : milieux naturels et populations",
          "L'Afrique subsaharienne : ressources et problèmes de développement",
          "Étude monographique d'un pays africain : Nigeria ou Afrique du Sud",
          "Le Sénégal : cadre physique et humain",
          "Le Sénégal : ressources économiques",
          "Les grands problèmes du Sénégal",
          "Le Sénégal et le monde",
          "Énergie et environnement",
          "Alimentation et développement",
          "La pauvreté dans le monde",
          "Méthodologie du commentaire de carte et de document géographique",
          "Autre"
        ]
      },
      "Anglais": {
        duree_epreuve: "2h",
        hidden: true,
        chapitres: [
          "Compréhension écrite",
          "Vocabulaire thématique",
          "Grammaire avancée",
          "Expression écrite",
          "Thèmes : sciences et technologie",
          "Civilisation anglophone",
          "Autre"
        ]
      }
    },

    "S2": {
      "Mathématiques": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Fonctions numériques : rappels et compléments sur la continuité",
          "Fonctions numériques : dérivées et primitives",
          "Fonction logarithme et fonction exponentielle",
          "Calcul intégral : intégrale par parties et changement de variable",
          "Équations différentielles linéaires",
          "Statistique",
          "Probabilité et dénombrement",
          "Nombres complexes : forme algébrique, trigonométrique, exponentielle",
          "Géométrie plane et dans l'espace",
          "Suites numériques",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Cinématique du point",
          "Bases de la dynamique : lois de Newton",
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
          "Acides alpha-aminés et éléments de stéréochimie",
          "Autre"
        ]
      },
      "SVT": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Organisation du système nerveux cérébro-spinal des mammifères",
          "Organisation de l'encéphale",
          "Organisation de la moelle épinière",
          "Structure du tissu nerveux",
          "Propriétés du tissu nerveux : excitabilité et conductibilité",
          "Phénomènes électriques : potentiel de repos et potentiel d'action",
          "La synapse",
          "Rôle du système nerveux dans le comportement moteur d'un animal",
          "Activité du muscle strié squelettique",
          "Activité cardiaque et régulation de la pression artérielle",
          "Milieu intérieur",
          "Régulation de la glycémie",
          "Système immunitaire",
          "Réponse immunitaire spécifique",
          "Infection à VIH/SIDA",
          "Reproduction chez les mammifères : gamétogenèse et fécondation",
          "Régulation du fonctionnement des appareils génitaux",
          "Reproduction chez les spermaphytes",
          "Génétique : lois de Mendel et liaison génétique",
          "Hérédité humaine",
          "Biotechnologies",
          "Autre"
        ]
      },
      "Philosophie": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Les origines et la spécificité de la philosophie",
          "Les grandes interrogations philosophiques",
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
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Le Surréalisme et les mouvements littéraires",
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
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Les conséquences de la guerre et les règlements du conflit",
          "La SDN et l'organisation de la paix",
          "Les relations internationales de 1919 à 1939",
          "La Seconde Guerre mondiale : causes et déroulement",
          "Les conséquences de la Seconde Guerre mondiale et les règlements du conflit",
          "La guerre froide : bipolarisation du monde",
          "Les relations Est-Ouest et la guerre froide",
          "La Chine de 1945 aux années 1990",
          "Causes générales de la décolonisation",
          "Les formes de la décolonisation",
          "La décolonisation en Asie : Inde et Indochine",
          "La décolonisation au Proche-Orient : la question palestinienne et les relations israélo-arabes",
          "La décolonisation au Maghreb : l'Algérie",
          "La décolonisation en Afrique noire : Gold Coast, Sénégal, Guinée-Bissau et Angola",
          "Introduction à l'étude des civilisations",
          "Les civilisations négro-africaines : cadre géographique et étude historique",
          "Les civilisations négro-africaines : organisation sociale, politique et économique",
          "Le Sénégal contemporain : vie politique, économique et sociale",
          "L'Afrique dans les relations internationales",
          "Méthodologie de la dissertation en histoire et géographie",
          "Autre"
        ]
      },
      "Géographie": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Le système-monde : des espaces interdépendants",
          "L'espace Nord-Américain : atouts et handicaps de la nature",
          "L'espace Nord-Américain : populations, villes et sociétés",
          "La construction de l'espace économique : États-Unis, Canada et Mexique",
          "Le modèle économique américain : caractéristiques et problèmes",
          "L'espace européen : milieux naturels et populations",
          "La construction européenne : réalités et perspectives",
          "Étude monographique : France ou Allemagne",
          "L'espace asiatique : milieux naturels",
          "L'espace asiatique : populations et sociétés",
          "Le modèle économique japonais",
          "La Chine : problèmes démographiques et modèle de développement",
          "L'Asie du Sud et du Sud-Est : espaces et sociétés",
          "L'espace africain : milieux naturels et populations",
          "Le continent africain : problèmes et perspectives de développement",
          "L'Afrique subsaharienne : étude de cas",
          "Le Maghreb",
          "Le Sénégal : milieu naturel et population",
          "Le Sénégal : problèmes économiques et politiques de développement",
          "Les espaces maritimes mondiaux",
          "Les grandes métropoles mondiales",
          "Les flux migratoires internationaux",
          "Les espaces ruraux dans le monde",
          "Méthodologie du commentaire de carte et de document géographique",
          "Autre"
        ]
      },
      "Anglais": {
        duree_epreuve: "2h",
        hidden: true,
        chapitres: [
          "Compréhension écrite",
          "Vocabulaire thématique",
          "Grammaire avancée",
          "Expression écrite",
          "Civilisation anglophone",
          "Autre"
        ]
      }
    },

    "S3": {
      "Mathématiques": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Probabilité et dénombrement",
          "Nombres complexes",
          "Systèmes d'équations linéaires",
          "Arithmétique dans Z",
          "Suites numériques",
          "Fonctions numériques : limites, continuité, dérivation",
          "Fonction logarithme et exponentielle",
          "Calcul intégral",
          "Équations différentielles",
          "Géométrie plane et dans l'espace",
          "Courbes paramétrées et coniques",
          "Autre"
        ]
      },
      "Sciences Physiques": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Cinématique du point",
          "Bases de la dynamique",
          "Applications des bases de la dynamique",
          "Gravitation universelle",
          "Électromagnétisme",
          "Oscillations électriques et mécaniques",
          "Interférences lumineuses",
          "Phénomènes corpusculaires",
          "Chimie organique : alcools, amines, acides carboxyliques",
          "Cinétique chimique et équilibres",
          "Autre"
        ]
      },
      "Construction Mécanique": {
        duree_epreuve: "4h",
        hidden: true,
        chapitres: [
          "Réalisation de liaison pivot par roulement",
          "Introduction à la transmission de puissance",
          "Roues de friction",
          "Engrenages",
          "Transmission par liens flexibles",
          "Variateurs de vitesses",
          "Réducteurs et boîtes de vitesses",
          "Accouplements",
          "Systèmes de transformation de mouvement",
          "Hydraulique et pneumatique",
          "Autre"
        ]
      },
      "Philosophie": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français":    { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":     { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    },

    "S4": {
      "SVT":                        { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Sciences Physiques":         { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Mathématiques":              { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Phyto-technique":            { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Écologie et Environnement":  { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Philosophie":                { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français":                   { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":                    { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    },

    "S5": {
      "SVT":                                           { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Sciences Physiques":                            { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Mathématiques":                                 { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Techniques de transformation et de conservation": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Philosophie":                                   { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français":                                      { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":                                       { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    },

    "F6": {
      "Mathématiques": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Physique":      { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Chimie":        { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "TP de Chimie":  { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français":      { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":       { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    },

    "T1": {
      "Mathématiques": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Calcul numérique et algébrique",
          "Fonctions numériques : étude et représentation",
          "Dérivation et applications",
          "Statistique et probabilité",
          "Programmation linéaire",
          "Mathématiques financières",
          "Suites arithmétiques et géométriques",
          "Autre"
        ]
      },
      "Mécanique": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Construction Mécanique": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Méthodes d'analyse et de conception",
          "Modélisation cinématique des mécanismes",
          "Modes de représentation",
          "Lubrification et étanchéité",
          "Conception de liaisons",
          "Cotation",
          "Construction moulée et mécano soudée",
          "Guidage en translation",
          "Guidage en rotation",
          "Réalisation de liaison pivot par roulement",
          "Engrenages",
          "Accouplements",
          "Systèmes de transformation de mouvement",
          "Autre"
        ]
      },
      "Analyse de fabrication et Étude d'outillage": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français": { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":  { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    },

    "T2": {
      "Mathématiques": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Calcul numérique et algébrique",
          "Fonctions numériques",
          "Dérivation et applications",
          "Statistique et probabilité",
          "Programmation linéaire",
          "Mathématiques financières",
          "Suites arithmétiques et géométriques",
          "Autre"
        ]
      },
      "Construction Électromécanique":      { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Électronique et Électrotechnique":   { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Schéma Automatique et Informatique": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français": { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":  { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    },

    "G": {
      "Mathématiques": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "Calcul numérique et algébrique",
          "Fonctions numériques : étude et représentation",
          "Dérivation et applications",
          "Statistique descriptive",
          "Probabilités",
          "Programmation linéaire",
          "Mathématiques financières : intérêts simples et composés",
          "Suites arithmétiques et géométriques",
          "Systèmes d'équations",
          "Autre"
        ]
      },
      "Économie Générale": {
        duree_epreuve: "3h",
        hidden: true,
        chapitres: [
          "La croissance et le développement",
          "Le sous-développement",
          "La balance des paiements",
          "Le système monétaire international (SMI)",
          "Échanges internationaux et mondialisation",
          "L'intégration économique",
          "Les déséquilibres économiques",
          "Rôle de l'État dans la régulation économique",
          "Les comptes d'opération et les tableaux de synthèse",
          "La répartition des revenus",
          "La consommation des ménages",
          "L'épargne des ménages",
          "L'investissement",
          "Monnaie et crédit",
          "Autre"
        ]
      },
      "Étude de Cas": { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Philosophie":  { duree_epreuve: "3h", hidden: true, chapitres: ["Autre"] },
      "Français":     { duree_epreuve: "4h", hidden: true, chapitres: ["Autre"] },
      "Anglais":      { duree_epreuve: "2h", hidden: true, chapitres: ["Autre"] }
    }
  }
};

/* ══════════════════════════════════════════════════════════
   Fonctions utilitaires
══════════════════════════════════════════════════════════ */

export function getMatieres(examen: string, serie?: string): string[] {
  if (examen === "BFEM") return Object.keys(PROGRAMMES.BFEM);
  if (!serie) return [];
  const s = PROGRAMMES.BAC[serie as keyof typeof PROGRAMMES.BAC];
  return s ? Object.keys(s) : [];
}

export function getChapitres(examen: string, serie: string, matiere: string): string[] {
  if (examen === "BFEM") {
    const m = PROGRAMMES.BFEM[matiere as keyof typeof PROGRAMMES.BFEM];
    return m?.chapitres ?? ["Autre"];
  }
  const s = PROGRAMMES.BAC[serie as keyof typeof PROGRAMMES.BAC];
  if (!s) return ["Autre"];
  const m = (s as Record<string, ProgrammeMatiere>)[matiere];
  return m?.chapitres ?? ["Autre"];
}

export function getInfoMatiere(examen: string, serie: string, matiere: string): ProgrammeMatiere | null {
  if (examen === "BFEM") {
    return PROGRAMMES.BFEM[matiere as keyof typeof PROGRAMMES.BFEM] ?? null;
  }
  const s = PROGRAMMES.BAC[serie as keyof typeof PROGRAMMES.BAC];
  if (!s) return null;
  return (s as Record<string, ProgrammeMatiere>)[matiere] ?? null;
}

export const getMatiereData = getInfoMatiere;

export function getProgramme(examen: string, serie: string, matiere: string, chapitre?: string): string {
  const info = getInfoMatiere(examen, serie, matiere);
  const chapitres = getChapitres(examen, serie, matiere);
  return `Matière: ${matiere} | Série: ${serie} | Examen: ${examen}${chapitre ? ` | Chapitre: ${chapitre}` : ""} | Coefficient: ${info?.coefficient ?? "N/A"} | Durée épreuve: ${info?.duree_epreuve ?? "N/A"} | Chapitres du programme: ${chapitres.filter(c => c !== "Autre").join(", ")}`;
}

export const MATIERES_BY_SERIE = PROGRAMMES;
