// src/components/SoundToggle.tsx
"use client";

import { useState } from "react";
import { sounds } from "@/lib/soundEffects";

export function SoundToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return sounds.isEnabled();
  });

  const handleToggle = () => {
    const next = sounds.toggle();
    setEnabled(next);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={enabled ? "Son activé (cliquer pour couper)" : "Son coupé (cliquer pour activer)"}
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all active:scale-95 ${
          enabled
            ? "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80"
            : "bg-slate-100/60 hover:bg-slate-200/60 text-slate-400 border border-slate-200/60"
        } ${className}`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {enabled ? "volume_up" : "volume_off"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? "Son activé (cliquer pour couper)" : "Son coupé (cliquer pour activer)"}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
        enabled
          ? "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80"
          : "bg-slate-100/60 hover:bg-slate-200/60 text-slate-400 border border-slate-200/60"
      } ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {enabled ? "volume_up" : "volume_off"}
      </span>
      <span className="hidden sm:inline">
        {enabled ? "Son : activé" : "Son : coupé"}
      </span>
    </button>
  );
}
