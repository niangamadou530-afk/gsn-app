/**
 * Configuration officielle des examens GSN PREP (Sénégal)
 * Facilement modifiable pour chaque nouvelle session d'examen.
 */
export interface ExamDetail {
  id: "BAC" | "BFEM";
  label: string;
  fullName: string;
  session: string;
  targetDate: string; // Format YYYY-MM-DD
  displayDateFr: string;
  displayDateEn: string;
  description: string;
  series: string[];
}

export const EXAM_CONFIG: Record<"BAC" | "BFEM", ExamDetail> = {
  BAC: {
    id: "BAC",
    label: "BAC 2027",
    fullName: "Baccalauréat Général & Technique",
    session: "Session Normale Juillet 2027",
    targetDate: "2027-06-29", // Début des épreuves du BAC Sénégal 2027
    displayDateFr: "29 juin 2027",
    displayDateEn: "June 29, 2027",
    description: "Séries Littéraires, Scientifiques, Techniques et Gestion",
    series: ["S1", "S2", "S3", "S4", "S5", "L1", "L2", "L'1", "STEG", "STIDD", "T1", "T2", "F6"],
  },
  BFEM: {
    id: "BFEM",
    label: "BFEM 2027",
    fullName: "Brevet de Fin d'Études Moyennes",
    session: "Session Normale Juillet 2027",
    targetDate: "2027-07-13", // Début des épreuves du BFEM Sénégal 2027
    displayDateFr: "13 juillet 2027",
    displayDateEn: "July 13, 2027",
    description: "Enseignement Moyen Général & Arabe",
    series: ["Générale", "Option Arabe"],
  },
};

/**
 * Calcule le nombre de jours restants avant l'examen cible (2027)
 */
export function getExamCountdown(examType: string = "BAC"): {
  days: number;
  label: string;
  targetDate: string;
  displayDate: string;
  urgencyLevel: "normal" | "warning" | "urgent";
} {
  const normalized = (examType || "").toUpperCase() === "BFEM" ? "BFEM" : "BAC";
  const exam = EXAM_CONFIG[normalized];
  
  const targetTime = new Date(exam.targetDate + "T08:00:00Z").getTime();
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
    label: exam.label,
    targetDate: exam.targetDate,
    displayDate: exam.displayDateFr,
    urgencyLevel,
  };
}
