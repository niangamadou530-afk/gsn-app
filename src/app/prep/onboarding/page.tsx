"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveOffline } from "@/lib/offline";

/* ─── DATA ─────────────────────────────────────────────── */

const BAC_SERIES = [
  { code: "L1", label: "Série L1", desc: "Lettres & Sciences Humaines" },
  { code: "L2", label: "Série L2", desc: "Langues & Civilisations" },
  { code: "S1", label: "Série S1", desc: "Maths — Sciences Physiques" },
  { code: "S2", label: "Série S2", desc: "Maths — Sciences Naturelles" },
  { code: "S3", label: "Série S3", desc: "Maths — Technologie" },
  { code: "S4", label: "Série S4", desc: "Maths — Agriculture" },
  { code: "G",  label: "Série G",  desc: "Gestion & Commerce" },
];

const SUBJECTS_MAP: Record<string, string[]> = {
  BFEM:    ["Français", "Maths", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Anglais"],
  BAC_L1:  ["Philosophie", "Français", "Histoire-Géographie", "Anglais", "Arabe/Espagnol"],
  BAC_L2:  ["Philosophie", "Français", "Histoire-Géographie", "Anglais", "Arabe"],
  BAC_S1:  ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie", "Anglais"],
  BAC_S2:  ["Maths", "Sciences Naturelles", "Sciences Physiques", "Français", "Philosophie", "Anglais"],
  BAC_S3:  ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Anglais"],
  BAC_S4:  ["Maths", "Sciences Naturelles", "Français", "Anglais"],
  BAC_G:   ["Comptabilité", "Économie", "Gestion", "Maths", "Français", "Anglais"],
};

const LEVELS = [
  { value: 1, label: "Nul",       emoji: "😰", score: 10,  level: "Faible" as const, colorSel: "bg-gray-300 border-gray-400",    colorDef: "bg-gray-100 border-gray-200" },
  { value: 2, label: "Faible",    emoji: "😟", score: 35,  level: "Faible" as const, colorSel: "bg-red-200 border-red-400",      colorDef: "bg-red-50 border-red-100" },
  { value: 3, label: "Moyen",     emoji: "😐", score: 60,  level: "Moyen"  as const, colorSel: "bg-yellow-200 border-yellow-400", colorDef: "bg-yellow-50 border-yellow-100" },
  { value: 4, label: "Bien",      emoji: "🙂", score: 80,  level: "Fort"   as const, colorSel: "bg-green-200 border-green-400",  colorDef: "bg-green-50 border-green-100" },
  { value: 5, label: "Très bien", emoji: "😎", score: 95,  level: "Fort"   as const, colorSel: "bg-blue-200 border-blue-400",   colorDef: "bg-blue-50 border-blue-100" },
];

type SubjectLevel = { level: "Faible" | "Moyen" | "Fort"; score: number };

/* ─── COMPONENT ─────────────────────────────────────────── */

function PrepOnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExam = searchParams.get("exam");

  const [step, setStep] = useState(0);
  const [examType, setExamType] = useState(preselectedExam ?? "");
  const [serie, setSerie] = useState("");
  const [selfEval, setSelfEval] = useState<Record<string, number>>({});
  const [subjectLevels, setSubjectLevels] = useState<Record<string, SubjectLevel>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preselectedExam === "BFEM" || preselectedExam === "BAC") setExamType(preselectedExam);
  }, [preselectedExam]);

  function getSubjects(exam: string, s: string): string[] {
    if (exam === "BFEM") return SUBJECTS_MAP["BFEM"];
    if (exam === "BAC" && s) return SUBJECTS_MAP[`BAC_${s}`] ?? [];
    return [];
  }

  function setLevelForSubject(subj: string, value: number) {
    setSelfEval(prev => ({ ...prev, [subj]: value }));
    const lv = LEVELS.find(l => l.value === value)!;
    setSubjectLevels(prev => ({ ...prev, [subj]: { level: lv.level, score: lv.score } }));
  }

  const subjects = getSubjects(examType, serie);
  const allEvaluated = subjects.length > 0 && subjects.every(s => selfEval[s] !== undefined);
  const progress = ((step + 1) / 3) * 100;

  /* ── Save profile and redirect ── */
  async function saveProfile() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const stuPayload = {
        exam_type: examType,
        serie: serie || null,
        level_per_subject: subjectLevels,
        country: "Sénégal",
        voice_lang: "fr-FR",
        stress_journal: [],
      };

      const { data: existingStu } = await supabase
        .from("prep_students").select("id").eq("user_id", user.id).maybeSingle();

      const result = existingStu
        ? await supabase.from("prep_students").update(stuPayload).eq("user_id", user.id)
        : await supabase.from("prep_students").insert({ user_id: user.id, ...stuPayload });

      if (result.error) throw new Error(result.error.message);

      saveOffline("student_" + user.id, { examType, serie, subjectLevels });
      router.push("/prep/dashboard");
    } catch (err: unknown) {
      alert("Erreur : " + (err instanceof Error ? err.message : "Impossible de sauvegarder"));
    } finally {
      setSaving(false);
    }
  }

  if (saving) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6 p-6">
      <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <div className="text-center">
        <p className="font-bold text-lg text-on-surface">Création de ton profil…</p>
        <p className="text-on-surface-variant text-sm mt-1">Sénégal · {examType}{serie ? " " + serie : ""}</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.push("/prep")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <div className="flex-1">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Étape {step + 1} sur 3</span>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: "#FF6B00" }} />
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

        {/* ── STEP 0: Exam + Serie ── */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Quel examen prépares-tu ?</h1>
              <p className="text-on-surface-variant text-sm">🇸🇳 Sénégal · Programme officiel Office du BAC</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["BFEM", "BAC"].map(e => (
                <button key={e}
                  onClick={() => { setExamType(e); setSerie(""); }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-[0.97] ${examType === e ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/30"}`}>
                  <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {e === "BFEM" ? "assignment" : "workspace_premium"}
                  </span>
                  <div className="text-center">
                    <p className="font-extrabold text-on-surface text-lg">{e}</p>
                    <p className="text-xs text-on-surface-variant">{e === "BFEM" ? "3ème · Brevet" : "Terminale · Bac"}</p>
                  </div>
                </button>
              ))}
            </div>

            {examType === "BAC" && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface">Quelle est ta série ?</p>
                <div className="space-y-2">
                  {BAC_SERIES.map(s => (
                    <button key={s.code}
                      onClick={() => setSerie(s.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-[0.98] text-left ${serie === s.code ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/20"}`}>
                      <div>
                        <span className="font-bold text-on-surface">{s.label}</span>
                        <span className="text-xs text-on-surface-variant ml-2">{s.desc}</span>
                      </div>
                      {serie === s.code && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={!examType || (examType === "BAC" && !serie)}
              onClick={() => setStep(1)}
              className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Suivant →
            </button>
          </>
        )}

        {/* ── STEP 1: Self-assessment ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Évalue ton niveau</h1>
              <p className="text-on-surface-variant text-sm">Pour chaque matière, choisis honnêtement ton niveau actuel.</p>
            </div>

            <div className="space-y-5">
              {subjects.map(subj => {
                const selected = selfEval[subj];
                return (
                  <div key={subj} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-on-surface">{subj}</p>
                      {selected !== undefined && (
                        <span className="text-sm">{LEVELS[selected - 1].emoji} <span className="font-semibold text-on-surface-variant text-xs">{LEVELS[selected - 1].label}</span></span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {LEVELS.map(lv => (
                        <button key={lv.value}
                          onClick={() => setLevelForSubject(subj, lv.value)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-[0.95] ${selected === lv.value ? lv.colorSel + " ring-2 ring-offset-1 ring-primary" : lv.colorDef}`}>
                          <span className="text-xl">{lv.emoji}</span>
                          <span className="text-[9px] font-bold text-on-surface leading-tight text-center">{lv.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              disabled={!allEvaluated}
              onClick={() => setStep(2)}
              className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Continuer → ({Object.keys(selfEval).length}/{subjects.length} matières)
            </button>
          </>
        )}

        {/* ── STEP 2: Confirmation ── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Récapitulatif</h1>
              <p className="text-on-surface-variant text-sm">Confirme ton profil pour accéder à GSN PREP.</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <div>
                  <p className="font-bold text-on-surface">
                    {examType}{serie ? " · Série " + serie : ""}
                  </p>
                  <p className="text-xs text-on-surface-variant">🇸🇳 Sénégal · Programme officiel</p>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(subjectLevels).map(([subj, info]) => {
                  const lv = LEVELS.find(l => l.level === info.level && l.score === info.score) ?? LEVELS[2];
                  return (
                    <div key={subj} className="flex items-center justify-between">
                      <span className="text-sm text-on-surface flex items-center gap-2">
                        <span>{lv.emoji}</span> {subj}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        info.level === "Fort" ? "bg-green-100 text-green-700" :
                        info.level === "Moyen" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{info.level}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full py-4 font-black text-white rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FF6B00" }}>
              <span className="material-symbols-outlined">check_circle</span>
              Créer mon profil GSN PREP
            </button>
          </>
        )}

      </div>
    </main>
  );
}

export default function PrepOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      </div>
    }>
      <PrepOnboardingInner />
    </Suspense>
  );
}
