"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExamTab = "BAC" | "BFEM";

const SITE_BAC  = "https://officedubac.sn/";
const SITE_BFEM = "https://sunudaara.com/";

const BAC_SERIES = [
  { label: "Série L", desc: "Littéraire — Philosophie, Français, HG, Langues" },
  { label: "Série S", desc: "Scientifique — Maths, Physique, SVT" },
  { label: "Série G", desc: "Gestion — Économie, Comptabilité, Droit" },
  { label: "Série T", desc: "Technique — Sciences de l'ingénieur" },
];

export default function EpreuvesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ExamTab>("BAC");

  const site     = tab === "BAC" ? SITE_BAC : SITE_BFEM;
  const siteName = tab === "BAC" ? "officedubac.sn" : "sunudaara.com";

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/prep/dashboard")} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-bold text-on-surface text-base">Épreuves & Corrigés</h1>
          <p className="text-xs text-on-surface-variant">Sujets officiels BAC · BFEM</p>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-4">

        {/* BAC / BFEM tabs */}
        <div className="flex gap-2 bg-surface-container rounded-xl p-1">
          {(["BAC", "BFEM"] as ExamTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${tab === t ? "text-primary shadow-sm" : "text-on-surface-variant"}`}
              style={tab === t ? { backgroundColor: "white" } : {}}>
              {t}
            </button>
          ))}
        </div>

        {/* Hero CTA */}
        <button
          onClick={() => window.open(site, "_blank")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl text-white shadow-xl active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #FF6B00, #FF9500)" }}>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-xl">Épreuves {tab}</p>
            <p className="text-sm text-white/80 font-medium mt-0.5">{siteName}</p>
          </div>
          <span className="material-symbols-outlined text-white/80 text-[24px]">open_in_new</span>
        </button>

        {/* Info card */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ borderLeft: "4px solid #3b82f6", backgroundColor: "#eff6ff" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100">
            <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <p className="font-extrabold text-sm text-blue-700">
              {tab === "BAC" ? "BAC sénégalais — officedubac.sn" : "BFEM — sunudaara.com"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-blue-900 leading-relaxed">
              {tab === "BAC"
                ? "Toutes les épreuves et corrigés officiels du BAC sénégalais classés par série, matière et année. Télécharge et entraîne-toi sur les vrais sujets."
                : "Toutes les épreuves et corrigés du BFEM disponibles par matière et année. Idéal pour s'entraîner avant l'examen."}
            </p>
          </div>
        </div>

        {/* Séries BAC */}
        {tab === "BAC" && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Séries disponibles</p>
            <div className="grid grid-cols-2 gap-2.5">
              {BAC_SERIES.map(s => (
                <button key={s.label} onClick={() => window.open(site, "_blank")}
                  className="text-left p-3.5 rounded-2xl shadow-sm active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: "#fff7ed", borderLeft: "3px solid #FF6B00" }}>
                  <p className="font-extrabold text-sm text-[#c2410c]">{s.label}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conseil */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ borderLeft: "4px solid #10b981", backgroundColor: "#f0fdf4" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-green-100">
            <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
            <p className="font-extrabold text-sm text-green-700">Conseil de révision</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {[
              "Commence par les épreuves des 3 dernières années",
              "Corrige chaque erreur avec le corrigé officiel",
              "Utilise GSN PREP pour approfondir les notions difficiles",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-500 font-black flex-shrink-0 mt-0.5">•</span>
                <p className="text-sm text-green-900 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
