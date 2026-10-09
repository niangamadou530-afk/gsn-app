"use client";

import React, { useMemo } from "react";
import { cleanAiArtifacts, formatMathFormulas } from "@/lib/mathFormatter";

interface MathRendererProps {
  content: string;
  className?: string;
  isCorrection?: boolean;
}

/**
 * Composant de rendu riche pour les explications, corrections et formules mathématiques.
 * Évite les artefacts IA et formate proprement les équations, étapes et barèmes.
 */
export function MathRenderer({
  content,
  className = "",
  isCorrection = false,
}: MathRendererProps) {
  const formattedHtml = useMemo(() => {
    if (!content) return "";

    // 1. Nettoyer les artefacts d'IA et de réflexion
    const cleaned = cleanAiArtifacts(content);

    // 2. Traiter ligne par ligne pour repérer les titres, étapes, barèmes et formules
    const rawLines = cleaned.split("\n");
    const outElements: string[] = [];
    let inList = false;

    const flushList = () => {
      if (inList) {
        outElements.push("</ul>");
        inList = false;
      }
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        outElements.push('<div class="h-2"></div>');
        continue;
      }

      // Détection de ligne de liste à puces ou numérotée
      const isBullet = /^[-*+•]\s/.test(trimmed);
      const isNumbered = /^\d+[\.)]\s/.test(trimmed);

      if (isBullet || isNumbered) {
        if (!inList) {
          outElements.push('<ul class="my-2 space-y-1.5 pl-1">');
          inList = true;
        }

        const rawText = trimmed.replace(/^[-*+•]\s/, "").replace(/^\d+[\.)]\s/, "");
        const formatted = formatMathFormulas(rawText)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\*\*(.+?)\*\*/g, "<strong class='font-bold text-slate-900'>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em class='italic'>$1</em>")
          .replace(/`(.+?)`/g, "<code class='px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-[#005bbf] font-semibold'>$1</code>");

        const bulletIcon = isNumbered
          ? `<span class="font-bold text-[#005bbf] text-xs shrink-0">${trimmed.match(/^\d+[\.)]/)?.[0] ?? "•"}</span>`
          : '<span class="text-[#005bbf] font-bold text-sm shrink-0 leading-none mt-0.5">•</span>';

        outElements.push(
          `<li class="flex items-start gap-2 text-sm leading-relaxed text-slate-800">${bulletIcon}<span>${formatted}</span></li>`
        );
        continue;
      } else {
        flushList();
      }

      // Détection des titres Markdown (#, ##, ###)
      if (trimmed.startsWith("### ")) {
        outElements.push(
          `<h4 class="text-sm font-extrabold text-slate-900 mt-3 mb-1 uppercase tracking-wider">${formatMathFormulas(trimmed.slice(4))}</h4>`
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        outElements.push(
          `<h3 class="text-base font-black text-[#005bbf] mt-4 mb-2 pb-1 border-b border-slate-100">${formatMathFormulas(trimmed.slice(3))}</h3>`
        );
        continue;
      }
      if (trimmed.startsWith("# ")) {
        outElements.push(
          `<h2 class="text-lg font-black text-slate-900 mt-3 mb-2">${formatMathFormulas(trimmed.slice(2))}</h2>`
        );
        continue;
      }

      // Détection de barème ou note d'examen : (x points) ou [x pts]
      const hasBareme = /\b(\d+(?:[,.]\d+)?\s*(?:points|pts|pt))\b/i.test(trimmed);

      // Détection d'une ligne de formule isolée
      const isMathFormulaLine =
        /^[=≈≤≥≠]/.test(trimmed) ||
        /\b(?:lim|f\(x\)|g\(x\)|P\(X|E\(X|V\(X|z\s*=|y\s*=|x\s*=)\b/i.test(trimmed) ||
        (/[=+\-*/÷×^√Δ∫∑∏]/.test(trimmed) && trimmed.length < 90 && !/[a-zA-Z]{6,}/.test(trimmed));

      if (isMathFormulaLine) {
        const mathFormatted = formatMathFormulas(trimmed)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        outElements.push(
          `<div class="my-2 px-3.5 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 font-mono text-xs sm:text-sm text-slate-900 font-bold overflow-x-auto shadow-2xs">${mathFormatted}</div>`
        );
        continue;
      }

      // Ligne de texte normale avec formatage en ligne
      let inlineFormatted = formatMathFormulas(trimmed)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong class='font-bold text-slate-900'>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em class='italic'>$1</em>")
        .replace(/`(.+?)`/g, "<code class='px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-[#005bbf] font-semibold'>$1</code>");

      if (hasBareme) {
        inlineFormatted = inlineFormatted.replace(
          /(\(\d+(?:[,.]\d+)?\s*(?:points|pts|pt)\))/gi,
          "<span class='inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black ml-1.5'>$1</span>"
        );
      }

      outElements.push(
        `<p class="text-sm leading-relaxed text-slate-800 my-1">${inlineFormatted}</p>`
      );
    }

    flushList();
    return outElements.join("");
  }, [content]);

  return (
    <div
      className={`math-rendered-content ${isCorrection ? "correction-mode" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
