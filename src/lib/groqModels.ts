/**
 * Configuration centralisée des identifiants de modèles Groq
 * Utilisé partout dans l'application :
 * - /api/prep-generate
 * - /api/prep-coach
 * - /api/prep-orientation
 * - /api/seed-programmes
 * - src/lib/mjs-parcours-server.ts
 */
export const GROQ_MODELS = {
  /** Modèle standard rapide (quiz QCM, flashcards, résumés, coach pédagogique, programmes) */
  DEFAULT: "openai/gpt-oss-20b",

  /** Modèle haute capacité pour la génération à partir d'un document ou cours élève */
  DOCUMENT: "openai/gpt-oss-120b",

  /** Modèle haute capacité (évaluation barèmes officiels et dissertations) */
  EVALUATE: "openai/gpt-oss-120b",

  /** Modèle vision multimodal (analyse d'images/photos de devoirs en préversion Groq) */
  VISION: "qwen/qwen3.8-27b",

  /** Modèle d'analyse pour le module MJS */
  MJS_PARCOURS: "llama-3.3-70b-versatile",
} as const;

/**
 * Taille maximale de texte d'un document en caractères
 * Par défaut : 6000 caractères (~1500 tokens, adapté à l'offre Groq actuelle ~8000 TPM)
 * Configurable via PREP_DOC_MAX_CHARS dans l'environnement
 */
export function getDocMaxChars(): number {
  if (typeof process !== "undefined" && process.env?.PREP_DOC_MAX_CHARS) {
    const parsed = parseInt(process.env.PREP_DOC_MAX_CHARS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 6000;
}

export const PHOTO_ANALYSIS_UNAVAILABLE_MESSAGE =
  "L'analyse de photo est momentanément indisponible, essaie avec du texte";
