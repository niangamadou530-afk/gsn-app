"use client";

interface CoachFilePrintViewProps {
  title: string;
  kind: string;
  contentMd: string;
  correctionMd?: string;
  showCorrection?: boolean;
  dateStr?: string;
}

function cleanMarkdownForPrint(rawMd: string): string {
  const md = cleanAiText(rawMd); return cleanMarkdownForPrintInternal(cleanAiText(md)); } function cleanMarkdownForPrintInternal(md: string): string {
  return md
    .replace(/^#\s+(.+)$/gm, "<h1 class='print-h1'>$1</h1>")
    .replace(/^##\s+(.+)$/gm, "<h2 class='print-h2'>$1</h2>")
    .replace(/^###\s+(.+)$/gm, "<h3 class='print-h3'>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li class='print-li'>$1</li>")
    .replace(/\n\n/g, "<br/><br/>");
}

export function CoachFilePrintView({
  title,
  kind,
  contentMd,
  correctionMd,
  showCorrection = false,
  dateStr,
}: CoachFilePrintViewProps) {
  const dateFormatted = dateStr || new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999] overflow-visible">
      {/* Header officiel A4 */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight text-[#005bbf]">GSN PREP</span>
            <span className="text-xs uppercase font-extrabold tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              {kind.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Document pédagogique · Programme sénégalais
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-800">{dateFormatted}</p>
          <p className="text-[10px] text-slate-500">Document personnel de révision</p>
        </div>
      </div>

      {/* Titre du document */}
      <h1 className="text-2xl font-black text-slate-900 mb-6 leading-tight">
        {cleanAiText(title)}
      </h1>

      {/* Contenu principal */}
      <div
        className="text-sm leading-relaxed text-slate-900 space-y-3 font-serif"
        dangerouslySetInnerHTML={{ __html: cleanMarkdownForPrint(contentMd) }}
      />

      {/* Correction (si présente et demandée) */}
      {showCorrection && correctionMd && correctionMd.trim().length > 0 && (
        <div className="mt-8 pt-6 border-t border-dashed border-slate-400">
          <h2 className="text-lg font-black text-[#005bbf] mb-3">
            Correction & Barème
          </h2>
          <div
            className="text-sm leading-relaxed text-slate-900 space-y-3 font-serif"
            dangerouslySetInnerHTML={{ __html: cleanMarkdownForPrint(correctionMd) }}
          />
        </div>
      )}

      {/* Pied de page A4 */}
      <div className="mt-12 pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between">
        <span>GSN PREP · Espace de révision BAC & BFEM Sénégal</span>
        <span>Page imprimée · Aucune donnée personnelle incluse</span>
      </div>
    </div>
  );
}
