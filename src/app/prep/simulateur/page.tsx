"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { speak, stopSpeaking } from "@/lib/voice";

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

const SUBJECTS_BFEM = ["Maths", "Français", "Sciences Physiques", "Sciences Naturelles", "Histoire-Géographie", "Anglais"];
const SUBJECTS_BAC  = ["Maths", "Français", "Physique-Chimie", "Sciences Naturelles", "Histoire-Géographie", "Philosophie", "Anglais", "Comptabilité"];

type Phase = "setup" | "loading" | "exam" | "correction";

function SimulateurInner() {
  const searchParams = useSearchParams();
  const preMatiere = searchParams.get("matiere") ?? "";

  const [phase, setPhase] = useState<Phase>("setup");
  const [examType, setExamType] = useState("BFEM");
  const [matiere, setMatiere] = useState(preMatiere);
  const [dureeMin, setDureeMin] = useState(30);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [skippedChapters, setSkippedChapters] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [studentInfo, setStudentInfo] = useState<{ exam_type: string; serie: string; country: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("prep_students").select("exam_type, serie, country").eq("user_id", user.id).limit(1)
        .then(({ data }) => { if (data?.[0]) setStudentInfo(data[0] as typeof studentInfo); });
    });
  }, []);

  const endExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("correction");
    saveResult();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "exam" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { endExam(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, endExam]);

  async function startExam() {
    if (!matiere) return;
    setPhase("loading");
    const n = examType === "BAC" ? 30 : 20;
    try {
      const res = await fetch("/api/prep-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: matiere,
          examType: studentInfo?.exam_type ?? examType,
          serie: studentInfo?.serie,
          country: studentInfo?.country ?? "Sénégal",
          questionCount: n,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions ?? []);
      setAnswers([]);
      setCurrent(0);
      setSelectedAnswer("");
      setSkippedChapters([]);
      setTimeLeft(dureeMin * 60);
      setPhase("exam");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      const isRateLimit = msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("429") || msg.toLowerCase().includes("limit");
      alert(isRateLimit
        ? "Limite de requêtes atteinte. Attends 30 secondes et réessaie."
        : "Erreur lors de la génération du quiz. Vérifie ta connexion et réessaie."
      );
      setPhase("setup");
    }
  }

  function submitAnswer() {
    if (!selectedAnswer) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer("");
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      endExam();
    }
  }

  function skipQuestion() {
    const chapter = q?.chapter ?? q?.question?.slice(0, 40) ?? "Chapitre inconnu";
    if (!skippedChapters.includes(chapter)) {
      setSkippedChapters(prev => [...prev, chapter]);
    }
    // Record as skipped (empty answer)
    const newAnswers = [...answers, "__SKIPPED__"];
    setAnswers(newAnswers);
    setSelectedAnswer("");
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
    } else {
      endExam();
    }
  }

  async function saveResult() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || questions.length === 0) return;
    const answered = answers.filter(a => a !== "__SKIPPED__");
    const correct = answered.filter((a, i) => {
      const qi = answers.indexOf(a, i);
      return a === questions[qi]?.correct_answer;
    }).length;
    const scoreVal = Math.round(
      (answers.filter((a, i) => a === questions[i]?.correct_answer).length / questions.length) * 20
    );
    const chapitresARevoir = skippedChapters.length > 0
      ? `\nChapitres à réviser en priorité : ${skippedChapters.join(", ")}`
      : "";
    await supabase.from("prep_results").insert({
      user_id: user.id,
      exam_type: examType,
      subject: matiere,
      score: scoreVal,
      feedback: `Examen blanc ${matiere} — Score : ${scoreVal}/20 (${answers.filter(a => a === "__SKIPPED__").length} questions sautées)${chapitresARevoir}`,
    });
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  function calcScore() {
    if (questions.length === 0) return 0;
    const correct = answers.filter((a, i) => a !== "__SKIPPED__" && a === questions[i]?.correct_answer).length;
    return Math.round((correct / questions.length) * 20);
  }

  const subjects = examType === "BAC" ? SUBJECTS_BAC : SUBJECTS_BFEM;
  const q = questions[current];
  const score = calcScore();
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);

  /* ── SETUP ── */
  if (phase === "setup") return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Examen blanc</p>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface mb-1">Configure ton examen blanc</h1>
          <p className="text-on-surface-variant text-sm">L&apos;IA génère des questions réalistes niveau {examType}.</p>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-sm text-on-surface">Type d&apos;examen</p>
          <div className="grid grid-cols-2 gap-3">
            {["BFEM", "BAC"].map(e => (
              <button key={e} onClick={() => { setExamType(e); setMatiere(""); }}
                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${examType === e ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-surface-container-lowest text-on-surface shadow-sm"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

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

        <div className="space-y-2">
          <p className="font-bold text-sm text-on-surface">Durée : <span className="text-primary">{dureeMin} minutes</span></p>
          <input type="range" min={15} max={120} step={15} value={dureeMin}
            onChange={e => setDureeMin(parseInt(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>15 min</span><span>60 min</span><span>120 min</span>
          </div>
        </div>

        <button onClick={startExam} disabled={!matiere}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FF6B00" }}>
          <span className="material-symbols-outlined">play_arrow</span>
          Démarrer l&apos;examen blanc
        </button>
      </div>
    </main>
  );

  /* ── LOADING ── */
  if (phase === "loading") return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-4 p-6">
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="text-on-surface font-bold">Génération des questions en cours…</p>
      <p className="text-on-surface-variant text-sm">L&apos;IA prépare {examType === "BAC" ? "30" : "20"} questions pour {matiere}</p>
    </div>
  );

  /* ── EXAM ── */
  if (phase === "exam" && q) {
    const pct = timeLeft / (dureeMin * 60);
    const timerColor = pct > 0.4 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
    return (
      <main className="min-h-screen bg-surface text-on-surface pb-10">
        {/* Timer bar */}
        <div className="sticky top-0 z-30 bg-surface border-b border-outline-variant/20">
          <div className="h-1.5 w-full bg-surface-container" style={{ background: `linear-gradient(to right, ${timerColor} ${pct * 100}%, #e0e0e0 0%)` }} />
          <div className="px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">{current + 1} / {questions.length}</span>
            <span className="text-lg font-black" style={{ color: timerColor }}>{formatTime(timeLeft)}</span>
            <button onClick={endExam} className="text-xs font-bold text-outline hover:text-error transition-colors">Terminer</button>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-6 py-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.difficulty === "facile" ? "bg-green-100 text-green-700" : q.difficulty === "moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
              {q.difficulty}
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">{q.points} pt{q.points > 1 ? "s" : ""} · {q.type}</span>
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
              <textarea
                rows={3}
                value={selectedAnswer}
                onChange={e => setSelectedAnswer(e.target.value)}
                placeholder="Écris ta réponse ici…"
                className="w-full p-4 rounded-xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none resize-none text-sm" />
            )}
          </div>

          <button onClick={submitAnswer} disabled={!selectedAnswer}
            className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#FF6B00" }}>
            {current < questions.length - 1 ? "Question suivante →" : "Terminer l'examen ✓"}
          </button>

          <button onClick={skipQuestion}
            className="w-full py-3 rounded-2xl border-2 border-outline-variant/30 font-semibold text-sm text-on-surface-variant hover:bg-surface-container transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">skip_next</span>
            Je n&apos;ai pas encore étudié ce chapitre
          </button>
        </div>
      </main>
    );
  }

  /* ── CORRECTION ── */
  if (phase === "correction") return (
    <main className="min-h-screen bg-surface text-on-surface pb-20">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <p className="font-bold text-on-surface">Correction — {matiere}</p>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">
        {/* Score card */}
        <div className="rounded-2xl p-6 text-white text-center" style={{ background: score >= 10 ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#FF6B00,#e55a00)" }}>
          <p className="text-5xl font-black">{score}<span className="text-2xl">/20</span></p>
          <p className="mt-2 font-bold text-white/90 text-lg">
            {score >= 16 ? "Excellent ! 🎉" : score >= 12 ? "Bien joué ! 👍" : score >= 10 ? "Passable — continue ! 💪" : "À réviser — courage ! 📚"}
          </p>
          <p className="text-white/70 text-sm mt-1">{answers.filter((a, i) => a === questions[i]?.correct_answer).length} / {questions.length} bonnes réponses · {totalPoints} pts</p>
        </div>

        {/* Chapitres à réviser */}
        {skippedChapters.length > 0 && (
          <div className="rounded-2xl p-4 bg-amber-50 border-l-4 border-amber-400 space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
              <p className="font-bold text-amber-800 text-sm">Chapitres à réviser en priorité</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {skippedChapters.map((ch, i) => (
                <span key={i} className="text-xs bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full">{ch}</span>
              ))}
            </div>
          </div>
        )}

        {/* Per-question correction */}
        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[i] ?? "";
            const isSkipped = userAns === "__SKIPPED__";
            const isCorrect = !isSkipped && userAns === q.correct_answer;
            return (
              <div key={q.id} className={`rounded-2xl p-4 shadow-sm border-l-4 ${isSkipped ? "border-amber-400 bg-amber-50" : isCorrect ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50"}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${isSkipped ? "text-amber-500" : isCorrect ? "text-green-600" : "text-red-500"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isSkipped ? "skip_next" : isCorrect ? "check_circle" : "cancel"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{q.question}</p>
                    {q.chapter && <span className="text-[10px] text-outline">{q.chapter}</span>}
                  </div>
                </div>
                {isSkipped && (
                  <p className="text-xs text-amber-700 mb-1 ml-6 font-semibold">Non étudié — à réviser en priorité</p>
                )}
                {!isSkipped && !isCorrect && (
                  <p className="text-xs text-red-600 mb-1 ml-6">Ta réponse : {userAns || "(vide)"}</p>
                )}
                <p className="text-xs text-green-700 font-semibold ml-6">✓ {q.correct_answer}</p>
                <div className="mt-2 flex items-start gap-1 ml-6">
                  <p className="text-xs text-on-surface-variant flex-1">{q.explanation}</p>
                  <button
                    onClick={() => speak(q.explanation)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-surface-container transition-colors"
                    title="Écouter l'explication">
                    🔊
                  </button>
                  <button
                    onClick={stopSpeaking}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-surface-container transition-colors"
                    title="Arrêter">
                    ⏹
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setPhase("setup")}
            className="flex-1 py-3 border-2 border-outline-variant/30 rounded-xl font-bold text-on-surface text-sm hover:bg-surface-container transition-colors">
            Nouvel examen
          </button>
          <Link href="/prep/dashboard" className="flex-1 py-3 text-center font-black text-white rounded-xl text-sm"
            style={{ backgroundColor: "#FF6B00" }}>
            Tableau de bord
          </Link>
        </div>
      </div>
    </main>
  );

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
