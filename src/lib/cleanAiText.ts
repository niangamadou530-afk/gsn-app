/**
 * Nettoyeur universel et pur de texte et formules mathématiques pour GSN PREP.
 * PHASE 1 (Partie G) :
 * 1. Convertit tout LaTeX résiduel en texte lisible (sans LaTeX, sans barre oblique inverse, sans délimiteurs)
 * 2. Gère récursivement fractions (\frac, \dfrac, \tfrac), combinaisons (\binom -> C(n, k)), racines (\sqrt), etc.
 * 3. Préserve les virgules décimales (ex: 0,476) et les symboles monétaires ($ suivis d'un chiffre).
 * 4. Supprime tous les artefacts techniques (balises de réflexion, délimiteurs de fichier <<<FILE...>>>, [[...]], fragments JSON).
 * 5. Ne modifie pas les blocs de code préformatés (```...```).
 */

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  "n": "ⁿ", "i": "ⁱ", "x": "ˣ", "y": "ʸ", "k": "ᵏ",
};

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "⁸", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "i": "ᵢ", "k": "ₖ", "m": "ₘ", "n": "ₙ", "o": "ₒ", "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "x": "ₓ",
};

function toSuperscript(s: string): string {
  if (/^[0-9+\-()nixyk]+$/.test(s)) {
    return s.split("").map((c) => SUPERSCRIPTS[c] || c).join("");
  }
  return `^(${s})`;
}

function toSubscript(s: string): string {
  if (/^[0-9+\-()aeikmnoprstx]+$/.test(s)) {
    return s.split("").map((c) => SUBSCRIPTS[c] || c).join("");
  }
  return `_(${s})`;
}

function extractBalancedBraces(text: string, startIndex: number): { content: string; nextIndex: number } | null {
  if (text[startIndex] !== "{") return null;
  let depth = 0;
  let content = "";
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      depth++;
      if (depth > 1) content += ch;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { content, nextIndex: i + 1 };
      } else {
        content += ch;
      }
    } else {
      content += ch;
    }
  }
  return null;
}

function replaceFractions(str: string): string {
  let s = str;
  let changed = true;
  let guard = 0;
  while (changed && guard < 25) {
    guard++;
    changed = false;
    const match = s.match(/\\(?:d|t)?frac\s*\{/);
    if (!match || match.index === undefined) break;

    const fracStart = match.index;
    const openBrace1 = s.indexOf("{", fracStart);
    const arg1 = extractBalancedBraces(s, openBrace1);
    if (!arg1) break;

    let openBrace2 = arg1.nextIndex;
    while (openBrace2 < s.length && /\s/.test(s[openBrace2])) openBrace2++;

    if (s[openBrace2] === "{") {
      const arg2 = extractBalancedBraces(s, openBrace2);
      if (arg2) {
        const num = replaceFractions(formatMathSymbols(arg1.content.trim()));
        const den = replaceFractions(formatMathSymbols(arg2.content.trim()));

        const numWrap = /^[a-zA-Z0-9]+$/.test(num) ? num : `(${num})`;
        const denWrap = /^[a-zA-Z0-9]+$/.test(den) ? den : `(${den})`;

        const replaced = `${numWrap}/${denWrap}`;
        s = s.slice(0, fracStart) + replaced + s.slice(arg2.nextIndex);
        changed = true;
      }
    }
  }
  console.log("formatMathSegment output:", JSON.stringify(s));
return s;
}

function replaceBinomials(str: string): string {
  let s = str;
  let changed = true;
  let guard = 0;
  while (changed && guard < 25) {
    guard++;
    changed = false;
    const match = s.match(/\\binom\s*\{/);
    if (!match || match.index === undefined) break;

    const binomStart = match.index;
    const openBrace1 = s.indexOf("{", binomStart);
    const arg1 = extractBalancedBraces(s, openBrace1);
    if (!arg1) break;

    let openBrace2 = arg1.nextIndex;
    while (openBrace2 < s.length && /\s/.test(s[openBrace2])) openBrace2++;

    if (s[openBrace2] === "{") {
      const arg2 = extractBalancedBraces(s, openBrace2);
      if (arg2) {
        const n = replaceFractions(formatMathSymbols(arg1.content.trim()));
        const k = replaceFractions(formatMathSymbols(arg2.content.trim()));
        const replaced = `C(${n}, ${k})`;
        s = s.slice(0, binomStart) + replaced + s.slice(arg2.nextIndex);
        changed = true;
      }
    }
  }
  return s;
}

function replaceRoots(str: string): string {
  let s = str;
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, "^{$1}√($2)");

  let changed = true;
  let guard = 0;
  while (changed && guard < 20) {
    guard++;
    changed = false;
    const match = s.match(/\\sqrt\s*\{/);
    if (!match || match.index === undefined) break;

    const start = match.index;
    const openBrace = s.indexOf("{", start);
    const arg = extractBalancedBraces(s, openBrace);
    if (arg) {
      const inner = formatMathSymbols(arg.content.trim());
      const replaced = `√(${inner})`;
      s = s.slice(0, start) + replaced + s.slice(arg.nextIndex);
      changed = true;
    }
  }
  return s;
}

function formatMathSymbols(text: string): string {
  if (!text) return "";
  let s = text;

  // Opérateurs et symboles LaTeX
  s = s.replace(/\\times\b/g, "×");
  s = s.replace(/\\cdot\b/g, "·");
  s = s.replace(/\\pm\b/g, "±");
  s = s.replace(/\\mp\b/g, "∓");
  s = s.replace(/\\div\b/g, "÷");
  s = s.replace(/\\approx\b/g, "≈");
  s = s.replace(/\\neq\b/g, "≠");
  s = s.replace(/\\leq\b|\\le\b/g, "≤");
  s = s.replace(/\\geq\b|\\ge\b/g, "≥");
  s = s.replace(/\\infty\b/g, "∞");
  s = s.replace(/\\to\b|\\rightarrow\b/g, "→");
  s = s.replace(/\\leftarrow\b/g, "←");
  s = s.replace(/\\implies\b|\\Rightarrow\b/g, "⇒");
  s = s.replace(/\\iff\b|\\Leftrightarrow\b/g, "⇔");
  s = s.replace(/\\in\b/g, "∈");
  s = s.replace(/\\notin\b/g, "∉");
  s = s.replace(/\\subset\b/g, "⊂");
  s = s.replace(/\\subseteq\b/g, "⊆");
  s = s.replace(/\\cup\b/g, "∪");
  s = s.replace(/\\cap\b/g, "∩");
  s = s.replace(/\\emptyset\b|\\varnothing\b/g, "∅");
  s = s.replace(/\\sum\b/g, "∑");
  s = s.replace(/\\prod\b/g, "∏");
  s = s.replace(/\\int\b/g, "∫");
  s = s.replace(/\\lim\b/g, "lim");
  s = s.replace(/\\forall\b/g, "∀");
  s = s.replace(/\\exists\b/g, "∃");

  // Ensembles de nombres
  s = s.replace(/\\mathbb\{R\}|\\mathbf\{R\}/g, "ℝ");
  s = s.replace(/\\mathbb\{N\}|\\mathbf\{N\}/g, "ℕ");
  s = s.replace(/\\mathbb\{Z\}|\\mathbf\{Z\}/g, "ℤ");
  s = s.replace(/\\mathbb\{Q\}|\\mathbf\{Q\}/g, "ℚ");
  s = s.replace(/\\mathbb\{C\}|\\mathbf\{C\}/g, "ℂ");

  // Lettres grecques
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
  s = s.replace(/\\phi\b/g, "φ");
  s = s.replace(/\\rho\b/g, "ρ");
  s = s.replace(/\\tau\b/g, "τ");

  // Boîtes de texte
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]+)\}/g, "$1");

  // Vecteurs et surlignages
  s = s.replace(/\\vec\{([^{}]+)\}/g, "vec($1)");
  s = s.replace(/\\overline\{([^{}]+)\}/g, "bar($1)");
  s = s.replace(/\\hat\{([^{}]+)\}/g, "hat($1)");

  return s;
}

function formatMathSegment(text: string): string {
console.log("formatMathSegment input:", JSON.stringify(text));
  if (!text) return "";
  let s = text;

  // 1. Découpage en lignes LaTeX et retours à la ligne
  s = s.replace(/\\newline\b|\\\\/g, "\n");

  // 2. Ignorer modificateurs d'affichage
  s = s.replace(/\\(?:displaystyle|textstyle|scriptstyle|limits|nolimits)\b/g, "");

  // 3. Délimiteurs de taille \left, \right
  s = s.replace(/\\left[.\(\[\{\|]?/g, "");
  s = s.replace(/\\right[.\)\]\}\|]?/g, "");

  // 4. Espaces LaTeX
  s = s.replace(/\\(?:quad|qquad)\b/g, "  ");
  s = s.replace(/\\(?:,|;|!)\b/g, " ");
  s = s.replace(/\\%/g, "%");

  // 5. Environnements mathématiques usuels
  s = s.replace(/\\begin\{(?:cases|aligned|split|matrix|pmatrix|array)\}/g, "");
  s = s.replace(/\\end\{(?:cases|aligned|split|matrix|pmatrix|array)\}/g, "");

  // 6. Remplacement des symboles majeurs d'abord
  s = formatMathSymbols(s);

  // 7. Fractions, Combinaisons, Racines
  s = replaceFractions(s);
  s = replaceBinomials(s);
  s = replaceRoots(s);

  // 8. Puissances et indices avec accolades
  s = s.replace(/\^\{([^{}]+)\}/g, (_, exp) => toSuperscript(exp));
  s = s.replace(/_\{([^{}]+)\}/g, (_, sub) => toSubscript(sub));

  // 9. Puissances et indices simples
  s = s.replace(/\^([0-9a-zA-Z])/g, (_, exp) => toSuperscript(exp));
  s = s.replace(/_([0-9a-zA-Z])/g, (_, sub) => toSubscript(sub));

  // 10. Nettoyer toute commande LaTeX inconnue résiduelle
  s = s.replace(/\\([a-zA-Z]+)\{([^{}]+)\}/g, "$2");
  s = s.replace(/\\([a-zA-Z]+)/g, "$1");

  // 11. Nettoyer accolades résiduelles
  s = s.replace(/[\{\}]/g, "");

  return s;
}

export function cleanAiText(input: string): string {
  if (!input) return "";

  const codeBlocks: string[] = [];
  let s = input.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // 1. Balises de réflexion de modèles d'IA (DeepSeek / Reasoning / Think)
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, "");
  s = s.replace(/<\/?think>/gi, "");
  s = s.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  s = s.replace(/<\/?reasoning>/gi, "");

  // 2. Nettoyage des marqueurs de blocs de fichiers internes
  s = s.replace(/<<<FILE_START>>>[\s\S]*?<<<FILE_END>>>/gi, "");
  s = s.replace(/<<<FILE_START>>>[\s\S]*$/gi, "");
  s = s.replace(/<<<[^>]+>>>/gi, "");

  // 3. Suppression des fragments indésirables ("undefined", "null", [[...]])
  s = s.replace(/\[\[[\s\S]*?\]\]/g, "");
  s = s.replace(/\b(?:undefined|null)\b/g, "");

  // Sauts de ligne LaTeX et littéraux
  s = s.replace(/\\newline\b/g, "\n");
  s = s.replace(/\\n(?![a-zA-Z])/g, "\n");

  // 4. Balises de rôles ou balises HTML d'instruction
  s = s.replace(/<\/?(?:system|user|assistant|output|thought|meta|prompt)>/gi, "");

  // 5. Conversion des blocs LaTeX mathématiques hors ligne : \[ ... \] et $$ ... $$
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    const formatted = formatMathSegment(math.trim());
    return `\n${formatted}\n`;
  });
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const formatted = formatMathSegment(math.trim());
    return `\n${formatted}\n`;
  });

  // 6. Conversion des formules en ligne : \( ... \) et $ ... $
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => formatMathSegment(math.trim()));
  s = s.replace(/(^|[^\\])\$([^\$\n]+?)\$(?![0-9])/g, (_, prefix, math) => {
    if (/^\s*\d+([.,]\d+)?\s*$/.test(math)) {
      return `${prefix}$${math}$`;
    }
    return `${prefix}${formatMathSegment(math.trim())}`;
  });

  // 7. Passage général sur les symboles résiduels
  // s = formatMathSegment(s);

  // 8. Nettoyage des symboles Markdown parasites dans le chat
  s = s.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "");
  s = s.replace(/^[ \t]*\|([^\n]+)\|[ \t]*$/gm, "$1");
  s = s.replace(/^[ \t]*\|[-:\s|]+\|[ \t]*$/gm, "");

  // 9. Rétablissement des blocs de code
  codeBlocks.forEach((block, idx) => {
    s = s.replace(`___CODE_BLOCK_${idx}___`, block);
  });

  // 10. Aération
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

export function cleanChatBubbleText(text: string): string {
  if (!text) return "";
  let out = cleanAiText(text);
  out = out.replace(/^[ \t]*#{1,6}\s*(.+)$/gm, "$1");
  out = out.replace(/^[ \t]*\*\s+/gm, "• ");
  return out;
}
