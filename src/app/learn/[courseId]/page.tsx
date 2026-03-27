"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────

type QuizQ = { question: string; options: string[]; answer: number; explanation?: string };
type Section = { title: string; content: string };
type ModContent = { sections: Section[]; quiz: QuizQ[] };
type Module = {
  id: string; title: string; description: string;
  keywords: string[]; exercises: string;
  quiz: QuizQ | QuizQ[]; // original 1 or array from content
  content?: ModContent;
};
type Week = { week: number; title: string; objective: string; modules: Module[] };
type Course = {
  id: string; title: string; modules: Week[];
  completed?: boolean; test_score?: number;
  modules_done?: string[]; quiz_passed?: string[];
  exercises_submitted?: string[];
};
type YTVideo = { videoId: string; title: string; channel: string };
type ModPhase = "content" | "exercise" | "quiz" | "result";

// ── Helpers ─────────────────────────────────────────────────

function modId(w: Week, mi: number, m: Module): string {
  return m.id || `w${w.week}m${mi}`;
}

function flatIds(weeks: Week[]): string[] {
  return weeks.flatMap((w, _wi) => w.modules.map((m, mi) => modId(w, mi, m)));
}

function isAccessible(id: string, allIds: string[], passed: Set<string>): boolean {
  const idx = allIds.indexOf(id);
  if (idx <= 0) return true;
  return passed.has(allIds[idx - 1]);
}

// ── Component ────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizPassed, setQuizPassed] = useState<Set<string>>(new Set());
  const [exDone, setExDone] = useState<Set<string>>(new Set());

  const [openWeek, setOpenWeek] = useState(0);
  const [openMod, setOpenMod] = useState<string | null>(null);

  const [phases, setPhases] = useState<Record<string, ModPhase>>({});
  const [exText, setExText] = useState<Record<string, string>>({});
  const [mAnswers, setMAnswers] = useState<Record<string, Record<number, number>>>({});
  const [mSubmitted, setMSubmitted] = useState<Record<string, boolean>>({});
  const [mContent, setMContent] = useState<Record<string, ModContent>>({});
  const [mLoading, setMLoading] = useState<Set<string>>(new Set());
  const [yt, setYt] = useState<Record<string, YTVideo[]>>({});
  const [ytLoading, setYtLoading] = useState<Set<string>>(new Set());
  const [ytFallback, setYtFallback] = useState(false);

  useEffect(() => { load(); }, [courseId]);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }

    const { data, error } = await supabase
      .from("user_courses").select("*")
      .eq("id", courseId).eq("user_id", auth.user.id).single();

    if (error || !data) { router.replace("/learn"); return; }

    setCourse(data as Course);
    const passed = new Set<string>(data.quiz_passed ?? []);
    const exs = new Set<string>(data.exercises_submitted ?? []);
    setQuizPassed(passed);
    setExDone(exs);

    // Init phases + cached content
    const initialPhases: Record<string, ModPhase> = {};
    const initialContent: Record<string, ModContent> = {};
    const weeks: Week[] = Array.isArray(data.modules) ? data.modules : [];

    weeks.forEach((w: Week) => {
      w.modules.forEach((m: Module, mi: number) => {
        const id = modId(w, mi, m);
        if (passed.has(id)) initialPhases[id] = "result";
        else if (exs.has(id)) initialPhases[id] = "quiz";
        else initialPhases[id] = "content";
        if (m.content) initialContent[id] = m.content;
      });
    });
    setPhases(initialPhases);
    setMContent(initialContent);
    setLoading(false);
  }

  const loadContent = useCallback(async (id: string, m: Module, w: Week) => {
    if (mContent[id] || mLoading.has(id)) return;
    setMLoading(prev => new Set([...prev, id]));
    try {
      const domain = (course?.title ?? "Formation").split("—")[0].trim();
      const res = await fetch("/api/module-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleTitle: m.title, weekTitle: w.title, domain, description: m.description }),
      });
      const content: ModContent = await res.json();
      if (!res.ok) throw new Error((content as any).error);

      setMContent(prev => ({ ...prev, [id]: content }));

      // Persist content into the JSONB
      if (course) {
        const updatedModules = (course.modules as Week[]).map(wk => ({
          ...wk,
          modules: wk.modules.map((mod, mi2) => {
            const mid = modId(wk, mi2, mod);
            return mid === id ? { ...mod, content } : mod;
          }),
        }));
        await supabase.from("user_courses").update({ modules: updatedModules }).eq("id", courseId);
        setCourse(prev => prev ? { ...prev, modules: updatedModules } : prev);
      }
    } catch (e) { console.error("Content load error:", e); }
    finally {
      setMLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [course, courseId, mContent, mLoading]);

  const loadYT = useCallback(async (id: string, keywords: string[]) => {
    if (yt[id] !== undefined || ytLoading.has(id)) return;
    setYtLoading(prev => new Set([...prev, id]));
    try {
      const q = keywords.slice(0, 2).join(" ");
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setYt(prev => ({ ...prev, [id]: data.items ?? [] }));
      if (data.fallback) setYtFallback(true);
    } catch { setYt(prev => ({ ...prev, [id]: [] })); }
    finally {
      setYtLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [yt, ytLoading]);

  function toggleMod(id: string, m: Module, w: Week) {
    if (openMod === id) { setOpenMod(null); return; }
    setOpenMod(id);
    loadContent(id, m, w);
    loadYT(id, m.keywords ?? []);
  }

  async function submitExercise(id: string) {
    if (!(exText[id] ?? "").trim()) { alert("Écris ta réponse avant de valider."); return; }
    const next = new Set([...exDone, id]);
    setExDone(next);
    setPhases(prev => ({ ...prev, [id]: "quiz" }));
    await supabase.from("user_courses").update({ exercises_submitted: Array.from(next) }).eq("id", courseId);
  }

  function pickAnswer(modId: string, qi: number, oi: number) {
    if (mSubmitted[modId]) return;
    setMAnswers(prev => ({ ...prev, [modId]: { ...(prev[modId] ?? {}), [qi]: oi } }));
  }

  async function submitModQuiz(id: string, quiz: QuizQ[]) {
    const ans = mAnswers[id] ?? {};
    if (Object.keys(ans).length < quiz.length) {
      alert(`Réponds à toutes les ${quiz.length} questions avant de valider.`);
      return;
    }
    setMSubmitted(prev => ({ ...prev, [id]: true }));
    const correct = quiz.filter((q, i) => ans[i] === q.answer).length;
    const pct = Math.round((correct / quiz.length) * 100);
    const passed = pct >= 60;

    setPhases(prev => ({ ...prev, [id]: "result" }));

    if (passed) {
      const nextPassed = new Set([...quizPassed, id]);
      setQuizPassed(nextPassed);
      await supabase.from("user_courses").update({
        quiz_passed: Array.from(nextPassed),
        modules_done: Array.from(nextPassed),
      }).eq("id", courseId);
    }
  }

  function retryModQuiz(id: string) {
    setMSubmitted(prev => ({ ...prev, [id]: false }));
    setMAnswers(prev => ({ ...prev, [id]: {} }));
    setPhases(prev => ({ ...prev, [id]: "quiz" }));
  }

  // ── Render ────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
  if (!course) return null;

  const weeks: Week[] = Array.isArray(course.modules) && (course.modules as any[])[0]?.week !== undefined
    ? course.modules : [];
  const allIds = flatIds(weeks);
  const totalMods = allIds.length;
  const passedCount = quizPassed.size;
  const pct = totalMods > 0 ? Math.round((passedCount / totalMods) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-28">
      <div className="max-w-3xl mx-auto p-6">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link href="/learn" className="text-sm text-blue-600 hover:underline">← Mes parcours</Link>
          <h1 className="text-2xl font-bold text-[#1a73e8] mt-2">{course.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-blue-600 w-10 text-right">{pct}%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{passedCount} / {totalMods} modules validés</p>
          {course.completed && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-semibold">
              🏆 Certifié · {course.test_score}%
              <Link href={`/learn/${courseId}/certificate`} className="underline ml-1">Voir le certificat</Link>
            </div>
          )}
        </div>

        {/* ── Weeks ── */}
        <div className="space-y-3">
          {weeks.map((w, wi) => (
            <div key={wi} className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">

              {/* Week header */}
              <button
                onClick={() => setOpenWeek(openWeek === wi ? -1 : wi)}
                className="w-full p-4 flex items-start justify-between text-left hover:bg-blue-50 transition-colors gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Semaine {w.week}</span>
                  <p className="font-bold text-[#1a73e8] leading-snug">{w.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{w.objective}</p>
                </div>
                <span className="text-gray-400 shrink-0 mt-1">{openWeek === wi ? "▲" : "▼"}</span>
              </button>

              {/* Modules */}
              {openWeek === wi && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {w.modules.map((m, mi) => {
                    const id = modId(w, mi, m);
                    const accessible = isAccessible(id, allIds, quizPassed);
                    const isPassed = quizPassed.has(id);
                    const isOpen = openMod === id;
                    const phase = phases[id] ?? "content";
                    const content = mContent[id];
                    const isLoadingContent = mLoading.has(id);
                    const quiz: QuizQ[] = content?.quiz ?? (Array.isArray(m.quiz) ? m.quiz : m.quiz ? [m.quiz as QuizQ] : []);
                    const ans = mAnswers[id] ?? {};
                    const isSubmitted = mSubmitted[id] ?? false;

                    return (
                      <div key={mi} className={`${isPassed ? "bg-green-50" : !accessible ? "bg-gray-50 opacity-60" : ""}`}>

                        {/* Module title row */}
                        <button
                          onClick={() => accessible && toggleMod(id, m, w)}
                          disabled={!accessible}
                          className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${accessible ? "hover:bg-blue-50 cursor-pointer" : "cursor-not-allowed"}`}
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isPassed ? "bg-green-500 text-white" : !accessible ? "bg-gray-300 text-gray-500" : "bg-blue-100 text-blue-600"}`}>
                            {!accessible ? "🔒" : isPassed ? "✓" : mi + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{m.title}</p>
                            {!accessible && <p className="text-xs text-gray-400 mt-0.5">Valide le module précédent pour débloquer</p>}
                            {isPassed && <p className="text-xs text-green-600 mt-0.5">Quiz validé ✓</p>}
                          </div>
                          {accessible && <span className="text-gray-400 text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>}
                        </button>

                        {/* Module detail panel */}
                        {isOpen && (
                          <div className="px-4 pb-6 border-t border-blue-50 pt-4 space-y-5">

                            {/* ─── PHASE: CONTENT ─── */}
                            {phase === "content" && (
                              <>
                                {isLoadingContent ? (
                                  <div className="flex items-center gap-3 text-blue-600">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                                    <span className="text-sm">Chargement du contenu détaillé…</span>
                                  </div>
                                ) : content?.sections ? (
                                  <div className="space-y-5">
                                    {content.sections.map((sec, si) => (
                                      <div key={si} className="border-l-4 border-blue-200 pl-4">
                                        <h4 className="font-bold text-[#1a73e8] mb-2">{sec.title}</h4>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{sec.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-700 leading-relaxed">{m.description}</p>
                                )}

                                {/* YouTube */}
                                {(m.keywords?.length > 0) && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ressources vidéo</p>
                                    {ytLoading.has(id) ? (
                                      <p className="text-sm text-gray-400">Chargement des vidéos…</p>
                                    ) : yt[id]?.length > 0 && !ytFallback ? (
                                      <div className="space-y-3">
                                        {yt[id].map((v, vi) => (
                                          <div key={vi} className="rounded-xl overflow-hidden bg-black">
                                            <div className="relative" style={{ paddingBottom: "56.25%" }}>
                                              <iframe
                                                src={`https://www.youtube.com/embed/${v.videoId}`}
                                                title={v.title}
                                                className="absolute inset-0 w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                              />
                                            </div>
                                            <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50">{v.title}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {m.keywords.map((kw, ki) => (
                                          <a key={ki} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                            ▶ {kw}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <button
                                  onClick={() => setPhases(prev => ({ ...prev, [id]: "exercise" }))}
                                  className="w-full py-3 bg-[#1a73e8] text-white rounded-lg font-semibold text-sm hover:opacity-90"
                                >
                                  J&apos;ai lu ce module → Passer à l&apos;exercice
                                </button>
                              </>
                            )}

                            {/* ─── PHASE: EXERCISE ─── */}
                            {phase === "exercise" && (
                              <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                  <p className="text-xs font-bold text-yellow-700 uppercase mb-2">Exercice pratique</p>
                                  <p className="text-sm text-yellow-900 font-medium leading-relaxed">{m.exercises || "Applique les concepts du module dans un exercice pratique. Décris ta démarche, les étapes que tu as suivies et ce que tu as appris."}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Ta réponse</label>
                                  <textarea
                                    value={exText[id] ?? ""}
                                    onChange={e => setExText(prev => ({ ...prev, [id]: e.target.value }))}
                                    rows={6}
                                    placeholder="Décris ta démarche, ce que tu as fait, ce que tu as appris…"
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-400 outline-none resize-none"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => setPhases(prev => ({ ...prev, [id]: "content" }))}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50">
                                    ← Relire le module
                                  </button>
                                  <button onClick={() => submitExercise(id)}
                                    className="flex-1 py-2.5 bg-[#1a73e8] text-white rounded-lg font-semibold text-sm hover:opacity-90">
                                    Valider l&apos;exercice →
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ─── PHASE: QUIZ ─── */}
                            {phase === "quiz" && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Quiz de validation · {quiz.length} questions · Score minimum 60%</p>
                                  {!isSubmitted && <p className="text-xs text-gray-400">{Object.keys(ans).length}/{quiz.length} réponses</p>}
                                </div>

                                {quiz.map((q, qi) => {
                                  const userAns = ans[qi];
                                  return (
                                    <div key={qi} className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                                      <p className="font-semibold text-sm mb-3 leading-relaxed">
                                        <span className="text-blue-600 font-bold">Q{qi + 1}. </span>{q.question}
                                      </p>
                                      <div className="space-y-2">
                                        {q.options.map((opt, oi) => {
                                          let cls = "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ";
                                          if (!isSubmitted) {
                                            cls += userAns === oi ? "border-blue-500 bg-blue-50 font-semibold" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
                                          } else {
                                            if (oi === q.answer) cls += "border-green-500 bg-green-50 text-green-800 font-semibold";
                                            else if (userAns === oi) cls += "border-red-300 bg-red-50 text-red-700";
                                            else cls += "border-gray-100 text-gray-400";
                                          }
                                          return (
                                            <button key={oi} className={cls} onClick={() => pickAnswer(id, qi, oi)} disabled={isSubmitted}>
                                              <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {isSubmitted && q.explanation && (
                                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">💡 {q.explanation}</p>
                                      )}
                                    </div>
                                  );
                                })}

                                {!isSubmitted ? (
                                  <button onClick={() => submitModQuiz(id, quiz)}
                                    className="w-full py-3 bg-[#1a73e8] text-white rounded-lg font-semibold text-sm hover:opacity-90">
                                    Valider le quiz
                                  </button>
                                ) : (() => {
                                  const correct = quiz.filter((q, i) => ans[i] === q.answer).length;
                                  const scorePct = Math.round((correct / quiz.length) * 100);
                                  const passed = scorePct >= 60;
                                  return (
                                    <div className={`rounded-xl p-4 text-center ${passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                                      <p className={`text-2xl font-black mb-1 ${passed ? "text-green-600" : "text-red-500"}`}>{scorePct}%</p>
                                      <p className="font-semibold text-sm mb-1">{passed ? "Module validé ! ✓" : "Score insuffisant"}</p>
                                      <p className="text-xs text-gray-500 mb-3">{correct}/{quiz.length} bonnes réponses · {passed ? "Module suivant débloqué" : "60% requis pour valider"}</p>
                                      {!passed && (
                                        <button onClick={() => retryModQuiz(id)} className="rounded-lg bg-[#1a73e8] text-white px-5 py-2 text-sm font-semibold hover:opacity-90">
                                          Réessayer le quiz
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* ─── PHASE: RESULT (passed) ─── */}
                            {phase === "result" && (
                              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">✅</div>
                                <p className="font-bold text-green-700">Module validé</p>
                                <p className="text-xs text-gray-500 mt-1">Quiz réussi · Module suivant débloqué</p>
                                <button onClick={() => retryModQuiz(id)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline">
                                  Repasser le quiz
                                </button>
                              </div>
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

        {/* ── Final test CTA ── */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow border border-blue-100 text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Certification</p>
          <h3 className="font-bold text-lg text-[#1a73e8] mb-1">Test final certifié</h3>
          <p className="text-sm text-gray-500 mb-2">20 questions · Score minimum 70% · Certificat GSN</p>
          {passedCount < totalMods && totalMods > 0 && (
            <p className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2 mb-4 inline-block">
              {passedCount}/{totalMods} modules validés — complète tous les modules pour accéder au test
            </p>
          )}
          <div className="block">
            <Link href={`/learn/${courseId}/test`} className="inline-block rounded-lg bg-[#1a73e8] text-white px-8 py-3 font-semibold hover:opacity-90">
              Passer le test →
            </Link>
          </div>
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
