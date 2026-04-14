/**
 * Programmes officiels du BAC et BFEM sénégalais
 * Source: Office du Baccalauréat du Sénégal
 * Utilisé par: quiz, micro-leçons, examen blanc, orientation
 */

export type ProgrammeMatiere = {
  horaire: string;         // durée officielle de l'épreuve
  coefficient: number;
  chapitres: string[];     // noms des chapitres pour le suivi
  contenu: string;         // texte complet pour les prompts Groq
};

// Record<matière, Record<série|"ALL", ProgrammeMatiere>>
export const PROGRAMMES_OFFICIELS: Record<string, Record<string, ProgrammeMatiere>> = {

  /* ─── FRANÇAIS ─────────────────────────────────────────────── */
  "Français": {
    "L1": {
      horaire: "240",
      coefficient: 5,
      chapitres: [
        "Texte littéraire — Lecture et compréhension",
        "Dissertation littéraire",
        "Commentaire composé",
        "Résumé et contraction de texte",
        "Expression écrite — Argumentation",
        "Grammaire : propositions subordonnées",
        "Grammaire : modes et temps du verbe",
        "Stylistique : figures de style",
        "Littérature africaine et française",
        "Lexique et vocabulaire",
      ],
      contenu: `PROGRAMME DE FRANÇAIS — SÉRIE L1 (BAC Sénégal)
Horaire: 6h/semaine — Durée épreuve: 4h — Coeff. 5

EXPRESSION ÉCRITE
- Dissertation littéraire : analyse d'un sujet, élaboration d'un plan dialectique ou thématique, rédaction soignée avec introduction/développement/conclusion
- Commentaire composé : étude d'un texte littéraire (mouvement littéraire, procédés stylistiques, thèmes)
- Contraction de texte : fidélité aux idées, style synthétique, cohérence
- Résumé : reformulation sans déformation du sens

GRAMMAIRE ET STYLISTIQUE
- Propositions subordonnées relatives, complétives, circonstancielles (but, cause, conséquence, concession, condition)
- Modes et temps : indicatif, subjonctif, conditionnel, infinitif, participe — valeurs et emplois
- Figures de style : métaphore, comparaison, antithèse, hyperbole, ironie, litote, euphémisme, anaphore, allitération, assonance
- Fonctions grammaticales : sujet, COD, COI, attribut, apposition, épithète

LITTÉRATURE
- Romans africains contemporains (Sembène Ousmane, Cheikh Hamidou Kane, Mariama Bâ, Aminata Sow Fall)
- Poésie négro-africaine (Léopold Sédar Senghor, Aimé Césaire)
- Théâtre francophone
- Lecture analytique : contexte historique, thèmes, personnages, style
- Mouvement littéraire : Négritude, Réalisme, Romantisme

VOCABULAIRE
- Formation des mots : préfixes, suffixes, composition
- Champs lexicaux et sémantiques
- Synonymes, antonymes, homophones, paronymes`,
    },
    "L2": {
      horaire: "240",
      coefficient: 4,
      chapitres: [
        "Dissertation littéraire",
        "Commentaire composé",
        "Résumé de texte",
        "Grammaire avancée",
        "Figures de style",
        "Littérature africaine",
        "Argumentation",
      ],
      contenu: `PROGRAMME DE FRANÇAIS — SÉRIE L2 (BAC Sénégal)
Horaire: 5h/semaine — Durée épreuve: 4h — Coeff. 4

EXPRESSION ÉCRITE
- Dissertation littéraire et générale
- Commentaire composé de textes littéraires
- Résumé, contraction et compte rendu
- Argumentation : thèse, antithèse, synthèse

GRAMMAIRE
- Analyse de propositions et de phrases complexes
- Subordination et coordination
- Modes verbaux et leurs valeurs
- Analyse stylistique : figures de style

LITTÉRATURE
- Littérature sénégalaise et africaine d'expression française
- Genres littéraires : roman, poésie, théâtre, essai
- Analyse de textes en lecture expliquée
- Contextes historiques et culturels des œuvres

VOCABULAIRE ET ORTHOGRAPHE
- Lexique thématique
- Dérivation et composition`,
    },
    "S1": {
      horaire: "240",
      coefficient: 2,
      chapitres: [
        "Dissertation générale",
        "Commentaire de texte",
        "Résumé",
        "Expression écrite scientifique",
        "Grammaire de base",
      ],
      contenu: `PROGRAMME DE FRANÇAIS — SÉRIE S1 (BAC Sénégal)
Horaire: 3h/semaine — Durée épreuve: 4h — Coeff. 2

EXPRESSION ÉCRITE
- Dissertation sur des sujets généraux (société, science, culture)
- Résumé et contraction de texte
- Commentaire orienté

GRAMMAIRE
- Révision des structures grammaticales essentielles
- Propositions subordonnées
- Connecteurs logiques et articulateurs du discours

VOCABULAIRE
- Vocabulaire scientifique courant
- Formation des mots`,
    },
    "S2": {
      horaire: "240",
      coefficient: 2,
      chapitres: [
        "Dissertation générale",
        "Commentaire de texte",
        "Résumé",
        "Grammaire essentielle",
      ],
      contenu: `PROGRAMME DE FRANÇAIS — SÉRIE S2 (BAC Sénégal)
Horaire: 3h/semaine — Durée épreuve: 4h — Coeff. 2

EXPRESSION ÉCRITE
- Dissertation sur des sujets d'actualité et de société
- Résumé de texte argumentatif ou narratif
- Commentaire orienté

GRAMMAIRE
- Propositions subordonnées (relatives, conjonctives, infinitives)
- Connecteurs logiques
- Modes et temps

VOCABULAIRE
- Lexique courant et scientifique`,
    },
    "BFEM": {
      horaire: "180",
      coefficient: 3,
      chapitres: [
        "Dictée",
        "Rédaction narrative ou descriptive",
        "Questions de grammaire",
        "Compréhension de texte",
        "Vocabulaire",
      ],
      contenu: `PROGRAMME DE FRANÇAIS — BFEM Sénégal
Durée épreuve: 3h — Coeff. 3

DICTÉE
- Orthographe grammaticale : accords (nom/adj, sujet/verbe, participe passé)
- Orthographe lexicale : mots courants
- Ponctuation

RÉDACTION
- Narration : récit d'un événement réel ou imaginaire
- Description : portrait, lieu, scène
- Argumentation simple : donner son avis et le justifier
- Lettre formelle et informelle

GRAMMAIRE
- Nature et fonction des mots
- Propositions : indépendante, principale, subordonnée
- Temps et modes : présent, passé composé, imparfait, futur, conditionnel, subjonctif présent
- Discours direct et indirect

VOCABULAIRE
- Synonymes, antonymes, familles de mots
- Sens propre et figuré
- Formation des mots`,
    },
  },

  /* ─── MATHÉMATIQUES ──────────────────────────────────────── */
  "Maths": {
    "S1": {
      horaire: "240",
      coefficient: 7,
      chapitres: [
        "Ensembles et applications",
        "Suites numériques",
        "Limites et continuité",
        "Dérivabilité et étude de fonctions",
        "Intégration",
        "Équations différentielles",
        "Nombres complexes",
        "Géométrie analytique",
        "Trigonométrie",
        "Dénombrement et probabilités",
        "Statistiques",
        "Arithmétique",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — SÉRIE S1 (BAC Sénégal)
Horaire: 7h/semaine — Durée épreuve: 4h — Coeff. 7

ANALYSE
Suites numériques : suites arithmétiques et géométriques, convergence, limite, suites définies par récurrence
Limites de fonctions : limite en un point et à l'infini, opérations sur les limites, formes indéterminées, théorèmes des gendarmes et de la valeur intermédiaire
Continuité : définition, prolongement par continuité, théorème des valeurs intermédiaires
Dérivabilité : définition, dérivées usuelles, règles de calcul (somme, produit, quotient, composée), dérivée et variations, tableau de variations
Fonctions usuelles : fonctions logarithme (ln, log), fonctions exponentielles (exp, a^x), fonctions trigonométriques (sin, cos, tan), fonctions trigonométriques inverses (arcsin, arccos, arctan)
Intégration : primitives, intégrale de Riemann, propriétés, calcul d'aires, intégration par parties, changement de variable
Équations différentielles : y'=ay, y'=ay+b, y''+ay'+by=f(x) (cas simples)

ALGÈBRE
Nombres complexes : forme algébrique, module, argument, forme trigonométrique, forme exponentielle, conjugué, équations dans ℂ, racines n-ièmes
Arithmétique : divisibilité, PGCD, PPCM, nombres premiers, congruences
Dénombrement : arrangements, permutations, combinaisons, formule du binôme
Probabilités : espace probabilisé, probabilité conditionnelle, indépendance, loi de probabilité discrète (Bernoulli, binomiale), espérance, variance, écart-type

GÉOMÉTRIE
Vecteurs, repères, droites et plans dans l'espace
Trigonométrie : relations métriques dans un triangle (Al-Kashi, sinus), formules d'addition, formules de duplication
Géométrie analytique : droite (équation, distance, angle), conique (parabole, ellipse, hyperbole, cercle)
Transformations : translation, rotation, homothétie, symétrie

STATISTIQUES
Statistiques descriptives : effectifs, fréquences, médiane, quartiles, moyenne, variance, écart-type, boîte à moustaches`,
    },
    "S2": {
      horaire: "240",
      coefficient: 6,
      chapitres: [
        "Suites numériques",
        "Limites et continuité",
        "Dérivabilité",
        "Intégration",
        "Nombres complexes",
        "Géométrie dans l'espace",
        "Probabilités",
        "Statistiques",
        "Arithmétique",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — SÉRIE S2 (BAC Sénégal)
Horaire: 6h/semaine — Durée épreuve: 4h — Coeff. 6

ANALYSE
Suites numériques : définition, suites arithmétiques et géométriques, limite, récurrence
Limites et continuité : limites usuelles, opérations, continuité
Dérivabilité : dérivées des fonctions usuelles et composées, étude de fonctions
Fonctions logarithme et exponentielle : propriétés, dérivées, intégrales
Fonctions trigonométriques : sin, cos, tan et leurs inverses, dérivées
Intégration : définition, propriétés, technique d'intégration

ALGÈBRE
Nombres complexes : formes algébrique, trigonométrique, exponentielle ; équations ; racines
Dénombrement : arrangements, combinaisons, probabilités
Probabilités : probabilité conditionnelle, indépendance, lois discrètes

GÉOMÉTRIE
Géométrie analytique plane et dans l'espace
Vecteurs dans l'espace : repère, produit scalaire, vectoriel
Plans et droites dans l'espace

STATISTIQUES
Statistiques à deux variables, régression, corrélation`,
    },
    "S3": {
      horaire: "240",
      coefficient: 6,
      chapitres: [
        "Fonctions numériques",
        "Suites",
        "Intégration",
        "Probabilités",
        "Géométrie",
        "Trigonométrie",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — SÉRIE S3 (BAC Sénégal)
Horaire: 6h/semaine — Durée épreuve: 4h — Coeff. 6

Contenu similaire à S2 avec approfondissement en analyse et probabilités.
Suites, limites, dérivées, intégrales, nombres complexes, géométrie analytique, probabilités.`,
    },
    "S4": {
      horaire: "240",
      coefficient: 5,
      chapitres: [
        "Fonctions numériques",
        "Suites",
        "Dérivabilité",
        "Intégration",
        "Probabilités",
        "Statistiques",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — SÉRIE S4 (BAC Sénégal)
Horaire: 5h/semaine — Durée épreuve: 4h — Coeff. 5

Analyse : suites, limites, dérivées, intégrales
Algèbre : nombres complexes, probabilités
Statistiques descriptives et inférentielles`,
    },
    "L": {
      horaire: "240",
      coefficient: 3,
      chapitres: [
        "Ensembles et logique",
        "Fonctions de base",
        "Suites arithmétiques et géométriques",
        "Statistiques descriptives",
        "Probabilités de base",
        "Géométrie plane",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — SÉRIES L1/L2 (BAC Sénégal)
Horaire: 4h/semaine — Durée épreuve: 4h — Coeff. 3

ALGÈBRE ET ANALYSE
Ensembles : opérations (union, intersection, complémentaire), produit cartésien
Logique : quantificateurs, implication, équivalence, contraposée
Fonctions numériques : fonction affine, polynôme du 2nd degré, valeur absolue
Suites : arithmétiques et géométriques, termes, sommes
Équations et inéquations : 1er et 2nd degré, systèmes

PROBABILITÉS ET STATISTIQUES
Statistiques : effectifs, fréquences, représentations graphiques, moyenne, médiane, mode
Probabilités : expérience aléatoire, événement, probabilité, équiprobabilité

GÉOMÉTRIE
Géométrie plane : triangle, parallèle, perpendiculaire, cercle, théorèmes (Thalès, Pythagore)
Trigonométrie : sin, cos, tan dans le triangle rectangle`,
    },
    "G": {
      horaire: "180",
      coefficient: 4,
      chapitres: [
        "Fonctions affines et polynômes",
        "Suites numériques",
        "Statistiques",
        "Probabilités",
        "Mathématiques financières",
        "Géométrie analytique",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — SÉRIE G (BAC Sénégal)
Horaire: 4h/semaine — Durée épreuve: 3h — Coeff. 4

ALGÈBRE
Ensembles, fonctions, équations et inéquations
Polynômes et fractions rationnelles
Suites arithmétiques et géométriques (applications à la finance)

MATHÉMATIQUES FINANCIÈRES
Intérêts simples et composés
Actualisation et capitalisation
Annuités

STATISTIQUES ET PROBABILITÉS
Statistiques descriptives : tableaux, graphiques, paramètres de position et dispersion
Probabilités : calcul de probabilités, loi binomiale

GÉOMÉTRIE
Géométrie analytique plane : droites, distances, angles`,
    },
    "BFEM": {
      horaire: "180",
      coefficient: 4,
      chapitres: [
        "Ensembles et opérations",
        "Arithmétique — divisibilité, PGCD, PPCM",
        "Fractions et opérations",
        "Équations et inéquations du 1er degré",
        "Systèmes d'équations",
        "Fonctions affines",
        "Statistiques",
        "Géométrie plane — triangles, cercles",
        "Théorème de Thalès",
        "Théorème de Pythagore",
        "Trigonométrie — sin, cos, tan",
        "Transformations — symétrie, translation, rotation",
      ],
      contenu: `PROGRAMME DE MATHÉMATIQUES — BFEM Sénégal
Durée épreuve: 3h — Coeff. 4

ARITHMÉTIQUE
Ensembles de nombres : ℕ, ℤ, ℚ, ℝ
Divisibilité : diviseurs, multiples, critères, PGCD (algorithme d'Euclide), PPCM
Fractions : opérations, simplification, comparaison
Puissances et racines : règles de calcul
Pourcentages et proportions

ALGÈBRE
Développement et factorisation : identités remarquables (a+b)², (a-b)², (a+b)(a-b)
Équations du 1er degré à une inconnue
Inéquations du 1er degré
Systèmes de deux équations à deux inconnues

FONCTIONS
Fonction affine : y = ax + b, représentation graphique, sens de variation, coefficient directeur
Résolution graphique d'équations et inéquations

STATISTIQUES
Séries statistiques : effectifs, fréquences
Représentations graphiques : histogramme, diagramme circulaire
Paramètres de position : mode, médiane, moyenne

GÉOMÉTRIE PLANE
Triangles : propriétés, triangles particuliers (isocèle, équilatéral, rectangle)
Théorème de Pythagore et réciproque
Théorème de Thalès et réciproque
Cercle : propriétés, angles inscrits, tangentes
Quadrilatères : parallélogramme, rectangle, losange, carré, trapèze
Polygones réguliers

TRIGONOMÉTRIE
sin, cos, tan dans le triangle rectangle
Calcul d'angles et de longueurs

TRANSFORMATIONS
Symétrie axiale et centrale
Translation, rotation
Homothétie

MESURES
Longueurs, aires (triangle, quadrilatère, cercle, disque), volumes (cube, parallélépipède, cylindre, pyramide, cône, sphère)`,
    },
  },

  /* ─── SCIENCES PHYSIQUES ─────────────────────────────────── */
  "Sciences Physiques": {
    "S1": {
      horaire: "210",
      coefficient: 6,
      chapitres: [
        "Mécanique — cinématique",
        "Mécanique — dynamique (lois de Newton)",
        "Mécanique — travail et énergie",
        "Électricité — courant continu (lois de Kirchhoff)",
        "Électricité — condensateur et bobine",
        "Électricité — circuits RLC",
        "Optique — réflexion et réfraction",
        "Optique — lentilles",
        "Thermodynamique",
        "Ondes mécaniques et sonores",
        "Physique nucléaire",
        "Chimie — structure de la matière",
        "Chimie — équilibre chimique",
        "Chimie — électrochimie",
        "Chimie — cinétique chimique",
        "Chimie organique",
      ],
      contenu: `PROGRAMME DE SCIENCES PHYSIQUES — SÉRIE S1 (BAC Sénégal)
Horaire: 6h/semaine — Durée épreuve: 3h30 — Coeff. 6

PHYSIQUE

Mécanique
Cinématique : mouvements (rectiligne uniforme, rectiligne uniformément varié, circulaire), équations horaires, vecteur vitesse et accélération
Dynamique : lois de Newton (principe d'inertie, relation fondamentale de la dynamique F=ma, principe des actions réciproques), systèmes en translation et en rotation
Travail et énergie : travail d'une force, théorème de l'énergie cinétique, énergie potentielle, conservation de l'énergie mécanique, puissance

Électricité
Courant continu : lois de Kirchhoff (mailles, nœuds), pont de Wheatstone, dipôles (résistance, source de tension, source de courant)
Condensateur : charge, décharge, énergie stockée, circuit RC
Bobine (inductance) : circuit RL, énergie
Circuits RLC : oscillations libres amorties, oscillations forcées, résonance

Optique
Réflexion : loi de Snell-Descartes, miroir plan et sphérique
Réfraction : loi de Snell-Descartes, prisme, fibre optique
Lentilles minces : construction d'images, relation conjuguée, vergence, grandissement

Thermodynamique
Premier principe : énergie interne, travail, chaleur
Gaz parfait : loi des gaz parfaits, transformations isotherme, isobare, isochore, adiabatique

Ondes
Ondes mécaniques progressives : célérité, longueur d'onde, période, fréquence
Ondes sonores : intensité, décibels, effet Doppler

Physique nucléaire
Structure du noyau : nucléons, numéro atomique, nombre de masse
Radioactivité : α, β, γ ; loi de décroissance radioactive
Fission et fusion nucléaires ; énergie de liaison

CHIMIE

Structure de la matière
Configuration électronique, classification périodique, liaisons (ionique, covalente, métallique)

Cinétique chimique
Vitesse de réaction, facteurs cinétiques (concentration, température, catalyseur)

Équilibre chimique
Constante d'équilibre Kc et Kp, quotient de réaction, déplacement d'équilibre (Le Chatelier), Ka, Kb, pH

Électrochimie
Pile électrochimique, potentiel d'oxydoréduction, électrolyse, lois de Faraday

Chimie organique
Hydrocarbures : alcanes, alcènes, alcynes, aromatiques
Fonctions organiques : alcool, aldéhyde, cétone, acide carboxylique, ester, amine, amide
Réactions organiques : addition, substitution, élimination, estérification`,
    },
    "S2": {
      horaire: "210",
      coefficient: 5,
      chapitres: [
        "Mécanique — cinématique et dynamique",
        "Mécanique — travail et énergie",
        "Électricité — courant continu",
        "Électricité — circuits RC et RL",
        "Optique géométrique",
        "Physique nucléaire",
        "Chimie — structure atomique",
        "Chimie — équilibre acido-basique",
        "Chimie — oxydoréduction",
        "Chimie organique",
      ],
      contenu: `PROGRAMME DE SCIENCES PHYSIQUES — SÉRIE S2 (BAC Sénégal)
Horaire: 5h/semaine — Durée épreuve: 3h30 — Coeff. 5

PHYSIQUE
Mécanique : cinématique (MRU, MRUV), dynamique (Newton), travail et énergie
Électricité : lois de Kirchhoff, circuits RC, RL, RLC
Optique : réflexion, réfraction, lentilles minces
Physique nucléaire : radioactivité, loi de décroissance, fission

CHIMIE
Structure atomique et classification périodique
Cinétique et équilibre chimique
Acides et bases : Ka, pH, solutions tampons
Oxydoréduction : potentiels, piles, électrolyse
Chimie organique : principales fonctions et réactions`,
    },
    "L2": {
      horaire: "120",
      coefficient: 2,
      chapitres: [
        "Mécanique de base",
        "Électricité — courant continu",
        "Optique géométrique",
        "Structure de la matière",
        "Chimie des solutions",
      ],
      contenu: `PROGRAMME DE SCIENCES PHYSIQUES — SÉRIE L2 (BAC Sénégal)
Horaire: 3h/semaine — Durée épreuve: 2h — Coeff. 2

PHYSIQUE
Mécanique : description du mouvement, forces, poids, poussée d'Archimède
Électricité : circuit simple, loi d'Ohm, résistances en série et parallèle, puissance
Optique : propagation de la lumière, miroir plan, réfraction, lentilles

CHIMIE
Structure de la matière : atome, ions, molécules
Corps purs et mélanges
Solutions : concentration, dilution, pH`,
    },
    "BFEM": {
      horaire: "120",
      coefficient: 2,
      chapitres: [
        "Électricité — circuit électrique",
        "Mécanique — forces et mouvements",
        "Optique — propagation de la lumière",
        "Structure de la matière",
        "Chimie des solutions",
        "Physique atomique",
      ],
      contenu: `PROGRAMME DE SCIENCES PHYSIQUES — BFEM Sénégal
Durée épreuve: 2h — Coeff. 2

PHYSIQUE
Électricité : circuit électrique (schéma, montage série/parallèle), loi d'Ohm (U=RI), intensité, tension, résistance, puissance (P=UI), énergie, sécurité électrique
Mécanique : forces (poids, poussée d'Archimède, frottement), mouvements (translation, rotation), équilibre
Optique : propagation rectiligne, ombre et pénombre, miroir plan, réfraction, lentilles convergentes et divergentes, œil, instruments optiques

CHIMIE
Structure de la matière : atome (noyau, électrons), tableau périodique (famille, période), ions, molécules
Corps purs et mélanges : mélanges homogènes/hétérogènes, techniques de séparation
Réactions chimiques : équation bilan, conservation de la masse
Solutions : dissolution, concentration en masse, dilution, pH (acide, base, neutre)`,
    },
  },

  /* ─── SCIENCES NATURELLES (SVT) ─────────────────────────── */
  "Sciences Naturelles": {
    "S1": {
      horaire: "210",
      coefficient: 5,
      chapitres: [
        "Biologie cellulaire",
        "Génétique — mitose et méiose",
        "Génétique mendélienne",
        "Génétique moléculaire — ADN et synthèse protéique",
        "Reproduction chez les végétaux",
        "Reproduction chez les animaux",
        "Immunologie",
        "Neurophysiologie",
        "Géologie — structure de la Terre",
        "Géologie — tectonique des plaques",
        "Géologie — roches et minéraux",
        "Écologie",
      ],
      contenu: `PROGRAMME DE SCIENCES NATURELLES (SVT) — SÉRIE S1 (BAC Sénégal)
Horaire: 5h/semaine — Durée épreuve: 3h30 — Coeff. 5

BIOLOGIE

Biologie cellulaire
Structure de la cellule procaryote et eucaryote, organites (noyau, mitochondrie, chloroplaste, réticulum endoplasmique, appareil de Golgi, lysosomes, ribosomes)
Membrane cellulaire : structure (bicouche lipidique), transport (diffusion, osmose, transport actif)
ADN : structure en double hélice, nucléotides, réplication semi-conservative

Génétique
Division cellulaire : mitose (phases : prophase, métaphase, anaphase, télophase), méiose (réduction chromatique, brassage génétique), importance
Génétique mendélienne : 1ère et 2ème loi de Mendel, monohybridisme, dihybridisme, codominance, dominance incomplète, liaison au sexe
Génétique moléculaire : structure de l'ADN, transcription (ARNm, ARNt, ARNr), traduction (code génétique, ribosome), mutations

Physiologie végétale
Nutrition minérale et photosynthèse (phase claire et sombre)
Reproduction sexuée et asexuée chez les végétaux
Fleur, pollinisation, fécondation, graine, germination

Reproduction animale
Systèmes reproducteurs masculin et féminin
Cycle menstruel, ovulation, fécondation, développement embryonnaire (segmentation, gastrulation, organogenèse)
Hormones sexuelles, régulation hormonale

Immunologie
Immunité non spécifique (barrières physiques, phagocytose, inflammation)
Immunité spécifique (humorale : anticorps, lymphocytes B ; cellulaire : lymphocytes T)
Vaccins, sérums, maladies immunitaires

Neurophysiologie
Neurone : structure, potentiel d'action, synapse, neurotransmetteurs
Système nerveux central et périphérique
Arc réflexe

GÉOLOGIE

Structure de la Terre
Sismologie, couches terrestres (croûte, manteau, noyau), discontinuités
Minéraux et roches : classification (magmatiques, sédimentaires, métamorphiques), cycle des roches

Tectonique des plaques
Dérive des continents (Wegener), expansion océanique, subduction, collision
Séismes et volcans : mécanismes, répartition mondiale

Géologie du Sénégal
Formation du bassin sédimentaire sénégalais`,
    },
    "S2": {
      horaire: "210",
      coefficient: 6,
      chapitres: [
        "Biologie cellulaire",
        "Division cellulaire — mitose et méiose",
        "Génétique mendélienne",
        "ADN et synthèse protéique",
        "Physiologie animale",
        "Immunologie",
        "Tectonique des plaques",
        "Roches et minéraux",
        "Écologie",
      ],
      contenu: `PROGRAMME DE SCIENCES NATURELLES (SVT) — SÉRIE S2 (BAC Sénégal)
Horaire: 6h/semaine — Durée épreuve: 3h30 — Coeff. 6

BIOLOGIE
Biologie cellulaire : structure cellulaire, organites, membrane, ADN
Génétique : mitose, méiose, hérédité mendélienne (monohybridisme, dihybridisme), liaison, mutation
Génétique moléculaire : réplication, transcription, traduction
Physiologie : nutrition, respiration, circulation, excrétion, reproduction
Immunologie : défenses immunitaires, immunité humorale et cellulaire

GÉOLOGIE
Structure et composition de la Terre
Tectonique des plaques : preuves, mécanismes, conséquences
Roches sédimentaires : formation, fossilisation, stratigraphie
Géologie historique`,
    },
    "L2": {
      horaire: "120",
      coefficient: 2,
      chapitres: [
        "Cellule et fonctions vitales",
        "Nutrition et digestion",
        "Circulation et respiration",
        "Reproduction",
        "Hérédité de base",
        "Écologie",
      ],
      contenu: `PROGRAMME DE SCIENCES NATURELLES — SÉRIE L2 (BAC Sénégal)
Horaire: 3h/semaine — Durée épreuve: 2h — Coeff. 2

BIOLOGIE
La cellule : structure et fonctions
Nutrition : digestion, absorption, glucides, lipides, protides, vitamines
Circulation : sang, cœur, artères, veines, capillaires
Respiration : poumons, échanges gazeux
Reproduction : humaine, végétale
Hérédité : gènes, chromosomes, dominance/récessivité

ÉCOLOGIE
Écosystème, chaînes alimentaires, biodiversité, développement durable`,
    },
  },

  /* ─── PHILOSOPHIE ─────────────────────────────────────────── */
  "Philosophie": {
    "ALL": {
      horaire: "240",
      coefficient: 4,
      chapitres: [
        "La conscience et l'inconscient",
        "La perception et la connaissance",
        "Le langage",
        "La raison et la vérité",
        "La science et la technique",
        "La liberté",
        "La morale",
        "La justice et le droit",
        "L'État et la politique",
        "Le travail et la valeur",
        "Le temps et l'existence",
        "La religion et la foi",
        "L'art et le beau",
      ],
      contenu: `PROGRAMME DE PHILOSOPHIE — TOUTES SÉRIES BAC (Sénégal)
Durée épreuve: 4h — Coeff. 4 (L1/L2), 3 (S1/S2)

MÉTHODOLOGIE
Dissertation philosophique : analyse du sujet, problématisation, plan dialectique (thèse/antithèse/synthèse), références aux auteurs
Explication de texte : contextualisation, thèse de l'auteur, analyse des arguments, portée critique

THÈMES ET NOTIONS

La conscience
Définition : la conscience de soi et du monde, le cogito cartésien
L'inconscient freudien : id, ego, surmoi ; rêve ; actes manqués ; refoulement
Philosophes : Descartes, Freud, Sartre, Bergson

La perception
Sensation vs perception, illusions des sens, réalité et apparence
Philosophes : Platon (allégorie de la caverne), Merleau-Ponty, Hume

Le langage
Langage et pensée, langage animal vs humain, signe et signification
Philosophes : Saussure, Wittgenstein, Bergson

La raison et la vérité
Raison, rationnel, rationalité ; vérité (correspondance, cohérence, consensus)
Philosophes : Descartes, Kant, Hegel, Popper

La science et la technique
Méthode scientifique, progrès, technique comme prolongement de l'homme
Philosophes : Bachelard, Popper, Ellul, Bergson

La liberté
Libre arbitre vs déterminisme, liberté et responsabilité, liberté politique
Philosophes : Sartre, Kant, Spinoza, Hegel

La morale
Morale et éthique, devoir, bien, mal ; utilitarisme vs déontologie
Philosophes : Kant (impératif catégorique), Mill, Aristote (vertu)

La justice et le droit
Droit naturel vs droit positif, justice sociale, équité
Philosophes : Platon, Aristote, Rousseau, Rawls

L'État et la politique
Origine et légitimité de l'État, contrat social, démocratie, totalitarisme
Philosophes : Hobbes, Locke, Rousseau, Montesquieu, Marx

Le travail
Travail et aliénation, valeur travail, loisir
Philosophes : Marx, Hegel, Arendt

La religion
Foi et raison, preuves de l'existence de Dieu, laïcité
Philosophes : Anselme, Descartes, Kant, Nietzsche

L'art
Imitation et création, beau, goût, émotion esthétique
Philosophes : Platon, Kant (jugement de goût), Hegel

Auteurs au programme (Sénégal) :
Léopold Sédar Senghor, Cheikh Anta Diop, Alioune Diop — philosophie africaine et négritude`,
    },
  },

  /* ─── HISTOIRE ────────────────────────────────────────────── */
  "Histoire": {
    "ALL": {
      horaire: "180",
      coefficient: 3,
      chapitres: [
        "L'Afrique précoloniale",
        "La traite négrière et ses conséquences",
        "La colonisation de l'Afrique",
        "Les résistances africaines à la colonisation",
        "La Première Guerre mondiale",
        "L'entre-deux-guerres et la crise de 1929",
        "La Seconde Guerre mondiale",
        "La décolonisation en Asie et en Afrique",
        "L'indépendance du Sénégal",
        "La Guerre froide",
        "La construction européenne",
        "Le monde après la Guerre froide",
        "L'Afrique dans le monde contemporain",
      ],
      contenu: `PROGRAMME D'HISTOIRE — TOUTES SÉRIES BAC (Sénégal)
Durée épreuve: 3h — Coeff. 3 (L1/L2), 2 (S1/S2)

HISTOIRE DE L'AFRIQUE

L'Afrique précoloniale
Grands empires : Ghana, Mali, Songhaï, Kanem-Bornou, empire Wolof (Jolof), royaumes côtiers
Structures sociales et politiques, économies, religions (animisme, islam, christianisme)
Civilisations et cultures africaines, relations entre États

La traite négrière (XVe-XIXe siècle)
Traite transsaharienne et arabe ; traite atlantique
Volume et zones d'approvisionnement (Sénégambie, Golfe de Guinée, Afrique centrale)
Conséquences démographiques, économiques et culturelles pour l'Afrique
Résistances à la traite

La colonisation (XIXe-XXe siècle)
Partage de l'Afrique : conférence de Berlin (1884-1885), découpage territorial
Modes d'administration : colonisation directe (France) vs indirecte (Grande-Bretagne)
Pénétration coloniale au Sénégal : quatre communes (Saint-Louis, Gorée, Dakar, Rufisque)
Économie coloniale : cultures de rente (arachide au Sénégal), travail forcé, exploitation des ressources

Résistances africaines
El Hadj Omar Tall, Samory Touré, Lat Dior, Ndiadiane Ndiaye
Résistance passive et armée
Mouvements religieux (marabouts) comme résistance culturelle

HISTOIRE MONDIALE

Première Guerre mondiale (1914-1918)
Causes (nationalisme, imperialisme, militarisme, alliances)
Combats et front occidental ; contributions africaines
Traité de Versailles et ses conséquences

L'entre-deux-guerres
Révolution bolchévique (1917) et URSS
Crise économique de 1929 et ses effets mondiaux
Montée des fascismes : Italie (Mussolini), Allemagne (Hitler), Japon

Deuxième Guerre mondiale (1939-1945)
Phases du conflit ; Holocaust ; participation africaine (tirailleurs)
Bilan : humain, économique, géopolitique
Conférences de Yalta et Potsdam

Décolonisation (1945-1970)
Facteurs : affaiblissement des métropoles, nationalisme, ONU
Asie : indépendance de l'Inde (1947), Indochine, Indonésie
Afrique noire : Loi-cadre Defferre (1956), indépendances 1960
Sénégal : indépendance le 4 avril 1960, Léopold Sédar Senghor

Guerre froide (1947-1991)
Blocs américain (OTAN) et soviétique (Pacte de Varsovie)
Crises : Berlin, Cuba, Corée, Vietnam
Non-alignement : Conférence de Bandung (1955), Mouvement des non-alignés
Fin de la Guerre froide : chute du mur de Berlin (1989), dissolution URSS (1991)

Monde contemporain
Mondialisation économique et culturelle
Conflits post-Guerre froide (Balkans, Afrique)
Construction européenne : traité de Rome (1957), Union européenne (Maastricht 1992)`,
    },
  },

  /* ─── GÉOGRAPHIE ──────────────────────────────────────────── */
  "Géographie": {
    "ALL": {
      horaire: "180",
      coefficient: 2,
      chapitres: [
        "Géographie du Sénégal — relief et hydrographie",
        "Géographie du Sénégal — climat et végétation",
        "Géographie du Sénégal — population et urbanisation",
        "Géographie du Sénégal — agriculture et pêche",
        "Géographie du Sénégal — industrie et énergie",
        "Géographie de l'Afrique occidentale",
        "Géographie du continent africain",
        "Géographie mondiale — pays développés et en développement",
        "Mondialisation et échanges internationaux",
        "Environnement et développement durable",
      ],
      contenu: `PROGRAMME DE GÉOGRAPHIE — TOUTES SÉRIES BAC (Sénégal)
Durée épreuve: 3h — Coeff. 2

GÉOGRAPHIE DU SÉNÉGAL

Relief et hydrographie
Zones de relief : plateau de Thiès, Casamance, Pays bassari ; littoral (Petite Côte, Grande Côte)
Fleuves : Sénégal, Gambie, Casamance, Saloum
Ressources en eau, fleuve Sénégal et Organisation pour la Mise en Valeur du fleuve Sénégal (OMVS)

Climat et végétation
Zones climatiques : sahélienne (nord), soudanienne (centre), subguinéenne (sud)
Pluviométrie, isohyètes, variations saisonnières
Végétation : steppe, savane, forêt-galerie, mangrove ; désertification et déforestation

Population et urbanisation
Démographie : effectifs, croissance, densité, répartition
Groupes ethniques : Wolof, Pulaar, Sérère, Diola, Mandingue, Soninké…
Migrations : rurales, internationales (diaspora)
Villes : Dakar (capitale), Saint-Louis, Thiès, Ziguinchor, Kaolack ; bidonvilles, étalement urbain

Agriculture
Cultures vivrières : mil, sorgho, maïs, riz
Cultures de rente : arachide, coton, canne à sucre
Zones agropastorales : bassin arachidier, vallée du fleuve Sénégal
Défis : sécheresse, dégradation des sols, modernisation

Pêche
Pêche artisanale et industrielle, potentiel maritime
Ports de pêche : Mbour, Joal, Saint-Louis, Dakar (Soumbédioune)
Exportations, surpêche, gestion durable

Industrie et énergie
Industries : Industries Chimiques du Sénégal (ICS), cimenteries, agroalimentaire, textile
Ressources énergétiques : pétrole (gisement offshore Sangomar), gaz naturel (GTA), solaire, hydroélectricité (OMVS)
Plan Sénégal Émergent (PSE) et Vision 2035

GÉOGRAPHIE AFRICAINE ET MONDIALE

Afrique de l'Ouest
CEDEAO, espaces économiques, migrations régionales
Grands États : Nigeria, Ghana, Côte d'Ivoire, Mali, Guinée

Le continent africain
Diversité géographique, enjeux de développement
Organisations africaines : Union africaine (UA), CEDEAO, UEMOA

Pays développés et en développement
PIB, IDH, critères de développement
Pôles : Triade (USA, Europe, Japon), puissances émergentes (BRICS)

Mondialisation
Échanges commerciaux, multinationales, flux financiers
Intégration régionale (UE, CEDEAO) et inégalités mondiales

Environnement et développement durable
Changement climatique, effet de serre
Désertification, déforestation, érosion côtière au Sénégal
Objectifs de Développement Durable (ODD)`,
    },
  },

  /* ─── HISTOIRE-GÉOGRAPHIE (combinée) ─────────────────────── */
  "Histoire-Géographie": {
    "ALL": {
      horaire: "180",
      coefficient: 3,
      chapitres: [
        "Histoire — L'Afrique précoloniale",
        "Histoire — La colonisation et les résistances",
        "Histoire — Guerres mondiales",
        "Histoire — Décolonisation et indépendance du Sénégal",
        "Histoire — Guerre froide et monde contemporain",
        "Géographie — Le Sénégal",
        "Géographie — L'Afrique",
        "Géographie — Mondialisation",
        "Géographie — Développement durable",
      ],
      contenu: `PROGRAMME D'HISTOIRE-GÉOGRAPHIE — BAC Sénégal
Durée épreuve: 3h

Voir contenu détaillé sous "Histoire" et "Géographie" ci-dessus.

MÉTHODOLOGIE
Composition : introduction (contexte + problématique), développement organisé en 2-3 parties, conclusion (bilan + ouverture)
Étude de document : nature, contexte, auteur, thèse, intérêt et limites
Commentaire de carte ou schéma géographique`,
    },
  },

  /* ─── ANGLAIS ─────────────────────────────────────────────── */
  "Anglais": {
    "ALL": {
      horaire: "150",
      coefficient: 3,
      chapitres: [
        "Comprehension — reading texts",
        "Grammar — tenses (present, past, future)",
        "Grammar — conditionals",
        "Grammar — passive voice",
        "Grammar — reported speech",
        "Grammar — modal verbs",
        "Vocabulary — social and civic themes",
        "Vocabulary — environment and development",
        "Vocabulary — science and technology",
        "Writing — essay and argument",
        "Writing — letter and formal writing",
        "Oral expression",
      ],
      contenu: `PROGRAMME D'ANGLAIS — TOUTES SÉRIES BAC (Sénégal)
Durée épreuve: 2h30 — Coeff. 3 (L), 2 (S)

COMPRÉHENSION
Reading comprehension: factual, inferential and evaluative questions
Identifying main ideas, supporting details, writer's purpose and tone
Vocabulary in context

GRAMMAIRE
Tenses: simple present, present continuous, simple past, past continuous, present perfect, past perfect, future forms (will, going to, present continuous)
Conditional sentences: type 0, 1, 2, 3
Passive voice: all tenses
Reported speech: statements, questions, orders
Modal verbs: can/could, may/might, must/have to, should/ought to, would
Relative clauses: defining and non-defining
Gerunds and infinitives
Articles, determiners, quantifiers

VOCABULAIRE PAR THÈME
Société et citoyenneté : droits et devoirs, démocratie, justice, égalité, discrimination
Environnement : changement climatique, pollution, biodiversité, développement durable
Science et technologie : Internet, intelligence artificielle, médecine, espace
Santé : maladies, hygiène, système de santé
Éducation : système éducatif, défis, solutions
Développement de l'Afrique : agriculture, industrie, aide internationale
Culture et identité : traditions, mondialisation, langues

EXPRESSION ÉCRITE
Essay writing : introduction (hook, thesis), body paragraphs (argument + evidence + example), conclusion
Letter writing : formal letter (complaint, request, application) ; informal letter
Summary writing : main points only, own words
Dialogue completion

EXPRESSION ORALE
Pronunciation, intonation
Role play, discussion, debate
Presenting and arguing a point of view

BFEM
Durée: 2h + oral — Coeff. 3
Même thèmes mais niveau plus accessible
Questions de compréhension sur texte court
Grammaire de base : temps, modaux simples, passif
Écriture : paragraphe, lettre simple`,
    },
  },

  /* ─── COMPTABILITÉ ─────────────────────────────────────────── */
  "Comptabilité": {
    "G": {
      horaire: "180",
      coefficient: 5,
      chapitres: [
        "Bilan — actif et passif",
        "Compte de résultat",
        "Opérations courantes — achats et ventes",
        "TVA et taxes",
        "Immobilisations et amortissements",
        "Stocks et inventaire",
        "Paie et charges sociales",
        "Clôture des comptes",
        "Analyse financière",
        "Comptabilité de gestion — coûts",
      ],
      contenu: `PROGRAMME DE COMPTABILITÉ — SÉRIE G (BAC Sénégal)
Horaire: 6h/semaine — Durée épreuve: 3h — Coeff. 5

COMPTABILITÉ GÉNÉRALE (SYSCOHADA)

Bilan
Structure du bilan : actif (immobilisations, stocks, créances, trésorerie) et passif (capitaux propres, dettes)
Équilibre du bilan : actif = passif
Lecture et interprétation du bilan

Compte de résultat
Produits d'exploitation, financiers, exceptionnels
Charges d'exploitation, financières, exceptionnelles
Calcul du résultat net : produits − charges

Opérations courantes
Achats et ventes : journal, grand livre, balance
Factures : remises, rabais, escomptes de règlement
TVA : mécanisme, déclaration, TVA déductible/collectée

Immobilisations
Nature : corporelles, incorporelles, financières
Amortissements : méthode linéaire, dégressif ; tableau d'amortissement
Cession d'immobilisation, valeur nette comptable, plus/moins-value

Stocks
Méthodes d'évaluation : CMUP, FIFO
Inventaire, régularisation (variation de stocks)
Dépréciation des stocks

Paie et charges sociales
Calcul du salaire brut, cotisations salariales et patronales (IPRES, CSS)
Salaire net, bulletin de paie
Comptabilisation de la paie

Clôture des comptes
Régularisations : charges et produits constatés d'avance, charges à payer, produits à recevoir
Provisions, dépréciations
Détermination du résultat

COMPTABILITÉ ANALYTIQUE
Méthode des coûts complets : coûts d'achat, de production, de revient
Calcul et imputation des charges
Analyse des écarts`,
    },
  },
};

/* ─── DURÉES OFFICIELLES DES ÉPREUVES (en minutes) ──────────── */
export const DUREES_OFFICIELLES: Record<string, Record<string, number>> = {
  BAC: {
    "Maths": 240,
    "Français": 240,
    "Philosophie": 240,
    "Sciences Physiques": 210,
    "Sciences Naturelles": 210,
    "Histoire-Géographie": 180,
    "Histoire": 180,
    "Géographie": 180,
    "Anglais": 150,
    "Comptabilité": 180,
    "Education Physique": 120,
  },
  BFEM: {
    "Maths": 180,
    "Français": 180,
    "Sciences Physiques": 120,
    "Sciences Naturelles": 120,
    "Histoire-Géographie": 120,
    "Anglais": 120,
    "Education Civique": 60,
  },
};

/* ─── SÉRIES ET MATIÈRES ─────────────────────────────────────── */
export const SERIES_BAC = ["L1", "L2", "S1", "S2", "S3", "S4", "G"] as const;
export const SERIES_BFEM = ["BFEM"] as const;

export const MATIERES_BY_SERIE: Record<string, string[]> = {
  L1: ["Français", "Philosophie", "Histoire-Géographie", "Anglais", "Maths", "Sciences Naturelles"],
  L2: ["Français", "Philosophie", "Histoire-Géographie", "Anglais", "Maths", "Sciences Physiques", "Sciences Naturelles"],
  S1: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie", "Histoire-Géographie", "Anglais"],
  S2: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie", "Histoire-Géographie", "Anglais"],
  S3: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie", "Histoire-Géographie", "Anglais"],
  S4: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie", "Histoire-Géographie", "Anglais"],
  G:  ["Comptabilité", "Maths", "Français", "Histoire-Géographie", "Anglais"],
  BFEM: ["Maths", "Français", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Anglais"],
};

/* ─── HELPER: récupérer le programme d'une matière/série ────── */
export function getProgramme(matiere: string, serie: string): ProgrammeMatiere | null {
  const mat = PROGRAMMES_OFFICIELS[matiere];
  if (!mat) return null;
  // Exact match
  if (mat[serie]) return mat[serie];
  // L séries use "L" key for Maths
  if ((serie === "L1" || serie === "L2") && mat["L"]) return mat["L"];
  // ALL fallback (Philosophie, Histoire, Géographie, Anglais)
  if (mat["ALL"]) return mat["ALL"];
  return null;
}

/* ─── HELPER: durée officielle ────────────────────────────────── */
export function getDureeOfficielle(examType: string, matiere: string): number {
  return DUREES_OFFICIELLES[examType]?.[matiere] ?? 180;
}
