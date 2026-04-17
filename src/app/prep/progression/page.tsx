"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type QuizResult = { matiere: string; score: number; total: number; created_at: string };
type FlashStat  = { matiere: string; total: number; maitrisee: number };

const BAC_DATE  = "2026-06-30";
const BFEM_DATE = "2026-07-15";

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }

function scoreColor(pct: number) {
  if (pct >= 70) return { bg: "#dcfce7", text: "#15803d", bar: "#22c55e" };
  if (pct >= 45) return { bg: "#fef9c3", text: "#854d0e", bar: "#eab308" };
  return { bg: "#fee2e2", text: "#991b1b", bar: "#ef4444" };
}

function ScoreLabel({ pct }: { pct: number }) {
  const c = scoreColor(pct);
  return (
    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.text }}>
      {pct}%
    </span>
  );
}

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

      const grouped: Record<string, { total: number; maitrisee: number }> = {};
      for (const f of flashData ?? []) {
        if (!grouped[f.matiere]) grouped[f.matiere] = { total: 0, maitrisee: 0 };
        grouped[f.matiere].total++;
        if (f.maitrisee) grouped[f.matiere].maitrisee++;
      }
      setFlash(Object.entries(grouped).map(([m, v]) => ({ matiere: m, ...v })));

      const worked = new Set([...(quizData ?? []).map(q => q.matiere), ...Object.keys(grouped)]);
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

  const quizAvg = quiz.length
    ? Math.round(quiz.reduce((s, q) => s + (q.score / q.total) * 100, 0) / quiz.length)
    : null;

  const flashMastered = flash.reduce((s, f) => s + f.maitrisee, 0);
  const flashTotal    = flash.reduce((s, f) => s + f.total, 0);
  const flashPct      = flashTotal > 0 ? Math.round((flashMastered / flashTotal) * 100) : null;

  const globalScore = quizAvg !== null && flashPct !== null
    ? Math.round((quizAvg + flashPct) / 2)
    : (quizAvg ?? flashPct ?? 0);

  const quizByMat: Record<string, number[]> = {};
  for (const q of quiz) {
    if (!quizByMat[q.matiere]) quizByMat[q.matiere] = [];
    quizByMat[q.matiere].push(Math.round((q.score / q.total) * 100));
  }

  const examDate = examType === "BFEM" ? BFEM_DATE : BAC_DATE;
  const days     = daysUntil(examDate);

  const ringColor = globalScore >= 70 ? "#22c55e" : globalScore >= 45 ? "#f97316" : "#ef4444";
  const circumference = 2 * Math.PI * 42;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">

      {/* Header gradient */}
      <div className="px-6 pt-8 pb-5 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #FF6B00, transparent)" }} />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold text-white">Mes Progrès</h1>
          <p className="text-white/50 text-sm mt-0.5">Quiz · Flashcards · Évolution</p>
        </div>
      </div>

      <div className="px-6 space-y-4 -mt-1 pt-4">

        {/* Score global + countdown côte à côte */}
        <div className="grid grid-cols-2 gap-3">
          {/* Score global */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Score Global</p>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-container)" strokeWidth="12" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - globalScore / 100)}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-on-surface">{globalScore}%</span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 text-center">
              {quiz.length} quiz · {flashTotal} flashcards
            </p>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl p-4 shadow-sm flex flex-col justify-between overflow-hidden relative"
            style={{ background: days > 60 ? "linear-gradient(135deg,#22c55e,#16a34a)" : days > 30 ? "linear-gradient(135deg,#f97316,#ea580c)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white, transparent)" }} />
            <span className="material-symbols-outlined text-white/80 text-[22px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            <div className="relative z-10">
              <p className="text-white font-black text-3xl leading-none">J-{days}</p>
              <p className="text-white/70 text-xs font-semibold mt-1">{examType} · {examType === "BFEM" ? "Juil. 2026" : "Juin 2026"}</p>
            </div>
          </div>
        </div>

        {/* Stats détaillées */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm" style={{ borderLeft: "3px solid #6366f1" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[16px]" style={{ color: "#6366f1", fontVariationSettings: "'FILL' 1" }}>quiz</span>
              <p className="text-xs font-bold text-on-surface-variant">Moyenne quiz</p>
            </div>
            <p className="text-2xl font-black text-on-surface">{quizAvg !== null ? `${quizAvg}%` : "—"}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{quiz.length} quiz passés</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm" style={{ borderLeft: "3px solid #10b981" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[16px]" style={{ color: "#10b981", fontVariationSettings: "'FILL' 1" }}>style</span>
              <p className="text-xs font-bold text-on-surface-variant">Flashcards</p>
            </div>
            <p className="text-2xl font-black text-on-surface">{flashPct !== null ? `${flashPct}%` : "—"}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{flashMastered}/{flashTotal} maîtrisées</p>
          </div>
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
                const c      = avg !== null ? scoreColor(avg) : null;

                return (
                  <div key={m} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm"
                    style={{ borderLeft: `3px solid ${c?.bar ?? "#94a3b8"}` }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="font-bold text-on-surface text-sm">{m}</p>
                      <div className="flex gap-1.5">
                        {avg !== null && <ScoreLabel pct={avg} />}
                        {fPct !== null && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {fPct}% flash
                          </span>
                        )}
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: c?.bar }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg,#FF6B00,#FF9500)" }}>
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <p className="font-bold text-on-surface">Aucune activité encore</p>
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
                const c   = scoreColor(pct);
                return (
                  <div key={i} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl p-3.5 shadow-sm"
                    style={{ borderLeft: `3px solid ${c.bar}` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: c.bg }}>
                      <span className="material-symbols-outlined text-[16px]" style={{ color: c.text, fontVariationSettings: "'FILL' 1" }}>quiz</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm truncate">{q.matiere}</p>
                      <p className="text-xs text-on-surface-variant">{new Date(q.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className="text-sm font-black px-3 py-1 rounded-full" style={{ backgroundColor: c.bg, color: c.text }}>
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
