"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PREP_CONTACT_EMAIL, PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";
import { sounds } from "@/lib/soundEffects";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface StudentProps {
  prenom?: string | null;
  exam_type?: string | null;
  serie?: string | null;
}

interface SettingsMenuProps {
  student?: StudentProps | null;
  onSignOut: () => void;
}

export function SettingsMenu({ student: _student, onSignOut }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return sounds.isEnabled();
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen && !showConfirmLogout) {
        setIsOpen(false);
        triggerBtnRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showConfirmLogout]);

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
  };

  const closeMenu = () => setIsOpen(false);

  const handleOpenLogoutConfirm = () => {
    setIsOpen(false);
    setShowConfirmLogout(true);
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        {/* Trigger Button: Only the gear icon */}
        <button
          ref={triggerBtnRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Menu paramètres et profil"
          title="Paramètres & compte"
          className={`w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            isOpen
              ? "bg-[#005bbf] text-white shadow-sm ring-2 ring-[#005bbf]/20"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            settings
          </span>
        </button>

        {/* Dropdown Menu Panel: Text only, strictly ordered */}
        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-2 w-56 sm:w-64 origin-top-right bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* 1. Mon profil */}
            <Link
              href="/prep/profil"
              role="menuitem"
              onClick={closeMenu}
              className="block w-full text-left px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Mon profil
            </Link>

            {/* 2. Son : activé / coupé */}
            <button
              type="button"
              role="menuitem"
              onClick={toggleSound}
              className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              {soundEnabled ? "Son : activé" : "Son : coupé"}
            </button>

            {/* 3. Aide (WhatsApp) */}
            <a
              href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl("Bonjour GSN PREP, j'ai besoin d'aide.")}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={closeMenu}
              className="block w-full text-left px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Aide (WhatsApp)
            </a>

            {/* 4. Contact */}
            <a
              href={`mailto:${PREP_CONTACT_EMAIL}?subject=Contact%20GSN%20PREP`}
              role="menuitem"
              onClick={closeMenu}
              className="block w-full text-left px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Contact
            </a>

            {/* 5. Confidentialité */}
            <Link
              href="/privacy"
              role="menuitem"
              onClick={closeMenu}
              className="block w-full text-left px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Confidentialité
            </Link>

            {/* 6. Conditions d'utilisation */}
            <Link
              href="/terms"
              role="menuitem"
              onClick={closeMenu}
              className="block w-full text-left px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Conditions d&apos;utilisation
            </Link>

            {/* Séparateur léger */}
            <div className="border-t border-slate-100 my-1" />

            {/* 7. Se déconnecter (couleur distincte) */}
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenLogoutConfirm}
              className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      {/* Confirmation de déconnexion */}
      <ConfirmDialog
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        onConfirm={() => {
          setShowConfirmLogout(false);
          onSignOut();
        }}
        triggerRef={triggerBtnRef}
        title="Te déconnecter ?"
        message="Tu pourras te reconnecter à tout moment avec ton numéro et ton mot de passe."
        confirmText="Se déconnecter"
        cancelText="Annuler"
      />
    </>
  );
}
