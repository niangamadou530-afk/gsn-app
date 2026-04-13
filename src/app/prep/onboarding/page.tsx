"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveOffline } from "@/lib/offline";

/* ─── DATA ─────────────────────────────────────────────── */

const COUNTRIES = [
  { code: "SN", name: "Sénégal",      flag: "🇸🇳", bfemName: "BFEM", bacName: "BAC" },
  { code: "CI", name: "Côte d'Ivoire",flag: "🇨🇮", bfemName: "BEPC", bacName: "BAC" },
  { code: "ML", name: "Mali",          flag: "🇲🇱", bfemName: "BEPC", bacName: "BAC" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", bfemName: "BEPC", bacName: "BAC" },
  { code: "GN", name: "Guinée",        flag: "🇬🇳", bfemName: "BEPC", bacName: "BAC" },
  { code: "TG", name: "Togo",          flag: "🇹🇬", bfemName: "BEPC", bacName: "BAC" },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", bfemName: "BEPC", bacName: "BAC" },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", bfemName: "BEPC", bacName: "BAC" },
  { code: "OTHER", name: "Autre pays", flag: "🌍", bfemName: "BFEM/BEPC", bacName: "BAC" },
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

type QuizQuestion = {
  question: string;
  choices: string[];
  correct: number;
  explanation: string;
};

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

  // Step 2 — quiz
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<Record<string, QuizQuestion[]>>({});
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [subjectAnswers, setSubjectAnswers] = useState<Record<string, number[]>>({});
  const [subjectLevels, setSubjectLevels] = useState<Record<string, SubjectLevel>>({});

  // Step 3 — generate
  const [examDate, setExamDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const subjects = getSubjects(examType, serie);
  const currentSubject = subjects[currentSubjectIdx] ?? "";
  const currentSubjectQuestions = quizData[currentSubject] ?? [];
  const currentQ = currentSubjectQuestions[currentQuestionIdx];
  const progress = ((step) / 3) * 100;

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

  /* ── Step 2: Load quiz questions via AI ── */
  async function loadQuizQuestions() {
    setQuizLoading(true);
    const subjs = getSubjects(examType, serie);
    const prompt = `Tu es expert en éducation en ${country}.
Génère 3 questions à choix multiples pour évaluer le niveau d'un élève préparant le ${examType}${serie ? " série " + serie : ""}.
Matières : ${subjs.join(", ")}.

Réponds UNIQUEMENT avec ce JSON valide :
{
  ${subjs.map(s => `"${s}": [
    {
      "question": "Question pour ${s} ?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Explication de la bonne réponse."
    }
  ]`).join(",\n  ")}
}

Règles :
- Exactement 3 questions par matière
- Questions adaptées au niveau ${examType}
- Difficulté progressive (facile, moyen, difficile)
- Tout en français
- correct = index 0-3 de la bonne réponse`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const cleaned = (data.reply ?? "").replace(/```json|```/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Pas de JSON");
      const parsed = JSON.parse(match[0]);
      // Ensure exactly 3 questions per subject
      const normalized: Record<string, QuizQuestion[]> = {};
      for (const s of subjs) {
        normalized[s] = Array.isArray(parsed[s]) ? parsed[s].slice(0, 3) : [];
      }
      setQuizData(normalized);
    } catch (e) {
      console.error("Quiz load error:", e);
      // Fallback: self-assessment
      const fallback: Record<string, QuizQuestion[]> = {};
      for (const s of subjs) {
        fallback[s] = [
          {
            question: `Comment évalues-tu ton niveau en ${s} ?`,
            choices: ["Je maîtrise bien", "J'ai quelques lacunes", "J'ai du mal", "Je ne connais pas du tout"],
            correct: 0,
            explanation: "Auto-évaluation de ton niveau.",
          },
        ];
      }
      setQuizData(fallback);
    } finally {
      setQuizLoading(false);
    }
  }

  function handleAnswer(idx: number) {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    const prev = subjectAnswers[currentSubject] ?? [];
    setSubjectAnswers(p => ({ ...p, [currentSubject]: [...prev, idx] }));
  }

  function nextQuestion() {
    const questions = quizData[currentSubject] ?? [];
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(i => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      // Calculate level for this subject
      const answers = [...(subjectAnswers[currentSubject] ?? [])];
      const qs = quizData[currentSubject] ?? [];
      const correct = answers.filter((a, i) => a === qs[i]?.correct).length;
      const score = Math.round((correct / qs.length) * 100);
      const level: "Faible" | "Moyen" | "Fort" = score >= 67 ? "Fort" : score >= 34 ? "Moyen" : "Faible";
      setSubjectLevels(p => ({ ...p, [currentSubject]: { level, score } }));

      if (currentSubjectIdx < subjects.length - 1) {
        setCurrentSubjectIdx(i => i + 1);
        setCurrentQuestionIdx(0);
        setSelectedAnswer(null);
        setAnswered(false);
      } else {
        setStep(3);
      }
    }
  }

  /* ── Step 3: Generate program ── */
  async function generateProgram() {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const levelsStr = Object.entries(subjectLevels)
        .map(([s, l]) => `${s}: ${l.level} (${l.score}%)`)
        .join(", ");

      const daysLeft = Math.max(1, Math.ceil(
        (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ));

      const res = await fetch("/api/prep-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          examType,
          serie,
          levels: levelsStr,
          examDate,
          daysLeft,
        }),
      });
      const programData = await res.json();
      if (!res.ok) throw new Error(programData.error);

      // Save student profile
      await supabase.from("prep_students").upsert({
        user_id: user.id,
        exam_type: examType,
        serie: serie || null,
        level_per_subject: subjectLevels,
        country,
        voice_lang: "fr-FR",
        stress_journal: [],
      }, { onConflict: "user_id" });

      // Save program
      const { error: progErr } = await supabase.from("prep_programs").upsert({
        user_id: user.id,
        program: programData,
        exam_date: examDate,
      }, { onConflict: "user_id" });
      if (progErr) throw progErr;

      saveOffline("program_" + user.id, programData);
      saveOffline("student_" + user.id, { country, examType, serie, subjectLevels, examDate });

      router.push("/prep/dashboard");
    } catch (err: any) {
      console.error(err);
      alert("Erreur : " + (err.message || "Impossible de générer le programme"));
    } finally {
      setGenerating(false);
    }
  }

  const defaultExamDate = examType === "BFEM" ? "2026-06-20" : "2026-06-25";

  /* ─── RENDER ─── */

  if (generating) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6 p-6">
        <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
        <div className="text-center">
          <p className="font-bold text-lg text-on-surface">L&apos;IA crée ton programme personnalisé…</p>
          <p className="text-on-surface-variant text-sm mt-1">Analyse de tes niveaux et planification en cours</p>
        </div>
      </div>
    );
  }

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
              <p className="text-on-surface-variant text-sm">Pays sélectionné : <strong>{country}</strong></p>
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
              onClick={async () => { setStep(2); await loadQuizQuestions(); }}
              className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Suivant →
            </button>
          </>
        )}

        {/* ── STEP 2: Quiz per subject ── */}
        {step === 2 && (
          <>
            {quizLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                <p className="text-on-surface-variant text-sm">Génération des questions d&apos;évaluation…</p>
              </div>
            ) : currentQ ? (
              <>
                {/* Subject progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                    <span>Matière {currentSubjectIdx + 1}/{subjects.length} — <strong className="text-on-surface">{currentSubject}</strong></span>
                    <span>Q{currentQuestionIdx + 1}/{currentSubjectQuestions.length}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((currentSubjectIdx * 3 + currentQuestionIdx + 1) / (subjects.length * 3)) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
                  <p className="font-bold text-on-surface leading-snug">{currentQ.question}</p>
                  <div className="space-y-2">
                    {currentQ.choices.map((choice, i) => {
                      let cls = "border-transparent bg-surface-container-low text-on-surface";
                      if (answered) {
                        if (i === currentQ.correct) cls = "border-green-500 bg-green-50 text-green-700";
                        else if (i === selectedAnswer) cls = "border-red-400 bg-red-50 text-red-600";
                      } else if (selectedAnswer === i) {
                        cls = "border-primary bg-primary/10 text-primary";
                      }
                      return (
                        <button key={i}
                          onClick={() => handleAnswer(i)}
                          className={`w-full text-left p-3 rounded-xl border-2 font-medium text-sm transition-all ${cls}`}>
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <div className="bg-surface-container rounded-xl p-3 text-sm text-on-surface-variant">
                      <span className="font-bold text-on-surface">Explication : </span>{currentQ.explanation}
                    </div>
                  )}
                </div>

                {answered && (
                  <button onClick={nextQuestion}
                    className="w-full py-4 font-black text-white rounded-2xl transition-all active:scale-[0.98]"
                    style={{ backgroundColor: "#FF6B00" }}>
                    {currentQuestionIdx < currentSubjectQuestions.length - 1
                      ? "Question suivante →"
                      : currentSubjectIdx < subjects.length - 1
                        ? `Matière suivante : ${subjects[currentSubjectIdx + 1]} →`
                        : "Voir mon programme →"}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-on-surface-variant">Chargement des questions…</p>
              </div>
            )}
          </>
        )}

        {/* ── STEP 3: Date + Generate ── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Ton programme est presque prêt !</h1>
              <p className="text-on-surface-variant text-sm">Confirme la date de ton examen pour que l&apos;IA planifie ton programme.</p>
            </div>

            {/* Levels recap */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <p className="font-bold text-on-surface text-sm">Résumé de ton évaluation</p>
              <div className="space-y-2">
                {Object.entries(subjectLevels).map(([subj, info]) => (
                  <div key={subj} className="flex items-center justify-between">
                    <span className="text-sm text-on-surface">{subj}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      info.level === "Fort" ? "bg-green-100 text-green-700" :
                      info.level === "Moyen" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{info.level} — {info.score}%</span>
                  </div>
                ))}
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
              onClick={() => generateProgram()}
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
