"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── XP & LEVELS ──────────────────────────────────────────── */

const LEVELS_XP = [
  { min: 0,    label: "Novice",     emoji: "🌱" },
  { min: 100,  label: "Apprenti",   emoji: "📚" },
  { min: 300,  label: "Confirmé",   emoji: "⭐" },
  { min: 600,  label: "Expert",     emoji: "🔥" },
  { min: 1000, label: "Brillant",   emoji: "💎" },
  { min: 1500, label: "Maître BAC", emoji: "👑" },
];

function getLevel(xp: number) {
  return [...LEVELS_XP].reverse().find(l => xp >= l.min) ?? LEVELS_XP[0];
}

function calcXP(isCorrect: boolean, timeSpent: number, streak: number): number {
  if (!isCorrect) return 0;
  const base = 10;
  const timeBonus = timeSpent < 10 ? 5 : timeSpent < 20 ? 3 : timeSpent < 35 ? 1 : 0;
  const mult = streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : streak >= 2 ? 1.2 : 1.0;
  return Math.round((base + timeBonus) * mult);
}

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
  question: string;
  answer: string;
  correct: boolean;
  timeSpent: number;
  chapter?: string;
};

type MicroLecon = {
  chapter: string;
  subject: string;
  explanation: string;
  key_points: string[];
  exemple: string;
};

type QuizAnalysis = {
  pret_bac_percent: number;
  chapitres_faibles: string[];
  message_coach: string;
};

const QUESTION_TIME = 45;

/* ─── PAGE ─────────────────────────────────────────────────── */

export default function QuizPage() {
  const router = useRouter();

  // User
  const [userId, setUserId] = useState<string | null>(null);
  const [serie, setSerie] = useState("S1");
  const [examType, setExamType] = useState("BAC");
  const [totalXP, setTotalXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("Novice");
  const [bestStreak, setBestStreak] = useState(0);

  // Step: "loading_user" | "loading_quiz" | "quiz" | "result"
  const [step, setStep] = useState<"loading_user" | "loading_quiz" | "quiz" | "result">("loading_user");
  const [autoSubject, setAutoSubject] = useState("");

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [streak, setStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [loadError, setLoadError] = useState("");

  // Per-question timer
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(null);
  const [microLecons, setMicroLecons] = useState<MicroLecon[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Load user + pick weakest subject
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      const [{ data: stu }, { data: stats }, { data: results }] = await Promise.all([
        supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).limit(1),
        supabase.from("prep_player_stats").select("total_xp, current_level, best_streak").eq("user_id", user.id).maybeSingle(),
        supabase.from("prep_results").select("subject, score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      ]);

      const et = stu?.[0]?.exam_type ?? "BAC";
      const sr = stu?.[0]?.serie ?? "S1";
      setExamType(et);
      setSerie(sr);
      setTotalXP(stats?.total_xp ?? 0);
      setCurrentLevel(stats?.current_level ?? "Novice");
      setBestStreak(stats?.best_streak ?? 0);

      // Pick weakest subject from recent results
      const subject = pickWeakestSubject(results ?? [], sr, et);
      setAutoSubject(subject);
      setStep("loading_quiz");
      await loadQuiz(subject, sr, et);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function pickWeakestSubject(
    results: { subject: string; score: number }[],
    sr: string,
    et: string
  ): string {
    // Compute avg per subject
    const sums: Record<string, { total: number; count: number }> = {};
    for (const r of results) {
      if (!sums[r.subject]) sums[r.subject] = { total: 0, count: 0 };
      sums[r.subject].total += r.score;
      sums[r.subject].count += 1;
    }
    const avgs: Record<string, number> = {};
    for (const [s, v] of Object.entries(sums)) {
      avgs[s] = v.total / v.count;
    }
    const MATIERES_BY_SERIE: Record<string, string[]> = {
      L1: ["Français", "Philosophie", "Histoire-Géographie", "Anglais", "Maths"],
      L2: ["Français", "Philosophie", "Histoire-Géographie", "Anglais", "Maths", "Sciences Physiques"],
      S1: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie"],
      S2: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français", "Philosophie"],
      S3: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français"],
      S4: ["Maths", "Sciences Physiques", "Sciences Naturelles", "Français"],
      G:  ["Comptabilité", "Maths", "Français"],
      BFEM: ["Maths", "Français", "Sciences Physiques", "Sciences Naturelles"],
    };
    const matieres = MATIERES_BY_SERIE[sr] ?? MATIERES_BY_SERIE["S1"];

    // Sort by avg score (lowest first)
    const sorted = matieres.sort((a, b) => (avgs[a] ?? 10) - (avgs[b] ?? 10));
    return sorted[0] ?? matieres[0];
  }

  async function loadQuiz(subject: string, sr: string, et: string) {
    setLoadError("");
    try {
      const res = await fetch("/api/prep-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, serie: sr, examType: et, count: 10 }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error || "Aucune question générée.");
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers([]);
      setSelected(null);
      setRevealed(false);
      setStreak(0);
      setSessionXP(0);
      setStep("quiz");
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Erreur chargement quiz.");
      setStep("result");
    }
  }

  // Per-question timer
  useEffect(() => {
    if (step !== "quiz") return;
    if (timerRef.current) clearInterval(timerRef.current);
    questionStartRef.current = Date.now();
    setTimeLeft(QUESTION_TIME);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          timeoutAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, step]);

  const timeoutAnswer = useCallback(() => {
    if (revealed) return;
    const q = questions[currentIdx];
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    setAnswers(prev => [...prev, { question: q.question, answer: "", correct: false, timeSpent, chapter: q.chapter }]);
    setStreak(0);
    setRevealed(true);
  }, [revealed, questions, currentIdx]);

  function submitAnswer() {
    if (!selected || revealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[currentIdx];
    const correct = selected === q.correct_answer;
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    const newStreak = correct ? streak + 1 : 0;
    const xpGained = calcXP(correct, timeSpent, newStreak);

    setAnswers(prev => [...prev, { question: q.question, answer: selected, correct, timeSpent, chapter: q.chapter }]);
    setStreak(newStreak);
    setSessionXP(s => s + xpGained);
    setRevealed(true);
  }

  function nextQuestion() {
    setSelected(null);
    setRevealed(false);
    if (currentIdx + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIdx(i => i + 1);
    }
  }

  const finishQuiz = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep("result");
    setAnalyzing(true);

    const allAnswers = answers;
    const correct = allAnswers.filter(a => a.correct).length;
    const score = Math.round((correct / questions.length) * 20);

    // Save to DB
    if (userId) {
      const newXP = totalXP + sessionXP;
      const newStreak = Math.max(bestStreak, streak);
      const level = getLevel(newXP);

      await Promise.all([
        supabase.from("prep_results").insert({
          user_id: userId,
          subject: autoSubject,
          score,
          feedback: `Quiz IA — ${correct}/${questions.length} correctes, ${sessionXP} XP gagnés`,
        }),
        supabase.from("prep_player_stats").upsert({
          user_id: userId,
          total_xp: newXP,
          current_level: level.label,
          best_streak: newStreak,
        }, { onConflict: "user_id" }),
      ]);

      setTotalXP(newXP);
      setCurrentLevel(level.label);
    }

    // Groq analysis
    try {
      const res = await fetch("/api/prep-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: autoSubject,
          serie,
          examType,
          questions: questions.map((q, i) => ({
            question: q.question,
            correct_answer: q.correct_answer,
            user_answer: allAnswers[i]?.answer ?? "",
            is_correct: allAnswers[i]?.correct ?? false,
            chapter: q.chapter,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data.analysis);
        // Load micro-lecons for weak chapters
        if (data.analysis?.chapitres_faibles?.length > 0) {
          const lecons: MicroLecon[] = [];
          for (const ch of data.analysis.chapitres_faibles.slice(0, 2)) {
            try {
              const lres = await fetch("/api/prep-micro-lecon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject: autoSubject, chapter: ch, serie }),
              });
              const ldata = await lres.json();
              if (lres.ok && ldata.lecon) lecons.push(ldata.lecon);
            } catch {}
          }
          setMicroLecons(lecons);
        }
      }
    } catch {}
    setAnalyzing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions, userId, totalXP, sessionXP, streak, bestStreak, autoSubject, serie, examType]);

  // ── LOADING ────────────────────────────────────────────────
  if (step === "loading_user" || step === "loading_quiz") {
    return (
      <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent", borderWidth: 3 }} />
        <div className="text-center">
          <p className="font-bold text-on-surface">
            {step === "loading_user" ? "Chargement de ton profil…" : `Génération du quiz — ${autoSubject}…`}
          </p>
          {step === "loading_quiz" && (
            <p className="text-sm text-on-surface-variant mt-1">L&apos;IA sélectionne les questions sur tes points faibles</p>
          )}
        </div>
      </main>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────
  if (step === "result" && loadError) {
    return (
      <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-[48px] text-red-400">error</span>
        <p className="font-bold text-on-surface">{loadError}</p>
        <Link href="/prep/dashboard" className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: "#FF6B00" }}>
          Retour au tableau de bord
        </Link>
      </main>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────
  if (step === "quiz") {
    const q = questions[currentIdx];
    const pct = (timeLeft / QUESTION_TIME) * 100;
    const isLow = timeLeft <= 10;
    const level = getLevel(totalXP + sessionXP);

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-outline-variant/20">
          <div className="px-6 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Quiz IA · {autoSubject}</p>
              <p className="text-sm font-bold text-on-surface">{currentIdx + 1}/{questions.length}</p>
            </div>
            <div className="flex items-center gap-3">
              {streak >= 2 && (
                <span className="text-sm font-black text-orange-500">🔥 ×{streak}</span>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm ${isLow ? "bg-red-100 text-red-600" : "bg-orange-50 text-orange-600"}`}>
                <span className="material-symbols-outlined text-[16px]">timer</span>
                {timeLeft}s
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-black text-yellow-600">+{sessionXP}</span>
                <span className="text-xs text-yellow-500">XP</span>
              </div>
            </div>
          </div>
          {/* Timer bar */}
          <div className="h-1 bg-surface-container-low">
            <div className="h-full transition-all duration-1000"
              style={{ width: `${pct}%`, backgroundColor: isLow ? "#ef4444" : "#FF6B00" }} />
          </div>
        </header>

        {/* Level pill */}
        <div className="max-w-2xl mx-auto px-6 pt-4 flex items-center gap-2">
          <span className="text-lg">{level.emoji}</span>
          <span className="text-xs font-semibold text-on-surface-variant">{level.label} · {totalXP + sessionXP} XP</span>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-4 space-y-5">
          {/* Question */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full text-white
                ${q.difficulty === "facile" ? "bg-green-500" : q.difficulty === "moyen" ? "bg-yellow-500" : "bg-red-500"}`}>
                {q.difficulty}
              </span>
              {q.chapter && <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{q.chapter}</span>}
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
                cls = "border-primary bg-primary/5 text-primary";
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

          {/* XP feedback */}
          {revealed && (() => {
            const ans = answers[answers.length - 1];
            const xp = ans ? calcXP(ans.correct, ans.timeSpent, streak) : 0;
            return (
              <div className={`rounded-xl p-3 flex items-center gap-3 ${ans?.correct ? "bg-green-50" : "bg-red-50"}`}>
                <span className={`text-2xl`}>{ans?.correct ? "✅" : "❌"}</span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${ans?.correct ? "text-green-700" : "text-red-700"}`}>
                    {ans?.correct ? `Correct ! +${xp} XP` : (ans?.answer === "" ? "Temps écoulé !" : "Incorrect")}
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          {!revealed ? (
            <button onClick={submitAnswer} disabled={!selected}
              className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-40 transition-all"
              style={{ backgroundColor: "#FF6B00" }}>
              Valider
            </button>
          ) : (
            <button onClick={nextQuestion}
              className="w-full py-3.5 rounded-xl font-bold text-white"
              style={{ backgroundColor: "#FF6B00" }}>
              {currentIdx + 1 >= questions.length ? "Voir les résultats" : "Suivant →"}
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────
  const correct = answers.filter(a => a.correct).length;
  const score20 = questions.length > 0 ? Math.round((correct / questions.length) * 20) : 0;
  const level = getLevel(totalXP);

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Résultats du Quiz IA</p>
      </header>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        {/* Score + XP card */}
        <div className="rounded-2xl p-6 text-white shadow-lg space-y-3" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <p className="text-white/80 text-sm font-semibold">{autoSubject} · {serie} {examType}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-black">{score20}<span className="text-xl text-white/60">/20</span></p>
              <p className="text-white/80 text-sm mt-1">{correct}/{questions.length} correctes</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black">+{sessionXP}</p>
              <p className="text-white/70 text-sm">XP gagnés</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <span className="text-xl">{level.emoji}</span>
            <span className="font-bold text-sm">{currentLevel}</span>
            <span className="text-white/70 text-xs ml-auto">{totalXP} XP total</span>
          </div>
        </div>

        {/* Analyse IA */}
        {analyzing ? (
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin shrink-0" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
            <p className="text-sm font-semibold text-on-surface">Analyse IA en cours…</p>
          </div>
        ) : analysis ? (
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-on-surface text-sm">Prêt pour le BAC ?</p>
              <span className={`text-2xl font-black ${analysis.pret_bac_percent >= 70 ? "text-green-600" : analysis.pret_bac_percent >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {analysis.pret_bac_percent}%
              </span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${analysis.pret_bac_percent}%`, backgroundColor: analysis.pret_bac_percent >= 70 ? "#22c55e" : analysis.pret_bac_percent >= 50 ? "#f59e0b" : "#ef4444" }} />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{analysis.message_coach}</p>
            {analysis.chapitres_faibles.length > 0 && (
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Chapitres à revoir</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.chapitres_faibles.map((ch, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{ch}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Micro-leçons */}
        {microLecons.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-on-surface">Micro-leçons pour toi</h2>
            {microLecons.map((lecon, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{lecon.chapter}</p>
                    <p className="text-xs text-on-surface-variant">{lecon.subject}</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{lecon.explanation}</p>
                {lecon.key_points.length > 0 && (
                  <ul className="space-y-1">
                    {lecon.key_points.map((pt, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-on-surface-variant">
                        <span className="text-primary font-black shrink-0">·</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                {lecon.exemple && (
                  <div className="bg-surface-container rounded-xl p-3">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">Exemple</p>
                    <p className="text-xs text-on-surface">{lecon.exemple}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => {
            setStep("loading_quiz");
            loadQuiz(autoSubject, serie, examType);
          }}
            className="py-3 rounded-xl font-bold text-sm text-white"
            style={{ backgroundColor: "#FF6B00" }}>
            Rejouer
          </button>
          <Link href="/prep/classement"
            className="py-3 rounded-xl font-bold text-sm text-white text-center"
            style={{ backgroundColor: "#1a73e8" }}>
            Classement 🏆
          </Link>
        </div>

        <Link href="/prep/simulateur"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[16px]">assignment</span>
          Passer un examen blanc
        </Link>
      </div>
    </main>
  );
}
