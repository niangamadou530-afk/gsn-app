"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Question = { id: number; question: string; options: string[]; answer: number; explanation: string };

export default function TestPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState("");
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => { init(); }, [courseId]);

  async function init() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }

    const { data, error } = await supabase
      .from("user_courses")
      .select("*")
      .eq("id", courseId)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !data) { router.replace("/learn"); return; }
    setCourse(data);

    const weeks = Array.isArray(data.modules) && data.modules[0]?.week !== undefined
      ? data.modules
      : [];
    const totalMods = weeks.reduce((n: number, w: any) => n + w.modules.length, 0);

    if (data.quiz_questions && Array.isArray(data.quiz_questions) && data.quiz_questions.length > 0) {
      setQuestions(data.quiz_questions);
      if (data.test_score !== null && data.test_score !== undefined) {
        setScore(data.test_score);
        setSubmitted(true);
      }
      setLoading(false);
      return;
    }

    const passedArr: string[] = data.quiz_passed ?? [];
    const doneArr: string[] = data.modules_done ?? [];
    const progressMap: Record<string, string> = data.modules_progress ?? {};
    const passedCount = passedArr.length;
    const doneCount = doneArr.length;
    const progressPassed = Object.values(progressMap).filter((v) => v === "passed").length;
    const effectiveDone = Math.max(passedCount, doneCount, progressPassed);

    console.log('[TestPage] totalMods:', totalMods,
      '| quiz_passed:', passedArr,
      '| modules_done:', doneArr,
      '| modules_progress passed:', progressPassed,
      '| effectiveDone:', effectiveDone);

    if (effectiveDone < totalMods && totalMods > 0) {
      setBlocked(true);
      setBlockedMsg(`Complète tous les modules du cours avant de passer le test. (${effectiveDone}/${totalMods} modules terminés)`);
      setLoading(false);
      return;
    }

    setGenerating(true);
    setLoading(false);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle: data.title, weeks }),
      });
      const quiz = await res.json();
      if (!res.ok) throw new Error(quiz.error);
      const qs: Question[] = quiz.questions ?? [];
      setQuestions(qs);

      await supabase
        .from("user_courses")
        .update({ quiz_questions: qs })
        .eq("id", courseId);
    } catch (e: any) {
      setError("Impossible de générer le test : " + e.message);
    } finally {
      setGenerating(false);
    }
  }

  function pick(qId: number, opt: number) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  }

  async function submit() {
    if (Object.keys(answers).length < questions.length) {
      alert(`Réponds à toutes les ${questions.length} questions avant de soumettre.`);
      return;
    }

    const correct = questions.filter(q => answers[q.id] === q.answer).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    setSaving(true);

    try {
      const alreadyCertified = course?.completed && course?.certificate_id;
      const certId = alreadyCertified
        ? course.certificate_id
        : `GSN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await supabase.from("user_courses").update({
        test_score: pct,
        ...(!alreadyCertified && pct >= 70 && {
          completed: true,
          certificate_id: certId,
          completed_at: new Date().toISOString(),
        }),
      }).eq("id", courseId);

      if (!alreadyCertified && pct >= 70) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("score, skills")
            .eq("id", authData.user.id)
            .single();

          const weeksCount = Array.isArray(course?.modules) ? course.modules.length : 0;
          // Split on em-dash or regular dash; domain = first part, level = last part (if 3+ parts)
          const titleParts = (course?.title ?? "Formation").split(/\s*[—–-]\s*/).map((s: string) => s.trim()).filter(Boolean);
          const domain = titleParts[0] ?? "Formation";
          const level = titleParts.length >= 3 ? titleParts[titleParts.length - 1] : undefined;

          const newSkill = {
            domain,
            score: pct,
            date: new Date().toISOString().split("T")[0],
            cert_id: certId,
            weeks: weeksCount,
            ...(level && { level }),
          };

          console.log('[submit] saving skill:', newSkill, 'userId:', authData.user.id);
          const { error: skillErr } = await supabase.from("users").update({
            score: (profile?.score ?? 0) + 5,
            skills: [...(Array.isArray(profile?.skills) ? profile.skills : []), newSkill],
          }).eq("id", authData.user.id);
          if (skillErr) console.error('[submit] users.update error:', skillErr.message, skillErr.code);
          else console.log('[submit] skill saved OK');

          setCourse((prev: any) => ({ ...prev, completed: true, certificate_id: certId }));
        }
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }

  function retry() {
    setSubmitted(false);
    setAnswers({});
    setScore(0);
    setCurrentQ(0);
  }

  // ── Loading states ──────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (blocked) return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-surface-container-lowest rounded-3xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Test verrouillé</h2>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{blockedMsg}</p>
        <Link href={`/learn/${courseId}`} className="block w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl text-center shadow-lg shadow-primary/20 active:scale-95 transition-all">
          Retourner au cours
        </Link>
      </div>
    </div>
  );

  if (generating) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6 p-6">
      <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <div className="text-center">
        <p className="text-primary font-bold text-lg">L&apos;IA génère ton test…</p>
        <p className="text-on-surface-variant text-sm mt-1">Une seule génération — le test sera sauvegardé</p>
      </div>
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-error block">error</span>
        <p className="text-on-surface-variant text-sm">{error}</p>
        <Link href={`/learn/${courseId}`} className="text-primary font-bold hover:underline">← Retour au parcours</Link>
      </div>
    </div>
  );

  const correctCount = questions.filter(q => answers[q.id] === q.answer).length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const q = questions[currentQ];

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 flex justify-between items-center px-6 py-4">
        <Link href={`/learn/${courseId}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <span className="text-base font-bold text-primary">Test Final</span>
        <span className="text-sm font-bold text-on-surface-variant">{answeredCount}/{questions.length}</span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-on-surface-variant font-medium text-xs tracking-wide uppercase mb-1">Certification</p>
              <p className="text-xl font-extrabold text-on-surface">{course?.title?.split("—")[0]?.trim()}</p>
            </div>
            {!submitted && (
              <span className="text-primary font-bold text-sm">Q{currentQ + 1} / {questions.length}</span>
            )}
          </div>
          <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${submitted ? 100 : progressPct}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant mt-1.5">Score minimum 70% · Certificat GSN</p>
        </div>

        {/* Results — shown after submission */}
        {submitted && (
          <div className="space-y-6 mb-8">

            {/* Score card */}
            <div className="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-8 text-center text-on-primary shadow-xl shadow-primary/20">
              <div className="w-28 h-28 rounded-full bg-white/15 border-4 border-white/25 flex flex-col items-center justify-center mx-auto mb-5">
                <span className="text-5xl font-extrabold">{score}%</span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-70 mt-1">Score</span>
              </div>
              <h3 className="text-2xl font-extrabold mb-1">{score >= 70 ? "Félicitations !" : "Pas encore…"}</h3>
              <p className="text-sm opacity-80">
                {correctCount}/{questions.length} bonnes réponses · {score >= 70 ? "Vous êtes certifié !" : "Minimum requis : 70%"}
              </p>
              {saving && <p className="text-xs opacity-60 mt-2 animate-pulse">Enregistrement en cours…</p>}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {(score >= 70 || course?.certificate_id) && (
                <Link href={`/learn/${courseId}/certificate`}
                  className="flex w-full py-4 bg-primary text-on-primary font-bold rounded-xl items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">workspace_premium</span>
                  Voir mon certificat
                </Link>
              )}
              {(score >= 70 || course?.certificate_id) && (
                <Link href="/score"
                  className="flex w-full py-4 bg-surface-container-low text-primary border-2 border-primary/20 font-bold rounded-xl items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">stars</span>
                  Voir mon Skill Passport
                </Link>
              )}
              {!course?.certificate_id && (
                <button onClick={retry}
                  className="w-full py-4 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-all active:scale-95">
                  Refaire le test
                </button>
              )}
            </div>

            {/* Questions review — always shown when answers available */}
            {Object.keys(answers).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-on-surface pt-2">Révision des réponses</h3>
                {questions.map((q, qi) => {
                  const userAns = answers[q.id];
                  const isCorrect = userAns === q.answer;
                  return (
                    <div key={q.id} className={`rounded-2xl overflow-hidden border-l-4 ${isCorrect ? "border-emerald-500" : "border-red-400"}`}>
                      <div className={`px-5 py-4 flex items-start gap-3 ${isCorrect ? "bg-emerald-50" : "bg-red-50"}`}>
                        <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${isCorrect ? "text-emerald-600" : "text-red-500"}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isCorrect ? "check_circle" : "cancel"}
                        </span>
                        <p className="font-semibold text-on-surface text-sm leading-relaxed">{qi + 1}. {q.question}</p>
                      </div>
                      <div className="bg-surface-container-lowest px-5 py-3 space-y-2">
                        {q.options.map((opt, oi) => {
                          const isUser = userAns === oi;
                          const isRight = q.answer === oi;
                          return (
                            <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm ${
                              isRight ? "bg-emerald-100 text-emerald-800 font-medium" :
                              isUser ? "bg-red-100 text-red-700" : "text-on-surface-variant"
                            }`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                isRight ? "bg-emerald-500 text-white" :
                                isUser ? "bg-red-400 text-white" : "bg-surface-container text-on-surface-variant"
                              }`}>
                                {String.fromCharCode(65 + oi)}
                              </div>
                              <span className="flex-1">{opt}</span>
                              {isRight && <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                              {isUser && !isRight && <span className="material-symbols-outlined text-[16px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>}
                            </div>
                          );
                        })}
                        {q.explanation && (
                          <p className="text-xs text-on-surface-variant italic pt-2 pl-1 border-t border-outline-variant/20 mt-1">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Question navigation dots */}
        {!submitted && questions.length > 0 && (
          <>
            <div className="flex gap-1 mb-6 flex-wrap">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`h-2 rounded-full transition-all ${i === currentQ ? "w-6 bg-primary" : answers[questions[i].id] !== undefined ? "w-2 bg-primary/50" : "w-2 bg-surface-container-highest"}`}
                />
              ))}
            </div>

            {/* Question card */}
            <section className="mb-6">
              <div className="bg-surface-container-low rounded-2xl p-6 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="material-symbols-outlined text-6xl">quiz</span>
                </div>
                <p className="text-lg font-semibold text-on-surface leading-relaxed relative z-10">
                  {q?.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q?.options.map((opt, oi) => {
                  const userAns = answers[q.id];
                  const isSelected = userAns === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => pick(q.id, oi)}
                      className={`w-full flex items-center p-4 rounded-xl border-l-4 text-left transition-all shadow-sm active:scale-[0.98] ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-transparent bg-surface-container-lowest hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 font-bold text-sm shrink-0 transition-colors ${
                        isSelected ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {String.fromCharCode(65 + oi)}
                      </div>
                      <span className={`font-medium text-sm ${isSelected ? "text-on-surface font-semibold" : "text-on-surface"}`}>{opt}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="px-6 py-3 text-on-surface-variant font-semibold hover:bg-surface-container rounded-xl transition-colors disabled:opacity-30"
              >
                Précédent
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
                  className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={saving || answeredCount < questions.length}
                  className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : `Valider (${answeredCount}/${questions.length})`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
