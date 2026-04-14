"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Result   = { subject: string; score: number; feedback: string; created_at: string };
type SubLevel = { level: string; score: number };

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

function getNextLevel(xp: number) {
  return LEVELS_XP.find(l => l.min > xp) ?? null;
}

export default function ProgressionPage() {
  const router = useRouter();
  const [results, setResults]     = useState<Result[]>([]);
  const [levels, setLevels]       = useState<Record<string, SubLevel>>({});
  const [examType, setExamType]   = useState("");
  const [playerXP, setPlayerXP]   = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [playerLevel, setPlayerLevel] = useState("Novice");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const [{ data: stu }, { data: res }, { data: stats }] = await Promise.all([
        supabase.from("prep_students").select("exam_type, level_per_subject").eq("user_id", user.id).limit(1),
        supabase.from("prep_results").select("subject, score, feedback, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("prep_player_stats").select("total_xp, current_level, best_streak").eq("user_id", user.id).maybeSingle(),
      ]);

      if (stu?.[0]) {
        setExamType(stu[0].exam_type ?? "");
        setLevels((stu[0].level_per_subject as Record<string, SubLevel>) ?? {});
      }
      setResults((res ?? []) as Result[]);
      setPlayerXP(stats?.total_xp ?? 0);
      setPlayerLevel(stats?.current_level ?? "Novice");
      setBestStreak(stats?.best_streak ?? 0);
      setLoading(false);
    }
    load();
  }, [router]);

  const level    = getLevel(playerXP);
  const nextLv   = getNextLevel(playerXP);
  const xpToNext = nextLv ? nextLv.min - playerXP : 0;
  const xpPct    = nextLv ? ((playerXP - level.min) / (nextLv.min - level.min)) * 100 : 100;

  const subjects   = Object.keys(levels);
  const completedDays = new Set(results.map(r => r.created_at?.slice(0, 10))).size;
  const bestSubj   = [...subjects].sort((a, b) => (levels[b]?.score ?? 0) - (levels[a]?.score ?? 0))[0];
  const weakSubj   = [...subjects].sort((a, b) => (levels[a]?.score ?? 0) - (levels[b]?.score ?? 0))[0];

  function avgScore(subj: string) {
    const sub = results.filter(r => r.subject === subj);
    return sub.length ? Math.round(sub.reduce((s, r) => s + r.score, 0) / sub.length) : 0;
  }

  function levelColor(l: string) {
    if (l === "Fort") return "bg-green-100 text-green-700";
    if (l === "Moyen") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

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

        {/* Level + XP card */}
        <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{level.emoji}</span>
              <div>
                <p className="text-white/80 text-xs font-semibold">Niveau actuel</p>
                <p className="text-xl font-black">{playerLevel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{playerXP} XP</p>
              <p className="text-white/70 text-xs">Streak max : 🔥{bestStreak}</p>
            </div>
          </div>
          {nextLv && (
            <>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(xpPct, 100)}%` }} />
              </div>
              <p className="text-white/70 text-xs mt-1">{xpToNext} XP pour {nextLv.emoji} {nextLv.label}</p>
            </>
          )}
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Examens",        value: results.length.toString(),  icon: "quiz",          color: "text-primary"   },
            { label: "Jours révisés",  value: completedDays.toString(),   icon: "calendar_today", color: "text-green-600" },
            { label: "XP total",       value: playerXP.toString(),        icon: "stars",         color: "text-yellow-600"},
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

        {/* Per-subject */}
        {subjects.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Par matière</h2>
            <div className="space-y-3">
              {subjects.map(subj => {
                const info = levels[subj];
                const avg  = avgScore(subj);
                return (
                  <div key={subj} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-on-surface">{subj}</p>
                      <div className="flex items-center gap-2">
                        {avg > 0 && <span className="text-xs text-on-surface-variant">Moy. examen: {avg}/20</span>}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${levelColor(info?.level ?? "Faible")}`}>
                          {info?.level ?? "Faible"}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${info?.score ?? 0}%`, backgroundColor: (info?.score ?? 0) >= 67 ? "#22c55e" : (info?.score ?? 0) >= 34 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Classement CTA */}
        <Link href="/prep/classement"
          className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-yellow-50 border-yellow-200 hover:border-yellow-400 transition-colors">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-on-surface text-sm">Voir mon classement</p>
            <p className="text-xs text-on-surface-variant">Top Sénégal · Par série · Par école</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto">arrow_forward_ios</span>
        </Link>

        {/* Recent exams */}
        {results.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Historique</h2>
            <div className="space-y-2">
              {results.slice(0, 15).map((r, i) => (
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
            <Link href="/prep/simulateur" className="inline-block mt-4 px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: "#FF6B00" }}>
              Passer un examen
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
