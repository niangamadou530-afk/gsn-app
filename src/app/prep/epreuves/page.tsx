"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const A  = "#00C9A7";
const C  = "#111118";
const B  = "rgba(255,255,255,0.07)";
const T2 = "#A0A0B0";

type ExamTab = "BAC" | "BFEM";

const SITE_BAC  = "https://officedubac.sn/";
const SITE_BFEM = "https://sunudaara.com/";

const BAC_SERIES = [
  { label: "Série L", desc: "Littéraire — Philo, Français, HG" },
  { label: "Série S", desc: "Scientifique — Maths, Physique, SVT" },
  { label: "Série G", desc: "Gestion — Économie, Comptabilité" },
  { label: "Série T", desc: "Technique — Sciences de l'ingénieur" },
];

export default function EpreuvesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ExamTab>("BAC");

  const site     = tab === "BAC" ? SITE_BAC : SITE_BFEM;
  const siteName = tab === "BAC" ? "officedubac.sn" : "sunudaara.com";

  return (
    <main className="min-h-screen text-white pb-8" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ backgroundColor: "rgba(10,10,15,0.92)", borderBottom: `1px solid ${B}` }}>
        <button onClick={() => router.push("/prep/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-95"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <span className="material-symbols-outlined text-white text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-bold text-white text-sm">Épreuves & Corrigés</h1>
          <p className="text-xs font-medium" style={{ color: T2 }}>Sujets officiels · BAC · BFEM</p>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-4">

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
          {(["BAC", "BFEM"] as ExamTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all"
              style={{
                backgroundColor: tab === t ? "rgba(0,201,167,0.12)" : "transparent",
                color: tab === t ? A : "#5A5A70",
                border: tab === t ? "1px solid rgba(0,201,167,0.2)" : "1px solid transparent",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* CTA principal */}
        <button onClick={() => window.open(site, "_blank")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ backgroundColor: A, color: "#003328" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-xl">Épreuves {tab}</p>
            <p className="text-sm opacity-70 font-medium mt-0.5">{siteName}</p>
          </div>
          <span className="material-symbols-outlined opacity-70">open_in_new</span>
        </button>

        {/* Info */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${A}` }}>
          <p className="font-bold text-white text-sm mb-2">
            {tab === "BAC" ? "BAC sénégalais — officedubac.sn" : "BFEM — sunudaara.com"}
          </p>
          <p className="text-sm" style={{ color: T2 }}>
            {tab === "BAC"
              ? "Toutes les épreuves et corrigés officiels classés par série, matière et année."
              : "Toutes les épreuves et corrigés du BFEM par matière et année."}
          </p>
        </div>

        {/* Séries BAC */}
        {tab === "BAC" && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T2 }}>Séries disponibles</p>
            <div className="grid grid-cols-2 gap-2.5">
              {BAC_SERIES.map(s => (
                <button key={s.label} onClick={() => window.open(site, "_blank")}
                  className="text-left p-4 rounded-2xl active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${A}` }}>
                  <p className="font-extrabold text-sm text-white">{s.label}</p>
                  <p className="text-[11px] mt-1 leading-tight" style={{ color: T2 }}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conseils */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[16px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
            <p className="font-bold text-white text-sm">Conseil de révision</p>
          </div>
          <div className="space-y-2">
            {[
              "Commence par les épreuves des 3 dernières années",
              "Corrige chaque erreur avec le corrigé officiel",
              "Utilise GSN PREP pour approfondir les notions difficiles",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-black flex-shrink-0 mt-0.5 text-sm" style={{ color: A }}>•</span>
                <p className="text-sm" style={{ color: T2 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
