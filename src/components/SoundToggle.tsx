// src/components/SoundToggle.tsx
"use client";

import { useState, useEffect } from "react";
import { sounds } from "@/lib/soundEffects";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(sounds.isEnabled());
  }, []);

  const handleToggle = () => {
    const next = sounds.toggle();
    setEnabled(next);
  };

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
        {enabled ? "Son actif" : "Son coupé"}
      </span>
    </button>
  );
}
