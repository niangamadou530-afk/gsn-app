"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveOffline } from "@/lib/offline";

/* ─── DATA ─────────────────────────────────────────────── */

const COUNTRIES = [
  { code: "SN", name: "Sénégal",       flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "ML", name: "Mali",           flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫" },
  { code: "GN", name: "Guinée",         flag: "🇬🇳" },
  { code: "TG", name: "Togo",           flag: "🇹🇬" },
  { code: "BJ", name: "Bénin",          flag: "🇧🇯" },
  { code: "CM", name: "Cameroun",       flag: "🇨🇲" },
  { code: "OTHER", name: "Autre pays",  flag: "🌍" },
];

const BAC_SERIES = [
  { code: "L",  label: "Série L",  desc: "Lettres & Sciences Humaines" },
  { code: "S1", label: "Série S1", desc: "Maths — Physique" },
  { code: "S2", label: "Série S2", desc: "Maths — Sciences Naturelles" },
  { code: "S3", label: "Série S3", desc: "Maths — Technologie" },
  { code: "S4", label: "Série S4", desc: "Maths — Agriculture" },
  { code: "G",  label: "Série G",  desc: "Gestion & Commerce" },
];

const SUBJECTS_MAP: Record<string, string[]> = {
  BFEM:   ["Français", "Maths", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Anglais"],
  BAC_L:  ["Français", "Philosophie", "Histoire-Géographie", "Anglais", "Arabe/Espagnol"],
  BAC_S1: ["Maths", "Physique-Chimie", "Sciences Naturelles", "Français", "Anglais"],
  BAC_S2: ["Maths", "Sciences Naturelles", "Physique-Chimie", "Français", "Anglais"],
  BAC_S3: ["Maths", "Physique-Chimie", "Sciences Naturelles", "Français", "Anglais"],
  BAC_S4: ["Maths", "Physique-Chimie", "Sciences Naturelles", "Français", "Anglais"],
  BAC_G:  ["Comptabilité", "Economie", "Gestion", "Maths", "Français", "Anglais"],
};

const LEVELS = [
  { value: 1, label: "Nul",       emoji: "😰", desc: "Je ne comprends rien",              score: 10, level: "Faible" as const, colorSel: "bg-gray-300 border-gray-400",   colorDef: "bg-gray-100 border-gray-200" },
  { value: 2, label: "Faible",    emoji: "😟", desc: "Quelques bases seulement",           score: 35, level: "Faible" as const, colorSel: "bg-red-200 border-red-400",     colorDef: "bg-red-50 border-red-100" },
  { value: 3, label: "Moyen",     emoji: "😐", desc: "Je comprends mais j'ai des lacunes", score: 60, level: "Moyen" as const,  colorSel: "bg-yellow-200 border-yellow-400", colorDef: "bg-yellow-50 border-yellow-100" },
  { value: 4, label: "Bien",      emoji: "🙂", desc: "Je maîtrise la plupart",             score: 80, level: "Fort" as const,  colorSel: "bg-green-200 border-green-400",  colorDef: "bg-green-50 border-green-100" },
  { value: 5, label: "Très bien", emoji: "😎", desc: "Je suis à l'aise",                   score: 95, level: "Fort" as const,  colorSel: "bg-blue-200 border-blue-400",   colorDef: "bg-blue-50 border-blue-100" },
];

type SubjectLevel = { level: "Faible" | "Moyen" | "Fort"; score: number };

/* ─── COMPONENT ─────────────────────────────────────────── */

function PrepOnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExam = searchParams.get("exam");

  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("");
  const [examType, setExamType] = useState(preselectedExam ?? "");
  const [serie, setSerie] = useState("");

  // Step 2 — self-assessment
  const [selfEval, setSelfEval] = useState<Record<string, number>>({});
  const [subjectLevels, setSubjectLevels] = useState<Record<string, SubjectLevel>>({});

  // Step 3 — generate
  const [examDate, setExamDate] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (preselectedExam === "BFEM" || preselectedExam === "BAC") {
      setExamType(preselectedExam);
    }
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
  const progress = (step / 3) * 100;
  const defaultExamDate = examType === "BFEM" ? "2026-06-20" : "2026-06-25";

  /* ── Step 3: Generate program ── */
  async function generateProgram() {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const levelsStr = Object.entries(subjectLevels)
        .map(([s, l]) => `${s}: ${l.level} (${l.score}%)`)
        .join(", ");

      const finalExamDate = examDate || defaultExamDate;
      const daysLeft = Math.max(1, Math.ceil(
        (new Date(finalExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ));

      const payload = {
        examType:  examType  || "BAC",
        examDate:  finalExamDate,
        serie:     serie     || "S1",
        country:   country   || "Sénégal",
        levels:    levelsStr || "Non évalué",
        daysLeft,
      };
      console.log("PAYLOAD ENVOYÉ:", JSON.stringify(payload));

      const res = await fetch("/api/prep-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const programData = await res.json();
      if (!res.ok) throw new Error(programData.error);

      await supabase.from("prep_students").upsert({
        user_id: user.id,
        exam_type: examType,
        serie: serie || null,
        level_per_subject: subjectLevels,
        country,
        voice_lang: "fr-FR",
        stress_journal: [],
      }, { onConflict: "user_id" });

      const { error: progErr } = await supabase.from("prep_programs").upsert({
        user_id: user.id,
        program: programData,
        exam_date: finalExamDate,
      }, { onConflict: "user_id" });
      if (progErr) throw progErr;

      saveOffline("program_" + user.id, programData);
      saveOffline("student_" + user.id, { country, examType, serie, subjectLevels, examDate: finalExamDate });

      router.push("/prep/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible de générer le programme";
      console.error(err);
      alert("Erreur : " + msg);
    } finally {
      setGenerating(false);
    }
  }

  /* ─── GENERATING OVERLAY ─── */
  if (generating) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6 p-6">
      <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <div className="text-center">
        <p className="font-bold text-lg text-on-surface">L&apos;IA crée ton programme personnalisé…</p>
        <p className="text-on-surface-variant text-sm mt-1">Analyse de tes niveaux et planification en cours</p>
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Étape {step + 1} sur 4</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: "#FF6B00" }} />
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

        {/* ── STEP 0: Country ── */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Dans quel pays passes-tu ton examen ?</h1>
              <p className="text-on-surface-variant text-sm">L&apos;IA adapte le programme au curriculum officiel de ton pays.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COUNTRIES.map(c => (
                <button key={c.code}
                  onClick={() => { setCountry(c.name); setStep(1); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all active:scale-[0.97] text-left ${country === c.name ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/30"}`}>
                  <span className="text-2xl">{c.flag}</span>
                  <span className="font-semibold text-sm text-on-surface">{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 1: Exam + Serie ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Quel examen prépares-tu ?</h1>
              <p className="text-on-surface-variant text-sm">Pays : <strong>{country}</strong></p>
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
              onClick={() => setStep(2)}
              className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Suivant →
            </button>
          </>
        )}

        {/* ── STEP 2: Self-assessment ── */}
        {step === 2 && (
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
                        <button
                          key={lv.value}
                          onClick={() => setLevelForSubject(subj, lv.value)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all active:scale-[0.95] ${selected === lv.value ? lv.colorSel + " ring-2 ring-offset-1 ring-primary" : lv.colorDef}`}>
                          <span className="text-xl">{lv.emoji}</span>
                          <span className="text-[9px] font-bold text-on-surface leading-tight text-center">{lv.label}</span>
                        </button>
                      ))}
                    </div>
                    {selected !== undefined && (
                      <p className="text-xs text-on-surface-variant italic">{LEVELS[selected - 1].desc}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              disabled={!allEvaluated}
              onClick={() => setStep(3)}
              className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Continuer → ({Object.keys(selfEval).length}/{subjects.length} matières)
            </button>
          </>
        )}

        {/* ── STEP 3: Date + Generate ── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Ton programme est presque prêt !</h1>
              <p className="text-on-surface-variant text-sm">Confirme la date de ton examen pour que l&apos;IA planifie tout.</p>
            </div>

            {/* Levels recap */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <p className="font-bold text-on-surface text-sm">Résumé de ton auto-évaluation</p>
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
                      }`}>{info.level} — {info.score}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Date de l&apos;examen</label>
              <input type="date"
                value={examDate || defaultExamDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none font-medium" />
              <p className="text-xs text-on-surface-variant">
                Par défaut : {examType === "BFEM" ? "20 juin 2026 (BFEM)" : "25 juin 2026 (BAC)"}
              </p>
            </div>

            <button
              onClick={generateProgram}
              disabled={generating}
              className="w-full py-4 font-black text-white rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FF6B00" }}>
              <span className="material-symbols-outlined">auto_awesome</span>
              Générer mon programme de révision
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
