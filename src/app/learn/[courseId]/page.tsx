"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Quiz = { question: string; options: string[]; answer: number };
type Module = { id: string; title: string; description: string; keywords: string[]; exercises: string; quiz: Quiz };
type Week = { week: number; title: string; objective: string; modules: Module[] };
type Course = { id: string; title: string; modules: Week[]; completed?: boolean; test_score?: number; modules_done?: string[] };

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [openWeek, setOpenWeek] = useState<number>(0);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useEffect(() => { load(); }, [courseId]);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }

    const { data, error } = await supabase
      .from("user_courses")
      .select("*")
      .eq("id", courseId)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !data) { router.replace("/learn"); return; }

    setCourse(data as Course);
    setDone(new Set(data.modules_done ?? []));
    setLoading(false);
  }

  async function markDone(modId: string) {
    const next = new Set(done);
    next.add(modId);
    setDone(next);
    await supabase
      .from("user_courses")
      .update({ modules_done: Array.from(next) })
      .eq("id", courseId);
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
  if (!course) return null;

  const weeks: Week[] = Array.isArray(course.modules) && (course.modules as any[])[0]?.week !== undefined
    ? course.modules
    : [];

  const totalMods = weeks.reduce((n, w) => n + w.modules.length, 0);
  const pct = totalMods > 0 ? Math.round((done.size / totalMods) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-28">
      <div className="max-w-3xl mx-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <Link href="/learn" className="text-sm text-blue-600 hover:underline">← Mes parcours</Link>
          <h1 className="text-2xl font-bold text-[#1a73e8] mt-2">{course.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-blue-600 w-10 text-right">{pct}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{done.size} / {totalMods} modules terminés</p>

          {course.completed && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-semibold">
              🏆 Certifié · Score {course.test_score}%
              <Link href={`/learn/${courseId}/certificate`} className="underline ml-1">Voir le certificat</Link>
            </div>
          )}
        </div>

        {/* Weeks */}
        <div className="space-y-3">
          {weeks.map((week, wi) => (
            <div key={wi} className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">

              {/* Week header */}
              <button
                onClick={() => setOpenWeek(openWeek === wi ? -1 : wi)}
                className="w-full p-4 flex items-start justify-between text-left hover:bg-blue-50 transition-colors gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Semaine {week.week}</span>
                  <p className="font-bold text-[#1a73e8]">{week.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{week.objective}</p>
                </div>
                <span className="text-gray-400 mt-1 shrink-0">{openWeek === wi ? "▲" : "▼"}</span>
              </button>

              {/* Modules */}
              {openWeek === wi && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {week.modules.map((mod, mi) => {
                    const modId = mod.id || `w${week.week}m${mi + 1}`;
                    const isDone = done.has(modId);
                    const isOpen = openModule === modId;

                    return (
                      <div key={mi} className={`${isDone ? "bg-green-50" : ""}`}>
                        {/* Module title row */}
                        <button
                          onClick={() => setOpenModule(isOpen ? null : modId)}
                          className="w-full p-4 flex items-center gap-3 text-left hover:bg-blue-50 transition-colors"
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDone ? "bg-green-500 text-white" : "bg-blue-100 text-blue-600"}`}>
                            {isDone ? "✓" : mi + 1}
                          </div>
                          <p className="flex-1 font-semibold text-sm">{mod.title}</p>
                          <span className="text-gray-400 text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
                        </button>

                        {/* Module detail */}
                        {isOpen && (
                          <div className="px-4 pb-5 pl-15 space-y-4" style={{ paddingLeft: "3.75rem" }}>

                            {/* Description */}
                            <p className="text-sm text-gray-700 leading-relaxed">{mod.description}</p>

                            {/* YouTube keywords */}
                            {mod.keywords?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ressources YouTube</p>
                                <div className="flex flex-wrap gap-2">
                                  {mod.keywords.map((kw, ki) => (
                                    <a
                                      key={ki}
                                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                    >
                                      ▶ {kw}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exercises */}
                            {mod.exercises && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Exercice pratique</p>
                                <p className="text-sm text-yellow-900">{mod.exercises}</p>
                              </div>
                            )}

                            {/* Quiz */}
                            {mod.quiz?.question && (
                              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Quiz de validation</p>
                                <p className="text-sm font-medium text-blue-900 mb-2">{mod.quiz.question}</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {mod.quiz.options?.map((opt, oi) => (
                                    <span
                                      key={oi}
                                      className={`text-xs px-2.5 py-1.5 rounded ${oi === mod.quiz.answer ? "bg-green-200 text-green-800 font-semibold" : "bg-white text-gray-500 border border-gray-100"}`}
                                    >
                                      {String.fromCharCode(65 + oi)}. {opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mark done */}
                            {!isDone && (
                              <button
                                onClick={() => markDone(modId)}
                                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
                              >
                                ✓ Marquer comme terminé
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final test CTA */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow border border-blue-100 text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Certification</p>
          <h3 className="font-bold text-lg text-[#1a73e8] mb-1">Test final certifié</h3>
          <p className="text-sm text-gray-500 mb-5">20 questions · Score minimum 70% · Certificat GSN</p>
          <Link
            href={`/learn/${courseId}/test`}
            className="inline-block rounded-lg bg-[#1a73e8] text-white px-8 py-3 font-semibold hover:opacity-90"
          >
            Passer le test →
          </Link>
        </div>
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
