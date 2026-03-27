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

    // If saved questions exist → load them directly (never regenerate)
    if (data.quiz_questions && Array.isArray(data.quiz_questions) && data.quiz_questions.length > 0) {
      setQuestions(data.quiz_questions);
      // If already taken, show stored result
      if (data.test_score !== null && data.test_score !== undefined) {
        setScore(data.test_score);
        setSubmitted(true);
      }
      setLoading(false);
      return;
    }

    // No saved questions → check if all modules are done
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

    // All modules done → generate questions
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

      // Save questions to DB (never regenerate again)
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

      // Only award points + skill on FIRST certification
      if (!alreadyCertified && pct >= 70) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("score, skills")
            .eq("id", authData.user.id)
            .single();

          const weeksCount = Array.isArray(course?.modules) ? course.modules.length : 0;
          const titleParts = (course?.title ?? "Formation").split("—").map((s: string) => s.trim());
          const domain = titleParts[0];
          const level = titleParts.length >= 3 ? titleParts[1] : undefined;

          const newSkill = {
            domain,
            title: course?.title ?? "Formation",
            score: pct,
            date: new Date().toISOString().split("T")[0],
            cert_id: certId,
            weeks: weeksCount,
            ...(level && { level }),
          };

          await supabase.from("users").update({
            score: (profile?.score ?? 0) + 5,
            skills: [...(Array.isArray(profile?.skills) ? profile.skills : []), newSkill],
          }).eq("id", authData.user.id);

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
  }

  // ── Render ──────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (blocked) return (
    <div className="max-w-md mx-auto mt-24 p-8 text-center bg-white rounded-xl shadow border border-yellow-200">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="font-bold text-lg text-gray-800 mb-2">Test verrouillé</h2>
      <p className="text-gray-500 text-sm mb-6">{blockedMsg}</p>
      <Link href={`/learn/${courseId}`} className="inline-block rounded-lg bg-[#1a73e8] text-white px-6 py-3 font-semibold hover:opacity-90">
        Retourner au cours
      </Link>
    </div>
  );

  if (generating) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p className="text-blue-600 font-medium">L&apos;IA génère ton test de certification…</p>
      <p className="text-xs text-gray-400">Une seule génération — le test sera sauvegardé</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-24 p-6 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Link href={`/learn/${courseId}`} className="text-blue-600 hover:underline">← Retour au parcours</Link>
    </div>
  );

  const correctCount = questions.filter(q => answers[q.id] === q.answer).length;

  return (
    <main className="min-h-screen bg-[#f4f8ff] pb-24">
      <div className="max-w-3xl mx-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <Link href={`/learn/${courseId}`} className="text-sm text-blue-600 hover:underline">← Retour au parcours</Link>
          <h1 className="text-2xl font-bold text-[#1a73e8] mt-2">Test final certifié</h1>
          <p className="text-sm text-gray-500">{course?.title} · {questions.length} questions · Score minimum 70%</p>
        </div>

        {/* Result banner */}
        {submitted && (
          <div className={`rounded-xl p-6 mb-6 text-center border-2 ${score >= 70 ? "bg-green-50 border-green-300" : "bg-red-50 border-red-200"}`}>
            <div className={`text-5xl font-black mb-1 ${score >= 70 ? "text-green-600" : "text-red-500"}`}>{score}%</div>
            <p className="font-bold text-lg mb-1">{score >= 70 ? "Félicitations ! 🎉" : "Pas encore…"}</p>
            <p className="text-sm text-gray-600 mb-4">
              {score >= 70
                ? `${correctCount} / ${questions.length} bonnes réponses. Certificat GSN débloqué !`
                : `${correctCount} / ${questions.length} bonnes réponses. Il faut 70% pour valider.`}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {(score >= 70 || course?.certificate_id) ? (
                <>
                  <Link href={`/learn/${courseId}/certificate`} className="rounded-lg bg-[#1a73e8] text-white px-6 py-2.5 font-semibold hover:opacity-90">
                    Voir mon certificat →
                  </Link>
                  <Link href="/score" className="rounded-lg border border-blue-200 text-blue-600 px-6 py-2.5 font-semibold hover:bg-blue-50">
                    Skill Passport
                  </Link>
                </>
              ) : null}
              <button onClick={retry} className="rounded-lg border border-gray-200 text-gray-600 px-6 py-2.5 font-semibold hover:bg-gray-50">
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!submitted && (
          <p className="text-sm text-gray-500 mb-4">{Object.keys(answers).length} / {questions.length} réponses</p>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {questions.map((q, qi) => {
            const userAns = answers[q.id];
            const isCorrect = submitted && userAns === q.answer;
            const isWrong = submitted && userAns !== undefined && userAns !== q.answer;

            return (
              <div key={q.id} className={`bg-white rounded-xl p-5 shadow border ${isCorrect ? "border-green-300" : isWrong ? "border-red-200" : "border-blue-100"}`}>
                <p className="font-semibold mb-3 text-sm leading-relaxed">
                  <span className="text-blue-600 font-bold">Q{qi + 1}. </span>{q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    let cls = "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ";
                    if (!submitted) {
                      cls += userAns === oi
                        ? "border-blue-500 bg-blue-50 font-semibold"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
                    } else {
                      if (oi === q.answer) cls += "border-green-500 bg-green-50 text-green-800 font-semibold";
                      else if (userAns === oi) cls += "border-red-300 bg-red-50 text-red-700";
                      else cls += "border-gray-100 text-gray-400";
                    }
                    return (
                      <button key={oi} className={cls} onClick={() => pick(q.id, oi)} disabled={submitted}>
                        <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        {!submitted && questions.length > 0 && (
          <button
            onClick={submit}
            disabled={saving}
            className="w-full mt-8 py-4 bg-[#1a73e8] text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : `Soumettre mes ${questions.length} réponses`}
          </button>
        )}
      </div>
    </main>
  );
}
