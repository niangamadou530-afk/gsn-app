"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const A  = "#00C9A7";
const C  = "#111118";
const B  = "rgba(255,255,255,0.07)";
const T2 = "#A0A0B0";

type QuizResult = { matiere: string; score: number; total: number; created_at: string };
type FlashStat  = { matiere: string; total: number; maitrisee: number };

const BAC_DATE  = "2026-06-30";
const BFEM_DATE = "2026-07-15";

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }

function scoreColor(pct: number): string {
  if (pct >= 70) return A;
  if (pct >= 45) return "#FFB800";
  return "#FF5B79";
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: A, borderTopColor: "transparent" }} />
    </div>
  );

  const quizAvg    = quiz.length ? Math.round(quiz.reduce((s, q) => s + (q.score / q.total) * 100, 0) / quiz.length) : null;
  const flashTotal = flash.reduce((s, f) => s + f.total, 0);
  const flashMast  = flash.reduce((s, f) => s + f.maitrisee, 0);
  const flashPct   = flashTotal > 0 ? Math.round((flashMast / flashTotal) * 100) : null;
  const global     = quizAvg !== null && flashPct !== null ? Math.round((quizAvg + flashPct) / 2) : (quizAvg ?? flashPct ?? 0);

  const quizByMat: Record<string, number[]> = {};
  for (const q of quiz) {
    if (!quizByMat[q.matiere]) quizByMat[q.matiere] = [];
    quizByMat[q.matiere].push(Math.round((q.score / q.total) * 100));
  }

  const days = daysUntil(examType === "BFEM" ? BFEM_DATE : BAC_DATE);
  const circ = 2 * Math.PI * 38;

  return (
    <main className="min-h-screen text-white pb-8" style={{ backgroundColor: "#0A0A0F" }}>

      <div className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Mes Progrès</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: T2 }}>Quiz · Flashcards · Évolution</p>
      </div>

      <div className="px-6 space-y-4">

        {/* Score global + countdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 flex flex-col items-center" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T2 }}>Score Global</p>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle cx="50" cy="50" r="38" fill="none" stroke={scoreColor(global)} strokeWidth="10"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - global / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-white">{global}%</span>
              </div>
            </div>
            <p className="text-[10px] mt-2 text-center" style={{ color: "#5A5A70" }}>
              {quiz.length} quiz · {flashTotal} flash
            </p>
          </div>

          <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: T2, fontVariationSettings: "'FILL' 1" }}>timer</span>
            <div>
              <p className="text-4xl font-black" style={{ color: A }}>J-{days}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: T2 }}>{examType}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#5A5A70" }}>
                {examType === "BFEM" ? "15 juil. 2026" : "30 juin 2026"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Moy. quiz", val: quizAvg !== null ? `${quizAvg}%` : "—", sub: `${quiz.length} quiz`, icon: "quiz" },
            { label: "Flashcards", val: flashPct !== null ? `${flashPct}%` : "—", sub: `${flashMast}/${flashTotal} maîtrisées`, icon: "style" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <span className="material-symbols-outlined text-[16px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="text-2xl font-black text-white mt-2">{s.val}</p>
              <p className="text-[10px] mt-0.5" style={{ color: T2 }}>{s.sub}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#5A5A70" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Par matière */}
        {matieres.length > 0 ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T2 }}>Par matière</p>
            <div className="space-y-2.5">
              {matieres.map(m => {
                const scores = quizByMat[m] ?? [];
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                const fData = flash.find(f => f.matiere === m);
                const fPct  = fData ? Math.round((fData.maitrisee / fData.total) * 100) : null;
                const col   = avg !== null ? scoreColor(avg) : A;

                return (
                  <div key={m} className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${col}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-white text-sm">{m}</p>
                      <div className="flex gap-1.5">
                        {avg !== null && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${col}15`, color: col }}>{avg}%</span>
                        )}
                        {fPct !== null && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: T2 }}>{fPct}% flash</span>
                        )}
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="h-1 w-full rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: col }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <span className="material-symbols-outlined text-[32px]" style={{ color: "#5A5A70", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <p className="font-bold text-white mt-3">Aucune activité encore</p>
            <p className="text-sm mt-1" style={{ color: T2 }}>Génère un quiz ou des flashcards pour voir tes progrès.</p>
          </div>
        )}

        {/* Historique quiz */}
        {quiz.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T2 }}>Derniers quiz</p>
            <div className="space-y-2">
              {quiz.slice(0, 5).map((q, i) => {
                const pct = Math.round((q.score / q.total) * 100);
                const col = scoreColor(pct);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3.5"
                    style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${col}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{q.matiere}</p>
                      <p className="text-xs" style={{ color: "#5A5A70" }}>{new Date(q.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <span className="text-sm font-black px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${col}15`, color: col }}>
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
