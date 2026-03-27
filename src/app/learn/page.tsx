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

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1a73e8]">GSN Learn</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tes parcours de formation personnalisés</p>
          </div>
          <Link
            href="/learn/onboarding"
            className="rounded-lg bg-[#1a73e8] text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            + Nouveau
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl p-10 shadow border border-blue-100 text-center">
            <p className="text-gray-600 mb-5">Tu n&apos;as pas encore de parcours de formation.</p>
            <Link
              href="/learn/onboarding"
              className="inline-block rounded-lg bg-[#1a73e8] text-white px-6 py-3 font-semibold hover:opacity-90"
            >
              Créer mon parcours avec l&apos;IA
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => {
              const weeks = getWeeksCount(course.modules);
              return (
                <Link
                  key={course.id}
                  href={`/learn/${course.id}`}
                  className="block bg-white rounded-xl p-5 shadow border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-bold text-[#1a73e8]">{course.title}</h2>
                      {weeks > 0 && (
                        <p className="text-sm text-gray-500 mt-0.5">{weeks} semaine{weeks > 1 ? "s" : ""} · {weeks * 3} modules</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {course.completed ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold rounded-full px-3 py-1">
                          🏆 {course.test_score}%
                        </span>
                      ) : (
                        <span className="text-[#1a73e8] text-sm font-semibold">Continuer →</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 shadow-[0_-4px_20px_rgba(26,115,232,0.08)]">
        <div className="max-w-4xl mx-auto grid grid-cols-5 text-sm">
          <Link href="/dashboard" className="py-3 text-center text-gray-600">Accueil</Link>
          <Link href="/learn" className="py-3 text-center text-[#1a73e8] font-semibold">Apprendre</Link>
          <Link href="/missions" className="py-3 text-center text-gray-600">Missions</Link>
          <Link href="/wallet" className="py-3 text-center text-gray-600">Wallet</Link>
          <Link href="/score" className="py-3 text-center text-gray-600">Score</Link>
        </div>
      </nav>
    </main>
  );
}
