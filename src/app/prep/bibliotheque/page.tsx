"use client";

import { useState } from "react";
import Link from "next/link";

type Epreuve = {
  id: number;
  annee: number;
  matiere: string;
  examen: "BFEM" | "BAC";
  serie?: string;
  type: string;
  hasCorrige: boolean;
};

const EPREUVES: Epreuve[] = [
  // BAC 2024
  { id: 1,  annee: 2024, matiere: "Maths",              examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 2,  annee: 2024, matiere: "Maths",              examen: "BAC",  serie: "S2", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 3,  annee: 2024, matiere: "Sciences Physiques", examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: false },
  { id: 4,  annee: 2024, matiere: "Sciences Naturelles",examen: "BAC",  serie: "S2", type: "Épreuve écrite",   hasCorrige: false },
  { id: 5,  annee: 2024, matiere: "Français",           examen: "BAC",  serie: "L1", type: "Dissertation",     hasCorrige: true  },
  { id: 6,  annee: 2024, matiere: "Philosophie",        examen: "BAC",  serie: "L1", type: "Dissertation",     hasCorrige: false },
  { id: 7,  annee: 2024, matiere: "Histoire-Géographie",examen: "BAC",  serie: "L2", type: "Composition",      hasCorrige: false },
  { id: 8,  annee: 2024, matiere: "Maths",              examen: "BFEM", serie: "",   type: "Épreuve écrite",   hasCorrige: true  },
  { id: 9,  annee: 2024, matiere: "Français",           examen: "BFEM", serie: "",   type: "Dictée + Rédac.",  hasCorrige: false },
  // BAC 2023
  { id: 10, annee: 2023, matiere: "Maths",              examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 11, annee: 2023, matiere: "Maths",              examen: "BAC",  serie: "S2", type: "Épreuve écrite",   hasCorrige: false },
  { id: 12, annee: 2023, matiere: "Sciences Naturelles",examen: "BAC",  serie: "S2", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 13, annee: 2023, matiere: "Comptabilité",       examen: "BAC",  serie: "G",  type: "Épreuve pratique", hasCorrige: false },
  { id: 14, annee: 2023, matiere: "Philosophie",        examen: "BAC",  serie: "L1", type: "Dissertation",     hasCorrige: true  },
  { id: 15, annee: 2023, matiere: "Anglais",            examen: "BFEM", serie: "",   type: "Oral + Écrit",     hasCorrige: false },
  // BAC 2022
  { id: 16, annee: 2022, matiere: "Maths",              examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 17, annee: 2022, matiere: "Sciences Physiques", examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: false },
  { id: 18, annee: 2022, matiere: "Philosophie",        examen: "BAC",  serie: "L2", type: "Dissertation",     hasCorrige: false },
  { id: 19, annee: 2022, matiere: "Maths",              examen: "BFEM", serie: "",   type: "Épreuve écrite",   hasCorrige: true  },
  // BAC 2021
  { id: 20, annee: 2021, matiere: "Maths",              examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 21, annee: 2021, matiere: "Français",           examen: "BAC",  serie: "L1", type: "Dissertation",     hasCorrige: false },
  { id: 22, annee: 2021, matiere: "Sciences Naturelles",examen: "BAC",  serie: "S2", type: "Épreuve écrite",   hasCorrige: false },
  // BAC 2020
  { id: 23, annee: 2020, matiere: "Maths",              examen: "BAC",  serie: "S2", type: "Épreuve écrite",   hasCorrige: false },
  { id: 24, annee: 2020, matiere: "Histoire-Géographie",examen: "BAC",  serie: "L1", type: "Composition",      hasCorrige: false },
  // BAC 2019
  { id: 25, annee: 2019, matiere: "Maths",              examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: true  },
  { id: 26, annee: 2019, matiere: "Sciences Physiques", examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: false },
  // BAC 2018
  { id: 27, annee: 2018, matiere: "Maths",              examen: "BAC",  serie: "S1", type: "Épreuve écrite",   hasCorrige: false },
  { id: 28, annee: 2018, matiere: "Philosophie",        examen: "BAC",  serie: "L1", type: "Dissertation",     hasCorrige: false },
];

const EXAMS   = ["Tous", "BFEM", "BAC"];
const SERIES  = ["Toutes", "L1", "L2", "S1", "S2", "S3", "S4", "G"];
const MATIERES = ["Toutes", "Maths", "Français", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Philosophie", "Anglais", "Comptabilité"];
const ANNEES  = ["Toutes", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

function officedubacUrl(e: Epreuve): string {
  const base = "https://www.officedubac.sn";
  const matSlug = e.matiere.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  return `${base}/?s=${encodeURIComponent(`${e.matiere} ${e.examen} ${e.serie || ""} ${e.annee}`.trim())}`;
}

function matiereIcon(m: string) {
  if (m.includes("Math")) return "functions";
  if (m.includes("Français") || m.includes("Philo")) return "menu_book";
  if (m.includes("Physique") || m.includes("Sciences")) return "science";
  if (m.includes("Histoire")) return "public";
  if (m.includes("Anglais")) return "translate";
  if (m.includes("Compt")) return "calculate";
  return "description";
}

export default function BibliothequePage() {
  const [filterExam,    setFilterExam]    = useState("Tous");
  const [filterSerie,   setFilterSerie]   = useState("Toutes");
  const [filterMatiere, setFilterMatiere] = useState("Toutes");
  const [filterAnnee,   setFilterAnnee]   = useState("Toutes");
  const [expanded,      setExpanded]      = useState<number | null>(null);

  const filtered = EPREUVES.filter(e => {
    if (filterExam    !== "Tous"    && e.examen !== filterExam) return false;
    if (filterSerie   !== "Toutes"  && e.serie  !== filterSerie) return false;
    if (filterMatiere !== "Toutes"  && e.matiere !== filterMatiere) return false;
    if (filterAnnee   !== "Toutes"  && e.annee.toString() !== filterAnnee) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">

      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs text-on-surface-variant">🇸🇳 officedubac.sn</p>
          <p className="font-bold text-on-surface">Épreuves BAC · BFEM Sénégal</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[18px] shrink-0 mt-0.5">info</span>
          <p className="text-xs text-blue-800">Les épreuves s&apos;ouvrent sur <strong>officedubac.sn</strong>, la source officielle de l&apos;Office du Baccalauréat du Sénégal.</p>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {EXAMS.map(f => (
              <button key={f} onClick={() => { setFilterExam(f); setFilterSerie("Toutes"); }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterExam === f ? "text-white" : "bg-surface-container-lowest text-on-surface-variant"}`}
                style={filterExam === f ? { backgroundColor: "#FF6B00" } : {}}>
                {f}
              </button>
            ))}
          </div>

          {filterExam === "BAC" && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {SERIES.map(s => (
                <button key={s} onClick={() => setFilterSerie(s)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${filterSerie === s ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-surface-container-lowest text-on-surface-variant"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {ANNEES.map(a => (
              <button key={a} onClick={() => setFilterAnnee(a)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterAnnee === a ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant"}`}>
                {a}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {MATIERES.map(m => (
              <button key={m} onClick={() => setFilterMatiere(m)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterMatiere === m ? "bg-surface-container-high text-on-surface border border-outline" : "bg-surface-container-lowest text-on-surface-variant"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-on-surface-variant font-medium">
          {filtered.length} épreuve{filtered.length !== 1 ? "s" : ""} · Sénégal
        </p>

        {/* List */}
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {matiereIcon(e.matiere)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: e.examen === "BAC" ? "#1a73e8" : "#FF6B00" }}>
                      {e.examen}{e.serie ? " " + e.serie : ""}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium">{e.annee}</span>
                    {e.hasCorrige && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">✓ Corrigé</span>
                    )}
                  </div>
                  <p className="font-bold text-on-surface">{e.matiere}</p>
                  <p className="text-xs text-on-surface-variant">{e.type}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <a href={officedubacUrl(e)} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    Voir
                  </a>
                  <button
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-colors">
                    {expanded === e.id ? "Fermer" : "Quiz"}
                  </button>
                </div>
              </div>

              {expanded === e.id && (
                <div className="px-4 pb-4">
                  <div className="bg-surface-container rounded-xl p-4 text-sm space-y-3">
                    <p className="font-bold text-on-surface">{e.matiere} {e.examen}{e.serie ? " " + e.serie : ""} {e.annee}</p>
                    <p className="text-on-surface-variant text-xs leading-relaxed">
                      Entraîne-toi sur ce type d&apos;épreuve avec des questions générées par l&apos;IA à partir du programme officiel.
                    </p>
                    <Link href={`/prep/simulateur?matiere=${encodeURIComponent(e.matiere)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      <span className="material-symbols-outlined text-[14px]">quiz</span>
                      Examen blanc — {e.matiere}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">search_off</span>
            <p className="text-on-surface-variant font-medium">Aucune épreuve pour ces filtres.</p>
          </div>
        )}

        {/* officedubac.sn direct link */}
        <a href="https://www.officedubac.sn" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          Toutes les épreuves sur officedubac.sn
        </a>

      </div>
    </main>
  );
}
