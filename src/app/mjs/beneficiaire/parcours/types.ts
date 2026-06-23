export type QuizQ = {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};

export type Section = { title: string; content: string };

export type ModuleContenu = {
  id: string;
  titre: string;
  description: string;
  keywords: string[];
  exercises: string;
  sections: Section[];
  quiz: QuizQ[];
};

export type ParcoursDetail = {
  id: string;
  titre: string;
  description: string | null;
  niveau: string | null;
  duree_semaines: number | null;
  modules_total: number;
  modules_contenu: ModuleContenu[] | null;
  mjs_secteurs: { nom: string } | null;
};

export type ParcoursListItem = {
  id: string;
  titre: string;
  description: string | null;
  niveau: string | null;
  duree_semaines: number | null;
  modules_total: number;
  secteur_id: string;
};

export type Secteur = {
  id: string;
  nom: string;
  slug: string;
  icone: string | null;
  ordre: number;
};

export const NIVEAU_LABEL: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};
