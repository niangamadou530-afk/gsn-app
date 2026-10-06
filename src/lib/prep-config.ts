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
