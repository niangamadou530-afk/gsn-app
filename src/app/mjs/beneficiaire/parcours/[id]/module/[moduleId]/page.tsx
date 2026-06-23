"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ModuleContenu, QuizQ } from "../../../types";

type YTVideo = { videoId: string; title: string; channel: string };
type Phase = "content" | "exercise" | "quiz" | "result";

export default function ModuleDetailPage() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [parcoursTitre, setParcoursTitre] = useState("");
  const [module, setModule] = useState<ModuleContenu | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [phase, setPhase] = useState<Phase>("content");
  const [quizPassed, setQuizPassed] = useState<Set<string>>(new Set());
  const [exDone, setExDone] = useState<Set<string>>(new Set());

  const [yt, setYt] = useState<YTVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytFallback, setYtFallback] = useState(false);
  const [exText, setExText] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [moduleId]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/mjs/beneficiaire/connexion"); return; }
    setUserId(user.id);

    const { data: p } = await supabase
      .from("mjs_parcours")
      .select("titre, modules_contenu")
      .eq("id", id)
      .eq("tenant_id", "mjs")
      .single();

    if (!p?.modules_contenu) { router.push(`/mjs/beneficiaire/parcours/${id}`); return; }

    const modules: ModuleContenu[] = p.modules_contenu as unknown as ModuleContenu[];
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx === -1) { router.push(`/mjs/beneficiaire/parcours/${id}`); return; }

    setParcoursTitre(p.titre);
    setModule(modules[idx]);
    setModuleIndex(idx);
    setTotalModules(modules.length);

    const { data: insc } = await supabase
      .from("mjs_inscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("parcours_id", id)
      .eq("tenant_id", "mjs")
      .maybeSingle();

    const { data: prog } = await supabase
      .from("mjs_progression")
      .select("modules_faits_ids")
      .eq("user_id", user.id)
      .eq("parcours_id", id)
      .eq("tenant_id", "mjs")
      .maybeSingle();

    if (insc) {
      const ids: string[] = prog?.modules_faits_ids ?? [];
      const passed = new Set<string>(ids);
      setQuizPassed(passed);
      if (passed.has(moduleId)) setPhase("result");
    }

    setLoading(false);
  }

  const loadYT = useCallback(async (keywords: string[]) => {
    if (yt.length > 0 || ytLoading) return;
    setYtLoading(true);
    try {
      const q = keywords.slice(0, 2).join(" ");
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const items = data.items ?? [];
      setYt(items);
      if (data.fallback || items.length === 0) setYtFallback(true);
    } catch {
      setYtFallback(true);
    } finally {
      setYtLoading(false);
    }
  }, [yt, ytLoading]);

  useEffect(() => {
    if (module?.keywords && phase === "content") {
      loadYT(module.keywords);
    }
  }, [module, phase]);

  async function submitExercise() {
    if (!exText.trim()) { alert("Écris ta réponse avant de valider."); return; }
    setExDone(prev => new Set([...prev, moduleId]));
    setPhase("quiz");
    setQIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitQuiz() {
    if (!module || !userId) return;
    const quiz: QuizQ[] = module.quiz ?? [];
    if (Object.keys(answers).length < quiz.length) {
      alert(`Réponds à toutes les ${quiz.length} questions.`);
      return;
    }
    setSubmitted(true);
    const correct = quiz.filter((q, i) => answers[i] === q.answer).length;
    const pct = Math.round((correct / quiz.length) * 100);
    const passed = pct >= 60;

    if (passed) {
      const nextPassed = new Set([...quizPassed, moduleId]);
      setQuizPassed(nextPassed);
      setPhase("result");

      const passedArr = Array.from(nextPassed);
      const pourcentage = Math.round((passedArr.length / totalModules) * 100);

      await supabase
        .from("mjs_progression")
        .update({
          modules_faits: passedArr.length,
          pourcentage,
          modules_faits_ids: passedArr,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("parcours_id", id)
        .eq("tenant_id", "mjs");

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function retry() {
    setSubmitted(false);
    setAnswers({});
    setQIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </main>
  );

  if (!module) return null;

  const quiz: QuizQ[] = module.quiz ?? [];
  const currentQ = quiz[qIdx];
  const userAns = answers[qIdx];
  const correct = quiz.filter((q, i) => answers[i] === q.answer).length;
  const scorePct = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0;
  const quizOk = scorePct >= 60;
  const answeredCount = Object.keys(answers).length;
  const isAlreadyPassed = quizPassed.has(moduleId);

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <button onClick={() => router.push(`/mjs/beneficiaire/parcours/${id}`)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-sm font-bold text-primary truncate max-w-[180px]">{parcoursTitre}</span>
        <span className="text-xs text-on-surface-variant">Module {moduleIndex + 1}/{totalModules}</span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-5">

        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Module {moduleIndex + 1}</span>
          <h1 className="text-xl font-extrabold text-on-surface mt-0.5">{module.titre}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{module.description}</p>
        </div>

        {/* Onglets phases */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
          {(["content", "exercise", "quiz", "result"] as Phase[]).map((p) => {
            const labels: Record<Phase, string> = { content: "Cours", exercise: "Exercice", quiz: "Quiz", result: "Résultat" };
            const isActive = phase === p;
            const isDisabled =
              (p === "exercise" && !exDone.has(moduleId) && phase === "content") ||
              (p === "quiz" && !exDone.has(moduleId)) ||
              (p === "result" && !isAlreadyPassed);
            return (
              <button
                key={p}
                disabled={isDisabled}
                onClick={() => { if (!isDisabled) { setPhase(p); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors
                  ${isActive ? "bg-surface-container-lowest text-primary shadow-sm" : isDisabled ? "text-outline/40 cursor-default" : "text-on-surface-variant hover:text-on-surface"}`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* ─── COURS ─── */}
        {phase === "content" && (
          <>
            {module.sections?.map((sec, si) => (
              <div key={si} className="border-l-4 border-primary/30 pl-4">
                <h4 className="font-bold text-primary mb-2 text-sm">{sec.title}</h4>
                <div className="text-sm text-on-surface leading-relaxed" dangerouslySetInnerHTML={{ __html: sec.content }} />
              </div>
            ))}

            {module.keywords?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Ressources vidéo</p>
                {ytLoading ? (
                  <p className="text-sm text-on-surface-variant">Chargement des vidéos…</p>
                ) : yt.length > 0 && !ytFallback ? (
                  <div className="space-y-3">
                    {yt.map((v, vi) => (
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
                    {module.keywords.map((kw, ki) => (
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
              onClick={() => { setPhase("exercise"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              J&apos;ai lu ce module — Passer à l&apos;exercice
            </button>
          </>
        )}

        {/* ─── EXERCICE ─── */}
        {phase === "exercise" && (
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Exercice pratique</p>
              <p className="text-sm text-on-surface font-medium leading-relaxed">
                {module.exercises || "Applique les concepts du module. Décris ta démarche et ce que tu as appris."}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Ta réponse</label>
              <textarea
                value={exText}
                onChange={(e) => setExText(e.target.value)}
                rows={5}
                placeholder="Décris ta démarche, ce que tu as fait, ce que tu as appris…"
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3 text-sm text-on-surface focus:border-primary outline-none resize-none transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPhase("content")}
                className="flex-1 py-3 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">
                ← Relire le cours
              </button>
              <button
                onClick={submitExercise}
                disabled={!exText.trim()}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                Valider l&apos;exercice →
              </button>
            </div>
          </div>
        )}

        {/* ─── QUIZ ─── */}
        {phase === "quiz" && quiz.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Quiz · 60% requis</p>
              <div className="flex gap-1">
                {quiz.map((_, i) => (
                  <button key={i} onClick={() => setQIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === qIdx ? "w-5 bg-primary" : answers[i] !== undefined ? "w-2 bg-primary/40" : "w-2 bg-surface-container-highest"}`} />
                ))}
              </div>
              <span className="text-xs text-on-surface-variant">{qIdx + 1}/{quiz.length}</span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="font-semibold text-sm mb-3 leading-relaxed text-on-surface">
                <span className="text-primary font-bold">Q{qIdx + 1}. </span>{currentQ?.question}
              </p>
              <div className="space-y-2">
                {currentQ?.options.map((opt, oi) => {
                  let cls = "w-full text-left px-3 py-2.5 rounded-xl border-l-4 text-sm transition-colors ";
                  if (!submitted) {
                    cls += userAns === oi ? "border-primary bg-primary/5 font-semibold text-on-surface" : "border-transparent bg-surface-container-lowest hover:border-primary/30 text-on-surface";
                  } else if (quizOk) {
                    if (oi === currentQ.answer) cls += "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                    else if (userAns === oi) cls += "border-red-400 bg-red-50 text-red-700";
                    else cls += "border-transparent bg-surface-container-lowest text-outline";
                  } else {
                    cls += userAns === oi ? "border-primary/50 bg-primary/5 text-on-surface" : "border-transparent bg-surface-container-lowest text-outline";
                  }
                  return (
                    <button key={oi} className={cls} onClick={() => !submitted && setAnswers(prev => ({ ...prev, [qIdx]: oi }))} disabled={submitted}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                    </button>
                  );
                })}
              </div>
              {submitted && quizOk && currentQ?.explanation && (
                <p className="mt-3 text-xs text-on-surface-variant bg-surface-container rounded-lg p-2.5 leading-relaxed">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">lightbulb</span>
                  {currentQ.explanation}
                </p>
              )}
            </div>

            {!submitted && (
              <div className="flex gap-2">
                <button onClick={() => setQIdx(prev => Math.max(0, prev - 1))} disabled={qIdx === 0}
                  className="flex-1 py-2.5 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container disabled:opacity-30 transition-colors">
                  ← Précédente
                </button>
                {qIdx < quiz.length - 1 ? (
                  <button onClick={() => setQIdx(prev => prev + 1)}
                    className="flex-1 py-2.5 bg-surface-container text-primary rounded-xl text-sm font-bold hover:bg-surface-container-high transition-colors">
                    Suivante →
                  </button>
                ) : (
                  <button onClick={submitQuiz} disabled={answeredCount < quiz.length}
                    className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition-all">
                    Valider {answeredCount < quiz.length ? `(${answeredCount}/${quiz.length})` : ""}
                  </button>
                )}
              </div>
            )}

            {submitted && (
              <div className={`rounded-xl p-4 text-center ${quizOk ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-2xl font-black mb-1 ${quizOk ? "text-emerald-600" : "text-red-500"}`}>{scorePct}%</p>
                <p className="font-semibold text-sm mb-1">{quizOk ? "Quiz réussi ✓" : "Quiz échoué ✗"}</p>
                <p className="text-xs text-on-surface-variant mb-3">
                  {correct}/{quiz.length} bonnes réponses · {quizOk ? "Module suivant débloqué" : "60% minimum requis"}
                </p>
                {!quizOk && (
                  <button onClick={retry}
                    className="rounded-xl bg-primary text-on-primary px-5 py-2.5 text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                    Réessayer
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── RÉSULTAT ─── */}
        {phase === "result" && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <p className="font-bold text-emerald-700">Module validé</p>
              <p className="text-xs text-on-surface-variant mt-1">Quiz réussi · Module suivant débloqué</p>
              <button onClick={retry} className="mt-3 text-xs text-on-surface-variant hover:text-on-surface underline">
                Repasser le quiz
              </button>
            </div>

            <button
              onClick={() => router.push(`/mjs/beneficiaire/parcours/${id}`)}
              className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {moduleIndex < totalModules - 1 ? "Module suivant →" : "Voir mon parcours complet →"}
            </button>

            <button onClick={() => setPhase("content")}
              className="w-full py-3 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">
              Relire le cours
            </button>
          </div>
        )}

      </div>
    </main>
  );
}