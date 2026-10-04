"use client";

import { useEffect, useState } from "react";
import { EXAM_CONFIG } from "@/lib/prep-config";

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalPercent: number; // Progression depuis début d'année scolaire (1er oct)
}

function calculateTimeRemaining(targetDate: string, targetTimeUtc: string): TimeUnits {
  // Dakar / Sénégal est sur UTC+0 toute l'année (pas d'heure d'été)
  const targetIso = `${targetDate}T${targetTimeUtc}`;
  const targetTime = new Date(targetIso).getTime();
  const now = Date.now();
  const diffMs = targetTime - now;

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      totalPercent: 100,
    };
  }

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  // Calcul d'avancement scolaire (du 1er octobre 2026 à la date d'examen 2027)
  const schoolStart = new Date("2026-10-01T00:00:00Z").getTime();
  const totalDuration = targetTime - schoolStart;
  const elapsed = Math.max(0, now - schoolStart);
  const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    totalPercent: percent,
  };
}

interface CountdownCardProps {
  examId: "BAC" | "BFEM";
  themeColor: "orange" | "blue";
}

export function LiveExamCountdownCard({ examId, themeColor }: CountdownCardProps) {
  const config = EXAM_CONFIG[examId];
  const [timeLeft, setTimeLeft] = useState<TimeUnits>(() =>
    calculateTimeRemaining(config.targetDate, config.targetTimeUtc)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mise à jour chaque seconde (synchrone à l'heure UTC de Dakar)
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(config.targetDate, config.targetTimeUtc));
    }, 1000);

    return () => clearInterval(interval);
  }, [config.targetDate, config.targetTimeUtc]);

  const isOrange = themeColor === "orange";
  // Sur fond sombre, le BFEM utilise un bleu ciel très lumineux (#38bdf8) pour un contraste optimal
  const accentColor = isOrange ? "#FF7A1A" : "#38bdf8";
  const badgeBg = isOrange ? "bg-orange-500/20 text-[#FF9E4A] border-orange-500/40" : "bg-sky-500/20 text-[#7dd3fc] border-sky-500/40";
  const dotBg = isOrange ? "#FF7A1A" : "#38bdf8";
  const dateColor = isOrange ? "#fed7aa" : "#bae6fd";

  const units = [
    { label: "Jours", value: timeLeft.days, pad: false },
    { label: "Heures", value: timeLeft.hours, pad: true },
    { label: "Min", value: timeLeft.minutes, pad: true },
    { label: "Sec", value: timeLeft.seconds, pad: true },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 rounded-3xl p-4 sm:p-6 border border-slate-700/80 shadow-xl relative overflow-hidden flex flex-col justify-between backdrop-blur-md">
      {/* Subtle Ambient Glow */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-[60px] pointer-events-none opacity-30"
        style={{ backgroundColor: accentColor }}
      />

      {/* Top Header Information */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${badgeBg}`}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: dotBg }} />
          {config.label}
        </span>
        <div className="text-right">
          <span className="text-xs sm:text-sm font-extrabold block" style={{ color: dateColor }}>
            {config.displayDateFr}
          </span>
          <span className="text-[10px] text-slate-300 block font-semibold">8h00 GMT (Sénégal)</span>
        </div>
      </div>

      {/* Live Digits Container */}
      <div className="my-4 relative z-10">
        {timeLeft.isPast ? (
          <div className="bg-slate-950/70 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-1">
            <span className="material-symbols-outlined text-emerald-400 text-[28px]">check_circle</span>
            <p className="text-emerald-300 font-extrabold text-sm sm:text-base">
              L&apos;examen a commencé !
            </p>
            <p className="text-xs text-slate-300">Bonne chance à tous les candidats du Sénégal 🇸🇳</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
              {units.map((u) => {
                const formatted = u.pad ? String(u.value).padStart(2, "0") : String(u.value);
                return (
                  <div
                    key={u.label}
                    className="bg-slate-950/90 rounded-2xl p-2 sm:p-3 border border-slate-800 text-center flex flex-col items-center justify-center relative overflow-hidden group shadow-inner"
                  >
                    {/* Live Segment Number with Smooth Flip/Slide Effect */}
                    <span
                      key={formatted}
                      className="font-mono text-xl sm:text-2xl lg:text-3xl font-black tracking-tight tabular-nums transition-all motion-safe:animate-[fadeIn_0.2s_ease-out]"
                      style={{ color: accentColor }}
                      suppressHydrationWarning
                    >
                      {mounted ? formatted : "--"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-300 mt-0.5">
                      {u.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* School Year Progress Bar */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                <span>Avancement de l&apos;année scolaire</span>
                <span style={{ color: accentColor }}>{mounted ? `${timeLeft.totalPercent}%` : "--"}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 motion-reduce:transition-none"
                  style={{
                    width: `${mounted ? timeLeft.totalPercent : 0}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes with Official Source Reference */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 relative z-10">
        <p className="text-[11px] text-slate-200 font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]" style={{ color: accentColor }}>
            event_available
          </span>
          <span>{config.referenceNote}</span>
        </p>
        <p className="text-[10px] text-slate-400 font-medium leading-tight">
          {isOrange
            ? "S1, S2, L1, L2, L'1, L-AR (Bac Technique : 15 juin 2027)"
            : "Collège · 3ème générale et option arabe"}
        </p>
      </div>
    </div>
  );
}
