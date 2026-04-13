"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadOffline, saveOffline } from "@/lib/offline";

type ChapterStat = {
  frequency_score: number;
  last_appeared: number;
  probability: string;
  tip?: string;
};

type SubjectDay = {
  name: string;
  duration_minutes: number;
  priority: "haute" | "moyenne" | "faible";
  topics: string[];
  exercises: string[];
};

type DayProgram = {
  day: number;
  date: string;
  subjects: SubjectDay[];
  total_hours: number;
};

type Program = {
  total_days: number;
  daily_program: DayProgram[];
  weekly_goals: string[];
  key_advice: string[];
  chapter_stats?: Record<string, ChapterStat>;
};

type Student = {
  exam_type: string;
  serie: string | null;
  level_per_subject: Record<string, { level: string; score: number }>;
  country: string;
};

function freqIcon(score: number): string {
  if (score > 15) return "🔥";
  if (score >= 10) return "⭐";
  return "📚";
}

export default function PrepDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [examDate, setExamDate] = useState("");
  const [userName, setUserName] = useState("Élève");
  const [loading, setLoading] = useState(true);
  const [doneSubjects, setDoneSubjects] = useState<Set<string>>(new Set());
  const [offline, setOffline] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const offlineStudent = loadOffline<Student>("student_" + user.id);
    const offlineProgram = loadOffline<Program>("program_" + user.id);
    if (offlineStudent && offlineProgram) {
      setStudent(offlineStudent as unknown as Student);
      setProgram(offlineProgram);
      setOffline(true);
    }

    const { data: profile } = await supabase.from("users").select("name").eq("id", user.id).single();
    setUserName(profile?.name?.split(" ")[0] ?? "Élève");

    const { data: stu } = await supabase.from("prep_students").select("*").eq("user_id", user.id).limit(1);
    const { data: prog } = await supabase.from("prep_programs").select("*").eq("user_id", user.id).limit(1);

    if (!stu?.[0] || !prog?.[0]) {
      router.replace("/prep/onboarding");
      return;
    }

    setStudent(stu[0] as Student);
    setProgram(prog[0].program as Program);
    setExamDate(prog[0].exam_date ?? "");
    setOffline(false);

    saveOffline("student_" + user.id, stu[0]);
    saveOffline("program_" + user.id, prog[0].program);
    setLoading(false);
  }

  function daysLeft(): number {
    if (!examDate) return 0;
    return Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
  }

  function todayProgram(): DayProgram | null {
    if (!program) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    return program.daily_program.find(d => d.date === todayStr) ?? program.daily_program[0] ?? null;
  }

  function priorityColor(p: string) {
    if (p === "haute") return "text-red-600 bg-red-50";
    if (p === "moyenne") return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  }

  function levelColor(l: string) {
    if (l === "Fort") return "bg-green-100 text-green-700";
    if (l === "Moyen") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  }

  const today = todayProgram();
  const dl = daysLeft();

  if (loading && !student) return (
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
        <div className="flex items-center gap-2">
          {offline && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Hors-ligne</span>}
          <Link href="/dashboard" className="text-xs text-on-surface-variant hover:text-on-surface font-medium">← GSN</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

        {/* Greeting + countdown */}
        <section className="space-y-3">
          <div>
            <p className="text-sm text-on-surface-variant font-medium">Tableau de bord</p>
            <h1 className="text-2xl font-extrabold text-on-surface">Bonjour, <span className="text-primary">{userName} 👋</span></h1>
          </div>
          <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #FF6B00, #FF8C40)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Compte à rebours</p>
                <p className="text-4xl font-black">J-{dl}</p>
                <p className="text-white/90 text-sm font-semibold mt-0.5">
                  avant le {student?.exam_type}{student?.serie ? " série " + student.serie : ""}
                </p>
              </div>
              <span className="material-symbols-outlined text-[56px] text-white/30" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            </div>
            {examDate && (
              <p className="text-white/70 text-xs mt-2">
                {new Date(examDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </section>

        {/* Today's program */}
        {today && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Programme d&apos;aujourd&apos;hui</h2>
              <span className="text-xs text-on-surface-variant font-medium">{today.total_hours}h prévues</span>
            </div>
            <div className="space-y-2">
              {today.subjects.map((s, i) => (
                <div key={i} className={`bg-surface-container-lowest rounded-2xl p-4 shadow-sm transition-opacity ${doneSubjects.has(s.name) ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-on-surface">{s.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityColor(s.priority)}`}>{s.priority}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium">{s.duration_minutes} min</p>
                      {s.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.topics.map((t, j) => {
                            const stat = program?.chapter_stats?.[t];
                            const icon = stat ? freqIcon(stat.frequency_score) : null;
                            const isExpanded = expandedTopic === `${i}-${j}`;
                            return (
                              <div key={j} className="flex flex-col">
                                <button
                                  onClick={() => setExpandedTopic(isExpanded ? null : `${i}-${j}`)}
                                  className="text-[11px] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-surface-container transition-colors">
                                  {icon && <span>{icon}</span>}
                                  <span>{t}</span>
                                  {stat && <span className="text-[9px] text-outline">{stat.frequency_score}x</span>}
                                </button>
                                {isExpanded && stat && (
                                  <div className="mt-1 p-2 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-900 leading-relaxed max-w-xs">
                                    <span className="font-bold">{stat.probability}</span> · Dernière fois : {stat.last_appeared}<br />
                                    {stat.tip && <span className="italic">{stat.tip}</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setDoneSubjects(p => { const n = new Set(p); n.has(s.name) ? n.delete(s.name) : n.add(s.name); return n; })}
                      className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${doneSubjects.has(s.name) ? "border-green-500 bg-green-500" : "border-outline-variant/40 hover:border-primary"}`}>
                      {doneSubjects.has(s.name) && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick access — 6 items */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-on-surface">Accès rapide</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/prep/resumeur",    icon: "auto_stories",    label: "Résumeur",    desc: "Cours → résumé IA",     color: "text-orange-500", bg: "bg-orange-50" },
              { href: "/prep/flashcards",  icon: "style",           label: "Flashcards",  desc: "Mémorisation active",   color: "text-purple-600", bg: "bg-purple-50" },
              { href: "/prep/simulateur",  icon: "quiz",            label: "Examen",      desc: "Examen blanc",          color: "text-blue-600",   bg: "bg-blue-50" },
              { href: "/prep/bibliotheque",icon: "library_books",   label: "Épreuves",    desc: "Corrigés & sujets",     color: "text-primary",    bg: "bg-primary/5" },
              { href: "/prep/soft-skills", icon: "self_improvement",label: "Stress",      desc: "Méthodes & Pomodoro",   color: "text-red-500",    bg: "bg-red-50" },
              { href: "/prep/progression", icon: "trending_up",     label: "Progrès",     desc: "Statistiques",          color: "text-green-600",  bg: "bg-green-50" },
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

        {/* Levels per subject */}
        {student?.level_per_subject && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Progression par matière</h2>
            <div className="space-y-2">
              {Object.entries(student.level_per_subject).map(([subj, info]) => (
                <div key={subj} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-on-surface flex-1">{subj}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${info.score}%` }} />
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${levelColor(info.level)}`}>{info.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key advice */}
        {program?.key_advice && program.key_advice.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Conseils clés de l&apos;IA</h2>
            <div className="space-y-2">
              {program.key_advice.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                  <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                  <p className="text-sm text-on-surface-variant">{tip}</p>
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
            <p className="font-bold text-on-surface text-sm">Orientation après l&apos;examen</p>
            <p className="text-xs text-on-surface-variant">Lycées recommandés · Parcours GSN Learn</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto">arrow_forward_ios</span>
        </Link>

      </div>

      {/* Bottom nav — 5 items */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur border-t border-outline-variant/20 flex justify-around items-center px-2 pb-6 pt-3">
        <Link href="/prep/dashboard" className="flex flex-col items-center active:scale-90 transition-transform" style={{ color: "#FF6B00" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/prep/resumeur" className="flex flex-col items-center text-orange-500 active:scale-90 transition-transform">
          <span className="material-symbols-outlined">auto_stories</span>
          <span className="text-[10px] font-medium mt-0.5">Résumeur</span>
        </Link>
        <Link href="/prep/flashcards" className="flex flex-col items-center active:scale-90 transition-transform" style={{ color: "#7C3AED" }}>
          <span className="material-symbols-outlined">style</span>
          <span className="text-[10px] font-medium mt-0.5">Flashcards</span>
        </Link>
        <Link href="/prep/simulateur" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">quiz</span>
          <span className="text-[10px] font-medium mt-0.5">Examen</span>
        </Link>
        <Link href="/prep/progression" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">trending_up</span>
          <span className="text-[10px] font-medium mt-0.5">Progrès</span>
        </Link>
      </nav>
    </main>
  );
}
