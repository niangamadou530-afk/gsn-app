"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BAC_DATE = "2026-06-30";

type SubjectLevel = { level: string; score: number };

type Student = {
  exam_type: string;
  serie: string | null;
  level_per_subject: Record<string, SubjectLevel>;
  positioning_done?: boolean;
};

function daysUntilBAC(): number {
  return Math.max(0, Math.ceil((new Date(BAC_DATE).getTime() - Date.now()) / 86400000));
}

export default function PrepDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [userName, setUserName] = useState("Élève");
  const [playerXP, setPlayerXP] = useState(0);
  const [playerLevel, setPlayerLevel] = useState("Novice");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const [{ data: profile }, { data: stu }, { data: stats }] = await Promise.all([
      supabase.from("users").select("name").eq("id", user.id).single(),
      supabase.from("prep_students").select("*").eq("user_id", user.id).limit(1),
      supabase.from("prep_player_stats").select("total_xp, current_level").eq("user_id", user.id).maybeSingle(),
    ]);

    setUserName(profile?.name?.split(" ")[0] ?? "Élève");

    if (!stu?.[0]) { router.replace("/prep/onboarding"); return; }

    setStudent(stu[0] as Student);
    setPlayerXP(stats?.total_xp ?? 0);
    setPlayerLevel(stats?.current_level ?? "Novice");
    setLoading(false);
  }

  const dl = daysUntilBAC();

  function levelEmoji(l: string) {
    const map: Record<string, string> = {
      "Maître BAC": "👑", "Brillant": "💎", "Expert": "🔥",
      "Confirmé": "⭐", "Apprenti": "📚", "Novice": "🌱",
    };
    return map[l] ?? "🌱";
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

      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">GSN</span>
          <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#FF6B00" }}>PREP</span>
        </div>
        <Link href="/dashboard" className="text-xs text-on-surface-variant hover:text-on-surface font-medium">← GSN</Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

        {/* Greeting + BAC countdown */}
        <section className="space-y-3">
          <div>
            <p className="text-sm text-on-surface-variant font-medium">Tableau de bord</p>
            <h1 className="text-2xl font-extrabold text-on-surface">Bonjour, <span className="text-primary">{userName} 👋</span></h1>
          </div>
          <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #FF6B00, #FF8C40)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">BAC — 30 juin 2026</p>
                <p className="text-4xl font-black">J-{dl}</p>
                <p className="text-white/90 text-sm font-semibold mt-0.5">
                  {student?.exam_type}{student?.serie ? " série " + student.serie : ""}
                </p>
              </div>
              <span className="material-symbols-outlined text-[56px] text-white/30" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            </div>
          </div>
        </section>

        {/* XP card */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-2xl">
              {levelEmoji(playerLevel)}
            </div>
            <div>
              <p className="font-black text-on-surface">{playerLevel}</p>
              <p className="text-xs text-on-surface-variant">{playerXP} XP accumulés</p>
            </div>
          </div>
          <Link href="/prep/classement"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Classement
            <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
          </Link>
        </section>

        {/* Quiz IA CTA */}
        <Link href="/prep/quiz"
          className="flex items-center gap-4 p-4 rounded-2xl shadow-sm text-white"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div className="flex-1">
            <p className="font-black text-white">Quiz IA adaptatif</p>
            <p className="text-white/80 text-xs mt-0.5">
              {student?.positioning_done ? "Continuer mes révisions" : "Commencer le quiz de positionnement"}
            </p>
          </div>
          <span className="material-symbols-outlined text-white/70">arrow_forward_ios</span>
        </Link>

        {/* Boîte à outils */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-on-surface">Boîte à outils</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/prep/resumeur",    icon: "auto_stories",    label: "Résumeur",         desc: "Cours → résumé IA",    color: "text-orange-500", bg: "bg-orange-50" },
              { href: "/prep/flashcards",  icon: "style",           label: "Flashcards",       desc: "Mémorisation active",  color: "text-purple-600", bg: "bg-purple-50" },
              { href: "/prep/programme",   icon: "calendar_month",  label: "Programme",        desc: "Plan de révision",     color: "text-blue-600",   bg: "bg-blue-50"   },
              { href: "/prep/soft-skills", icon: "self_improvement",label: "Bien-être",        desc: "Stress & Pomodoro",    color: "text-red-500",    bg: "bg-red-50"    },
              { href: "/prep/bibliotheque",icon: "library_books",   label: "Épreuves",         desc: "Sujets & corrigés",    color: "text-primary",    bg: "bg-primary/5" },
              { href: "/prep/classement",  icon: "emoji_events",    label: "Classement",       desc: "Top Sénégal",          color: "text-yellow-600", bg: "bg-yellow-50" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm hover:shadow-md transition-all active:scale-[0.97] space-y-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg}`}>
                  <span className={`material-symbols-outlined text-[20px] ${item.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-xs">{item.label}</p>
                  <p className="text-[10px] text-on-surface-variant leading-tight">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Progression par matière */}
        {student?.level_per_subject && Object.keys(student.level_per_subject).length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Mes matières</h2>
              <Link href="/prep/programme" className="text-xs text-primary font-bold hover:underline">Voir programme →</Link>
            </div>
            <div className="space-y-2">
              {Object.entries(student.level_per_subject).map(([subj, info]) => (
                <div key={subj} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-on-surface flex-1">{subj}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${info.score}%`, backgroundColor: info.score >= 67 ? "#22c55e" : info.score >= 34 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${levelColor(info.level)}`}>{info.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Orientation CTA */}
        <Link href="/prep/orientation"
          className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-primary/5 border-primary/20 hover:border-primary transition-colors">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          <div>
            <p className="font-bold text-on-surface text-sm">Orientation après le BAC</p>
            <p className="text-xs text-on-surface-variant">Upload ton relevé · Universités sénégalaises · GSN Learn</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto">arrow_forward_ios</span>
        </Link>

      </div>
    </main>
  );
}
