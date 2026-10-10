import { cleanAiText } from "@/lib/mathFormatter";
"use client";

import { useState } from "react";
import { CoachFile } from "./CoachFileSheet";
import { CoachFileCard } from "./CoachFileCard";

interface CoachFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  files: CoachFile[];
  onOpenFile: (file: CoachFile) => void;
  onDeleteFile?: (fileId: string) => Promise<void>;
  isAllFilesMode?: boolean;
}

export function CoachFilesModal({
  isOpen,
  onClose,
  title,
  files,
  onOpenFile,
  onDeleteFile,
  isAllFilesMode = false,
}: CoachFilesModalProps) {
  const [fileToDelete, setFileToDelete] = useState<CoachFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteConfirm = async () => {
    if (!fileToDelete?.id || !onDeleteFile) return;
    setDeleting(true);
    try {
      await onDeleteFile(fileToDelete.id);
      setFileToDelete(null);
    } catch {
      // Ignorer
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] max-h-[85vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              {title}
            </h2>
          </div>

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

        {/* Liste simple des fichiers (sans puces de filtre, sans compteurs, sans recherche) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {files.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium">
                {isAllFilesMode
                  ? "Aucun fichier enregistré pour l'instant. Demande un exercice, une fiche ou un planning au Coach !"
                  : "Rien n'a encore été généré dans cette conversation. Demande un exercice ou une fiche au Coach."}
              </p>
            </div>
          ) : (
            files.map((file, idx) => (
              <div key={file.id || idx} className="relative group">
                <CoachFileCard
                  file={file}
                  onOpenFile={(f) => {
                    onOpenFile(f);
                    onClose();
                  }}
                />

                {/* Bouton de suppression individuelle (dans Mes fichiers) */}
                {isAllFilesMode && onDeleteFile && file.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileToDelete(file);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Supprimer ce fichier"
                    aria-label="Supprimer ce fichier"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Confirmation de suppression d'un fichier */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Supprimer ce document ?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Le document « {fileToDelete.title} » sera définitivement supprimé.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
