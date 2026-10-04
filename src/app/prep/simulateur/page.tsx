"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SubjectConfig = {
  name: string;
  coeff: number;
  icon: string;
};

const BAC_SERIES_CONFIG: Record<string, { label: string; subjects: SubjectConfig[] }> = {
  "S2": {
    label: "Série S2 — Sciences Expérimentales",
    subjects: [
      { name: "Sciences Physiques", coeff: 6, icon: "science" },
      { name: "SVT", coeff: 6, icon: "biotech" },
      { name: "Mathématiques", coeff: 5, icon: "calculate" },
      { name: "Français", coeff: 3, icon: "menu_book" },
      { name: "Philosophie", coeff: 2, icon: "psychology" },
      { name: "Histoire-Géographie", coeff: 2, icon: "public" },
      { name: "Langue Vivante 1 (Anglais)", coeff: 2, icon: "translate" },
      { name: "EPS", coeff: 1, icon: "sports_soccer" },
    ],
  },
  "S1": {
    label: "Série S1 — Mathématiques & Sciences Physiques",
    subjects: [
      { name: "Mathématiques", coeff: 8, icon: "calculate" },
      { name: "Sciences Physiques", coeff: 7, icon: "science" },
      { name: "SVT", coeff: 3, icon: "biotech" },
      { name: "Français", coeff: 3, icon: "menu_book" },
      { name: "Philosophie", coeff: 2, icon: "psychology" },
      { name: "Histoire-Géographie", coeff: 2, icon: "public" },
      { name: "Langue Vivante 1 (Anglais)", coeff: 2, icon: "translate" },
      { name: "EPS", coeff: 1, icon: "sports_soccer" },
    ],
  },
  "L2": {
    label: "Série L2 — Lettres & Sciences Humaines",
    subjects: [
      { name: "Philosophie", coeff: 5, icon: "psychology" },
      { name: "Français", coeff: 5, icon: "menu_book" },
      { name: "Histoire-Géographie", coeff: 4, icon: "public" },
      { name: "Langue Vivante 1", coeff: 3, icon: "translate" },
      { name: "Langue Vivante 2", coeff: 3, icon: "language" },
      { name: "Mathématiques", coeff: 2, icon: "calculate" },
      { name: "SVT", coeff: 2, icon: "biotech" },
      { name: "EPS", coeff: 1, icon: "sports_soccer" },
    ],
  },
  "L'": {
    label: "Série L' — Lettres Classiques & Modernes",
    subjects: [
      { name: "Français", coeff: 6, icon: "menu_book" },
      { name: "Philosophie", coeff: 5, icon: "psychology" },
      { name: "Langue Vivante 1", coeff: 4, icon: "translate" },
      { name: "Langue Vivante 2 / Arabe", coeff: 4, icon: "language" },
      { name: "Histoire-Géographie", coeff: 3, icon: "public" },
      { name: "Mathématiques", coeff: 2, icon: "calculate" },
      { name: "EPS", coeff: 1, icon: "sports_soccer" },
    ],
  },
  "G": {
    label: "Série G — Gestion & Comptabilité",
    subjects: [
      { name: "Comptabilité & Gestion", coeff: 5, icon: "finance_chip" },
      { name: "Économie & Droit", coeff: 4, icon: "gavel" },
      { name: "Mathématiques", coeff: 4, icon: "calculate" },
      { name: "Français", coeff: 3, icon: "menu_book" },
      { name: "Philosophie", coeff: 2, icon: "psychology" },
      { name: "Histoire-Géographie", coeff: 2, icon: "public" },
      { name: "Langue Vivante 1", coeff: 2, icon: "translate" },
      { name: "EPS", coeff: 1, icon: "sports_soccer" },
    ],
  },
  "BFEM": {
    label: "Brevet de Fin d'Études Moyennes (BFEM)",
    subjects: [
      { name: "Mathématiques", coeff: 4, icon: "calculate" },
      { name: "Français (Texte + Dictée)", coeff: 4, icon: "menu_book" },
      { name: "Sciences Physiques", coeff: 2, icon: "science" },
      { name: "Sciences de la Vie et de la Terre", coeff: 2, icon: "biotech" },
      { name: "Histoire-Géographie", coeff: 2, icon: "public" },
      { name: "Anglais", coeff: 2, icon: "translate" },
      { name: "Éducation Physique", coeff: 1, icon: "sports_soccer" },
    ],
  },
};

export default function SimulateurPage() {
  const router = useRouter();
  const [serieKey, setSerieKey] = useState<string>("S2");
  const [grades, setGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("prep_students")
        .select("exam_type, serie")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.exam_type === "BFEM") {
              setSerieKey("BFEM");
            } else if (data.serie && BAC_SERIES_CONFIG[data.serie]) {
              setSerieKey(data.serie);
            }
          }
        });
    });
  }, []);

  const config = BAC_SERIES_CONFIG[serieKey] || BAC_SERIES_CONFIG["S2"];

  // Initialize or reset default grades when series changes
  useEffect(() => {
    const initial: Record<string, number> = {};
    for (const sub of config.subjects) {
      initial[sub.name] = 10;
    }
    setGrades(initial);
  }, [serieKey, config]);

  const { totalPoints, totalCoeff, average, mention, verdictColor } = useMemo(() => {
    let pts = 0;
    let coeffs = 0;
    for (const sub of config.subjects) {
      const g = grades[sub.name] ?? 10;
      pts += g * sub.coeff;
      coeffs += sub.coeff;
    }
    const avg = coeffs > 0 ? pts / coeffs : 0;

    let ment = "Ajourné";
    let col = "text-rose-600 bg-rose-50 border-rose-200";

    if (avg >= 16) {
      ment = "Mention Très Bien 🌟";
      col = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (avg >= 14) {
      ment = "Mention Bien 🏆";
      col = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (avg >= 12) {
      ment = "Mention Assez Bien 🎖️";
      col = "text-blue-700 bg-blue-50 border-blue-200";
    } else if (avg >= 10) {
      ment = "Admis d'office (Sans mention) ✅";
      col = "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (avg >= 9) {
      ment = "2ème Groupe (Oral de rattrapage) ⚠️";
      col = "text-amber-700 bg-amber-50 border-amber-200";
    }

    return {
      totalPoints: pts,
      totalCoeff: coeffs,
      average: avg,
      mention: ment,
      verdictColor: col,
    };
  }, [config, grades]);

  function updateGrade(subject: string, val: number) {
    const clamped = Math.max(0, Math.min(20, val));
    setGrades((prev) => ({ ...prev, [subject]: clamped }));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">calculate</span>
            <span>Barème officiel Office du Bac & Direction des Examens</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Simulateur de Moyenne & Mentions
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Estime tes points et ta mention au BAC ou au BFEM en ajustant tes notes par matière selon les coefficients officiels.
          </p>
        </div>
      </div>

      {/* Series Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
          Choisir l&apos;examen & la série :
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(BAC_SERIES_CONFIG).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSerieKey(k)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                serieKey === k
                  ? "bg-[#005bbf] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {k === "BFEM" ? "BFEM" : `Série ${k}`}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Results Card */}
      <div className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              {config.label}
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight">
                {average.toFixed(2)}
              </span>
              <span className="text-xl sm:text-2xl font-bold opacity-80">/20</span>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Total cumulé : <strong className="text-white">{totalPoints.toFixed(1)}</strong> points sur {totalCoeff * 20} (Coeff total : {totalCoeff})
            </p>
          </div>

          <div className="sm:text-right bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
            <span className="text-xs text-blue-100 font-semibold block uppercase tracking-wider">
              Verdict officiel prévisionnel
            </span>
            <p className="text-lg sm:text-xl font-black mt-1 text-white">
              {mention}
            </p>
            <div className="mt-3">
              <Link
                href="/prep/orientation"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Tester mon orientation post-bac</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Sliders & Inputs */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Notes estimées par matière</h2>
            <p className="text-xs text-slate-500">Ajustez le curseur ou tapez directement la note sur 20</p>
          </div>
          <button
            onClick={() => {
              const reset: Record<string, number> = {};
              for (const sub of config.subjects) reset[sub.name] = 10;
              setGrades(reset);
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
          >
            Réinitialiser à 10/20
          </button>
        </div>

        <div className="space-y-4">
          {config.subjects.map((sub) => {
            const currentGrade = grades[sub.name] ?? 10;
            const subPoints = (currentGrade * sub.coeff).toFixed(1);
            return (
              <div
                key={sub.name}
                className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:border-blue-200 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">{sub.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{sub.name}</p>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Coefficient : <strong>{sub.coeff}</strong> ({subPoints} pts)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={currentGrade}
                      onChange={(e) => updateGrade(sub.name, parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center font-black text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#005bbf]"
                    />
                    <span className="text-xs font-bold text-slate-400">/20</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={currentGrade}
                  onChange={(e) => updateGrade(sub.name, parseFloat(e.target.value))}
                  className="w-full accent-[#005bbf] cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
