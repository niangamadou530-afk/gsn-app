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
  quiz: QuizQ | QuizQ[];
  content?: ModContent;
};
type Week = { week: number; title: string; objective: string; modules: Module[] };
type Course = {
  id: string; title: string; modules: Week[];
  completed?: boolean; test_score?: number;
  modules_done?: string[]; quiz_passed?: string[];
  exercises_submitted?: string[];
  modules_progress?: Record<string, string>;
};
type YTVideo = { videoId: string; title: string; channel: string };
type ModPhase = "content" | "exercise" | "quiz" | "result";

// ── Helpers ─────────────────────────────────────────────────

function modId(w: Week, mi: number, m: Module): string {
  return m.id || `w${w.week}m${mi}`;
}

function flatIds(weeks: Week[]): string[] {
  return weeks.flatMap((w) => w.modules.map((m, mi) => modId(w, mi, m)));
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
  const [userId, setUserId] = useState<string>("");
  const [quizPassed, setQuizPassed] = useState<Set<string>>(new Set());
  const [exDone, setExDone] = useState<Set<string>>(new Set());

  const [openWeek, setOpenWeek] = useState(0);
  const [openMod, setOpenMod] = useState<string | null>(null);

  const [phases, setPhases] = useState<Record<string, ModPhase>>({});
  const [exText, setExText] = useState<Record<string, string>>({});
  const [exFile, setExFile] = useState<Record<string, { name: string } | null>>({});
  const [mAnswers, setMAnswers] = useState<Record<string, Record<number, number>>>({});
  const [mSubmitted, setMSubmitted] = useState<Record<string, boolean>>({});
  const [mContent, setMContent] = useState<Record<string, ModContent>>({});
  const [mLoading, setMLoading] = useState<Set<string>>(new Set());
  const [yt, setYt] = useState<Record<string, YTVideo[]>>({});
  const [ytLoading, setYtLoading] = useState<Set<string>>(new Set());
  const [ytFallbackSet, setYtFallbackSet] = useState<Set<string>>(new Set());
  const [qIdx, setQIdx] = useState<Record<string, number>>({});

  useEffect(() => { load(); }, [courseId]);

  async function load() {
    console.log("=== LOAD START ===");
    console.log("courseId:", courseId);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }
    console.log("userId:", auth.user.id);
    setUserId(auth.user.id);

    const { data, error } = await supabase
      .from("user_courses").select("*")
      .eq("id", courseId).eq("user_id", auth.user.id).single();

    console.log("raw supabase data:", data);
    console.log("supabase error:", error);

    if (error || !data) { router.replace("/learn"); return; }

    console.log("modules_done from DB:", data?.modules_done);
    console.log("quiz_passed from DB:", data?.quiz_passed);
    console.log("modules_progress from DB:", data?.modules_progress);
    console.log("exercises_submitted from DB:", data?.exercises_submitted);

    setCourse(data as Course);

    // ── Rebuild progression from ALL available DB sources ──────────────
    const quizPassedArr: string[] = Array.isArray(data.quiz_passed) ? data.quiz_passed : [];
    const modulesDoneArr: string[] = Array.isArray(data.modules_done) ? data.modules_done : [];
    const exsArr: string[] = Array.isArray(data.exercises_submitted) ? data.exercises_submitted : [];
    const progress: Record<string, string> = (data.modules_progress && typeof data.modules_progress === "object")
      ? data.modules_progress
      : {};

    // Merge quiz_passed + modules_done → maximum coverage
    const passed = new Set<string>([...quizPassedArr, ...modulesDoneArr]);

    // Also absorb any "passed" entries from modules_progress
    for (const [id, val] of Object.entries(progress)) {
      if (val === "passed") passed.add(id);
    }

    const exs = new Set<string>([
      ...exsArr,
      ...Object.entries(progress).filter(([, v]) => v === "exercise_done").map(([k]) => k),
    ]);

    const initialPhases: Record<string, ModPhase> = {};
    const initialContent: Record<string, ModContent> = {};
    const weeks: Week[] = Array.isArray(data.modules) ? data.modules : [];

    // Compute ALL module IDs from current modules structure
    const allComputedIds: string[] = [];
    weeks.forEach((w: Week) => {
      w.modules.forEach((m: Module, mi: number) => {
        const id = modId(w, mi, m);
        allComputedIds.push(id);
        if (passed.has(id)) {
          initialPhases[id] = "result";
        } else if (exs.has(id)) {
          initialPhases[id] = "quiz";
        } else {
          initialPhases[id] = "content";
        }
        if (m.content) initialContent[id] = m.content;
      });
    });

    console.log("=== STATE AFTER LOAD ===");
    console.log("all computed module IDs:", allComputedIds);
    console.log("passed Set (merged):", [...passed]);
    console.log("exs Set:", [...exs]);
    console.log("moduleStates (phases):", initialPhases);
    console.log("IDs in modules_done NOT in computed:", modulesDoneArr.filter(id => !allComputedIds.includes(id)));
    console.log("IDs in computed that ARE passed:", allComputedIds.filter(id => passed.has(id)));

    // Set ALL state together after computing everything
    setQuizPassed(new Set(passed));
    setExDone(new Set(exs));
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
      const items = data.items ?? [];
      setYt(prev => ({ ...prev, [id]: items }));
      if (data.fallback || items.length === 0) {
        setYtFallbackSet(prev => new Set([...prev, id]));
      }
    } catch {
      setYt(prev => ({ ...prev, [id]: [] }));
      setYtFallbackSet(prev => new Set([...prev, id]));
    } finally {
      setYtLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [yt, ytLoading]);

  function goToPhase(id: string, phase: ModPhase) {
    setPhases(prev => ({ ...prev, [id]: phase }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleMod(id: string, m: Module, w: Week) {
    if (openMod === id) { setOpenMod(null); return; }
    setOpenMod(id);
    loadContent(id, m, w);
    loadYT(id, m.keywords ?? []);
  }

  async function submitExercise(id: string) {
    const hasText = (exText[id] ?? "").trim().length > 0;
    const hasFile = !!exFile[id];
    if (!hasText && !hasFile) {
      alert("Écris ta réponse ou joins un fichier avant de valider.");
      return;
    }
    const next = new Set([...exDone, id]);
    setExDone(next);
    goToPhase(id, "quiz");

    const exArr = Array.from(next);
    console.log('[submitExercise] saving exercises_submitted:', exArr);

    // Save exercises_submitted with user_id filter for RLS
    const { data: saveData, error: err1 } = await supabase.from("user_courses").update({
      exercises_submitted: exArr,
    }).eq("id", courseId).eq("user_id", userId).select();
    console.log('[submitExercise] SAVE RESULT:', saveData, 'ERROR:', err1);
    if (err1) console.error('[submitExercise] CRITICAL save error:', err1.message, err1.code);
    else console.log('[submitExercise] exercises_submitted saved OK — rows affected:', saveData?.length);

    // Save modules_progress separately (non-critical)
    const updatedProgress = { ...(course?.modules_progress ?? {}), [id]: "exercise_done" };
    setCourse(prev => prev ? { ...prev, modules_progress: updatedProgress } : prev);
    supabase.from("user_courses").update({ modules_progress: updatedProgress })
      .eq("id", courseId).eq("user_id", userId)
      .then(({ error: e }) => { if (e) console.warn('[submitExercise] modules_progress not saved:', e.message); });
  }

  function pickAnswer(mid: string, qi: number, oi: number) {
    if (mSubmitted[mid]) return;
    setMAnswers(prev => ({ ...prev, [mid]: { ...(prev[mid] ?? {}), [qi]: oi } }));
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

    if (passed) {
      const nextPassed = new Set([...quizPassed, id]);
      setQuizPassed(nextPassed);
      goToPhase(id, "result");

      const passedArr = Array.from(nextPassed);
      console.log('[submitModQuiz] saving — courseId:', courseId, 'userId:', userId, 'passedArr:', passedArr);

      // Save quiz_passed + modules_done with user_id filter for RLS
      const { data: saveData, error: err1 } = await supabase.from("user_courses").update({
        quiz_passed: passedArr,
        modules_done: passedArr,
      }).eq("id", courseId).eq("user_id", userId).select();

      console.log("SAVE RESULT:", saveData, "ERROR:", err1);

      if (err1) {
        console.error('[submitModQuiz] CRITICAL save error:', err1.message, err1.code, err1.details);
      } else {
        console.log('[submitModQuiz] quiz_passed saved OK — rows affected:', saveData?.length);
      }

      // Save modules_progress separately (column may not exist yet — non-critical)
      const updatedProgress = { ...(course?.modules_progress ?? {}), [id]: "passed" };
      setCourse(prev => prev ? { ...prev, modules_progress: updatedProgress } : prev);
      supabase.from("user_courses").update({ modules_progress: updatedProgress })
        .eq("id", courseId).eq("user_id", userId)
        .then(({ error: e }) => { if (e) console.warn('[submitModQuiz] modules_progress not saved:', e.message); });
    }
    // On failure: stay in "quiz" phase, isSubmitted=true shows score + retry
  }

  function retryModQuiz(id: string) {
    setMSubmitted(prev => ({ ...prev, [id]: false }));
    setMAnswers(prev => ({ ...prev, [id]: {} }));
    setQIdx(prev => ({ ...prev, [id]: 0 }));
    setPhases(prev => ({ ...prev, [id]: "quiz" }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Render ────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
    <main className="min-h-screen bg-surface text-on-surface pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 flex justify-between items-center px-6 py-4">
        <Link href="/learn" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <span className="text-base font-bold text-primary truncate max-w-[160px]">{course.title.split("—")[0].trim()}</span>
        <span className="text-sm font-bold text-primary">{pct}%</span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="space-y-3">
          <h1 className="text-xl font-extrabold text-on-surface leading-snug">{course.title}</h1>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-on-surface-variant">{passedCount} / {totalMods} modules validés</span>
              <span className="text-primary">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {course.completed && (
            <Link href={`/learn/${courseId}/certificate`}
              className="inline-flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-full px-4 py-1.5 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              Certifié · {course.test_score}% · Voir le certificat
            </Link>
          )}
        </div>

        {/* ── Weeks ── */}
        <div className="space-y-3">
          {weeks.map((w, wi) => (
            <div key={wi} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">

              {/* Week header */}
              <button
                onClick={() => setOpenWeek(openWeek === wi ? -1 : wi)}
                className="w-full p-5 flex items-start justify-between text-left hover:bg-surface-container-low transition-colors gap-4"
              >
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Semaine {w.week}</span>
                  <p className="font-bold text-on-surface leading-snug mt-0.5">{w.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{w.objective}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant shrink-0 mt-1">
                  {openWeek === wi ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Modules */}
              {openWeek === wi && (
                <div className="border-t border-outline-variant/10 divide-y divide-outline-variant/10">
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
                    const curQIdx = qIdx[id] ?? 0;
                    const ytFallback = ytFallbackSet.has(id);

                    return (
                      <div key={mi} className={`${isPassed ? "bg-emerald-50/50" : !accessible ? "opacity-50" : ""}`}>

                        {/* Module title row */}
                        <button
                          onClick={() => accessible && toggleMod(id, m, w)}
                          disabled={!accessible}
                          className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${accessible ? "hover:bg-surface-container-low cursor-pointer" : "cursor-not-allowed"}`}
                        >
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isPassed ? "bg-emerald-500 text-white" : !accessible ? "bg-surface-container text-outline" : "bg-primary/10 text-primary"}`}>
                            {!accessible
                              ? <span className="material-symbols-outlined text-[16px]">lock</span>
                              : isPassed
                              ? <span className="material-symbols-outlined text-[16px]">check</span>
                              : <span className="text-xs font-bold">{mi + 1}</span>
                            }
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-on-surface">{m.title}</p>
                            {!accessible && <p className="text-xs text-on-surface-variant mt-0.5">Valide le module précédent pour débloquer</p>}
                            {isPassed && <p className="text-xs text-emerald-600 mt-0.5 font-medium">Quiz validé ✓</p>}
                          </div>
                          {accessible && (
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">
                              {isOpen ? "expand_less" : "expand_more"}
                            </span>
                          )}
                        </button>

                        {/* Module detail panel */}
                        {isOpen && (
                          <div className="px-4 pb-6 border-t border-outline-variant/10 pt-4 space-y-5">

                            {/* Phase tabs */}
                            <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
                              {(["content", "exercise", "quiz", "result"] as ModPhase[]).map((p) => {
                                const labels: Record<ModPhase, string> = { content: "Cours", exercise: "Exercice", quiz: "Quiz", result: "Résultat" };
                                const isActive = phase === p;
                                const isDisabled =
                                  (p === "exercise" && phase === "content") ||
                                  (p === "quiz" && !exDone.has(id) && phase === "content") ||
                                  (p === "result" && !isPassed);
                                return (
                                  <button
                                    key={p}
                                    disabled={isDisabled}
                                    onClick={() => !isDisabled && goToPhase(id, p)}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isActive ? "bg-surface-container-lowest text-primary shadow-sm" : isDisabled ? "text-outline/40 cursor-default" : "text-on-surface-variant hover:text-on-surface"}`}
                                  >
                                    {labels[p]}
                                  </button>
                                );
                              })}
                            </div>

                            {/* ─── PHASE: CONTENT ─── */}
                            {phase === "content" && (
                              <>
                                {isLoadingContent ? (
                                  <div className="flex items-center gap-3 text-primary">
                                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                                    <span className="text-sm">Chargement du contenu détaillé…</span>
                                  </div>
                                ) : content?.sections ? (
                                  <div className="space-y-5">
                                    {content.sections.map((sec, si) => (
                                      <div key={si} className="border-l-4 border-primary/30 pl-4">
                                        <h4 className="font-bold text-primary mb-2 text-sm">{sec.title}</h4>
                                        <div className="text-sm text-on-surface leading-relaxed" dangerouslySetInnerHTML={{ __html: sec.content }} />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-on-surface leading-relaxed">{m.description}</p>
                                )}

                                {/* YouTube */}
                                {m.keywords?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Ressources vidéo</p>
                                    {ytLoading.has(id) ? (
                                      <p className="text-sm text-on-surface-variant">Chargement des vidéos…</p>
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
                                            <p className="text-xs text-on-surface-variant px-3 py-2 bg-surface-container-low">{v.title}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {m.keywords.map((kw, ki) => (
                                          <a key={ki}
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                            <span className="material-symbols-outlined text-[14px]">play_arrow</span>{kw}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <button
                                  onClick={() => goToPhase(id, "exercise")}
                                  className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                                >
                                  J&apos;ai lu ce module — Passer à l&apos;exercice
                                </button>
                              </>
                            )}

                            {/* ─── PHASE: EXERCISE ─── */}
                            {phase === "exercise" && (
                              <div className="space-y-4">
                                <div className="bg-tertiary-fixed/30 rounded-xl p-4">
                                  <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-2">Exercice pratique</p>
                                  <p className="text-sm text-on-surface font-medium leading-relaxed">
                                    {m.exercises || "Applique les concepts du module dans un exercice pratique. Décris ta démarche, les étapes que tu as suivies et ce que tu as appris."}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Ta réponse</label>
                                  <textarea
                                    value={exText[id] ?? ""}
                                    onChange={e => setExText(prev => ({ ...prev, [id]: e.target.value }))}
                                    rows={5}
                                    placeholder="Décris ta démarche, ce que tu as fait, ce que tu as appris…"
                                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:border-primary outline-none resize-none transition-colors"
                                  />
                                </div>

                                {/* File attachment */}
                                <div>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                                    id={`file-${id}`}
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      setExFile(prev => ({ ...prev, [id]: f ? { name: f.name } : null }));
                                    }}
                                  />
                                  <label
                                    htmlFor={`file-${id}`}
                                    className="inline-flex items-center gap-2 px-3 py-2 border-2 border-dashed border-outline-variant rounded-xl text-sm text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                    Joindre un fichier (PDF, image, Word)
                                  </label>
                                  {exFile[id] && (
                                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                      {exFile[id]!.name}
                                      <button
                                        onClick={() => setExFile(prev => ({ ...prev, [id]: null }))}
                                        className="text-outline hover:text-error ml-1"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                      </button>
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-3">
                                  <button onClick={() => goToPhase(id, "content")}
                                    className="flex-1 py-3 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">
                                    ← Relire le cours
                                  </button>
                                  <button
                                    onClick={() => submitExercise(id)}
                                    disabled={!(exText[id] ?? "").trim() && !exFile[id]}
                                    className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition-all"
                                  >
                                    Valider l&apos;exercice →
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ─── PHASE: QUIZ ─── */}
                            {phase === "quiz" && quiz.length > 0 && (() => {
                              const q = quiz[curQIdx];
                              const userAns = ans[curQIdx];
                              const totalQ = quiz.length;
                              const answeredCount = Object.keys(ans).length;
                              const correct = quiz.filter((qq, i) => ans[i] === qq.answer).length;
                              const scorePct = Math.round((correct / totalQ) * 100);
                              const quizPassed = scorePct >= 60;

                              return (
                                <div className="space-y-4">
                                  {/* Progress dots */}
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Quiz · 60% requis</p>
                                    <div className="flex gap-1">
                                      {quiz.map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() => setQIdx(prev => ({ ...prev, [id]: i }))}
                                          className={`h-2 rounded-full transition-all ${i === curQIdx ? "w-5 bg-primary" : ans[i] !== undefined ? "w-2 bg-primary/40" : "w-2 bg-surface-container-highest"}`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-on-surface-variant">{curQIdx + 1}/{totalQ}</span>
                                  </div>

                                  {/* Current question */}
                                  <div className="bg-surface-container-low rounded-xl p-4">
                                    <p className="font-semibold text-sm mb-3 leading-relaxed text-on-surface">
                                      <span className="text-primary font-bold">Q{curQIdx + 1}. </span>{q.question}
                                    </p>
                                    <div className="space-y-2">
                                      {q.options.map((opt, oi) => {
                                        let cls = "w-full text-left px-3 py-2.5 rounded-xl border-l-4 text-sm transition-colors ";
                                        if (!isSubmitted) {
                                          cls += userAns === oi
                                            ? "border-primary bg-primary/5 font-semibold text-on-surface"
                                            : "border-transparent bg-surface-container-lowest hover:border-primary/30 text-on-surface";
                                        } else if (quizPassed) {
                                          if (oi === q.answer) cls += "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                                          else if (userAns === oi) cls += "border-red-400 bg-red-50 text-red-700";
                                          else cls += "border-transparent bg-surface-container-lowest text-outline";
                                        } else {
                                          cls += userAns === oi
                                            ? "border-primary/50 bg-primary/5 text-on-surface"
                                            : "border-transparent bg-surface-container-lowest text-outline";
                                        }
                                        return (
                                          <button key={oi} className={cls} onClick={() => pickAnswer(id, curQIdx, oi)} disabled={isSubmitted}>
                                            <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {isSubmitted && quizPassed && q.explanation && (
                                      <p className="mt-3 text-xs text-on-surface-variant bg-surface-container rounded-lg p-2.5 leading-relaxed">
                                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">lightbulb</span>
                                        {q.explanation}
                                      </p>
                                    )}
                                  </div>

                                  {/* Navigation */}
                                  {!isSubmitted && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setQIdx(prev => ({ ...prev, [id]: Math.max(0, curQIdx - 1) }))}
                                        disabled={curQIdx === 0}
                                        className="flex-1 py-2.5 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container disabled:opacity-30 transition-colors"
                                      >
                                        ← Précédente
                                      </button>
                                      {curQIdx < totalQ - 1 ? (
                                        <button
                                          onClick={() => setQIdx(prev => ({ ...prev, [id]: curQIdx + 1 }))}
                                          className="flex-1 py-2.5 bg-surface-container text-primary rounded-xl text-sm font-bold hover:bg-surface-container-high transition-colors"
                                        >
                                          Suivante →
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => submitModQuiz(id, quiz)}
                                          disabled={answeredCount < totalQ}
                                          className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition-all"
                                        >
                                          Valider {answeredCount < totalQ ? `(${answeredCount}/${totalQ})` : ""}
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Result banner after submit */}
                                  {isSubmitted && (
                                    <div className={`rounded-xl p-4 text-center ${quizPassed ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                                      <p className={`text-2xl font-black mb-1 ${quizPassed ? "text-emerald-600" : "text-red-500"}`}>{scorePct}%</p>
                                      <p className="font-semibold text-sm mb-1">
                                        {quizPassed ? "Quiz réussi ✓" : "Quiz échoué ✗"}
                                      </p>
                                      <p className="text-xs text-on-surface-variant mb-3">
                                        {correct}/{totalQ} bonnes réponses · {quizPassed ? "Module suivant débloqué" : "60% minimum requis"}
                                      </p>
                                      {!quizPassed && (
                                        <button onClick={() => retryModQuiz(id)}
                                          className="rounded-xl bg-primary text-on-primary px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                                          Réessayer
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* ─── PHASE: RESULT (passed) ─── */}
                            {phase === "result" && (
                              <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                  </div>
                                  <p className="font-bold text-emerald-700">Module validé</p>
                                  <p className="text-xs text-on-surface-variant mt-1">Quiz réussi · Module suivant débloqué</p>
                                  <button onClick={() => retryModQuiz(id)} className="mt-3 text-xs text-on-surface-variant hover:text-on-surface underline">
                                    Repasser le quiz
                                  </button>
                                </div>
                                <button onClick={() => goToPhase(id, "content")}
                                  className="w-full py-3 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">
                                  Relire le cours
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
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm text-center space-y-3">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Certification</p>
          <h3 className="font-extrabold text-lg text-on-surface">Test final certifié</h3>
          <p className="text-sm text-on-surface-variant">20 questions · Score minimum 70% · Certificat GSN</p>
          {passedCount < totalMods && totalMods > 0 && (
            <div className="inline-flex items-center gap-2 bg-tertiary-fixed/40 text-tertiary rounded-xl px-4 py-2 text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {passedCount}/{totalMods} modules validés — complète tous les modules d&apos;abord
            </div>
          )}
          <div className="pt-1">
            <Link href={`/learn/${courseId}/test`}
              className="inline-block bg-primary text-on-primary px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
              Passer le test →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/learn" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="text-[10px] font-medium mt-0.5">Apprendre</span>
        </Link>
        <Link href="/missions" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[10px] font-medium mt-0.5">Missions</span>
        </Link>
        <Link href="/wallet" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-medium mt-0.5">Wallet</span>
        </Link>
        <Link href="/score" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">stars</span>
          <span className="text-[10px] font-medium mt-0.5">Score</span>
        </Link>
      </nav>
    </main>
  );
}
