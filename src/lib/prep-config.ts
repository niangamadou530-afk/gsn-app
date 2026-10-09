/**
 * Configuration officielle et prévisionnelle des examens GSN PREP (Sénégal)
 * Calendrier officiel du BAC et du BFEM 2027 par série.
 * Source principale : Office du Baccalauréat du Sénégal (officedubac.sn)
 * et Direction des Examens et Concours (DEXCO) du Ministère de l'Éducation Nationale du Sénégal.
 */

export interface SeriesExamDate {
  code: string;
  name: string;
  examType: "BAC" | "BFEM";
  category: "Général" | "Technique" | "Moyen";
  targetDate: string; // Format YYYY-MM-DD
  targetTimeUtc: string; // Heure UTC / Sénégal (Dakar = GMT+0)
  displayDateFr: string;
  confirmee: "oui" | "non";
  source: string;
  statutNote: string;
}

export interface ExamDetail {
  id: "BAC" | "BFEM";
  label: string;
  fullName: string;
  session: string;
  targetDate: string; // Format YYYY-MM-DD
  targetTimeUtc: string;
  displayDateFr: string;
  displayDateEn: string;
  description: string;
  referenceNote: string;
  confirmee: "oui" | "non";
  source: string;
  series: string[];
}

/**
 * Dates de référence prévisionnelles (les plus répandues) pour la session 2027
 */
export const EXAM_CONFIG: Record<"BAC" | "BFEM", ExamDetail> = {
  BAC: {
    id: "BAC",
    label: "BAC 2027",
    fullName: "Baccalauréat Général & Technique",
    session: "Session Normale 2027",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    displayDateEn: "June 29, 2027",
    description: "Séries Littéraires, Scientifiques, Techniques et Gestion",
    referenceNote: "Date de référence : la plupart des séries (date estimée, à confirmer)",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) - Projection session normale (date estimée, à confirmer par arrêté ministériel MEN)",
    series: ["S1", "S2", "S3", "S4", "S5", "L1", "L2", "L'1", "L-AR", "STEG", "STIDD", "T1", "T2", "F6"],
  },
  BFEM: {
    id: "BFEM",
    label: "BFEM 2027",
    fullName: "Brevet de Fin d'Études Moyennes",
    session: "Session Normale Juillet 2027",
    targetDate: "2027-07-13",
    targetTimeUtc: "07:30:00Z",
    displayDateFr: "13 juillet 2027",
    displayDateEn: "July 13, 2027",
    description: "Enseignement Moyen Général & Arabe",
    referenceNote: "Date de référence du BFEM (estimée, à confirmer)",
    confirmee: "non",
    source: "Direction des Examens et Concours (DEXCO) - Ministère de l'Éducation Nationale du Sénégal (date estimée, à confirmer)",
    series: ["BFEM Général", "BFEM Option Arabe"],
  },
};

/**
 * Calendrier complet par série (S1, S2, S3, S4, S5, L1, L2, L'1, L-AR, STEG, STIDD, T1, T2, F6, BFEM)
 * Chaque entrée indique explicitement la source et le statut de confirmation.
 */
export const SERIES_EXAM_CALENDAR: SeriesExamDate[] = [
  // ── BAC GÉNÉRAL (Fin juin / début juillet) ──
  {
    code: "S1",
    name: "Série S1 — Sciences exactes (Maths & Physiques)",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "S2",
    name: "Série S2 — Sciences expérimentales (SVT, PC & Maths)",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "S3",
    name: "Série S3 — Sciences et techniques industrielles",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "S4",
    name: "Série S4 — Sciences agronomiques",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "S5",
    name: "Série S5 — Sciences agroalimentaires & bio-ressources",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "L1",
    name: "Série L1 — Lettres classiques et langues vivantes",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "L2",
    name: "Série L2 — Lettres et sciences humaines",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "L'1",
    name: "Série L'1 — Langues et civilisations modernes",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Projection session normale",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "L-AR",
    name: "Série L-AR — Lettres et Langue Arabe (Franco-Arabe)",
    examType: "BAC",
    category: "Général",
    targetDate: "2027-06-29",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "29 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Section Franco-Arabe",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },

  // ── BAC TECHNIQUE (Départ anticipé mi-juin) ──
  {
    code: "STEG",
    name: "Série STEG — Sciences & Technologies de l'Économie et de la Gestion",
    examType: "BAC",
    category: "Technique",
    targetDate: "2027-06-15",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "15 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Session avancée Bac Technique",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "STIDD",
    name: "Série STIDD — Sciences & Technologies Industrielles et DD",
    examType: "BAC",
    category: "Technique",
    targetDate: "2027-06-15",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "15 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Session avancée Bac Technique",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "T1",
    name: "Série T1 — Génie mécanique et fabrication mécanique",
    examType: "BAC",
    category: "Technique",
    targetDate: "2027-06-15",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "15 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Épreuves pratiques et écrites techniques",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "T2",
    name: "Série T2 — Électrotechnique et électronique appliquée",
    examType: "BAC",
    category: "Technique",
    targetDate: "2027-06-15",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "15 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Épreuves pratiques et écrites techniques",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "F6",
    name: "Série F6 — Chimie de laboratoire et biologie médicale",
    examType: "BAC",
    category: "Technique",
    targetDate: "2027-06-15",
    targetTimeUtc: "08:00:00Z",
    displayDateFr: "15 juin 2027",
    confirmee: "non",
    source: "Office du Baccalauréat du Sénégal (officedubac.sn) — Épreuves de travaux pratiques de labo",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },

  // ── BFEM (Mi-juillet) ──
  {
    code: "BFEM",
    name: "BFEM Général — Enseignement Moyen (Collège)",
    examType: "BFEM",
    category: "Moyen",
    targetDate: "2027-07-13",
    targetTimeUtc: "07:30:00Z",
    displayDateFr: "13 juillet 2027",
    confirmee: "non",
    source: "Direction des Examens et Concours (DEXCO) / MEN Sénégal — Calendrier habituel du Brevet",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
  {
    code: "BFEM-AR",
    name: "BFEM Option Arabe — Enseignement Moyen Franco-Arabe",
    examType: "BFEM",
    category: "Moyen",
    targetDate: "2027-07-13",
    targetTimeUtc: "07:30:00Z",
    displayDateFr: "13 juillet 2027",
    confirmee: "non",
    source: "Direction des Examens et Concours (DEXCO) / MEN Sénégal — Section Franco-Arabe",
    statutNote: "Date estimée, à confirmer par arrêté ministériel",
  },
];

/**
 * Clé de stockage local pour la date personnalisée de l'élève
 */
export const LOCAL_STORAGE_EXAM_DATE_KEY = "gsn_prep_custom_exam_date";

export interface CustomExamDateRecord {
  date: string; // YYYY-MM-DD
  timeUtc: string; // HH:mm:ssZ
  displayDateFr: string;
  seriesCode?: string;
  label?: string;
  source?: string;
  isCustom: boolean;
}

/**
 * Récupère la date d'examen effective d'une série ou par défaut
 */
export function getSeriesExamInfo(seriesCode?: string | null, examType: string = "BAC"): SeriesExamDate {
  const normType = (examType || "").toUpperCase() === "BFEM" ? "BFEM" : "BAC";
  if (normType === "BFEM") {
    const found = SERIES_EXAM_CALENDAR.find(s => s.code === (seriesCode || "BFEM"));
    return found || SERIES_EXAM_CALENDAR.find(s => s.code === "BFEM")!;
  }
  const cleanCode = (seriesCode || "").trim().toUpperCase();
  const match = SERIES_EXAM_CALENDAR.find(s => s.code.toUpperCase() === cleanCode);
  if (match) return match;
  // Par défaut S2 (série la plus représentée)
  return SERIES_EXAM_CALENDAR.find(s => s.code === "S2")!;
}

/**
 * Charge la date personnalisée depuis localStorage (côté client uniquement)
 */
export function loadStoredCustomExamDate(): CustomExamDateRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_EXAM_DATE_KEY);
    if (!val) return null;
    return JSON.parse(val) as CustomExamDateRecord;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde la date personnalisée dans localStorage
 */
export function saveCustomExamDate(record: CustomExamDateRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_EXAM_DATE_KEY, JSON.stringify(record));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Réinitialise la date personnalisée
 */
export function clearCustomExamDate(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_EXAM_DATE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Calcule les jours restants pour le dashboard ou la landing page
 */
export function getExamCountdown(examType: string = "BAC", customDate?: string | null): {
  days: number;
  label: string;
  targetDate: string;
  displayDate: string;
  urgencyLevel: "normal" | "warning" | "urgent";
} {
  const normalized = (examType || "").toUpperCase() === "BFEM" ? "BFEM" : "BAC";
  const defaultExam = EXAM_CONFIG[normalized];

  const targetDateStr = customDate || defaultExam.targetDate;
  const targetIso = `${targetDateStr}T${defaultExam.targetTimeUtc}`;
  const targetTime = new Date(targetIso).getTime();
  const now = Date.now();
  const diffMs = targetTime - now;
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let urgencyLevel: "normal" | "warning" | "urgent" = "normal";
  if (days <= 30) {
    urgencyLevel = "urgent";
  } else if (days <= 90) {
    urgencyLevel = "warning";
  }

  return {
    days,
    label: defaultExam.label,
    targetDate: targetDateStr,
    displayDate: defaultExam.displayDateFr,
    urgencyLevel,
  };
}

/**
 * Configuration du support officiel WhatsApp pour GSN PREP
 * Centralisée ici pour modification globale en un seul endroit.
 */
export const PREP_WHATSAPP_SUPPORT = {
  /** Numéro au format international sans signe + ni espaces (ex: 221781246504) */
  phoneRaw: "221781246504",
  /** Numéro lisible pour affichage (ex: +221 78 124 65 04) */
  phoneFormatted: "+221 78 124 65 04",
  /** Indicatif pays */
  countryCode: "+221",
  /** Lien direct vers WhatsApp avec message d'assistance générale */
  getGeneralHelpUrl: (customMessage?: string) => {
    const text = customMessage || "Bonjour GSN PREP, j'ai besoin d'aide pour mon compte ou mes révisions.";
    return `https://wa.me/221781246504?text=${encodeURIComponent(text)}`;
  },
  /** Lien direct vers WhatsApp pour mot de passe oublié avec identifiant prérempli */
  getPasswordResetUrl: (identifier?: string) => {
    const id = identifier && identifier.trim() ? identifier.trim() : "[Mon numéro d'inscription]";
    const text = `Bonjour GSN PREP, j'ai oublié mon mot de passe. Mon numéro d'inscription est : ${id}`;
    return `https://wa.me/221781246504?text=${encodeURIComponent(text)}`;
  },
};

/**
 * Contact officiel et responsabilité de traitement des données pour GSN PREP
 */
export const PREP_CONTACT_EMAIL = "globalskillsnetwork36@gmail.com";
export const PREP_RESPONSIBLE_NAME = "Amadou Niang";

export const PREP_LEGAL_CONFIG = {
  publisher: "Global Skills Network (GSN)",
  responsibleName: PREP_RESPONSIBLE_NAME,
  contactEmail: PREP_CONTACT_EMAIL,
  supportPhoneFormatted: "+221 78 124 65 04",
  supportPhoneRaw: "221781246504",
  address: "Dakar, République du Sénégal",
};

/**
 * Quotas quotidiens d'utilisation IA par élève
 * Centralisés en un point unique pour :
 * 1. Les vérifications serveur (/api/prep-generate, /api/prep-coach)
 * 2. Les messages envoyés à l'élève (« 10/10 », etc.)
 * 3. L'affichage en direct sur le Dashboard (/prep/dashboard)
 */
export type PrepUsageField = "coach_count" | "quiz_count" | "flashcards_count" | "resume_count";

export const PREP_DAILY_QUOTAS: Record<PrepUsageField, number> = {
  coach_count: 10,
  quiz_count: 5,
  flashcards_count: 4,
  resume_count: 3,
};

export const PREP_QUOTA_DETAILS: Record<PrepUsageField, { label: string; limit: number; icon: string; description: string }> = {
  coach_count: {
    label: "Coach IA Personnel",
    limit: PREP_DAILY_QUOTAS.coach_count,
    icon: "smart_toy",
    description: "Questions pédagogiques et méthodologie",
  },
  quiz_count: {
    label: "Génération de Quiz",
    limit: PREP_DAILY_QUOTAS.quiz_count,
    icon: "quiz",
    description: "Séries de QCM avec explications",
  },
  flashcards_count: {
    label: "Fiches Flashcards",
    limit: PREP_DAILY_QUOTAS.flashcards_count,
    icon: "style",
    description: "Mémorisation active par chapitre",
  },
  resume_count: {
    label: "Résumés de cours",
    limit: PREP_DAILY_QUOTAS.resume_count,
    icon: "auto_stories",
    description: "Synthèses ciblées par matière",
  },
};

/**
 * Configuration centralisée des animations de défilement pour GSN PREP.
 * Trois niveaux disponibles : "douce", "moyenne", "marquee".
 * Pour changer de niveau global en une ligne, modifier PREP_MOTION_ACTIVE_LEVEL ci-dessous.
 */
export type PrepMotionLevel = "douce" | "moyenne" | "marquee";

export interface PrepMotionSettings {
  distanceY: number; // en px
  initialScale: number;
  durationMs: number;
  staggerMs: number;
  easing: string;
}

export const PREP_MOTION_PRESETS: Record<PrepMotionLevel, PrepMotionSettings> = {
  douce: {
    distanceY: 14,
    initialScale: 1.0,
    durationMs: 360,
    staggerMs: 50,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  moyenne: {
    distanceY: 28,
    initialScale: 0.97,
    durationMs: 520,
    staggerMs: 90,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  marquee: {
    distanceY: 48,
    initialScale: 0.94,
    durationMs: 700,
    staggerMs: 120,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};

// RÉGLAGE UNIQUE : changer "marquee" en "moyenne" ou "douce" pour basculer toute l'application
export const PREP_MOTION_ACTIVE_LEVEL: PrepMotionLevel = "marquee";

export const PREP_MOTION: PrepMotionSettings = PREP_MOTION_PRESETS[PREP_MOTION_ACTIVE_LEVEL];

/* ── CONFIGURATION DU COACH IA (PARTIE K) ─────────────────── */

export const PREP_COACH_RETENTION_DAYS = 90;

export const PREP_COACH_CONFIG = {
  retentionDays: PREP_COACH_RETENTION_DAYS,
  maxConversations: 50,
  maxMessagesPerConversation: 200,
  maxFilesTotal: 100,
  maxFileCharLength: 40000,
  maxNewConversationsPerDay: 20,
  chatMaxTokens: 500,
  fileMaxTokens: 1800,
  titleMaxLength: 60,
  recentHistoryLimit: 6,
} as const;

/* ── CONTRÔLE DES INSCRIPTIONS (PARTIE K6) ─────────────────── */
// Tableau des profils actuellement ouverts aux nouvelles inscriptions
// Pour rouvrir un espace ultérieurement, ajouter simplement son identifiant (ex: "professionnel")
export const GSN_SIGNUP_OPEN_PROFILES = ["eleve"] as const;
export type GsnOpenProfile = (typeof GSN_SIGNUP_OPEN_PROFILES)[number];

export const GSN_SIGNUP_CLOSED_MESSAGE =
  "En construction : les inscriptions ouvriront bientôt.";

export const GSN_SIGNUP_BANNER_NOTICE =
  "Pour le moment, seule l'inscription élève GSN PREP est ouverte.";

export function isSignupProfileOpen(profileType: string | null | undefined): boolean {
  if (!profileType) return false;
  return (GSN_SIGNUP_OPEN_PROFILES as readonly string[]).includes(profileType);
}

/* ── VISITE GUIDÉE INTERACTIVE PREP (PARTIE K4) ─────────────── */

export const PREP_GUIDE_NAME = "Prépy";

// Réglage pose par pose du support de fond transparent (true = sans cadre ni fond uni, false = cercle doux)
export const PREP_GUIDE_TRANSPARENT: Record<TourGuideAttitude, boolean> = {
  accueil: true,
  montre: true,
  encourage: true,
  felicite: true,
  reflechit: true,
  erreur: true,
  idle: true,
};

export type TourPlacement = "haut" | "bas" | "gauche" | "droite" | "auto";
export type TourGuideAttitude = "accueil" | "montre" | "encourage" | "felicite" | "reflechit" | "erreur" | "idle";

export interface PrepTourStep {
  id: string;
  route: string;
  cible?: string; // Sélecteur attribut data-tour
  titre: string;
  texte: string;
  placement?: TourPlacement;
  attitude?: TourGuideAttitude;
  avant?: string; // Nom de l'événement CustomEvent à émettre avant (ex: prep-tour:open-coach-drawer)
  apres?: string; // Nom de l'événement CustomEvent à émettre après (ex: prep-tour:close-coach-drawer)
}

export const PREP_TOUR_STEPS: PrepTourStep[] = [
  {
    id: "welcome",
    route: "/prep/dashboard",
    titre: "Bienvenue sur PREP",
    texte: "Je te montre PREP en 2 minutes. Tu peux arrêter quand tu veux.",
    attitude: "accueil",
    placement: "auto",
  },
  {
    id: "countdown",
    route: "/prep/dashboard",
    cible: "dashboard-countdown",
    titre: "Le compte à rebours",
    texte: "Visualise ici les jours restants avant le début des épreuves selon ta série. Prépare-toi avec sérénité et régularité.",
    attitude: "montre",
    placement: "bas",
  },
  {
    id: "daily-action",
    route: "/prep/dashboard",
    cible: "dashboard-daily-action",
    titre: "Ton entraînement du jour",
    texte: "Ton entraînement du jour est ici. Chaque matin, lance ta séance recommandée pour t'entraîner sur les notions clés de ta série.",
    attitude: "montre",
    placement: "haut",
  },
  {
    id: "settings-menu",
    route: "/prep/dashboard",
    cible: "settings-menu-panel",
    titre: "Paramètres & Réglages",
    texte: "Gère ton profil, active ou coupe le son, contacte l'aide WhatsApp, revois ce guide ou déconnecte-toi en toute sécurité.",
    attitude: "montre",
    placement: "bas",
    avant: "prep-tour:open-settings",
    apres: "prep-tour:close-settings",
  },
  {
    id: "epreuves",
    route: "/prep/epreuves",
    cible: "epreuves-filters",
    titre: "Annales & Corrigés",
    texte: "Filtre par année, série ou matière. Consulte les vrais sujets du BAC et accède aux corrigés détaillés avec leurs barèmes.",
    attitude: "montre",
    placement: "bas",
  },
  {
    id: "generer",
    route: "/prep/generer",
    cible: "generer-options",
    titre: "Quiz, Flashcards & Résumés",
    texte: "Révise à partir de ton programme ou envoie la photo d'un cours. Génère des quiz d'entraînement, fiches et cartes mémoires.",
    attitude: "encourage",
    placement: "bas",
  },
  {
    id: "coach-input",
    route: "/prep/coach",
    cible: "coach-input",
    titre: "Ton Coach IA personnel",
    texte: "Pose tes questions sur une leçon difficile ou demande un exercice type examen. Ton coach te répond 24h/24 en français clair.",
    attitude: "montre",
    placement: "haut",
  },
  {
    id: "coach-drawer",
    route: "/prep/coach",
    cible: "coach-drawer-panel",
    titre: "Conversations & Fichiers",
    texte: "Retrouve tes anciennes discussions, lance une nouvelle conversation et accède à tous tes exercices ou fiches générés directement.",
    attitude: "montre",
    placement: "droite",
    avant: "prep-tour:open-coach-drawer",
    apres: "prep-tour:close-coach-drawer",
  },
  {
    id: "coach-private",
    route: "/prep/coach",
    cible: "coach-private-notice",
    titre: "Échanges 100% privés",
    texte: "Tes parents ne peuvent pas les voir depuis l'Espace Parents. Tes discussions et tes fichiers générés restent strictement confidentiels.",
    attitude: "encourage",
    placement: "haut",
  },
  {
    id: "simulateur",
    route: "/prep/simulateur",
    cible: "simulateur-verdict",
    titre: "Simulateur de moyenne & Mention",
    texte: "Calcule ta moyenne, corrige un coefficient si besoin, ajoute des matières. Découvre ton verdict prévisionnel au BAC.",
    attitude: "montre",
    placement: "bas",
  },
  {
    id: "orientation",
    route: "/prep/orientation",
    cible: "orientation-upload-zone",
    titre: "Orientation post-bac & Filières",
    texte: "Découvre des pistes d'orientation adaptées à ta série et à tes points forts. Analyse tes bulletins pour explorer les filières universitaires.",
    attitude: "montre",
    placement: "bas",
  },
  {
    id: "soft-skills",
    route: "/prep/soft-skills",
    cible: "soft-skills-breathing",
    titre: "Gestion du stress & Méthodes",
    texte: "Gère ton stress et organise tes révisions. Utilise le minuteur de concentration, la respiration guidée et nos astuces bien-être.",
    attitude: "encourage",
    placement: "bas",
  },
  {
    id: "progression",
    route: "/prep/progression",
    cible: "progression-stats",
    titre: "Suivi de progression",
    texte: "Mesure ton score global, ta régularité et tes points forts. Identifie les matières prioritaires pour maximiser ta moyenne.",
    attitude: "montre",
    placement: "bas",
  },
  {
    id: "parent-code",
    route: "/prep/parent",
    cible: "parent-code-card",
    titre: "Code d'accès Espace Parents",
    texte: "Partage un code temporaire pour rassurer tes proches. Tu peux le renouveler ou l'annuler à tout moment en un clic.",
    attitude: "montre",
    placement: "bas",
  },
  {
    id: "parent-what-parents-see",
    route: "/prep/parent",
    cible: "parent-what-parents-see",
    titre: "Ce que voient tes parents",
    texte: "Tes parents voient : identité scolaire, moyenne générale et assiduité, scores par matière et activités récentes. Jamais tes messages ni fichiers.",
    attitude: "encourage",
    placement: "haut",
  },
  {
    id: "end",
    route: "/prep/dashboard",
    titre: "C'est parti !",
    texte: "Tu connais maintenant l'essentiel de PREP. Choisis par quoi débuter tes révisions aujourd'hui pour décrocher ta mention !",
    attitude: "felicite",
    placement: "auto",
  },
];


