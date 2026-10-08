"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Te déconnecter ?",
  message = "Tu pourras te reconnecter à tout moment avec ton numéro et ton mot de passe.",
  confirmText = "Se déconnecter",
  cancelText = "Annuler",
  triggerRef,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap and default focus on Annuler
  useEffect(() => {
    if (!isOpen) return;

    // Put focus on "Annuler" button by default
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean
        ) as HTMLElement[];
        if (focusable.length < 2) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    const triggerEl = triggerRef?.current;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to trigger element when dialog closes
      if (triggerEl) {
        triggerEl.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="space-y-2">
          <h2
            id="confirm-dialog-title"
            className="text-base font-extrabold text-slate-900"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-desc"
            className="text-xs text-slate-600 leading-relaxed"
          >
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
