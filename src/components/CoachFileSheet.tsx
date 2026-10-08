"use client";

import { useState } from "react";
import { CoachFilePrintView } from "./CoachFilePrintView";

export interface CoachFile {
  id?: string;
  conversation_id?: string;
  kind: "exercice" | "fiche" | "methode" | "planning" | "corrige";
  title: string;
  content_md: string;
  correction_md?: string;
  created_at?: string;
}

interface CoachFileSheetProps {
  file: CoachFile | null;
  isOpen: boolean;
  onClose: () => void;
}

function sanitizeFileName(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function renderSafeMarkdown(md: string) {
  // Échappement des balises HTML brutes
  const safe = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Rendu des titres, listes, gras, italique, tableaux simples
  const lines = safe.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 my-2.5 space-y-1 text-slate-800 text-sm">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      const formatted = trimmed.slice(2)
        .replace(/\*\*(.+?)\*\*/g, "<strong class='font-bold text-slate-900'>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em class='italic'>$1</em>");
      listItems.push(formatted);
      continue;
    } else {
      flushList();
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-extrabold text-slate-900 mt-4 mb-1">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-black text-[#005bbf] mt-5 mb-2 border-b border-slate-100 pb-1">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-black text-slate-900 mt-3 mb-2">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      const formatted = trimmed
        .replace(/\*\*(.+?)\*\*/g, "<strong class='font-bold text-slate-900'>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em class='italic'>$1</em>");
      elements.push(
        <p key={i} className="text-sm leading-relaxed text-slate-800 my-1.5" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  }
  flushList();

  return elements;
}

export function CoachFileSheet({ file, isOpen, onClose }: CoachFileSheetProps) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [showMenuPlus, setShowMenuPlus] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen || !file) return null;

  const isExercice = file.kind === "exercice" && Boolean(file.correction_md?.trim());
  const dateFormatted = file.created_at
    ? new Date(file.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const cleanBaseName = `prep-${sanitizeFileName(file.title || "document")}`;

  // Copier dans le presse-papier
  const handleCopy = async () => {
    try {
      const fullText = `# ${file.title}\n\n${file.content_md}${
        file.correction_md ? `\n\n## Correction\n\n${file.correction_md}` : ""
      }`;
      await navigator.clipboard.writeText(fullText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
      setShowMenuPlus(false);
    } catch {
      // Ignorer si non supporté
    }
  };

  // Partage natif
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: file.title,
          text: `${file.title} - Document GSN PREP\n\n${file.content_md.slice(0, 300)}...`,
        });
      } else {
        await handleCopy();
      }
      setShowMenuPlus(false);
    } catch {
      // Utilisateur a annulé ou non disponible
    }
  };

  // Télécharger en Markdown (.md)
  const downloadMarkdown = () => {
    const fullText = `# GSN PREP · ${file.title}\nDate: ${dateFormatted}\n\n${file.content_md}${
      file.correction_md ? `\n\n## Correction & Barème\n\n${file.correction_md}` : ""
    }`;
    const blob = new Blob([fullText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanBaseName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenuPlus(false);
  };

  // Télécharger en Word (.doc HTML compatible)
  const downloadWordDoc = () => {
    const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${file.title}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; }
    h1 { color: #005bbf; font-size: 18pt; margin-bottom: 8pt; }
    h2 { color: #333333; font-size: 14pt; margin-top: 14pt; margin-bottom: 6pt; }
    .header-box { border-bottom: 2pt solid #005bbf; padding-bottom: 8pt; margin-bottom: 16pt; }
    .meta { color: #666666; font-size: 9pt; }
    .correction-box { border-top: 1pt dashed #999; margin-top: 20pt; padding-top: 12pt; }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>GSN PREP · ${file.title}</h1>
    <p class="meta">Document pédagogique · ${dateFormatted} · Aucun renseignement personnel inclus</p>
  </div>
  <div>
    ${file.content_md.replace(/\n\n/g, "<p>").replace(/\n/g, "<br/>")}
  </div>
  ${
    file.correction_md
      ? `<div class="correction-box"><h2>Correction & Barème</h2>${file.correction_md.replace(/\n\n/g, "<p>").replace(/\n/g, "<br/>")}</div>`
      : ""
  }
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanBaseName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenuPlus(false);
  };

  // Imprimer ou enregistrer en PDF via le navigateur
  const printToPdf = () => {
    setShowMenuPlus(false);
    window.print();
  };

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

  return (
    <>
      {/* Vue cachée pour l'impression A4 */}
      <CoachFilePrintView
        title={file.title}
        kind={file.kind}
        contentMd={file.content_md}
        correctionMd={file.correction_md}
        showCorrection={showCorrection}
        dateStr={dateFormatted}
      />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 print:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Modal : Mobile (bottom sheet) / Desktop (side panel) */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-[620px] max-h-[90vh] md:max-h-full bg-white rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none shadow-2xl z-50 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-slate-200 print:hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
        
        {/* Header de la feuille */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#005bbf]">
                  {getKindLabel()}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{dateFormatted}</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate mt-0.5">
                {file.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Menu Plus */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenuPlus(!showMenuPlus)}
                className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
                title="Options du fichier"
                aria-label="Options du fichier"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showMenuPlus && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 py-1 text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copyFeedback ? "Copié !" : "Copier le texte"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Partager</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <div className="px-4 py-1 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Télécharger
                  </div>

                  <button
                    type="button"
                    onClick={downloadMarkdown}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <span className="w-4 text-center font-mono font-bold text-slate-400">#</span>
                    <span>Fichier texte brut (.md)</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadWordDoc}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <span className="w-4 text-center font-bold text-[#005bbf]">W</span>
                    <span>Document Word (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={printToPdf}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <span className="w-4 text-center font-bold text-rose-600">P</span>
                    <span>Imprimer en PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
              title="Fermer"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corps du document avec défilement */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
            {renderSafeMarkdown(file.content_md)}
          </div>

          {/* Bouton et bloc de correction masqué par défaut */}
          {isExercice && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCorrection(!showCorrection)}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 text-[#005bbf] border border-blue-200 flex items-center justify-center gap-2 transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${showCorrection ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{showCorrection ? "Masquer la correction" : "Afficher la correction"}</span>
              </button>

              {showCorrection && (
                <div className="mt-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider pb-2 border-b border-emerald-200">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Correction pas à pas & Barème</span>
                  </div>
                  <div className="pt-2">
                    {renderSafeMarkdown(file.correction_md || "")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bandeau de confidentialité permanent avec cadenas SVG */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600">
            <svg className="w-4 h-4 text-[#005bbf] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="leading-snug">
              Privé : tes parents ne peuvent pas voir tes conversations ni tes fichiers. Ne partage pas ton mot de passe : celui qui l&apos;a peut ouvrir ton compte.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
