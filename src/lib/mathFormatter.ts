/**
 * Module partagé de nettoyage pur et de formatage des réponses de l'IA (GSN PREP).
 *
 * RÈGLE ABSOLUE : Fonction pure sans dépendances externes.
 * - Supprime tous les artefacts d'IA, raisonnements internes (<think>, <reasoning>),
 *   marqueurs techniques (<<<FILE_START>>>, [[...]], undefined, null, \n littéraux).
 * - Nettoie et convertit tout LaTeX résiduel en texte lisible avec symboles Unicode.
 * - Ne modifie JAMAIS le contenu à l'intérieur des blocs de code markdown (```...```).
 * - Préserve intacte la virgule décimale (ex: 0,476) et les devises monétaires ($).
 */

/**
 * Nettoie le texte produit par l'IA et convertit tout LaTeX résiduel en texte mathématique clair.
 */
export function cleanAiText(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = String(raw);

  // 1. Extraire et protéger les blocs de code markdown
  const codeBlocks: string[] = [];
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 2. Nettoyer les balises de réflexion de modèles d'IA (DeepSeek, Llama, etc.)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<\/?think>/gi, "");
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  text = text.replace(/<\/?reasoning>/gi, "");
  text = text.replace(/<\/?(?:system|user|assistant|output|thought|meta)>/gi, "");

  // 3. Délimiteurs techniques de documents et balises
  text = text.replace(/<<<FILE_START>>>[\s\S]*?<<<FILE_END>>>/gi, "");
  text = text.replace(/<<<[^>]+>>>/gi, "");
  text = text.replace(/\[\[[\s\S]*?\]\]/gi, "");
  text = text.replace(/\bundefined\b/g, "");
  text = text.replace(/\bnull\b/g, "");

  // 4. Normalisation des retours à la ligne LaTeX et échappements littéraux
  text = text.replace(/\\newline\b/g, "\n");
  text = text.replace(/\\\\/g, "\n");
  text = text.replace(/\\n/g, "\n");

  // 5. Normalisation des environnements LaTeX multi-lignes
  text = text.replace(/\\begin\{(?:cases|aligned|pmatrix|matrix)\}([\s\S]*?)\\end\{(?:cases|aligned|pmatrix|matrix)\}/g, (_m, body) => {
    return body.split(/\n/).map((l: string) => l.trim().replace(/&/g, "  ")).join("\n");
  });

  // 6. Ignorer les commandes de formatage et espaces LaTeX
  text = text.replace(/\\displaystyle\b/g, "");
  text = text.replace(/\\left\b/g, "");
  text = text.replace(/\\right\b/g, "");
  text = text.replace(/\\,/g, " ");
  text = text.replace(/\\;/g, " ");
  text = text.replace(/\\quad\b/g, "  ");
  text = text.replace(/\\qquad\b/g, "   ");
  text = text.replace(/\\%/g, "%");

  // 7. Retrait des délimiteurs de blocs mathématiques
  // Blocs multi-lignes \[ ... \] ou $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, c) => "\n" + c.trim() + "\n");
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, c) => "\n" + c.trim() + "\n");
  // Formules en ligne \( ... \)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, "$1");
  // Dollar isolé : ignorer les montants d'argent (ex: 500 $ ou 100$)
  text = text.replace(/\$([^\$\n]+?)\$/g, (m, expr) => {
    if (/^\s*\d+([.,]\d+)?\s*(F|CFA|EUR|USD|€|\$)?\s*$/i.test(expr)) return m;
    return expr;
  });

  // 8. Opérateurs et symboles mathématiques usuels
  const symbolMap: Array<[RegExp, string]> = [
    [/\\approx/g, "≈"],
    [/\\times/g, "×"],
    [/\\cdot/g, "·"],
    [/\\div/g, "÷"],
    [/\\pm/g, "±"],
    [/\\mp/g, "∓"],
    [/\\neq/g, "≠"],
    [/\\leq/g, "≤"],
    [/\\le\b/g, "≤"],
    [/\\geq/g, "≥"],
    [/\\ge\b/g, "≥"],
    [/\\in\b/g, "∈"],
    [/\\notin\b/g, "∉"],
    [/\\subset\b/g, "⊂"],
    [/\\infty/g, "∞"],
    [/\\rightarrow/g, "→"],
    [/\\to\b/g, "→"],
    [/\\leftarrow/g, "←"],
    [/\\implies/g, "⇒"],
    [/\\Rightarrow/g, "⇒"],
    [/\\iff/g, "⇔"],
    [/\\Leftrightarrow/g, "⇔"],
    [/\\sum/g, "∑"],
    [/\\prod/g, "∏"],
    [/\\int/g, "∫"],
    [/\\lim/g, "lim"],
    [/\\cup/g, "∪"],
    [/\\cap/g, "∩"],
    [/\\emptyset/g, "∅"],
    [/\\forall/g, "∀"],
    [/\\exists/g, "∃"],
    [/\\Delta/g, "Δ"],
    [/\\delta/g, "δ"],
    [/\\pi/g, "π"],
    [/\\theta/g, "θ"],
    [/\\alpha/g, "α"],
    [/\\beta/g, "β"],
    [/\\gamma/g, "γ"],
    [/\\lambda/g, "λ"],
    [/\\sigma/g, "σ"],
    [/\\omega/g, "ω"],
    [/\\Omega/g, "Ω"],
    [/\\mu/g, "µ"]
  ];
  for (const [re, sym] of symbolMap) {
    text = text.replace(re, sym);
  }

  // 9. Combinaisons \binom{n}{k} -> C(n, k)
  while (/\\binom\{([^{}]+)\}\{([^{}]+)\}/.test(text)) {
    text = text.replace(/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, "C($1, $2)");
  }

  // 10. Fractions récursives \frac, \dfrac, \tfrac
  while (/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/.test(text)) {
    text = text.replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, num, den) => {
      const cleanNum = num.length > 3 || /[\+\-\*\/]/.test(num) ? `(${num.trim()})` : num.trim();
      const cleanDen = den.length > 3 || /[\+\-\*\/]/.test(den) ? `(${den.trim()})` : den.trim();
      return `${cleanNum}/${cleanDen}`;
    });
  }

  // 11. Racines carrées et racines n-ièmes
  text = text.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, "$1√($2)");
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, "√($1)");

  // 12. Ensembles de nombres
  text = text.replace(/\\mathbb\{R\}/g, "ℝ");
  text = text.replace(/\\mathbb\{N\}/g, "ℕ");
  text = text.replace(/\\mathbb\{Z\}/g, "ℤ");
  text = text.replace(/\\mathbb\{Q\}/g, "ℚ");
  text = text.replace(/\\mathbb\{C\}/g, "ℂ");

  // 13. Textes, vecteurs et surlignages
  text = text.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, "$1");
  text = text.replace(/\\vec\{([^{}]+)\}/g, "vec($1)");
  text = text.replace(/\\overline\{([^{}]+)\}/g, "($1)");
  text = text.replace(/\\hat\{([^{}]+)\}/g, "($1)");

  // 14. Exposants et indices usuels
  const supMap: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "n": "ⁿ", "x": "ˣ"
  };
  const subMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "i": "ᵢ", "j": "ⱼ", "k": "ₖ", "n": "ₙ"
  };

  text = text.replace(/\^\{([0-9n\+\-]+)\}/g, (_m, exp) => exp.split("").map((c: string) => supMap[c] || c).join(""));
  text = text.replace(/\^([0-9nx])/g, (_m, c) => supMap[c] || `^${c}`);
  text = text.replace(/\_\{([0-9ijk\+\-]+)\}/g, (_m, sub) => sub.split("").map((c: string) => subMap[c] || c).join(""));
  text = text.replace(/\_([0-9ijk])/g, (_m, c) => subMap[c] || `_${c}`);

  // 15. Commandes inconnues restantes : retire la barre oblique inverse et conserve l'argument
  text = text.replace(/\\([a-zA-Z]+)\{([^{}]+)\}/g, "$2");
  text = text.replace(/\\([a-zA-Z]+)/g, "$1");

  // 16. Retrait des accolades orphelines
  text = text.replace(/\{([^{}]+)\}/g, "$1");
  text = text.replace(/[{}]/g, "");

  // 17. Restauration des blocs de code markdown
  codeBlocks.forEach((block, idx) => {
    text = text.replace(`__CODE_BLOCK_${idx}__`, block);
  });

  return text.trim();
}

/**
 * Nettoyage des artefacts techniques spécifiquement (alias de cleanAiText).
 */
export function cleanAiArtifacts(text: string): string {
  return cleanAiText(text);
}

/**
 * Formatage des formules mathématiques (alias de cleanAiText).
 */
export function formatMathFormulas(text: string): string {
  return cleanAiText(text);
}

/**
 * Formatage du texte de correction d'épreuve ou d'exercice.
 */
export function formatCorrectionText(text: string): string {
  return cleanAiText(text);
}
