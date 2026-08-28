"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ModuleContenu, QuizQ } from "../../types";

const TARGET_QUESTIONS = 20;
const PASS_THRESHOLD = 70;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

function buildFinalQuiz(modules: ModuleContenu[]): QuizQ[] {
  const all = modules.flatMap((m) => m.quiz ?? []);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(TARGET_QUESTIONS, shuffled.length));
}

export default function TestFinalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [parcoursTitre, setParcoursTitre] = useState("");
  const [quiz, setQuiz] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [qIdx, setQIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/mjs/beneficiaire/connexion"); return; }

    const { data: p } = await supabase
      .from("mjs_parcours")
      .select("titre, modules_contenu")
      .eq("id", id)
      .eq("tenant_id", "mjs")
      .single();

    const modules = (p?.modules_contenu ?? []) as ModuleContenu[];
    if (!p || modules.length === 0) {
      router.push(`/mjs/beneficiaire/parcours/${id}`);
      return;
    }

    const moduleIds = modules.map((m) => m.id);
    const { data: prog } = await supabase
      .from("mjs_progression")
      .select("modules_faits_ids")
      .eq("user_id", user.id)
      .eq("parcours_id", id)
      .eq("tenant_id", "mjs")
      .maybeSingle();

    const passed: string[] = prog?.modules_faits_ids ?? [];
    if (!moduleIds.every((mid) => passed.includes(mid))) {
      router.push(`/mjs/beneficiaire/parcours/${id}`);
      return;
    }

    setParcoursTitre(p.titre);
    setQuiz(buildFinalQuiz(modules));
    setLoading(false);
  }

  const currentQ = quiz[qIdx];
  const userAns = answers[qIdx];
  const correct = useMemo(
    () => quiz.filter((q, i) => answers[i] === q.answer).length,
    [quiz, answers]
  );
  const scorePct = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0;
  const passed = scorePct >= PASS_THRESHOLD;
  const answeredCount = Object.keys(answers).length;

  async function deliverPassport(userId: string) {
    const { error: passportError } = await supabase
      .from("mjs_skill_passports")
      .upsert(
        { user_id: userId, tenant_id: "mjs", parcours_id: id },
        { onConflict: "user_id,parcours_id" }
      );
    if (passportError) throw passportError;

    await supabase
      .from("mjs_progression")
      .update({ pourcentage: 100, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("parcours_id", id)
      .eq("tenant_id", "mjs");
  }

  async function submitTest() {
    if (answeredCount < quiz.length) {
      alert(`Réponds à toutes les ${quiz.length} questions.`);
      return;
    }
    setSubmitted(true);

    if (passed) {
      setIssuing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non connecté");

        const res = await fetch("/api/mjs/skill-passport", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify({ parcours_id: id }),
        });
        const data = await res.json();

        if (res.status === 503 && data.use_client) {
          await deliverPassport(user.id);
        } else if (!res.ok) {
          throw new Error(data.error || "Erreur certification");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur";
        alert("Certification : " + msg);
      } finally {
        setIssuing(false);
      }
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (quiz.length === 0) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center px-6">
        <p className="text-on-surface-variant text-sm text-center">Aucune question disponible pour ce test.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <button onClick={() => router.push(`/mjs/beneficiaire/parcours/${id}`)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-sm font-bold text-primary truncate max-w-[180px]">Test final</span>
        <span className="text-xs text-on-surface-variant">{qIdx + 1}/{quiz.length}</span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-5">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Certification</p>
          <h1 className="text-xl font-extrabold text-on-surface mt-0.5">{parcoursTitre}</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {quiz.length} questions · {PASS_THRESHOLD}% minimum pour obtenir le Skill Passport
          </p>
        </div>

        {!submitted && currentQ && (
          <>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="font-semibold text-sm mb-3 leading-relaxed text-on-surface">
                <span className="text-primary font-bold">Q{qIdx + 1}. </span>{currentQ.question}
              </p>
              <div className="space-y-2">
                {currentQ.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border-l-4 text-sm transition-colors ${userAns === oi ? "border-primary bg-primary/5 font-semibold" : "border-transparent bg-surface-container-lowest hover:border-primary/30"}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [qIdx]: oi }))}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setQIdx((p) => Math.max(0, p - 1))} disabled={qIdx === 0}
                className="flex-1 py-2.5 border-2 border-outline-variant text-on-surface-variant rounded-xl text-sm font-bold disabled:opacity-30">
                ← Précédente
              </button>
              {qIdx < quiz.length - 1 ? (
                <button onClick={() => setQIdx((p) => p + 1)}
                  className="flex-1 py-2.5 bg-surface-container text-primary rounded-xl text-sm font-bold">
                  Suivante →
                </button>
              ) : (
                <button onClick={submitTest} disabled={answeredCount < quiz.length}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm disabled:opacity-40">
                  Valider le test
                </button>
              )}
            </div>
          </>
        )}

        {submitted && (
          <div className={`rounded-xl p-6 text-center space-y-4 ${passed ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            <p className={`text-3xl font-black ${passed ? "text-emerald-600" : "text-red-500"}`}>{scorePct}%</p>
            <p className="font-semibold">{passed ? "Test réussi !" : "Test échoué"}</p>
            <p className="text-sm text-on-surface-variant">
              {correct}/{quiz.length} bonnes réponses · minimum {PASS_THRESHOLD}%
            </p>
            {passed && (
              <>
                {issuing ? (
                  <p className="text-sm text-on-surface-variant">Émission du Skill Passport…</p>
                ) : (
                  <button
                    onClick={() => router.push(`/mjs/beneficiaire/skill-passport/${id}`)}
                    className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold shadow-md"
                  >
                    Voir mon Skill Passport →
                  </button>
                )}
              </>
            )}
            {!passed && (
              <button onClick={() => { setSubmitted(false); setAnswers({}); setQIdx(0); }}
                className="py-3 px-6 bg-primary text-on-primary rounded-xl font-bold text-sm">
                Réessayer
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
