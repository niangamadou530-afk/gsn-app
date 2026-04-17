"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type QuizResult = { matiere: string; score: number; total: number; created_at: string };
type FlashStat  = { matiere: string; total: number; maitrisee: number };

const BAC_DATE  = "2026-06-30";
const BFEM_DATE = "2026-07-15";

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }
function countdownColor(d: number) { return d > 60 ? "#22c55e" : d > 30 ? "#f97316" : "#ef4444"; }

export default function ProgressionPage() {
  const router = useRouter();
  const [quiz,    setQuiz]    = useState<QuizResult[]>([]);
  const [flash,   setFlash]   = useState<FlashStat[]>([]);
  const [examType, setExamType] = useState("BAC");
  const [matieres, setMatieres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: stu }, { data: quizData }, { data: flashData }] = await Promise.all([
        supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).maybeSingle(),
        supabase.from("quiz_results").select("matiere, score, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("flashcards").select("matiere, maitrisee").eq("user_id", user.id),
      ]);

      if (stu) setExamType(stu.exam_type ?? "BAC");
      setQuiz(quizData ?? []);

      // Group flashcards by matiere
      const grouped: Record<string, { total: number; maitrisee: number }> = {};
      for (const f of flashData ?? []) {
        if (!grouped[f.matiere]) grouped[f.matiere] = { total: 0, maitrisee: 0 };
        grouped[f.matiere].total++;
        if (f.maitrisee) grouped[f.matiere].maitrisee++;
      }
      setFlash(Object.entries(grouped).map(([m, v]) => ({ matiere: m, ...v })));

      // All worked matieres
      const worked = new Set([
        ...(quizData ?? []).map(q => q.matiere),
        ...Object.keys(grouped),
      ]);
      setMatieres([...worked]);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );

  // Compute global score
  const quizAvg = quiz.length
    ? Math.round(quiz.reduce((s, q) => s + (q.score / q.total) * 100, 0) / quiz.length)
    : null;

  const flashMastered = flash.reduce((s, f) => s + f.maitrisee, 0);
  const flashTotal    = flash.reduce((s, f) => s + f.total, 0);
  const flashPct      = flashTotal > 0 ? Math.round((flashMastered / flashTotal) * 100) : null;

  const globalScore = quizAvg !== null && flashPct !== null
    ? Math.round((quizAvg + flashPct) / 2)
    : (quizAvg ?? flashPct ?? 0);

  // Per-matiere quiz score
  const quizByMat: Record<string, number[]> = {};
  for (const q of quiz) {
    if (!quizByMat[q.matiere]) quizByMat[q.matiere] = [];
    quizByMat[q.matiere].push(Math.round((q.score / q.total) * 100));
  }

  const examDate = examType === "BFEM" ? BFEM_DATE : BAC_DATE;
  const days     = daysUntil(examDate);
  const cdColor  = countdownColor(days);

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">Mes Progrès</h1>
        <p className="text-on-surface-variant text-sm mt-0.5">Basé sur tes quiz et flashcards</p>
      </header>

      <div className="px-6 space-y-4">

        {/* Countdown */}
        <div className="rounded-2xl p-4 text-white flex items-center justify-between" style={{ backgroundColor: cdColor }}>
          <div>
            <p className="text-xs opacity-80 font-semibold">Compte à rebours {examType}</p>
            <p className="text-3xl font-black">J-{days}</p>
          </div>
          <span className="material-symbols-outlined text-[40px] opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
        </div>

        {/* Score global */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm text-center">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Score Global</p>
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-container)" strokeWidth="10" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#FF6B00" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - globalScore / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-on-surface">{globalScore}%</span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            {quiz.length} quiz · {flashTotal} flashcards ({flashMastered} maîtrisées)
          </p>
        </div>

        {/* Par matière */}
        {matieres.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Par matière</p>
            <div className="space-y-2.5">
              {matieres.map(m => {
                const scores = quizByMat[m] ?? [];
                const avg    = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                const fData  = flash.find(f => f.matiere === m);
                const fPct   = fData ? Math.round((fData.maitrisee / fData.total) * 100) : null;

                return (
                  <div key={m} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-on-surface text-sm">{m}</p>
                      <div className="flex gap-2">
                        {avg !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${avg >= 60 ? "bg-green-100 text-green-700" : avg >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            Quiz {avg}%
                          </span>
                        )}
                        {fPct !== null && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Flash {fPct}%
                          </span>
                        )}
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: avg >= 60 ? "#22c55e" : avg >= 40 ? "#f97316" : "#ef4444" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <p className="font-bold text-on-surface mt-2">Aucune activité encore</p>
            <p className="text-sm text-on-surface-variant mt-1">Génère un quiz ou des flashcards pour voir tes progrès.</p>
          </div>
        )}

        {/* Historique quiz */}
        {quiz.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Derniers quiz</p>
            <div className="space-y-2">
              {quiz.slice(0, 5).map((q, i) => {
                const pct = Math.round((q.score / q.total) * 100);
                return (
                  <div key={i} className="flex items-center justify-between bg-surface-container-lowest rounded-xl p-3.5 shadow-sm">
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{q.matiere}</p>
                      <p className="text-xs text-on-surface-variant">{new Date(q.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className={`text-sm font-black px-3 py-1 rounded-full ${pct >= 60 ? "bg-green-100 text-green-700" : pct >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {q.score}/{q.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
