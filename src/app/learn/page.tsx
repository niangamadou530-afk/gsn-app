"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string | number;
  title: string;
  modules: any[];
  completed?: boolean;
  test_score?: number;
};

const DOMAIN_COLORS = [
  "#005bbf", "#9c27b0", "#ff9800", "#4caf50", "#e91e63", "#009688",
];

function domainColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return DOMAIN_COLORS[Math.abs(hash) % DOMAIN_COLORS.length];
}

export default function LearnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }
    const { data, error } = await supabase
      .from("user_courses")
      .select("id, title, modules, completed, test_score")
      .eq("user_id", auth.user.id)
      .order("id", { ascending: false });
    if (!error && data) setCourses(data as Course[]);
    setLoading(false);
  }

  function getWeeksCount(modules: any[]): number {
    if (!Array.isArray(modules)) return 0;
    if (modules[0]?.week !== undefined) return modules.length;
    return 0;
  }

  function getDomain(title: string): string {
    return title.split("—")[0].trim();
  }

  function getDuration(title: string): string {
    const parts = title.split("—");
    return parts.length >= 3 ? parts[2].trim() : (parts[1]?.trim() ?? "");
  }

  return (
    <main className="min-h-screen bg-surface text-on-background pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-[0_4px_24px_rgba(25,28,35,0.04)]">
        <div className="flex justify-between items-center px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">school</span>
            <h1 className="text-xl font-bold tracking-tight text-primary">GSN Learn</h1>
          </div>
          <Link
            href="/learn/onboarding"
            className="flex items-center gap-1.5 bg-primary text-on-primary text-sm font-bold px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(0,91,191,0.25)] hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Nouveau
          </Link>
        </div>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto">

        {/* Hero header */}
        <section className="mb-8">
          <h2 className="text-[2.75rem] font-extrabold tracking-tight leading-tight text-on-background mb-1">
            GSN Learn
          </h2>
          <p className="text-on-surface-variant font-medium">Tes parcours de formation</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-surface-container-low rounded-xl p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">school</span>
            <p className="text-on-surface-variant font-medium mb-6">
              Tu n&apos;as pas encore de parcours de formation.
            </p>
            <Link
              href="/learn/onboarding"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-6 py-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Créer mon parcours avec l&apos;IA
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {courses.map((course) => {
              const weeks = getWeeksCount(course.modules);
              const color = domainColor(course.title);
              const domain = getDomain(course.title);
              const duration = getDuration(course.title);

              return (
                <Link
                  key={course.id}
                  href={`/learn/${course.id}`}
                  className="block bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(25,28,35,0.05)] overflow-hidden hover:shadow-[0_8px_32px_rgba(25,28,35,0.10)] transition-all active:scale-[0.99]"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {domain}
                      </span>
                      {duration && (
                        course.completed ? (
                          <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            Certifié <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                            {duration}
                          </span>
                        )
                      )}
                    </div>
                    <h3 className="text-base font-bold text-on-background mb-4">{course.title}</h3>
                    {weeks > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant">Modules</span>
                          <span style={{ color }}>{weeks * 3} modules</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: course.completed ? "100%" : "12%", backgroundColor: color }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-3.5 bg-surface-container-low flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        {course.completed ? "workspace_premium" : "schedule"}
                      </span>
                      {course.completed ? `Score : ${course.test_score}%` : `${weeks} semaine${weeks > 1 ? "s" : ""} · ${weeks * 3} modules`}
                    </span>
                    <button className="text-sm font-bold text-primary flex items-center gap-1 active:scale-95 transition-transform">
                      {course.completed ? "Voir le diplôme" : "Continuer"}
                      <span className="material-symbols-outlined text-[16px]">
                        {course.completed ? "open_in_new" : "arrow_forward"}
                      </span>
                    </button>
                  </div>
                </Link>
              );
            })}

            {/* Create new */}
            <div className="pt-2">
              <Link
                href="/learn/onboarding"
                className="w-full py-4 flex items-center justify-center gap-3 bg-surface-container-lowest border-2 border-dashed border-outline-variant text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors active:scale-[0.98] duration-200"
              >
                <span className="material-symbols-outlined">add_circle</span>
                + Créer un nouveau parcours
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)]">
        <div className="flex justify-around items-center pt-3 pb-6 px-4 max-w-2xl mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center text-outline hover:opacity-80 active:scale-90 transition-all">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] font-medium mt-0.5">Accueil</span>
          </Link>
          <Link href="/learn" className="flex flex-col items-center text-primary relative after:content-[''] after:w-1 after:h-1 after:bg-primary after:rounded-full after:mt-0.5 after:block hover:opacity-80 active:scale-90 transition-all">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="text-[10px] font-medium mt-0.5">Apprendre</span>
          </Link>
          <Link href="/missions" className="flex flex-col items-center text-outline hover:opacity-80 active:scale-90 transition-all">
            <span className="material-symbols-outlined">assignment</span>
            <span className="text-[10px] font-medium mt-0.5">Missions</span>
          </Link>
          <Link href="/wallet" className="flex flex-col items-center text-outline hover:opacity-80 active:scale-90 transition-all">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-[10px] font-medium mt-0.5">Wallet</span>
          </Link>
          <Link href="/score" className="flex flex-col items-center text-outline hover:opacity-80 active:scale-90 transition-all">
            <span className="material-symbols-outlined">stars</span>
            <span className="text-[10px] font-medium mt-0.5">Score</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
