"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MATIERES_BY_SERIE, getDureeOfficielle } from "@/data/programmes";

/* ─── TYPES ────────────────────────────────────────────────── */

type QuizQuestion = {
  id: number;
  type: "qcm" | "vrai_faux" | "calcul" | "definition";
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  difficulty: "facile" | "moyen" | "difficile";
  chapter?: string;
};

type AnswerRecord = {
  answer: string;
  correct: boolean;
  timeSpent: number;
};

const ANNEES = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

/* ─── INNER COMPONENT (uses useSearchParams) ────────────────── */

function SimulateurInner() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [examType, setExamType] = useState("BAC");
  const [serie, setSerie] = useState("S1");

  // Step 0 = config, 1 = loading questions, 2 = exam in progress, 3 = results
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Config
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedAnnee, setSelectedAnnee] = useState("2024");

  // Exam state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Official timer (counts down from duree * 60 seconds)
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dureeMinutes = getDureeOfficielle(examType, selectedMatiere);

  // Load user info
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: stu } = await supabase.from("prep_students")
        .select("exam_type, serie").eq("user_id", user.id).limit(1);
      if (stu?.[0]) {
        setExamType(stu[0].exam_type ?? "BAC");
        setSerie(stu[0].serie ?? "S1");
      }
      // Pre-fill matiere from query param
      const m = searchParams.get("matiere");
      if (m) setSelectedMatiere(m);
    }
    load();
  }, [searchParams]);

  // Timer countdown during exam
  useEffect(() => {
    if (step !== 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finishExam = useCallback(() => {
    setStep(3);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  async function startExam() {
    if (!selectedMatiere) return;
    setStep(1);
    setLoadError("");
    try {
      const res = await fetch("/api/prep-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedMatiere,
          serie,
          examType,
          annee: selectedAnnee,
          examBlanc: true,
          count: 10,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error || "Aucune question générée.");
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers({});
      setSelected(null);
      setRevealed(false);
      setTimeLeft(dureeMinutes * 60);
      setStep(2);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Erreur lors du chargement.");
      setStep(0);
    }
  }

  function submitAnswer() {
    if (!selected || revealed) return;
    const q = questions[currentIdx];
    const correct = selected === q.correct_answer;
    setAnswers(prev => ({
      ...prev,
      [currentIdx]: { answer: selected, correct, timeSpent: 0 },
    }));
    setRevealed(true);
  }

  function nextQuestion() {
    setSelected(null);
    setRevealed(false);
    if (currentIdx + 1 >= questions.length) {
      finishExam();
    } else {
      setCurrentIdx(i => i + 1);
    }
  }

  // ─── Save results on finish ───────────────────────────────
  useEffect(() => {
    if (step !== 3 || !userId || !questions.length) return;
    const correct = Object.values(answers).filter(a => a.correct).length;
    const score = Math.round((correct / questions.length) * 20);
    const saveResult = async () => {
      await supabase.from("prep_results").insert({
        user_id: userId,
        subject: selectedMatiere,
        score,
        feedback: `Examen blanc ${examType} ${serie} ${selectedAnnee} — ${correct}/${questions.length} questions correctes`,
      });
    };
    saveResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const matieres = MATIERES_BY_SERIE[serie] ?? MATIERES_BY_SERIE["S1"];

  // ── STEP 0: Configuration ─────────────────────────────────
  if (step === 0) {
    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
          <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">GSN PREP</p>
            <p className="font-bold text-on-surface">Examen blanc</p>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
          {/* Hero */}
          <div className="rounded-2xl p-6 text-white space-y-1" style={{ background: "linear-gradient(135deg,#1a73e8,#4285f4)" }}>
            <span className="material-symbols-outlined text-[40px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <h1 className="text-xl font-extrabold">Examen blanc officiel</h1>
            <p className="text-white/80 text-sm">Simulation réelle sans XP ni classement. Minuterie officielle.</p>
          </div>

          {/* Matière */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
            <p className="font-bold text-on-surface text-sm">Matière — Série {serie}</p>
            <div className="grid grid-cols-2 gap-2">
              {matieres.map(m => (
                <button key={m} onClick={() => setSelectedMatiere(m)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all border-2 ${selectedMatiere === m ? "border-blue-500 bg-blue-50 text-blue-700" : "border-transparent bg-surface-container text-on-surface"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Année */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
            <p className="font-bold text-on-surface text-sm">Année de session</p>
            <div className="flex flex-wrap gap-2">
              {ANNEES.map(a => (
                <button key={a} onClick={() => setSelectedAnnee(a)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedAnnee === a ? "text-white" : "bg-surface-container text-on-surface-variant"}`}
                  style={selectedAnnee === a ? { backgroundColor: "#1a73e8" } : {}}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Info durée */}
          {selectedMatiere && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">timer</span>
              <div>
                <p className="text-sm font-bold text-blue-800">Durée officielle : {dureeMinutes} minutes</p>
                <p className="text-xs text-blue-600">Le minuteur démarrera au lancement de l&apos;examen</p>
              </div>
            </div>
          )}

          {loadError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl font-medium">{loadError}</p>
          )}

          <button
            onClick={startExam}
            disabled={!selectedMatiere}
            className="w-full py-4 rounded-2xl font-black text-white text-base disabled:opacity-40 transition-all shadow-lg"
            style={{ backgroundColor: "#1a73e8" }}>
            Lancer l&apos;examen blanc →
          </button>
        </div>
      </main>
    );
  }

  // ── STEP 1: Loading ───────────────────────────────────────
  if (step === 1) {
    return (
      <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#1a73e8", borderTopColor: "transparent", borderWidth: 3 }} />
        <div className="text-center">
          <p className="font-bold text-on-surface">Génération de l&apos;examen…</p>
          <p className="text-sm text-on-surface-variant mt-1">{selectedMatiere} {serie} {selectedAnnee}</p>
        </div>
      </main>
    );
  }

  // ── STEP 2: Exam in progress ──────────────────────────────
  if (step === 2) {
    const q = questions[currentIdx];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const pct = (timeLeft / (dureeMinutes * 60)) * 100;
    const isLow = timeLeft < 300; // < 5 min

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        {/* Timer header */}
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-outline-variant/20">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-on-surface-variant font-medium">{selectedMatiere} — {serie} {selectedAnnee}</p>
              <p className="text-sm font-bold text-on-surface">
                Question {currentIdx + 1}/{questions.length}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg ${isLow ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-700"}`}>
              <span className="material-symbols-outlined text-[18px]">timer</span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
          {/* Timer bar */}
          <div className="h-1 bg-surface-container-low">
            <div className="h-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: isLow ? "#ef4444" : "#1a73e8" }} />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          {/* Question */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full text-white
                ${q.difficulty === "facile" ? "bg-green-500" : q.difficulty === "moyen" ? "bg-yellow-500" : "bg-red-500"}`}>
                {q.difficulty}
              </span>
              {q.chapter && <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{q.chapter}</span>}
              <span className="text-[11px] text-on-surface-variant ml-auto">{q.points} pt{q.points > 1 ? "s" : ""}</span>
            </div>
            <p className="font-semibold text-on-surface text-base leading-snug">{q.question}</p>
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {q.choices.map((choice, i) => {
              let cls = "border-outline-variant/30 bg-surface-container-lowest text-on-surface";
              if (revealed) {
                if (choice === q.correct_answer) cls = "border-green-400 bg-green-50 text-green-800";
                else if (choice === selected) cls = "border-red-400 bg-red-50 text-red-700";
                else cls = "border-outline-variant/20 bg-surface-container text-on-surface-variant";
              } else if (selected === choice) {
                cls = "border-blue-500 bg-blue-50 text-blue-800";
              }
              return (
                <button key={i}
                  onClick={() => !revealed && setSelected(choice)}
                  disabled={revealed}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium text-sm transition-all ${cls}`}>
                  <span className="font-black mr-2 text-xs text-on-surface-variant">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Explanation after reveal */}
          {revealed && (
            <div className="bg-surface-container rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase">Correction</p>
              <p className="text-sm text-on-surface leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!revealed ? (
              <button onClick={submitAnswer} disabled={!selected}
                className="flex-1 py-3.5 rounded-xl font-bold text-white disabled:opacity-40 transition-all"
                style={{ backgroundColor: "#1a73e8" }}>
                Valider
              </button>
            ) : (
              <button onClick={nextQuestion}
                className="flex-1 py-3.5 rounded-xl font-bold text-white"
                style={{ backgroundColor: "#1a73e8" }}>
                {currentIdx + 1 >= questions.length ? "Voir les résultats" : "Question suivante →"}
              </button>
            )}
          </div>

          {/* Skip / abandon */}
          <div className="flex justify-center">
            <button onClick={() => {
              setAnswers(prev => ({ ...prev, [currentIdx]: { answer: "", correct: false, timeSpent: 0 } }));
              nextQuestion();
            }} className="text-xs text-on-surface-variant hover:text-on-surface underline">
              Passer cette question
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── STEP 3: Results ───────────────────────────────────────
  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = Object.values(answers).filter(a => a.correct).length;
  const score20 = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 20) : 0;
  const pctCorrect = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
  const mention = score20 >= 16 ? "Très Bien" : score20 >= 14 ? "Bien" : score20 >= 12 ? "Assez Bien" : score20 >= 10 ? "Passable" : "Insuffisant";
  const mentionColor = score20 >= 14 ? "text-green-700 bg-green-100" : score20 >= 10 ? "text-yellow-700 bg-yellow-100" : "text-red-700 bg-red-100";

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Résultats — Examen blanc</p>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        {/* Score card */}
        <div className="rounded-2xl p-6 text-white shadow-lg text-center space-y-2" style={{ background: "linear-gradient(135deg,#1a73e8,#4285f4)" }}>
          <p className="text-white/80 text-sm font-semibold">{selectedMatiere} {examType} {serie} — {selectedAnnee}</p>
          <p className="text-6xl font-black">{score20}<span className="text-2xl text-white/60">/20</span></p>
          <span className={`inline-block text-sm font-black px-4 py-1.5 rounded-full ${mentionColor}`}>{mention}</span>
          <p className="text-white/70 text-sm">{totalCorrect}/{questions.length} questions correctes ({pctCorrect}%)</p>
        </div>

        {/* Per-question review */}
        <section className="space-y-3">
          <h2 className="font-bold text-on-surface text-lg">Corrigé détaillé</h2>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const ans = answers[i];
              const isCorrect = ans?.correct;
              const skipped = !ans || ans.answer === "";
              return (
                <div key={i} className={`rounded-xl p-4 shadow-sm space-y-2 border-l-4 ${isCorrect ? "border-green-400 bg-green-50/50" : "border-red-400 bg-red-50/50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-on-surface leading-snug flex-1">{i + 1}. {q.question}</p>
                    <span className={`shrink-0 text-[11px] font-black px-2 py-0.5 rounded-full ${isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                      {isCorrect ? "✓" : "✗"}
                    </span>
                  </div>
                  {!skipped && !isCorrect && (
                    <p className="text-xs text-red-700">Votre réponse : <strong>{ans?.answer}</strong></p>
                  )}
                  {skipped && <p className="text-xs text-on-surface-variant italic">Passée</p>}
                  <p className="text-xs text-green-700 font-medium">Bonne réponse : <strong>{q.correct_answer}</strong></p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setStep(0); setSelectedMatiere(""); setAnswers({}); setQuestions([]); }}
            className="py-3 rounded-xl font-bold text-sm bg-surface-container text-on-surface">
            Nouvel examen
          </button>
          <Link href="/prep/quiz"
            className="py-3 rounded-xl font-bold text-sm text-white text-center"
            style={{ backgroundColor: "#FF6B00" }}>
            Quiz IA →
          </Link>
        </div>

        <Link href="/prep/progression"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[16px]">bar_chart</span>
          Voir ma progression
        </Link>
      </div>
    </main>
  );
}

/* ─── PAGE EXPORT ─────────────────────────────────────────── */

export default function SimulateurPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#1a73e8", borderTopColor: "transparent" }} />
      </main>
    }>
      <SimulateurInner />
    </Suspense>
  );
}
