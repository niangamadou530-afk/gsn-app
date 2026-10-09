"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SubjectItem = {
  id: string;
  name: string;
  coeff: number;
  icon: string;
  isCustom?: boolean;
};

const BAC_SERIES_CONFIG: Record<string, { label: string; subjects: { name: string; coeff: number; icon: string }[] }> = {
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
  const [serieKey, setSerieKey] = useState<string>("S2");
  const [studentPrenom, setStudentPrenom] = useState<string>("");
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCoeff, setNewSubjectCoeff] = useState(2);
  const [showAddModal, setShowAddModal] = useState(false);

  // Charger le profil de l'élève connecté
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("prep_students")
        .select("prenom, exam_type, serie")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.prenom) setStudentPrenom(data.prenom);
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

  // Initialiser les matières et notes officielles pour la série choisie
  useEffect(() => {
    resetToOfficial();
  }, [serieKey]);

  function resetToOfficial() {
    const list: SubjectItem[] = config.subjects.map((s, idx) => ({
      id: `official-${idx}-${s.name}`,
      name: s.name,
      coeff: s.coeff,
      icon: s.icon,
      isCustom: false,
    }));
    setSubjectsList(list);

    const initialGrades: Record<string, number> = {};
    for (const item of list) {
      initialGrades[item.id] = 10;
    }
    setGrades(initialGrades);
  }

  function handleUpdateCoeff(id: string, val: number) {
    const clamped = Math.max(1, Math.min(20, Math.round(val)));
    setSubjectsList((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, coeff: clamped } : sub))
    );
  }

  function handleUpdateGrade(id: string, val: number) {
    const clamped = Math.max(0, Math.min(20, val));
    setGrades((prev) => ({ ...prev, [id]: clamped }));
  }

  function handleAddSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newSub: SubjectItem = {
      id: newId,
      name: newSubjectName.trim(),
      coeff: Math.max(1, Math.min(20, newSubjectCoeff)),
      icon: "bookmark",
      isCustom: true,
    };

    setSubjectsList((prev) => [...prev, newSub]);
    setGrades((prev) => ({ ...prev, [newId]: 10 }));
    setNewSubjectName("");
    setNewSubjectCoeff(2);
    setShowAddModal(false);
  }

  function handleRemoveSubject(id: string) {
    setSubjectsList((prev) => prev.filter((sub) => sub.id !== id));
    setGrades((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  const { totalPoints, totalCoeff, average, mention } = useMemo(() => {
    let pts = 0;
    let coeffs = 0;
    for (const sub of subjectsList) {
      const g = grades[sub.id] ?? 10;
      pts += g * sub.coeff;
      coeffs += sub.coeff;
    }
    const avg = coeffs > 0 ? pts / coeffs : 0;

    let ment = "Ajourné (Moyenne < 9/20)";

    if (avg >= 16) {
      ment = "Mention Très Bien 🌟";
    } else if (avg >= 14) {
      ment = "Mention Bien 🏆";
    } else if (avg >= 12) {
      ment = "Mention Assez Bien 🎖️";
    } else if (avg >= 10) {
      ment = "Admis d'office (Sans mention) ✅";
    } else if (avg >= 9) {
      ment = "2ème Groupe (Oral de rattrapage) ⚠️";
    }

    return {
      totalPoints: pts,
      totalCoeff: coeffs,
      average: avg,
      mention: ment,
    };
  }, [subjectsList, grades]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">calculate</span>
            <span>Barème officiel Office du Bac & Direction des Examens</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Simulateur de Moyenne {studentPrenom ? `de ${studentPrenom}` : ""}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Estime tes points et ta mention officielle. Les coefficients sont modifiables pour s&apos;adapter à ton établissement et tu peux ajouter tes matières facultatives.
          </p>
        </div>
      </div>

      {/* Series Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2.5">
          Sélectionner l&apos;examen & la série :
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
      <div data-tour="simulateur-verdict" className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
              {config.label}
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight tabular-nums">
                {average.toFixed(2)}
              </span>
              <span className="text-xl sm:text-2xl font-bold opacity-80">/20</span>
            </div>
            <p className="text-xs text-blue-100 mt-1.5 font-medium">
              Total cumulé : <strong className="text-white">{totalPoints.toFixed(1)}</strong> points sur {totalCoeff * 20} (Coeff total : {totalCoeff})
            </p>
          </div>

          <div className="sm:text-right bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 space-y-2">
            <span className="text-xs text-blue-100 font-bold block uppercase tracking-wider">
              Verdict officiel prévisionnel
            </span>
            <p className="text-lg sm:text-xl font-black text-white">
              {mention}
            </p>
            <div className="pt-2">
              <Link
                href="/prep/orientation"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                <span>Tester mon orientation post-bac</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Sliders & Inputs with Editable Coefficients */}
      <div data-tour="simulateur-subjects-list" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Notes estimées par matière</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Glisse le curseur ou tape directement ta note sur 20.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-[#005bbf] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>+ Ajouter une matière</span>
            </button>
            <button
              type="button"
              onClick={resetToOfficial}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
              title="Réinitialise tous les coefficients et matières au barème officiel"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Rétablir les coefficients officiels</span>
            </button>
          </div>
        </div>

        {/* Helpful Tip about editable coefficients */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">edit</span>
          <p className="text-xs leading-relaxed font-semibold">
            <strong>Coefficient incorrect ? Modifie-le</strong> : clique directement sur le chiffre du coefficient avec l&apos;icône crayon ✏️ pour ajuster le poids d&apos;une matière selon ton établissement.
          </p>
        </div>

        {/* Subject Rows */}
        <div className="space-y-3.5">
          {subjectsList.map((sub) => {
            const currentGrade = grades[sub.id] ?? 10;
            const subPoints = (currentGrade * sub.coeff).toFixed(1);
            return (
              <div
                key={sub.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{sub.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{sub.name}</p>
                        {sub.isCustom && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                            Ajoutée
                          </span>
                        )}
                      </div>

                      {/* Visible and editable coefficient input */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">edit</span>
                          <span className="text-[11px] font-bold text-slate-600">Coeff :</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={sub.coeff}
                            onChange={(e) => handleUpdateCoeff(sub.id, parseFloat(e.target.value) || 1)}
                            className="w-10 px-1 py-0.5 text-center font-black text-xs rounded bg-slate-50 border border-slate-200 text-[#005bbf] focus:outline-none focus:bg-white focus:border-[#005bbf]"
                            title="Modifier le coefficient de cette matière"
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          ({subPoints} points)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={currentGrade}
                        onChange={(e) => handleUpdateGrade(sub.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 text-center font-black text-base sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#005bbf]"
                      />
                      <span className="text-xs font-bold text-slate-500">/20</span>
                    </div>

                    {sub.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub.id)}
                        className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Supprimer cette matière ajoutée"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grade Range Slider */}
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={currentGrade}
                  onChange={(e) => handleUpdateGrade(sub.id, parseFloat(e.target.value))}
                  className="w-full accent-[#005bbf] cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Subject Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">Ajouter une matière</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Nom de la matière
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arabe, Italien, Dessin technique..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#005bbf]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Coefficient
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={newSubjectCoeff}
                  onChange={(e) => setNewSubjectCoeff(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#005bbf]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#005bbf] text-white font-extrabold text-xs shadow-xs hover:bg-[#004ba0]"
                >
                  Ajouter la matière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
