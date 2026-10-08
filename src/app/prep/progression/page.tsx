"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { EXAM_CONFIG } from "@/lib/prep-config";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice } from "@/components/SlowConnectionNotice";

type QuizResult = { matiere: string; score: number; total: number; created_at: string };
type FlashStat  = { matiere: string; total: number; maitrisee: number };

const BAC_DATE  = EXAM_CONFIG.BAC.targetDate;
const BFEM_DATE = EXAM_CONFIG.BFEM.targetDate;

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }

export default function ProgressionPage() {
  const router = useRouter();
  const [quiz,     setQuiz]     = useState<QuizResult[]>([]);
  const [flash,    setFlash]    = useState<FlashStat[]>([]);
  const [examType, setExamType] = useState("BAC");
  const [matieres, setMatieres] = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setIsSlowConnection(false);

    const slowTimer = setTimeout(() => {
      if (mounted && loading) {
        setIsSlowConnection(true);
      }
    }, 8000);

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isPreviewEnvironment()) {
            if (mounted) {
              setIsPreview(true);
              setExamType("BAC");
              setQuiz([
                { matiere: "Mathématiques", score: 8, total: 10, created_at: new Date().toISOString() },
                { matiere: "Sciences Physiques", score: 9, total: 10, created_at: new Date(Date.now() - 86400000).toISOString() },
                { matiere: "SVT", score: 7, total: 10, created_at: new Date(Date.now() - 172800000).toISOString() },
                { matiere: "Philosophie", score: 6, total: 10, created_at: new Date(Date.now() - 259200000).toISOString() },
              ]);
              setFlash([
                { matiere: "Mathématiques", total: 25, maitrisee: 20 },
                { matiere: "Sciences Physiques", total: 30, maitrisee: 24 },
                { matiere: "SVT", total: 18, maitrisee: 14 },
              ]);
              setMatieres(["Mathématiques", "Sciences Physiques", "SVT", "Philosophie"]);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }

        const [{ data: stu }, { data: quizData }, { data: flashData }] = await Promise.all([
          supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).maybeSingle(),
          supabase.from("quiz_results").select("matiere, score, total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("flashcards").select("matiere, maitrisee").eq("user_id", user.id),
        ]);

        if (mounted) {
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
      } catch (err) {
        console.error(err);
        if (isPreviewEnvironment() && mounted) {
          setIsPreview(true);
          setLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      clearTimeout(slowTimer);
    };
  }, [router, retryCount]);

  if (isSlowConnection && loading) return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <SlowConnectionNotice
        onRetry={() => {
          setIsSlowConnection(false);
          setLoading(true);
          setRetryCount(c => c + 1);
        }}
      />
    </div>
  );

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="text-xs font-bold text-slate-500">Calcul de vos statistiques de révision...</p>
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {isPreview && <PreviewBanner />}
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">insights</span>
            <span>Bilan d&apos;apprentissage personnalisé</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.progression.title")}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {t("prep.progression.subtitle")}
          </p>
        </div>
      </div>

      {/* Top Bento Row: Countdown & Mastery Donut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Countdown Card */}
        <div className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
              Compte à rebours officiel 2027
            </span>
            <p className="text-sm text-blue-100 font-semibold mt-3">
              {t("prep.progression.countdown", { examType })}
            </p>
            <p className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
              J-{days}
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between border-t border-white/20 mt-4">
            <span className="text-xs text-blue-100">Session de juin 2027</span>
            <Link
              href="/prep/generer?type=quiz"
              className="px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-xs transition-colors"
            >
              Lancer un quiz
            </Link>
          </div>
        </div>

        {/* Global Mastery Donut Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">
            {t("prep.progression.globalScoreLabel")}
          </p>
          <div className="relative w-32 h-32 my-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#FF6B00"
                strokeWidth="9"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - globalScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">{globalScore}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Moyenne</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t("prep.progression.summaryStats", { quizCount: quiz.length, flashTotal, flashMastered })}
          </p>
        </div>
      </div>

      {/* Matières Breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 px-1">
          {t("prep.progression.byMatiere")}
        </h2>

        {matieres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matieres.map((m) => {
              const scores = quizByMat[m] ?? [];
              const avg    = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
              const fData  = flash.find(f => f.matiere === m);
              const fPct   = fData ? Math.round((fData.maitrisee / fData.total) * 100) : null;

              return (
                <div key={m} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{m}</p>
                    <div className="flex items-center gap-1.5">
                      {avg !== null && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          avg >= 60 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          avg >= 40 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {t("prep.progression.quizPct", { avg })}
                        </span>
                      )}
                      {fPct !== null && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#005bbf] border border-blue-200">
                          {t("prep.progression.flashPct", { pct: fPct })}
                        </span>
                      )}
                    </div>
                  </div>

                  {avg !== null && (
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${avg}%`,
                          backgroundColor: avg >= 60 ? "#10b981" : avg >= 40 ? "#f59e0b" : "#ef4444"
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">trending_up</span>
            </div>
            <p className="font-extrabold text-slate-900 text-base">{t("prep.progression.empty.title")}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("prep.progression.empty.desc")}</p>
            <Link
              href="/prep/generer"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005bbf] text-white font-bold text-xs shadow-xs hover:bg-[#004899] transition-all"
            >
              Faire mon premier entraînement
            </Link>
          </div>
        )}
      </div>

      {/* Historique Récent */}
      {quiz.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 px-1">
            {t("prep.progression.recentQuiz")}
          </h2>
          <div className="space-y-2">
            {quiz.slice(0, 5).map((q, i) => {
              const pct = Math.round((q.score / q.total) * 100);
              return (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{q.matiere}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(q.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${
                    pct >= 60 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    pct >= 40 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    {q.score}/{q.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
