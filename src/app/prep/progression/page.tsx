"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Result = {
  subject: string;
  score: number;
  feedback: string;
  created_at: string;
};

type Level = { level: string; score: number };

export default function ProgressionPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [levels, setLevels] = useState<Record<string, Level>>({});
  const [examType, setExamType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: stu } = await supabase.from("prep_students")
        .select("exam_type, level_per_subject").eq("user_id", user.id).limit(1);
      if (stu?.[0]) {
        setExamType(stu[0].exam_type ?? "");
        setLevels((stu[0].level_per_subject as Record<string, Level>) ?? {});
      }

      const { data: res } = await supabase.from("prep_results")
        .select("subject, score, feedback, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setResults((res ?? []) as Result[]);
      setLoading(false);
    }
    load();
  }, [router]);

  function avgScore(subj: string): number {
    const sub = results.filter(r => r.subject === subj);
    if (!sub.length) return 0;
    return Math.round(sub.reduce((s, r) => s + r.score, 0) / sub.length);
  }

  function levelColor(l: string) {
    if (l === "Fort") return "bg-green-100 text-green-700";
    if (l === "Moyen") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

  const subjects = Object.keys(levels);
  const completedDays = new Set(results.map(r => r.created_at?.slice(0, 10))).size;
  const bestSubj = subjects.sort((a, b) => (levels[b]?.score ?? 0) - (levels[a]?.score ?? 0))[0];
  const weakSubj = subjects.sort((a, b) => (levels[a]?.score ?? 0) - (levels[b]?.score ?? 0))[0];
  const globalAvg = subjects.length
    ? Math.round(subjects.reduce((s, subj) => s + (levels[subj]?.score ?? 0), 0) / subjects.length)
    : 0;

  if (loading) return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </main>
  );

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Mon évolution — {examType}</p>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Score moyen", value: `${globalAvg}%`, icon: "stars", color: "text-primary" },
            { label: "Jours révisés", value: completedDays.toString(), icon: "calendar_today", color: "text-green-600" },
            { label: "Examens blancs", value: results.length.toString(), icon: "quiz", color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4 text-center shadow-sm space-y-1">
              <span className={`material-symbols-outlined text-[22px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="text-xl font-extrabold text-on-surface">{s.value}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Best / weakest */}
        {subjects.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-bold text-green-700 uppercase">Meilleure matière</p>
              <p className="font-bold text-on-surface">{bestSubj ?? "—"}</p>
              <p className="text-sm text-green-700 font-semibold">{levels[bestSubj]?.score ?? 0}%</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-bold text-red-700 uppercase">À améliorer</p>
              <p className="font-bold text-on-surface">{weakSubj ?? "—"}</p>
              <p className="text-sm text-red-700 font-semibold">{levels[weakSubj]?.score ?? 0}%</p>
            </div>
          </div>
        )}

        {/* Score target */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-on-surface">Score moyen actuel</p>
            <p className="font-extrabold text-primary">{globalAvg}% / 100%</p>
          </div>
          <div className="h-3 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${globalAvg}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Objectif : 50% (10/20)</span>
            <span className={globalAvg >= 50 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
              {globalAvg >= 50 ? "✓ Objectif atteint" : `${50 - globalAvg}% manquants`}
            </span>
          </div>
        </div>

        {/* Per-subject bars */}
        {subjects.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Par matière</h2>
            <div className="space-y-3">
              {subjects.map(subj => {
                const info = levels[subj];
                const avg = avgScore(subj);
                return (
                  <div key={subj} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-on-surface">{subj}</p>
                      <div className="flex items-center gap-2">
                        {avg > 0 && <span className="text-xs text-on-surface-variant">Moy. examens: {avg}/20</span>}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${levelColor(info?.level ?? "Faible")}`}>
                          {info?.level ?? "Faible"}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${info?.score ?? 0}%`, backgroundColor: (info?.score ?? 0) >= 67 ? "#22c55e" : (info?.score ?? 0) >= 34 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <p className="text-[11px] text-on-surface-variant">Niveau initial : {info?.score ?? 0}%</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent exams */}
        {results.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Historique des examens blancs</h2>
            <div className="space-y-2">
              {results.slice(0, 10).map((r, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${r.score >= 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {r.score}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{r.subject}</p>
                      <p className="text-[11px] text-on-surface-variant">/20</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {results.length === 0 && subjects.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">bar_chart</span>
            <p className="text-on-surface-variant font-medium">Aucune donnée encore.</p>
            <p className="text-sm text-on-surface-variant mt-1">Passe un examen blanc pour voir tes statistiques.</p>
            <Link href="/prep/simulateur" className="inline-block mt-4 px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: "#FF6B00" }}>
              Commencer un examen blanc
            </Link>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur border-t border-outline-variant/20 flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/prep/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/prep/bibliotheque" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">library_books</span>
          <span className="text-[10px] font-medium mt-0.5">Épreuves</span>
        </Link>
        <Link href="/prep/simulateur" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">quiz</span>
          <span className="text-[10px] font-medium mt-0.5">Examen</span>
        </Link>
        <Link href="/prep/progression" className="flex flex-col items-center active:scale-90 transition-transform" style={{ color: "#FF6B00" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          <span className="text-[10px] font-medium mt-0.5">Progrès</span>
        </Link>
        <Link href="/prep/soft-skills" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">self_improvement</span>
          <span className="text-[10px] font-medium mt-0.5">Méthodes</span>
        </Link>
      </nav>
    </main>
  );
}
