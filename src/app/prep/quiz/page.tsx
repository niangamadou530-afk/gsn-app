"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MATIERES_BY_SERIE } from "@/data/programmes";

/* ─── XP & LEVELS ─────────────────────────────────────────── */
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
function calcXP(correct: boolean, timeSpent: number, streak: number) {
  if (!correct) return 0;
  const base = 10;
  const bonus = timeSpent < 10 ? 5 : timeSpent < 20 ? 3 : timeSpent < 35 ? 1 : 0;
  const mult = streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : streak >= 2 ? 1.2 : 1.0;
  return Math.round((base + bonus) * mult);
}
function scoreToLevel(pct: number): string {
  if (pct >= 70) return "Fort";
  if (pct >= 40) return "Moyen";
  return "Faible";
}

/* ─── TYPES ────────────────────────────────────────────────── */
type QuizQuestion = {
  id: number;
  type: string;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  difficulty: string;
  chapter?: string;
};
type SubjectLevel = { level: string; score: number };

type Phase =
  | "loading"
  | "positioning_intro"
  | "positioning_loading"
  | "positioning_quiz"
  | "positioning_results"
  | "subject_select"
  | "quiz_loading"
  | "quiz"
  | "quiz_result";

const QUESTION_TIME = 45;
const BAC_DATE = "2026-06-30";

function daysUntilBAC() {
  return Math.max(0, Math.ceil((new Date(BAC_DATE).getTime() - Date.now()) / 86400000));
}

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
  const [subjectLevels, setSubjectLevels] = useState<Record<string, SubjectLevel>>({});

  // Phase machine
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");

  // ── POSITIONING ──────────────────────────────────────────
  const [posSubjects, setPosSubjects] = useState<string[]>([]);
  const [posIdx, setPosIdx] = useState(0);           // which subject we're positioning
  const [posQuestions, setPosQuestions] = useState<QuizQuestion[]>([]);
  const [posAnswered, setPosAnswered] = useState(0);  // questions answered in current subject
  const [posCorrect, setPosCorrect] = useState(0);    // correct answers in current subject
  const [posScores, setPosScores] = useState<Record<string, number>>({}); // subject → pct
  const [posSelected, setPosSelected] = useState<string | null>(null);
  const [posRevealed, setPosRevealed] = useState(false);

  // ── REGULAR QUIZ ──────────────────────────────────────────
  const [quizSubject, setQuizSubject] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; timeSpent: number; chapter?: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [streak, setStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  /* ── LOAD USER ────────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      const [{ data: stu }, { data: stats }] = await Promise.all([
        supabase.from("prep_students")
          .select("exam_type, serie, level_per_subject, positioning_done")
          .eq("user_id", user.id).limit(1),
        supabase.from("prep_player_stats")
          .select("total_xp, current_level, best_streak")
          .eq("user_id", user.id).maybeSingle(),
      ]);

      const et = stu?.[0]?.exam_type ?? "BAC";
      const sr = stu?.[0]?.serie ?? "S1";
      const positioningDone = stu?.[0]?.positioning_done === true;
      const levels = (stu?.[0]?.level_per_subject as Record<string, SubjectLevel>) ?? {};

      setExamType(et);
      setSerie(sr);
      setSubjectLevels(levels);
      setTotalXP(stats?.total_xp ?? 0);
      setCurrentLevel(stats?.current_level ?? "Novice");
      setBestStreak(stats?.best_streak ?? 0);

      const subjects = MATIERES_BY_SERIE[sr] ?? MATIERES_BY_SERIE["S1"];
      setPosSubjects(subjects);

      if (!positioningDone) {
        setPhase("positioning_intro");
      } else {
        setPhase("subject_select");
      }
    }
    load();
  }, [router]);

  /* ── POSITIONING: load questions for next subject ─────────── */
  async function loadPositioningQuestions(subject: string) {
    setPhase("positioning_loading");
    setError("");
    setPosSelected(null);
    setPosRevealed(false);
    setPosAnswered(0);
    setPosCorrect(0);
    try {
      const res = await fetch("/api/prep-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, serie, examType, count: 3 }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error || "Erreur");
      setPosQuestions(data.questions);
      setPhase("positioning_quiz");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setPhase("positioning_intro");
    }
  }

  function startPositioning() {
    setPosIdx(0);
    setPosScores({});
    loadPositioningQuestions(posSubjects[0]);
  }

  function submitPosAnswer() {
    if (!posSelected || posRevealed) return;
    const q = posQuestions[posAnswered];
    const correct = posSelected === q.correct_answer;
    setPosCorrect(c => correct ? c + 1 : c);
    setPosRevealed(true);
  }

  function nextPosQuestion() {
    const nextAnswered = posAnswered + 1;
    setPosSelected(null);
    setPosRevealed(false);

    if (nextAnswered >= posQuestions.length) {
      // Subject done — compute score
      const pct = Math.round(((posCorrect + (posSelected === posQuestions[posAnswered]?.correct_answer ? 1 : 0)) / posQuestions.length) * 100);
      const actualPct = Math.round(posCorrect / posQuestions.length * 100);
      const newScores = { ...posScores, [posSubjects[posIdx]]: actualPct };
      setPosScores(newScores);

      const nextIdx = posIdx + 1;
      if (nextIdx >= posSubjects.length) {
        // All subjects done
        finishPositioning(newScores);
      } else {
        setPosIdx(nextIdx);
        loadPositioningQuestions(posSubjects[nextIdx]);
      }
    } else {
      setPosAnswered(nextAnswered);
    }
  }

  async function finishPositioning(scores: Record<string, number>) {
    if (!userId) return;
    // Build level_per_subject
    const newLevels: Record<string, SubjectLevel> = {};
    for (const [subj, pct] of Object.entries(scores)) {
      newLevels[subj] = { level: scoreToLevel(pct), score: pct };
    }
    setSubjectLevels(newLevels);
    setPosScores(scores);

    // Save to Supabase
    await supabase.from("prep_students")
      .update({ level_per_subject: newLevels, positioning_done: true })
      .eq("user_id", userId);

    // Chapter progress is seeded when the user visits /prep/programme

    setPhase("positioning_results");
  }

  /* ── REGULAR QUIZ: load questions ─────────────────────────── */
  async function startQuiz(subject: string) {
    setQuizSubject(subject);
    setPhase("quiz_loading");
    setError("");
    try {
      const res = await fetch("/api/prep-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, serie, examType, count: 10 }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error || "Erreur");
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers([]);
      setSelected(null);
      setRevealed(false);
      setStreak(0);
      setSessionXP(0);
      setTimeLeft(QUESTION_TIME);
      setPhase("quiz");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur chargement quiz");
      setPhase("subject_select");
    }
  }

  /* ── QUIZ TIMER ───────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "quiz") return;
    if (timerRef.current) clearInterval(timerRef.current);
    startRef.current = Date.now();
    setTimeLeft(QUESTION_TIME);

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, phase]);

  function handleTimeout() {
    if (revealed) return;
    const timeSpent = QUESTION_TIME;
    setAnswers(prev => [...prev, { correct: false, timeSpent, chapter: questions[currentIdx]?.chapter }]);
    setStreak(0);
    setRevealed(true);
  }

  function submitAnswer() {
    if (!selected || revealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[currentIdx];
    const correct = selected === q.correct_answer;
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    const newStreak = correct ? streak + 1 : 0;
    const xp = calcXP(correct, timeSpent, newStreak);
    setAnswers(prev => [...prev, { correct, timeSpent, chapter: q.chapter }]);
    setStreak(newStreak);
    setSessionXP(s => s + xp);
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
    setPhase("quiz_result");
    const correct = answers.filter(a => a.correct).length;
    const score = Math.round((correct / questions.length) * 20);
    const pct = Math.round((correct / questions.length) * 100);

    if (!userId) return;
    const newXP = totalXP + sessionXP;
    const newStreak = Math.max(bestStreak, streak);
    const lvl = getLevel(newXP);

    // Update level for this subject
    const newLevels = {
      ...subjectLevels,
      [quizSubject]: { level: scoreToLevel(pct), score: pct },
    };
    setSubjectLevels(newLevels);
    setTotalXP(newXP);
    setCurrentLevel(lvl.label);

    await Promise.all([
      supabase.from("prep_results").insert({
        user_id: userId,
        subject: quizSubject,
        score,
        feedback: `Quiz IA — ${correct}/${questions.length} correctes, ${sessionXP} XP`,
      }),
      supabase.from("prep_player_stats").upsert({
        user_id: userId,
        total_xp: newXP,
        current_level: lvl.label,
        best_streak: newStreak,
      }, { onConflict: "user_id" }),
      supabase.from("prep_students")
        .update({ level_per_subject: newLevels })
        .eq("user_id", userId),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions, userId, totalXP, sessionXP, streak, bestStreak, quizSubject, subjectLevels]);

  /* ─── RENDERS ─────────────────────────────────────────────── */

  const level = getLevel(totalXP);
  const dl = daysUntilBAC();

  // ── LOADING ────────────────────────────────────────────────
  if (phase === "loading") return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </main>
  );

  // ── POSITIONING INTRO ──────────────────────────────────────
  if (phase === "positioning_intro") return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs text-on-surface-variant">GSN PREP</p>
          <p className="font-bold text-on-surface">Quiz de positionnement</p>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
        <div className="rounded-2xl p-6 text-white space-y-2" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <span className="material-symbols-outlined text-[48px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
          <h1 className="text-2xl font-extrabold">Quiz de positionnement</h1>
          <p className="text-white/80 text-sm leading-relaxed">
            Bienvenue ! Pour personnaliser ton programme de révision, réponds à quelques questions par matière.
            Cela ne prend que 5 minutes.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
          <p className="font-bold text-on-surface text-sm">Comment ça marche ?</p>
          {[
            { icon: "looks_one", text: `3 questions par matière (${posSubjects.length} matières — série ${serie})` },
            { icon: "looks_two", text: "Le système calcule ton niveau de départ par matière" },
            { icon: "looks_3", text: "Tu reçois un programme de révision personnalisé jusqu'au 30 juin" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="text-sm text-on-surface">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <span className="material-symbols-outlined text-blue-600 text-[18px]">calendar_today</span>
          <p className="text-sm text-blue-800 font-medium">BAC dans <strong>J-{dl}</strong> — 30 juin 2026</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

        <button onClick={startPositioning}
          className="w-full py-4 rounded-2xl font-black text-white text-base shadow-lg"
          style={{ backgroundColor: "#FF6B00" }}>
          Commencer le positionnement →
        </button>
      </div>
    </main>
  );

  // ── POSITIONING LOADING ────────────────────────────────────
  if (phase === "positioning_loading") return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent", borderWidth: 3 }} />
      <div className="text-center">
        <p className="font-bold text-on-surface">Chargement des questions…</p>
        <p className="text-sm text-on-surface-variant mt-1">
          {posSubjects[posIdx]} — matière {posIdx + 1}/{posSubjects.length}
        </p>
      </div>
    </main>
  );

  // ── POSITIONING QUIZ ───────────────────────────────────────
  if (phase === "positioning_quiz") {
    const q = posQuestions[posAnswered];
    if (!q) return null;
    const progress = ((posIdx * 3 + posAnswered) / (posSubjects.length * 3)) * 100;

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-outline-variant/20">
          <div className="h-1 bg-surface-container-low">
            <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#FF6B00" }} />
          </div>
          <div className="px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant">Positionnement · {posSubjects[posIdx]}</p>
              <p className="text-sm font-bold text-on-surface">
                Matière {posIdx + 1}/{posSubjects.length} · Question {posAnswered + 1}/3
              </p>
            </div>
            <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
              Sans XP
            </span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-2">
            {q.chapter && (
              <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{q.chapter}</span>
            )}
            <p className="font-semibold text-on-surface text-base leading-snug">{q.question}</p>
          </div>

          <div className="space-y-2">
            {q.choices.map((choice, i) => {
              let cls = "border-outline-variant/30 bg-surface-container-lowest text-on-surface";
              if (posRevealed) {
                if (choice === q.correct_answer) cls = "border-green-400 bg-green-50 text-green-800";
                else if (choice === posSelected) cls = "border-red-400 bg-red-50 text-red-700";
                else cls = "border-outline-variant/20 bg-surface-container text-on-surface-variant";
              } else if (posSelected === choice) {
                cls = "border-primary bg-primary/5 text-primary";
              }
              return (
                <button key={i}
                  onClick={() => !posRevealed && setPosSelected(choice)}
                  disabled={posRevealed}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium text-sm transition-all ${cls}`}>
                  <span className="font-black mr-2 text-xs text-on-surface-variant">{String.fromCharCode(65 + i)}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          {posRevealed && (
            <div className="bg-surface-container rounded-xl p-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Correction</p>
              <p className="text-sm text-on-surface leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {!posRevealed ? (
            <button onClick={submitPosAnswer} disabled={!posSelected}
              className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: "#FF6B00" }}>
              Valider
            </button>
          ) : (
            <button onClick={nextPosQuestion}
              className="w-full py-3.5 rounded-xl font-bold text-white"
              style={{ backgroundColor: "#FF6B00" }}>
              {posAnswered + 1 >= posQuestions.length
                ? (posIdx + 1 >= posSubjects.length ? "Voir mes résultats" : `Matière suivante : ${posSubjects[posIdx + 1]} →`)
                : "Question suivante →"}
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── POSITIONING RESULTS ────────────────────────────────────
  if (phase === "positioning_results") {
    const nbFort   = Object.values(posScores).filter(s => s >= 70).length;
    const nbMoyen  = Object.values(posScores).filter(s => s >= 40 && s < 70).length;
    const nbFaible = Object.values(posScores).filter(s => s < 40).length;

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4">
          <p className="font-bold text-on-surface">Résultats du positionnement</p>
          <p className="text-xs text-on-surface-variant">BAC dans J-{dl} — 30 juin 2026</p>
        </header>

        <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: nbFort,   label: "Fort ✅",    color: "text-green-600 bg-green-50"  },
              { val: nbMoyen,  label: "Moyen 🔶",  color: "text-yellow-600 bg-yellow-50" },
              { val: nbFaible, label: "Faible 🔴",  color: "text-red-600 bg-red-50"      },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
                <p className="text-3xl font-black">{s.val}</p>
                <p className="text-xs font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {posSubjects.map(subj => {
              const pct = posScores[subj] ?? 0;
              const lv = scoreToLevel(pct);
              return (
                <div key={subj} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <p className="font-bold text-sm text-on-surface flex-1">{subj}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lv === "Fort" ? "bg-green-100 text-green-700" : lv === "Moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {lv}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/prep/programme"
            className="flex items-center gap-3 p-4 rounded-2xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#1a73e8,#4285f4)" }}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <div>
              <p className="font-black">Voir mon programme de révision</p>
              <p className="text-white/80 text-xs">Organisé par matière, chapitre et semaine jusqu'au 30 juin</p>
            </div>
            <span className="material-symbols-outlined text-white/70 ml-auto">arrow_forward_ios</span>
          </Link>

          <button onClick={() => setPhase("subject_select")}
            className="w-full py-3.5 rounded-xl font-bold text-white"
            style={{ backgroundColor: "#FF6B00" }}>
            Commencer à réviser →
          </button>
        </div>
      </main>
    );
  }

  // ── SUBJECT SELECT ─────────────────────────────────────────
  if (phase === "subject_select") {
    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
          <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs text-on-surface-variant">GSN PREP · Quiz IA</p>
            <p className="font-bold text-on-surface">Choisir une matière</p>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
          {/* XP + countdown */}
          <div className="flex gap-3">
            <div className="flex-1 bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <span className="text-2xl">{level.emoji}</span>
              <div>
                <p className="font-black text-on-surface text-sm">{currentLevel}</p>
                <p className="text-xs text-on-surface-variant">{totalXP} XP</p>
              </div>
            </div>
            <div className="flex-1 bg-orange-50 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-black text-primary">J-{dl}</p>
              <p className="text-[10px] text-on-surface-variant font-medium">BAC 30 juin</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          {/* Subjects */}
          <div className="space-y-2">
            <p className="font-bold text-on-surface text-sm">Série {serie} — choisir la matière à réviser</p>
            {(MATIERES_BY_SERIE[serie] ?? MATIERES_BY_SERIE["S1"]).map(subj => {
              const info = subjectLevels[subj];
              const lv = info?.level ?? "Faible";
              const sc = info?.score ?? 0;
              return (
                <button key={subj} onClick={() => startQuiz(subj)}
                  className="w-full flex items-center justify-between gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="flex-1 text-left">
                    <p className="font-bold text-on-surface text-sm">{subj}</p>
                    {info && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${sc}%`, backgroundColor: sc >= 70 ? "#22c55e" : sc >= 40 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${lv === "Fort" ? "bg-green-100 text-green-700" : lv === "Moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {lv}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {lv === "Faible" && !info && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Priorité</span>
                    )}
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Repositionnement */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase">Mettre à jour mon niveau</p>
            <p className="text-sm text-on-surface-variant">Refaire le quiz de positionnement pour une matière spécifique</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(MATIERES_BY_SERIE[serie] ?? []).map(subj => (
                <button key={subj}
                  onClick={async () => {
                    setPosIdx((MATIERES_BY_SERIE[serie] ?? []).indexOf(subj));
                    setPosSubjects([subj]);
                    await loadPositioningQuestions(subj);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
                  {subj}
                </button>
              ))}
            </div>
          </div>

          <Link href="/prep/programme"
            className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-400 transition-colors">
            <span className="material-symbols-outlined text-blue-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <div>
              <p className="font-bold text-on-surface text-sm">Mon programme de révision</p>
              <p className="text-xs text-on-surface-variant">Chapitres · Semaines · BAC 30 juin</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant ml-auto">arrow_forward_ios</span>
          </Link>
        </div>
      </main>
    );
  }

  // ── QUIZ LOADING ───────────────────────────────────────────
  if (phase === "quiz_loading") return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent", borderWidth: 3 }} />
      <div className="text-center">
        <p className="font-bold text-on-surface">Génération du quiz IA…</p>
        <p className="text-sm text-on-surface-variant mt-1">{quizSubject} · Série {serie}</p>
      </div>
    </main>
  );

  // ── ACTIVE QUIZ ────────────────────────────────────────────
  if (phase === "quiz") {
    const q = questions[currentIdx];
    if (!q) return null;
    const pct = (timeLeft / QUESTION_TIME) * 100;
    const isLow = timeLeft <= 10;
    const lastAns = answers[answers.length - 1];
    const lastXP = lastAns ? calcXP(lastAns.correct, lastAns.timeSpent, streak) : 0;

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-outline-variant/20">
          <div className="px-6 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-on-surface-variant">{quizSubject} · {serie}</p>
              <p className="text-sm font-bold text-on-surface">{currentIdx + 1}/{questions.length}</p>
            </div>
            <div className="flex items-center gap-2">
              {streak >= 2 && <span className="text-sm font-black text-orange-500">🔥 ×{streak}</span>}
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black text-sm ${isLow ? "bg-red-100 text-red-600" : "bg-orange-50 text-orange-600"}`}>
                <span className="material-symbols-outlined text-[14px]">timer</span>
                {timeLeft}s
              </div>
              <div className="bg-yellow-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-black text-yellow-600">+{sessionXP} XP</span>
              </div>
            </div>
          </div>
          <div className="h-1 bg-surface-container-low">
            <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: isLow ? "#ef4444" : "#FF6B00" }} />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-5 space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full text-white ${q.difficulty === "facile" ? "bg-green-500" : q.difficulty === "moyen" ? "bg-yellow-500" : "bg-red-500"}`}>
                {q.difficulty}
              </span>
              {q.chapter && <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{q.chapter}</span>}
            </div>
            <p className="font-semibold text-on-surface text-base leading-snug">{q.question}</p>
          </div>

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
                  <span className="font-black mr-2 text-xs text-on-surface-variant">{String.fromCharCode(65 + i)}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className={`rounded-xl p-3 flex items-start gap-3 ${lastAns?.correct ? "bg-green-50" : "bg-red-50"}`}>
              <span className="text-xl shrink-0">{lastAns?.correct ? "✅" : "❌"}</span>
              <div>
                <p className={`text-sm font-bold ${lastAns?.correct ? "text-green-700" : "text-red-700"}`}>
                  {lastAns?.correct ? `Correct ! +${lastXP} XP` : lastAns?.timeSpent === QUESTION_TIME ? "Temps écoulé !" : "Incorrect"}
                </p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          )}

          {!revealed ? (
            <button onClick={submitAnswer} disabled={!selected}
              className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-40"
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

  // ── QUIZ RESULT ────────────────────────────────────────────
  if (phase === "quiz_result") {
    const correct = answers.filter(a => a.correct).length;
    const score20 = questions.length > 0 ? Math.round((correct / questions.length) * 20) : 0;
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const newLv = getLevel(totalXP);
    const mention = score20 >= 14 ? "Bien" : score20 >= 10 ? "Passable" : "À retravailler";
    const mentionColor = score20 >= 14 ? "bg-green-100 text-green-700" : score20 >= 10 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
          <Link href="/prep/quiz" onClick={() => setPhase("subject_select")} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </Link>
          <p className="font-bold text-on-surface">Résultats — {quizSubject}</p>
        </header>

        <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
          <div className="rounded-2xl p-6 text-white shadow-lg text-center" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
            <p className="text-white/80 text-sm font-semibold">{quizSubject} · {serie}</p>
            <p className="text-6xl font-black mt-2">{score20}<span className="text-2xl text-white/60">/20</span></p>
            <span className={`inline-block mt-2 text-sm font-black px-4 py-1.5 rounded-full ${mentionColor}`}>{mention}</span>
            <p className="text-white/70 text-sm mt-2">{correct}/{questions.length} correctes · +{sessionXP} XP</p>
            <div className="flex items-center justify-center gap-2 mt-3 bg-white/10 rounded-xl px-4 py-2">
              <span className="text-xl">{newLv.emoji}</span>
              <span className="font-bold text-sm">{currentLevel}</span>
              <span className="text-white/70 text-xs ml-2">{totalXP} XP total</span>
            </div>
          </div>

          {/* Niveau mis à jour */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold uppercase">Niveau mis à jour</p>
              <p className="font-bold text-on-surface">{quizSubject}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444" }} />
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreToLevel(pct) === "Fort" ? "bg-green-100 text-green-700" : scoreToLevel(pct) === "Moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {scoreToLevel(pct)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setPhase("subject_select"); }}
              className="py-3 rounded-xl font-bold text-sm bg-surface-container text-on-surface">
              Changer de matière
            </button>
            <button onClick={() => startQuiz(quizSubject)}
              className="py-3 rounded-xl font-bold text-sm text-white"
              style={{ backgroundColor: "#FF6B00" }}>
              Rejouer
            </button>
          </div>

          <Link href="/prep/programme"
            className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-400 transition-colors">
            <span className="material-symbols-outlined text-blue-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <div>
              <p className="font-bold text-on-surface text-sm">Programme de révision</p>
              <p className="text-xs text-on-surface-variant">J-{dl} avant le BAC</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant ml-auto">arrow_forward_ios</span>
          </Link>
        </div>
      </main>
    );
  }

  return null;
}
