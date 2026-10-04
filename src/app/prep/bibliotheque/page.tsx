"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";

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
  return `${base}/?s=${encodeURIComponent(`${e.matiere} ${e.examen} ${e.serie || ""} ${e.annee}`.trim())}`;
}

function matiereIcon(m: string) {
  if (m.includes("Math")) return "calculate";
  if (m.includes("Français") || m.includes("Philo")) return "menu_book";
  if (m.includes("Physique") || m.includes("Sciences")) return "science";
  if (m.includes("Histoire")) return "public";
  if (m.includes("Anglais")) return "translate";
  if (m.includes("Compt")) return "finance_chip";
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">folder_special</span>
            <span>Archives officielles du Baccalauréat & BFEM sénégalais</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.bibliotheque.headerTitle")}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Consultez les sujets et corrigés des sessions 2018 à 2024 de l&apos;Office du Bac du Sénégal.
          </p>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#005bbf] text-[20px] shrink-0 mt-0.5">info</span>
        <p className="text-xs text-slate-700 leading-relaxed">
          {t("prep.bibliotheque.infoPart1")} <strong className="text-slate-900">officedubac.sn</strong> {t("prep.bibliotheque.infoPart2")}
        </p>
      </div>

      {/* Filter Bars */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        {/* Exams */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Examen :</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {EXAMS.map(f => (
              <button
                key={f}
                onClick={() => { setFilterExam(f); setFilterSerie("Toutes"); }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                  filterExam === f
                    ? "bg-[#005bbf] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Series (if BAC) */}
        {filterExam === "BAC" && (
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Série :</label>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {SERIES.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSerie(s)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    filterSerie === s
                      ? "bg-blue-100 text-[#005bbf] border border-blue-300"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Years */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Session :</label>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {ANNEES.map(a => (
              <button
                key={a}
                onClick={() => setFilterAnnee(a)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  filterAnnee === a
                    ? "bg-[#FF6B00] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Matieres */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Discipline :</label>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {MATIERES.map(m => (
              <button
                key={m}
                onClick={() => setFilterMatiere(m)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  filterMatiere === m
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          {t(filtered.length !== 1 ? "prep.bibliotheque.resultsCountPlural" : "prep.bibliotheque.resultsCountSingular", { count: filtered.length })}
        </p>
      </div>

      {/* List of Exams */}
      <div className="space-y-3">
        {filtered.map(e => (
          <div key={e.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden transition-all">
            <div className="p-4 sm:p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {matiereIcon(e.matiere)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: e.examen === "BAC" ? "#005bbf" : "#FF6B00" }}
                  >
                    {e.examen}{e.serie ? " " + e.serie : ""}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{e.annee}</span>
                  {e.hasCorrige && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t("prep.bibliotheque.correctedBadge")}
                    </span>
                  )}
                </div>
                <p className="font-extrabold text-slate-900 text-sm truncate">{e.matiere}</p>
                <p className="text-xs text-slate-400 mt-0.5">{e.type}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <a
                  href={officedubacUrl(e)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005bbf] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  <span>{t("prep.bibliotheque.viewLink")}</span>
                </a>
                <button
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  {expanded === e.id ? t("prep.bibliotheque.closeLabel") : t("prep.bibliotheque.quizLabel")}
                </button>
              </div>
            </div>

            {expanded === e.id && (
              <div className="px-5 pb-5 pt-0">
                <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-xs space-y-2.5">
                  <p className="font-extrabold text-slate-900">
                    Sujet de {e.matiere} ({e.examen}{e.serie ? " " + e.serie : ""} {e.annee})
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {t("prep.bibliotheque.quizHint")}
                  </p>
                  <Link
                    href={`/prep/generer?matiere=${encodeURIComponent(e.matiere)}&type=quiz`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005bbf] hover:underline"
                  >
                    <span className="material-symbols-outlined text-[15px]">quiz</span>
                    <span>{t("prep.bibliotheque.mockExamLink", { matiere: e.matiere })}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-2">
          <span className="material-symbols-outlined text-[44px] text-slate-300 block mx-auto">search_off</span>
          <p className="font-extrabold text-slate-900 text-sm">{t("prep.bibliotheque.emptyState")}</p>
          <p className="text-xs text-slate-500">Essayez d&apos;élargir vos filtres d&apos;année ou de discipline.</p>
        </div>
      )}

      {/* officedubac.sn direct link button */}
      <a
        href="https://www.officedubac.sn"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#005bbf] text-xs font-bold text-slate-700 hover:text-[#005bbf] transition-all shadow-xs"
      >
        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        <span>{t("prep.bibliotheque.allExamsLink")}</span>
      </a>
    </div>
  );
}
