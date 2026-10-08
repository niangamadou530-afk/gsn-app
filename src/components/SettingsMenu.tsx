"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PREP_CONTACT_EMAIL, PREP_LEGAL_CONFIG, PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";
import { sounds } from "@/lib/soundEffects";

interface StudentProps {
  prenom?: string | null;
  exam_type?: string | null;
  serie?: string | null;
}

interface SettingsMenuProps {
  student?: StudentProps | null;
  onSignOut: () => void;
}

export function SettingsMenu({ student, onSignOut }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return sounds.isEnabled();
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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
  }, [isOpen]);

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu paramètres et profil"
        title="Paramètres & compte"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
          isOpen
            ? "bg-[#005bbf] text-white shadow-sm ring-2 ring-[#005bbf]/20"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isOpen ? "close" : "settings"}
        </span>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-72 sm:w-80 origin-top-right bg-white rounded-3xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* User Profile Header */}
          <div className="p-4 bg-gradient-to-b from-slate-50 to-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#005bbf] to-[#1a73e8] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {student?.prenom ? student.prenom.charAt(0).toUpperCase() : "E"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 truncate">
                  {student?.prenom ? student.prenom : "Élève GSN PREP"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00]">
                    {student?.exam_type || "2027"}
                  </span>
                  {student?.serie && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#005bbf]">
                      Série {student.serie}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/prep/profil"
              onClick={closeMenu}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#005bbf]">
                  manage_accounts
                </span>
                <span>Mon profil élève</span>
              </span>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Quick Preferences */}
          <div className="p-2 space-y-0.5">
            <button
              type="button"
              onClick={toggleSound}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  {soundEnabled ? "volume_up" : "volume_off"}
                </span>
                <span>Effets sonores</span>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  soundEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {soundEnabled ? "Actifs" : "Coupés"}
              </span>
            </button>

            <Link
              href="/prep/parent"
              onClick={closeMenu}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  family_restroom
                </span>
                <span>Espace Parents</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Assistance & Support */}
          <div className="p-2 space-y-0.5">
            <a
              href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50/60 text-xs font-bold text-emerald-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">
                  chat
                </span>
                <span>Assistance WhatsApp</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700">
                {PREP_LEGAL_CONFIG.supportPhoneFormatted}
              </span>
            </a>

            <a
              href={`mailto:${PREP_CONTACT_EMAIL}?subject=Contact%20GSN%20PREP`}
              onClick={closeMenu}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  mail
                </span>
                <span>Support par email</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                open_in_new
              </span>
            </a>
          </div>

          {/* Legal Pages & Rights */}
          <div className="p-2 space-y-0.5">
            <Link
              href="/privacy"
              onClick={closeMenu}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px] text-slate-400">
                  shield
                </span>
                <span>Confidentialité & Données</span>
              </div>
              <span className="material-symbols-outlined text-[15px] text-slate-400">
                chevron_right
              </span>
            </Link>

            <Link
              href="/terms"
              onClick={closeMenu}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px] text-slate-400">
                  gavel
                </span>
                <span>Conditions d&apos;utilisation</span>
              </div>
              <span className="material-symbols-outlined text-[15px] text-slate-400">
                chevron_right
              </span>
            </Link>
          </div>

          {/* Sign out */}
          <div className="p-2 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onSignOut();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
