"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── XP & LEVELS ─────────────────────────────────────── */

const LEVELS_XP = [
  { min: 0,    label: "Novice",     emoji: "🌱", color: "#9ca3af" },
  { min: 100,  label: "Apprenti",   emoji: "📚", color: "#3b82f6" },
  { min: 300,  label: "Confirmé",   emoji: "⭐", color: "#22c55e" },
  { min: 600,  label: "Expert",     emoji: "🔥", color: "#a855f7" },
  { min: 1000, label: "Brillant",   emoji: "💎", color: "#f59e0b" },
  { min: 1500, label: "Maître BAC", emoji: "👑", color: "#ef4444" },
];

function getLevel(xp: number) {
  return [...LEVELS_XP].reverse().find(l => xp >= l.min) ?? LEVELS_XP[0];
}

function getNextLevel(xp: number) {
  return LEVELS_XP.find(l => l.min > xp) ?? null;
}

function calcXP(isCorrect: boolean, timeSpent: number, streak: number): number {
  if (!isCorrect) return 0;
  const base = 10;
  const timeBonus = timeSpent < 10 ? 5 : timeSpent < 20 ? 3 : timeSpent < 35 ? 1 : 0;
  const mult = streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : streak >= 2 ? 1.2 : 1.0;
  return Math.round((base + timeBonus) * mult);
}

/* ─── TYPES ─────────────────────────────────────────────── */

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
  xp: number;
  time: number;
  correct: boolean;
};

type Phase = "setup" | "loading" | "exam" | "feedback" | "correction";

const SUBJECTS_BAC  = ["Maths", "Français", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Philosophie", "Anglais"];
const SUBJECTS_BFEM = ["Maths", "Français", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Anglais"];
const BAC_SERIES    = ["L1", "L2", "S1", "S2", "S3", "S4", "G"];
const QUESTION_TIME = 45;

/* ─── INNER ─────────────────────────────────────────────── */

function SimulateurInner() {
  const searchParams = useSearchParams();
  const preMatiere = searchParams.get("matiere") ?? "";

  const [phase, setPhase]       = useState<Phase>("setup");
  const [examType, setExamType] = useState("BAC");
  const [serie, setSerie]       = useState("");
  const [matiere, setMatiere]   = useState(preMatiere);

  const [questions, setQuestions]         = useState<QuizQuestion[]>([]);
  const [current, setCurrent]             = useState(0);
  const [answers, setAnswers]             = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  // Per-question timer
  const [questionTime, setQuestionTime]   = useState(QUESTION_TIME);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  // Gamification
  const [streak, setStreak]               = useState(0);
  const [maxStreak, setMaxStreak]         = useState(0);
  const [totalXP, setTotalXP]             = useState(0);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [feedbackXP, setFeedbackXP]       = useState(0);
  const [feedbackExpl, setFeedbackExpl]   = useState("");

  // Player base XP (before this quiz)
  const [playerXP, setPlayerXP]           = useState(0);
  const [studentInfo, setStudentInfo]     = useState<{ exam_type: string; serie: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).limit(1),
        supabase.from("prep_player_stats").select("total_xp").eq("user_id", user.id).maybeSingle(),
      ]).then(([stuRes, statsRes]) => {
        if (stuRes.data?.[0]) {
          const stu = stuRes.data[0] as { exam_type: string; serie: string };
          setStudentInfo(stu);
          setExamType(stu.exam_type || "BAC");
          setSerie(stu.serie || "");
        }
        setPlayerXP(statsRes.data?.total_xp ?? 0);
      });
    });
  }, []);

  // Start per-question timer
  const startQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setQuestionTime(QUESTION_TIME);
    questionStartRef.current = Date.now();
    questionTimerRef.current = setInterval(() => {
      setQuestionTime(t => {
        if (t <= 1) {
          clearInterval(questionTimerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  // Auto-skip when timer hits 0
  useEffect(() => {
    if (phase === "exam" && questionTime === 0) {
      processAnswer("__TIMEOUT__");
    }
  }, [questionTime, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "exam") {
      startQuestionTimer();
    }
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, [phase, current, startQuestionTimer]);

  async function startExam() {
    if (!matiere) return;
    setPhase("loading");
    const n = 10;
    try {
      const res = await fetch("/api/prep-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: matiere,
          examType: studentInfo?.exam_type ?? examType,
          serie: studentInfo?.serie ?? serie,
          country: "Sénégal",
          questionCount: n,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions ?? []);
      setAnswers([]);
      setCurrent(0);
      setSelectedAnswer("");
      setStreak(0);
      setMaxStreak(0);
      setTotalXP(0);
      setPhase("exam");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isRate = msg.toLowerCase().includes("rate") || msg.includes("429");
      alert(isRate ? "Limite de requêtes. Attends 30s et réessaie." : "Erreur lors de la génération. Réessaie.");
      setPhase("setup");
    }
  }

  function processAnswer(answer: string) {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const q = questions[current];
    const isCorrect = answer !== "__TIMEOUT__" && answer === q.correct_answer;

    const newStreak = isCorrect ? streak + 1 : 0;
    const xp = calcXP(isCorrect, timeSpent, streak);
    const newMaxStreak = Math.max(maxStreak, newStreak);

    setStreak(newStreak);
    setMaxStreak(newMaxStreak);

    const newAnswer: AnswerRecord = { answer, xp, time: timeSpent, correct: isCorrect };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    const newTotalXP = totalXP + xp;
    setTotalXP(newTotalXP);

    setFeedbackCorrect(isCorrect);
    setFeedbackXP(xp);
    setFeedbackExpl(q.explanation);
    setSelectedAnswer("");
    setPhase("feedback");

    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(c => c + 1);
        setPhase("exam");
      } else {
        finishExam(newAnswers, newMaxStreak, newTotalXP);
      }
    }, 1800);
  }

  async function finishExam(finalAnswers: AnswerRecord[], finalMaxStreak: number, finalXP: number) {
    setPhase("correction");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || questions.length === 0) return;

    const scoreVal = Math.round((finalAnswers.filter(a => a.correct).length / questions.length) * 20);

    try {
      await supabase.from("prep_results").insert({
        user_id: user.id,
        exam_type: examType,
        subject: matiere,
        score: scoreVal,
        feedback: `Quiz gamifié ${matiere} — Score: ${scoreVal}/20, XP: ${finalXP}, Streak max: ${finalMaxStreak}`,
      });

      const { data: existing } = await supabase
        .from("prep_player_stats").select("total_xp, best_streak, display_name")
        .eq("user_id", user.id).maybeSingle();

      const newTotalXP = (existing?.total_xp ?? 0) + finalXP;
      const newBestStreak = Math.max(existing?.best_streak ?? 0, finalMaxStreak);
      const newLevel = getLevel(newTotalXP).label;

      const { data: profile } = await supabase.from("users").select("name").eq("id", user.id).single();
      const displayName = existing?.display_name ?? profile?.name ?? "Joueur";

      const statsPayload = {
        total_xp: newTotalXP, current_level: newLevel,
        best_streak: newBestStreak, display_name: displayName,
        serie: studentInfo?.serie ?? serie,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("prep_player_stats").update(statsPayload).eq("user_id", user.id);
      } else {
        await supabase.from("prep_player_stats").insert({ user_id: user.id, ...statsPayload });
      }

      setPlayerXP(newTotalXP);
    } catch {
      // Stats update failed silently (table may not exist yet)
    }
  }

  const subjects = examType === "BAC" ? SUBJECTS_BAC : SUBJECTS_BFEM;
  const q = questions[current];
  const pctTime = questionTime / QUESTION_TIME;
  const timerColor = pctTime > 0.5 ? "#22c55e" : pctTime > 0.25 ? "#f59e0b" : "#ef4444";

  /* ── SETUP ── */
  if (phase === "setup") return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs text-on-surface-variant">Mode gamifié · {QUESTION_TIME}s par question</p>
          <p className="font-bold text-on-surface">Examen blanc</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full">
          <span className="text-sm">{getLevel(playerXP).emoji}</span>
          <span className="text-xs font-black text-yellow-700">{playerXP} XP</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface mb-1">Configure ton examen</h1>
          <p className="text-on-surface-variant text-sm">10 questions · Timer par question · XP + Streak</p>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-sm text-on-surface">Type d&apos;examen</p>
          <div className="grid grid-cols-2 gap-3">
            {["BFEM", "BAC"].map(e => (
              <button key={e} onClick={() => { setExamType(e); setMatiere(""); setSerie(""); }}
                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${examType === e ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-surface-container-lowest text-on-surface shadow-sm"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {examType === "BAC" && (
          <div className="space-y-2">
            <p className="font-bold text-sm text-on-surface">Série</p>
            <div className="flex flex-wrap gap-2">
              {BAC_SERIES.map(s => (
                <button key={s} onClick={() => setSerie(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${serie === s ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-surface-container-lowest text-on-surface"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-bold text-sm text-on-surface">Matière</p>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map(s => (
              <button key={s} onClick={() => setMatiere(s)}
                className={`p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${matiere === s ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-surface-container-lowest text-on-surface shadow-sm"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* XP system explanation */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 space-y-2">
          <p className="font-bold text-sm text-on-surface">Système de points</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
            <span>✅ Bonne réponse = 10 XP</span>
            <span>⚡ Rapidité = +5 XP</span>
            <span>🔥 Streak ×3 = ×1.5 XP</span>
            <span>👑 Streak ×5 = ×2 XP</span>
          </div>
        </div>

        <button onClick={startExam} disabled={!matiere || (examType === "BAC" && !serie)}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FF6B00" }}>
          <span className="material-symbols-outlined">play_arrow</span>
          Démarrer l&apos;examen
        </button>
      </div>
    </main>
  );

  /* ── LOADING ── */
  if (phase === "loading") return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-4 p-6">
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="text-on-surface font-bold">Génération des questions…</p>
      <p className="text-on-surface-variant text-sm">Programme officiel BAC Sénégal · {matiere}</p>
    </div>
  );

  /* ── FEEDBACK (after answer) ── */
  if (phase === "feedback") return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 space-y-6">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${feedbackCorrect ? "bg-green-100" : "bg-red-100"}`}>
        {feedbackCorrect ? "✅" : "❌"}
      </div>
      <div className="text-center space-y-2">
        <p className={`text-2xl font-black ${feedbackCorrect ? "text-green-600" : "text-red-500"}`}>
          {feedbackCorrect ? "Correct !" : "Faux"}
        </p>
        {feedbackXP > 0 && (
          <p className="text-lg font-bold text-yellow-600">+{feedbackXP} XP 🔥 Streak {streak}</p>
        )}
        <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">{feedbackExpl}</p>
      </div>
      <div className="flex items-center gap-2 bg-surface-container-lowest px-5 py-2 rounded-full">
        <span className="text-sm font-bold text-on-surface">{current + 1}/{questions.length}</span>
        <span className="text-on-surface-variant">·</span>
        <span className="text-sm font-black text-primary">{totalXP} XP</span>
      </div>
    </div>
  );

  /* ── EXAM ── */
  if (phase === "exam" && q) return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface border-b border-outline-variant/20">
        {/* Question timer bar */}
        <div className="h-2 w-full transition-all" style={{
          background: `linear-gradient(to right, ${timerColor} ${pctTime * 100}%, #e5e7eb 0%)`
        }} />
        <div className="px-6 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-on-surface">{current + 1}/{questions.length}</span>
          {/* Streak */}
          {streak > 0 && (
            <span className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-black text-orange-600">
              🔥 {streak}
            </span>
          )}
          <span className="text-xl font-black" style={{ color: timerColor }}>{questionTime}s</span>
          <span className="text-sm font-black text-yellow-600">{totalXP} XP</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.difficulty === "facile" ? "bg-green-100 text-green-700" : q.difficulty === "moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {q.difficulty}
          </span>
          {q.chapter && <span className="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full">{q.chapter}</span>}
        </div>

        <p className="text-lg font-bold text-on-surface leading-snug">{q.question}</p>

        <div className="space-y-2">
          {q.choices.length > 0 ? (
            q.choices.map((c, i) => (
              <button key={i} onClick={() => setSelectedAnswer(c)}
                className={`w-full text-left p-4 rounded-xl border-2 font-medium text-sm transition-all ${selectedAnswer === c ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/20"}`}>
                {c}
              </button>
            ))
          ) : (
            <textarea rows={3} value={selectedAnswer}
              onChange={e => setSelectedAnswer(e.target.value)}
              placeholder="Écris ta réponse ici…"
              className="w-full p-4 rounded-xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none resize-none text-sm" />
          )}
        </div>

        <button onClick={() => processAnswer(selectedAnswer)} disabled={!selectedAnswer}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
          style={{ backgroundColor: "#FF6B00" }}>
          Valider →
        </button>
      </div>
    </main>
  );

  /* ── CORRECTION ── */
  if (phase === "correction") {
    const correctCount = answers.filter(a => a.correct).length;
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 20) : 0;
    const newTotalXP = playerXP; // already updated in finishExam
    const level = getLevel(newTotalXP);
    const nextLv = getNextLevel(newTotalXP);

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-20">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4">
          <p className="font-bold text-on-surface">Résultats — {matiere}</p>
        </header>

        <div className="max-w-xl mx-auto px-6 py-6 space-y-5">
          {/* Score + XP card */}
          <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: score >= 10 ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#FF6B00,#e55a00)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-5xl font-black">{score}<span className="text-2xl">/20</span></p>
                <p className="text-white/90 font-bold mt-1">
                  {score >= 16 ? "Excellent ! 🎉" : score >= 12 ? "Bien joué ! 👍" : score >= 10 ? "Passable 💪" : "À réviser 📚"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">+{totalXP}</p>
                <p className="text-white/80 text-sm">XP gagnés</p>
              </div>
            </div>
            <div className="flex gap-4 text-white/80 text-sm">
              <span>✅ {correctCount}/{questions.length} correctes</span>
              <span>🔥 Streak max : {maxStreak}</span>
            </div>
          </div>

          {/* Level card */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{level.emoji}</span>
              <div>
                <p className="font-black text-on-surface">{level.label}</p>
                <p className="text-xs text-on-surface-variant">{newTotalXP} XP total</p>
              </div>
            </div>
            {nextLv && (
              <div className="text-right text-xs text-on-surface-variant">
                <p>Prochain niveau :</p>
                <p className="font-bold">{nextLv.emoji} {nextLv.label}</p>
                <p>à {nextLv.min - newTotalXP} XP</p>
              </div>
            )}
          </div>

          {/* Per-question correction */}
          <div className="space-y-3">
            <p className="font-bold text-on-surface">Correction détaillée</p>
            {questions.map((q, i) => {
              const ans = answers[i];
              const isTimeout = ans?.answer === "__TIMEOUT__";
              const isCorrect = ans?.correct ?? false;
              return (
                <div key={q.id} className={`rounded-2xl p-4 shadow-sm border-l-4 ${isTimeout ? "border-amber-400 bg-amber-50" : isCorrect ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50"}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${isTimeout ? "text-amber-500" : isCorrect ? "text-green-600" : "text-red-500"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isTimeout ? "timer_off" : isCorrect ? "check_circle" : "cancel"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface">{q.question}</p>
                      {q.chapter && <span className="text-[10px] text-outline">{q.chapter}</span>}
                    </div>
                    {ans?.xp > 0 && (
                      <span className="text-xs font-black text-yellow-600">+{ans.xp} XP</span>
                    )}
                  </div>
                  {isTimeout && <p className="text-xs text-amber-700 mb-1 ml-6">Temps écoulé</p>}
                  {!isTimeout && !isCorrect && (
                    <p className="text-xs text-red-600 mb-1 ml-6">Ta réponse : {ans?.answer || "(vide)"}</p>
                  )}
                  <p className="text-xs text-green-700 font-semibold ml-6">✓ {q.correct_answer}</p>
                  <p className="text-xs text-on-surface-variant mt-1 ml-6">{q.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPhase("setup"); setQuestions([]); }}
              className="flex-1 py-3 border-2 border-outline-variant/30 rounded-xl font-bold text-on-surface text-sm hover:bg-surface-container transition-colors">
              Rejouer
            </button>
            <Link href="/prep/classement" className="flex-1 py-3 text-center font-black text-white rounded-xl text-sm"
              style={{ backgroundColor: "#FF6B00" }}>
              Classement 🏆
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return null;
}

export default function SimulateurPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      </div>
    }>
      <SimulateurInner />
    </Suspense>
  );
}
