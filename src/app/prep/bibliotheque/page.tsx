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
  pays: string;
};

const EPREUVES: Epreuve[] = [
  { id: 1,  annee: 2024, matiere: "Maths",             examen: "BAC",  serie: "S1", type: "Épreuve écrite",  pays: "Sénégal" },
  { id: 2,  annee: 2024, matiere: "Français",           examen: "BAC",  serie: "L",  type: "Dissertation",    pays: "Sénégal" },
  { id: 3,  annee: 2024, matiere: "Physique-Chimie",    examen: "BAC",  serie: "S1", type: "Épreuve écrite",  pays: "Sénégal" },
  { id: 4,  annee: 2024, matiere: "Histoire-Géographie",examen: "BAC",  serie: "L",  type: "Composition",     pays: "Sénégal" },
  { id: 5,  annee: 2024, matiere: "Maths",             examen: "BFEM", serie: "",   type: "Épreuve écrite",  pays: "Sénégal" },
  { id: 6,  annee: 2024, matiere: "Français",           examen: "BFEM", serie: "",   type: "Dictée + Rédac.", pays: "Sénégal" },
  { id: 7,  annee: 2023, matiere: "Maths",             examen: "BAC",  serie: "S2", type: "Épreuve écrite",  pays: "Sénégal" },
  { id: 8,  annee: 2023, matiere: "Sciences Naturelles",examen: "BAC",  serie: "S2", type: "Épreuve écrite",  pays: "Sénégal" },
  { id: 9,  annee: 2023, matiere: "Comptabilité",       examen: "BAC",  serie: "G",  type: "Épreuve pratique",pays: "Sénégal" },
  { id: 10, annee: 2023, matiere: "Anglais",            examen: "BFEM", serie: "",   type: "Oral + Écrit",   pays: "Sénégal" },
  { id: 11, annee: 2022, matiere: "Philosophie",        examen: "BAC",  serie: "L",  type: "Dissertation",    pays: "Sénégal" },
  { id: 12, annee: 2022, matiere: "Maths",             examen: "BFEM", serie: "",   type: "Épreuve écrite",  pays: "Sénégal" },
  { id: 13, annee: 2022, matiere: "Physique-Chimie",    examen: "BAC",  serie: "S1", type: "Épreuve écrite",  pays: "Côte d'Ivoire" },
  { id: 14, annee: 2021, matiere: "Maths",             examen: "BAC",  serie: "S1", type: "Épreuve écrite",  pays: "Mali" },
  { id: 15, annee: 2021, matiere: "Français",           examen: "BAC",  serie: "L",  type: "Dissertation",    pays: "Burkina Faso" },
];

const EXAMS = ["Tous", "BFEM", "BAC"];
const MATIERES = ["Toutes", "Maths", "Français", "Physique-Chimie", "Sciences Naturelles", "Histoire-Géographie", "Philosophie", "Anglais", "Comptabilité"];
const ANNEES = ["Toutes", "2024", "2023", "2022", "2021"];

export default function BibliothequePage() {
  const [filterExam, setFilterExam] = useState("Tous");
  const [filterMatiere, setFilterMatiere] = useState("Toutes");
  const [filterAnnee, setFilterAnnee] = useState("Toutes");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = EPREUVES.filter(e => {
    if (filterExam !== "Tous" && e.examen !== filterExam) return false;
    if (filterMatiere !== "Toutes" && e.matiere !== filterMatiere) return false;
    if (filterAnnee !== "Toutes" && e.annee.toString() !== filterAnnee) return false;
    return true;
  });

  function matiereIcon(m: string) {
    if (m.includes("Math")) return "functions";
    if (m.includes("Français") || m.includes("Philo")) return "menu_book";
    if (m.includes("Physique") || m.includes("Sciences")) return "science";
    if (m.includes("Histoire")) return "public";
    if (m.includes("Anglais")) return "translate";
    if (m.includes("Compt")) return "calculate";
    return "description";
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/prep/dashboard" className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">GSN PREP</p>
            <p className="font-bold text-on-surface">Bibliothèque d&apos;épreuves</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-yellow-600 text-[18px] shrink-0 mt-0.5">info</span>
          <p className="text-xs text-yellow-800">Les vraies épreuves seront ajoutées progressivement. Ces exemples illustrent la structure du module.</p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {EXAMS.map(f => (
              <button key={f} onClick={() => setFilterExam(f)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterExam === f ? "text-white" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}
                style={filterExam === f ? { backgroundColor: "#FF6B00" } : {}}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {ANNEES.map(a => (
              <button key={a} onClick={() => setFilterAnnee(a)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterAnnee === a ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant"}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {MATIERES.map(m => (
              <button key={m} onClick={() => setFilterMatiere(m)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterMatiere === m ? "bg-surface-container-high text-on-surface border border-outline" : "bg-surface-container-lowest text-on-surface-variant"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-on-surface-variant font-medium">{filtered.length} épreuve{filtered.length !== 1 ? "s" : ""}</p>

        {/* List */}
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{matiereIcon(e.matiere)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full text-white`}
                      style={{ backgroundColor: e.examen === "BAC" ? "#1a73e8" : "#FF6B00" }}>
                      {e.examen}{e.serie ? " " + e.serie : ""}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium">{e.annee} · {e.pays}</span>
                  </div>
                  <p className="font-bold text-on-surface">{e.matiere}</p>
                  <p className="text-xs text-on-surface-variant">{e.type}</p>
                </div>
                <button
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  className="shrink-0 px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-colors">
                  {expanded === e.id ? "Fermer" : "Voir le corrigé"}
                </button>
              </div>

              {expanded === e.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-surface-container rounded-xl p-4 text-sm space-y-3">
                    <p className="font-bold text-on-surface">Corrigé type — {e.matiere} {e.examen} {e.annee}</p>
                    <p className="text-on-surface-variant leading-relaxed">
                      Ce corrigé sera disponible prochainement. Les épreuves officielles du {e.examen} de {e.pays} ({e.annee}) seront ajoutées avec leurs corrigés détaillés et commentés par l&apos;IA.
                    </p>
                    <Link href={`/prep/simulateur?matiere=${encodeURIComponent(e.matiere)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      <span className="material-symbols-outlined text-[14px]">quiz</span>
                      Faire un examen blanc sur {e.matiere}
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
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur border-t border-outline-variant/20 flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/prep/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/prep/bibliotheque" className="flex flex-col items-center active:scale-90 transition-transform" style={{ color: "#FF6B00" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
          <span className="text-[10px] font-medium mt-0.5">Épreuves</span>
        </Link>
        <Link href="/prep/simulateur" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">quiz</span>
          <span className="text-[10px] font-medium mt-0.5">Examen</span>
        </Link>
        <Link href="/prep/progression" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">trending_up</span>
          <span className="text-[10px] font-medium mt-0.5">Progrès</span>
        </Link>
        <Link href="/prep/soft-skills" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">self_improvement</span>
          <span className="text-[10px] font-medium mt-0.5">Méthodes</span>
        </Link>
      </nav>
    </main>
  );
}
