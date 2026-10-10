import { cleanAiText } from "@/lib/mathFormatter";
"use client";

import { useState } from "react";
import Link from "next/link";

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface CoachConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onDeleteAllConversations: () => Promise<void>;
  onOpenAllFiles: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  annalesHref?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "À l'instant";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffDays = Math.floor(diffH / 24);
    if (diffDays === 1) return "hier";
    return `il y a ${diffDays} jours`;
  } catch {
    return "";
  }
}

export function CoachConversationDrawer({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onDeleteAllConversations,
  onOpenAllFiles,
  loading,
  error,
  onRetry,
  annalesHref = "/prep/epreuves",
}: CoachConversationDrawerProps) {
  const [convToDelete, setConvToDelete] = useState<ConversationSummary | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [convToRename, setConvToRename] = useState<ConversationSummary | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartRename = (conv: ConversationSummary) => {
    setConvToRename(conv);
    setRenameTitle(conv.title);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convToRename || !renameTitle.trim() || actionLoading) return;
    setActionLoading(true);
    try {
      await onRenameConversation(convToRename.id, renameTitle.trim());
      setConvToRename(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!convToDelete || actionLoading) return;
    setActionLoading(true);
    try {
      await onDeleteConversation(convToDelete.id);
      setConvToDelete(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await onDeleteAllConversations();
      setShowDeleteAllConfirm(false);
    } finally {
      setActionLoading(false);
    }
  };

  const content = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200/90 select-none">
      {/* Header tiroir */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Discussions</span>
          </div>

          {/* Bouton fermeture sur mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Fermer le menu"
            aria-label="Fermer le menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bouton Nouvelle conversation */}
        <button
          type="button"
          onClick={() => {
            onNewConversation();
            onClose();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nouvelle conversation</span>
        </button>

        {/* Bouton Mes fichiers */}
        <button
          type="button"
          onClick={() => {
            onOpenAllFiles();
            onClose();
          }}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Mes fichiers générés</span>
        </button>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          // Squelettes de chargement
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : error ? (
          // État erreur avec Réessayer
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : conversations.length === 0 ? (
          // État vide
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs text-slate-500 font-medium">Pas encore de conversation</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                className={`group relative rounded-xl px-3 py-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-[#005bbf] font-bold border border-blue-200/80"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate leading-snug">
                    {conv.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(conv.updated_at || conv.created_at)}
                  </p>
                </div>

                {/* Actions au survol : Renommer & Supprimer */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(conv);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
                    title="Renommer"
                    aria-label="Renommer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConvToDelete(conv);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Supprimer"
                    aria-label="Supprimer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pied de colonne : Supprimer tout + Liens retour */}
      <div className="p-3 border-t border-slate-200/80 space-y-2 shrink-0 bg-slate-50/50">
        {conversations.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDeleteAllConfirm(true)}
            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Supprimer toutes mes conversations</span>
          </button>
        )}

        <div className="pt-1 border-t border-slate-200/70 flex flex-col gap-1 text-xs font-semibold text-slate-600">
          <Link
            href={annalesHref}
            className="px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Annales &amp; Corrigés</span>
          </Link>

          <Link
            href="/prep/dashboard"
            className="px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Mon tableau de bord</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Colonne latérale fixe sur Ordinateur (desktop) */}
      <aside data-tour="coach-drawer-panel" className="hidden md:block w-72 h-[calc(100vh-140px)] min-h-[580px] shrink-0 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs">
        {content}
      </aside>

      {/* Tiroir mobile coulissant à gauche */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Panneau */}
          <div data-tour="coach-drawer-panel" className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}

      {/* Modal : Renommer conversation */}
      {convToRename && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRename}
            className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <h3 className="font-extrabold text-slate-900 text-sm">
              Renommer la discussion
            </h3>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-[#005bbf]"
              placeholder="Titre de la discussion"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConvToRename(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!renameTitle.trim() || actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#005bbf] text-white font-bold text-xs hover:bg-[#004899] disabled:opacity-50"
              >
                {actionLoading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal : Confirmation suppression 1 conversation */}
      {convToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Supprimer cette discussion ?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La discussion « {convToDelete.title} » et ses messages associés seront définitivement effacés.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Confirmation suppression de toutes les conversations */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Supprimer toutes vos conversations ?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Toutes vos discussions et l&apos;ensemble de vos fichiers de révision générés avec le Coach seront définitivement effacés.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Suppression…" : "Tout supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
