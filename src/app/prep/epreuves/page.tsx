"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExamTab = "BAC" | "BFEM";

const ANNEES = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const BAC_SERIES_EPREUVES = ["L", "S1", "S2", "S3", "S4", "S5", "F6", "T1", "T2", "G"];

const BAC_MATIERES = [
  "Mathématiques", "Sciences Physiques", "SVT", "Philosophie",
  "Français", "Histoire-Géographie", "Anglais",
];

const BFEM_MATIERES = [
  "Mathématiques", "Sciences Physiques", "SVT",
  "Histoire-Géographie", "Français", "Anglais",
];

// officedubac.sn URL pattern
function bacUrl(annee: string, serie: string, matiere: string, type: "epreuve" | "corrige"): string {
  const m = matiere.toLowerCase()
    .replace(/é|è|ê/g, "e")
    .replace(/à/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const s = serie.toLowerCase();
  if (type === "epreuve") {
    return `https://www.officedubac.sn/bac-${annee}/epreuve-${m}-serie-${s}-${annee}.pdf`;
  }
  return `https://www.officedubac.sn/bac-${annee}/corrige-${m}-serie-${s}-${annee}.pdf`;
}

// sunudaara.com URL pattern for BFEM
function bfemUrl(annee: string, matiere: string, type: "epreuve" | "corrige"): string {
  const m = matiere.toLowerCase()
    .replace(/é|è|ê/g, "e")
    .replace(/à/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (type === "epreuve") {
    return `https://www.sunudaara.com/bfem-${annee}/epreuve-${m}-${annee}.pdf`;
  }
  return `https://www.sunudaara.com/bfem-${annee}/corrige-${m}-${annee}.pdf`;
}

export default function EpreuvesPage() {
  const router = useRouter();
  const [tab, setTab]       = useState<ExamTab>("BAC");
  const [annee, setAnnee]   = useState("2024");
  const [serie, setSerie]   = useState("S1");
  const [matiere, setMatiere] = useState("");

  const matieres = tab === "BAC" ? BAC_MATIERES : BFEM_MATIERES;

  function openPdf(type: "epreuve" | "corrige") {
    if (!matiere) return;
    const url = tab === "BAC"
      ? bacUrl(annee, serie, matiere, type)
      : bfemUrl(annee, matiere, type);
    window.open(url, "_blank");
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/prep/dashboard")} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold text-on-surface">Épreuves & Corrigés</h1>
      </header>

      <div className="px-6 py-4 space-y-5">

        {/* BAC / BFEM */}
        <div className="flex gap-2 bg-surface-container rounded-xl p-1">
          {(["BAC", "BFEM"] as ExamTab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setMatiere(""); }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${tab === t ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Année */}
        <div>
          <p className="font-bold text-sm mb-2">Année</p>
          <div className="flex flex-wrap gap-2">
            {ANNEES.map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${annee === a ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Série (BAC seulement) */}
        {tab === "BAC" && (
          <div>
            <p className="font-bold text-sm mb-2">Série</p>
            <div className="flex flex-wrap gap-2">
              {BAC_SERIES_EPREUVES.map(s => (
                <button key={s} onClick={() => setSerie(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${serie === s ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matière */}
        <div>
          <p className="font-bold text-sm mb-2">Matière</p>
          <div className="space-y-2">
            {matieres.map(m => (
              <button key={m} onClick={() => setMatiere(m)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${matiere === m ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-on-surface bg-surface-container-lowest"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Boutons */}
        {matiere && (
          <div className="space-y-3 pt-2">
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-on-surface text-sm">
                {matiere} · {tab}{tab === "BAC" ? " " + serie : ""} · {annee}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Source : {tab === "BAC" ? "officedubac.sn" : "sunudaara.com"}
              </p>
            </div>

            <button
              onClick={() => openPdf("epreuve")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#FF6B00" }}>
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              Voir l'épreuve
            </button>

            <button
              onClick={() => openPdf("corrige")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black border-2 border-primary text-primary bg-primary/5 active:scale-[0.98] transition-transform">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
              Voir le corrigé
            </button>

            <p className="text-xs text-center text-on-surface-variant">
              Les documents s'ouvrent dans un nouvel onglet depuis le site officiel.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
