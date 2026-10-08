"use client";

import { CoachFile } from "./CoachFileSheet";

interface CoachFileCardProps {
  file: CoachFile;
  onOpenFile: (file: CoachFile) => void;
  accompanyingText?: string;
}

export function CoachFileCard({ file, onOpenFile, accompanyingText }: CoachFileCardProps) {
  const getKindLabel = () => {
    switch (file.kind) {
      case "exercice": return "Exercice · MD";
      case "fiche": return "Fiche · MD";
      case "methode": return "Méthode · MD";
      case "planning": return "Planning · MD";
      case "corrige": return "Corrigé · MD";
      default: return "Document · MD";
    }
  };

  const dateFormatted = file.created_at
    ? new Date(file.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "Aujourd'hui";

  return (
    <div className="space-y-2 max-w-sm sm:max-w-md">
      {accompanyingText && (
        <p className="text-sm text-slate-800 leading-relaxed">
          {accompanyingText}
        </p>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenFile(file)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenFile(file); }}
        className="w-full text-left bg-white hover:bg-slate-50/90 active:scale-[0.99] border border-blue-200/90 hover:border-[#005bbf]/60 rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer group flex items-start gap-3"
      >
        {/* Document Icon SVG */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100/80 text-[#005bbf] flex items-center justify-center shrink-0 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#005bbf]">
              {getKindLabel()}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {dateFormatted}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-sm truncate leading-snug group-hover:text-[#005bbf] transition-colors">
            {file.title}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {file.content_md.slice(0, 120).replace(/[#*`_]/g, "")}...
          </p>
        </div>

        {/* Chevron Icon SVG */}
        <div className="text-slate-300 group-hover:text-[#005bbf] self-center shrink-0 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
