/**
 * Utilitaire de nettoyage des artefacts IA et de formatage des formules mathématiques
 * pour l'application GSN PREP.
 *
 * Résout :
 * 1. Les artefacts dans les réponses de l'IA (<think>...</think>, balises internes,
 *    <<<FILE_START>>>, <<<FILE_END>>>, blocs de code résiduels).
 * 2. L'affichage propre des corrections et explications avec barème lisible.
 * 3. Le rendu esthétique et universel des formules mathématiques (LaTeX, symboles, fractions, exposants, racines).
 */

/**
 * Nettoie tous les artefacts techniques générés par les modèles d'IA (Groq, Llama, DeepSeek, etc.)
 */
export function cleanAiArtifacts(text: string): string {
  if (!text) return "";
  let out = text;

  // 1. Balises de réflexion de modèles type DeepSeek / reasoning models
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, "");
  out = out.replace(/<\/?think>/gi, "");
  out = out.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  out = out.replace(/<\/?reasoning>/gi, "");

  // 2. Balises internes de fichiers PREP
  out = out.replace(/<<<FILE_START>>>[\s\S]*?<<<FILE_END>>>/gi, "");
  out = out.replace(/<<<FILE_START>>>[\s\S]*$/gi, "");
  out = out.replace(/<<<[^>]+>>>/gi, "");

  // 3. Balises résiduelles de rôle ou de métadonnées de chat
  out = out.replace(/<\/?(?:system|user|assistant|output|thought|meta)>/gi, "");

  // 4. Délimiteurs markdown de blocs résiduels enveloppant toute la réponse
  out = out.replace(/^```(?:markdown|latex|json|text)?\r?\n([\s\S]*?)\r?\n```$/i, "$1");

  // 5. Nettoyage des espaces et retours à la ligne superflus créés par le retrait des balises
  out = out.replace(/\n{3,}/g, "\n\n").trim();

  return out;
}

/**
 * Nettoie et transforme les formules mathématiques brutes (LaTeX, notations en ligne)
 * en texte et symboles Unicode clairs et lisibles immédiatement sur mobile et desktop.
 */
export function formatMathFormulas(text: string): string {
  if (!text) return "";
  let s = text;

  // Normalisation des délimiteurs LaTeX : \( ... \) -> $ ... $, \[ ... \] -> $$ ... $$
  s = s.replace(/\\?\(([\s\S]*?)\\?\)/g, "$$1$");
  s = s.replace(/\\?\[([\s\S]*?)\\?\]/g, "$$$$1$$$");

  // Remplacement des symboles LaTeX courants par leurs équivalents Unicode de haute qualité
  s = s.replace(/\\times\b/g, "×");
  s = s.replace(/\\cdot\b/g, "·");
  s = s.replace(/\\pm\b/g, "±");
  s = s.replace(/\\mp\b/g, "∓");
  s = s.replace(/\\div\b/g, "÷");
  s = s.replace(/\\approx\b/g, "≈");
  s = s.replace(/\\neq\b/g, "≠");
  s = s.replace(/\\le\b|\\leq\b/g, "≤");
  s = s.replace(/\\ge\b|\\geq\b/g, "≥");
  s = s.replace(/\\infty\b/g, "∞");
  s = s.replace(/\\to\b|\\rightarrow\b/g, "→");
  s = s.replace(/\\leftarrow\b/g, "←");
  s = s.replace(/\\Leftrightarrow\b/g, "⇔");
  s = s.replace(/\\Rightarrow\b/g, "⇒");
  s = s.replace(/\\in\b/g, "∈");
  s = s.replace(/\\notin\b/g, "∉");
  s = s.replace(/\\subset\b/g, "⊂");
  s = s.replace(/\\cup\b/g, "∪");
  s = s.replace(/\\cap\b/g, "∩");
  s = s.replace(/\\forall\b/g, "∀");
  s = s.replace(/\\exists\b/g, "∃");
  s = s.replace(/\\Delta\b/g, "Δ");
  s = s.replace(/\\delta\b/g, "δ");
  s = s.replace(/\\pi\b/g, "π");
  s = s.replace(/\\theta\b/g, "θ");
  s = s.replace(/\\alpha\b/g, "α");
  s = s.replace(/\\beta\b/g, "β");
  s = s.replace(/\\gamma\b/g, "γ");
  s = s.replace(/\\lambda\b/g, "λ");
  s = s.replace(/\\sigma\b/g, "σ");
  s = s.replace(/\\omega\b/g, "ω");
  s = s.replace(/\\Omega\b/g, "Ω");
  s = s.replace(/\\mu\b/g, "µ");
  s = s.replace(/\\sum\b/g, "∑");
  s = s.replace(/\\prod\b/g, "∏");
  s = s.replace(/\\int\b/g, "∫");

  // Remplacement des fractions LaTeX \frac{a}{b} -> (a)/(b) ou a/b
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  // Remplacement des racines carrées \sqrt{x} -> √(x)
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");
  s = s.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, "^{$1}√($2)");

  // Remplacement des textes LaTeX \text{...} ou \mathrm{...}
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, "$1");

  // Exposants usuels en chiffres simples : ^0 -> ⁰, ^1 -> ¹, ^2 -> ², ^3 -> ³, etc.
  s = s.replace(/\^2\b/g, "²");
  s = s.replace(/\^3\b/g, "³");
  s = s.replace(/\^0\b/g, "⁰");
  s = s.replace(/\^1\b/g, "¹");
  s = s.replace(/\^n\b/g, "ⁿ");

  // Nettoyage des $ résiduels isolés lorsqu'ils entourent une expression
  // $x^2 + y = 0$ -> x² + y = 0
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  s = s.replace(/\$([^\$\n]+?)\$/g, "$1");

  return s;
}

/**
 * Nettoie une correction ou explication d'IA pour lui donner un rendu impeccable,
 * aéré et lisible, avec mise en valeur des étapes de calcul et du barème.
 */
export function formatCorrectionText(text: string): string {
  if (!text) return "";
  const cleaned = cleanAiArtifacts(text);
  return formatMathFormulas(cleaned);
}
