import type { ModuleContenu } from "@/app/mjs/beneficiaire/parcours/types";

export function parseModulesJson(raw: string): ModuleContenu[] {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Pas de tableau JSON reçu");
  return JSON.parse(match[0]) as ModuleContenu[];
}

export function buildParcoursPrompt(p: {
  titre: string;
  niveau: string | null;
  duree_semaines: number | null;
  modules_total: number;
  secteurNom: string;
}): string {
  return `Génère le contenu détaillé d'un parcours de formation intitulé "${p.titre}" (secteur: ${p.secteurNom}, niveau: ${p.niveau}, durée: ${p.duree_semaines} semaines).

Réponds UNIQUEMENT avec un tableau JSON de ${p.modules_total} modules, sans texte autour, sans balises markdown :
[
  {
    "id": "m1",
    "titre": "Titre du module",
    "description": "Description courte en 1 phrase",
    "keywords": ["mot-clé 1", "mot-clé 2"],
    "exercises": "Énoncé d'un exercice pratique lié à ce module",
    "sections": [
      { "title": "Titre de section", "content": "Contenu HTML simple de la section (pas de balises complexes)" }
    ],
    "quiz": [
      { "question": "Question ?", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Explication courte" }
    ]
  }
]

Tout en français. Exactement ${p.modules_total} modules. 3 sections par module. 3 questions de quiz par module.`;
}
