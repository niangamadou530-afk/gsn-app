"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type QuizQ = { question: string; options: string[]; answer: number; explanation?: string };
type Section = { title: string; content: string };

export type ModuleContenu = {
  id: string;
  titre: string;
  description: string;
  keywords: string[];
  exercises: string;
  sections: Section[];
  quiz: QuizQ[];
};

type Parcours = {
  id: string;
  titre: string;
  description: string | null;
  niveau: string | null;
  duree_semaines: number | null;
  modules_total: number;
  modules_contenu: ModuleContenu[] | null;
  mjs_secteurs: { nom: string } | null;
};

export default function DetailParcoursPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [quizPassed, setQuizPassed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inscribing, setInscribing] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/mjs/beneficiaire/connexion"); return; }
    setUserId(user.id);

    const { data: p } = await supabase
      .from("mjs_parcours")
      .select("id, titre, description, niveau, duree_semaines, modules_total, modules_contenu, mjs_secteurs ( nom )")
      .eq("id", id)
      .eq("tenant_id", "mjs")
      .single();

    if (!p) { router.push("/mjs/beneficiaire/parcours"); return; }
    setParcours(p as unknown as Parcours);

    const { data: insc } = await supabase
      .from("mjs_inscriptions")
      .select("id, mjs_progression ( modules_faits_ids )")
      .eq("user_id", user.id)
      .eq("parcours_id", id)
      .eq("tenant_id", "mjs")
      .maybeSingle();

    if (insc) {
      setDejaInscrit(true);
      const ids: string[] = (insc as any).mjs_progression?.[0]?.modules_faits_ids ?? [];
      setQuizPassed(new Set(ids));
    }

    setLoading(false);
  }

  async function genererContenu(p: Parcours) {
    setGenerating(true);
    try {
      const prompt = `Génère le contenu détaillé d'un parcours de formation intitulé "${p.titre}" (secteur: ${p.mjs_secteurs?.nom}, niveau: ${p.niveau}, durée: ${p.duree_semaines} semaines).

Réponds UNIQUEMENT avec un tableau JSON de ${p.modules_total} modules, sans texte autour, sans balises markdown :
[
  {
    "id": "m1",
    "titre": "Titre du module",
    "description": "Description courte en 1 phrase",
    "keywords": ["mot-clé 1", "mot-clé 2"],
    "exercises": "Énoncé d'un exercice pratique lié à ce module",
    "sections": [
      { "title": "Titre de section", "content": "Contenu HTML simple de la section (pas de balises complexes)" }
    ],
    "quiz": [
      { "question": "Question ?", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Explication courte" }
    ]
  }
]

Tout en français. Exactement ${p.modules_total} modules. 3 sections par module. 3 questions de quiz par module.`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur API");

      const cleaned = data.reply.replace(/```json|```/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Pas de tableau JSON reçu");
      const modules: ModuleContenu[] = JSON.parse(match[0]);

      await supabase
        .from("mjs_parcours")
        .update({ modules_contenu: modules })
        .eq("id", p.id);

      setParcours({ ...p, modules_contenu: modules });
    } catch (err: any) {
      console.error(err);
      alert("Erreur génération : " + (err.message || "réessaie"));
    } finally {
      setGenerating(false);
    }
  }

  async function sInscrire() {
    if (!parcours || !userId) return;
    setInscribing(true);
    try {
      const { error: inscError } = await supabase
        .from("mjs_inscriptions")
        .insert({ user_id: userId, tenant_id: "mjs", parcours_id: parcours.id });
      if (inscError) throw inscError;

      const { error: progError } = await supabase
        .from("mjs_progression")
        .insert({ user_id: userId, tenant_id: "mjs", parcours_id: parcours.id, modules_faits: 0, pourcentage: 0, modules_faits_ids: [] });
      if (progError) throw progError;

      if (!parcours.modules_contenu || parcours.modules_contenu.length === 0) {
        await genererContenu(parcours);
      }

      setDejaInscrit(true);
    } catch (err: any) {
      console.error(err);
      alert("Erreur inscription : " + (err.message || "réessaie"));
    } finally {
      setInscribing(false);
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </main>
  );

  if (!parcours) return null;

  const niveauLabel: Record<string, string> = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };
  const allIds = parcours.modules_contenu?.map((m) => m.id) ?? [];
  const totalMods = allIds.length;
  const passedCount = quizPassed.size;
  const pct = totalMods > 0 ? Math.round((passedCount / totalMods) * 100) : 0;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">

      {/* Top bar fixe */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <button onClick={() => router.push("/mjs/beneficiaire/parcours")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-base font-bold text-primary truncate max-w-[180px]">{parcours.titre}</span>
        <span className="text-sm font-bold text-primary">{pct}%</span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-6">

        {/* En-tête parcours */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">{parcours.mjs_secteurs?.nom}</p>
          <h1 className="text-xl font-extrabold text-on-surface">{parcours.titre}</h1>
          {parcours.description && <p className="text-sm text-on-surface-variant">{parcours.description}</p>}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            {parcours.niveau && <span>{niveauLabel[parcours.niveau] ?? parcours.niveau}</span>}
            {parcours.duree_semaines && <span>· {parcours.duree_semaines} semaines</span>}
            {parcours.modules_total && <span>· {parcours.modules_total} modules</span>}
          </div>
          {dejaInscrit && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-on-surface-variant">{passedCount} / {totalMods} modules validés</span>
                <span className="text-primary">{pct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Bouton inscription */}
        {!dejaInscrit && (
          <button
            onClick={sInscrire}
            disabled={inscribing || generating}
            className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {generating ? "L'IA prépare le contenu…" : inscribing ? "Inscription..." : "S'inscrire à ce parcours"}
          </button>
        )}

        {/* Spinner génération */}
        {generating && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-on-surface-variant text-sm">L'IA prépare le contenu du parcours…</p>
          </div>
        )}

        {/* Message avant inscription */}
        {!parcours.modules_contenu && !generating && !dejaInscrit && (
          <p className="text-on-surface-variant text-sm text-center py-6">
            Inscris-toi pour que l'IA génère le contenu du parcours.
          </p>
        )}

        {/* Liste des modules */}
        {parcours.modules_contenu && parcours.modules_contenu.length > 0 && (
          <div className="space-y-3">
            {parcours.modules_contenu.map((m, i) => {
              const isPassed = quizPassed.has(m.id);
              const accessible = dejaInscrit && (i === 0 || quizPassed.has(allIds[i - 1]));

              return (
                <button
                  key={m.id}
                  onClick={() => accessible && router.push(`/mjs/beneficiaire/parcours/${id}/module/${m.id}`)}
                  disabled={!accessible}
                  className={`w-full text-left bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-all ${accessible ? "hover:shadow-md active:scale-[0.98] cursor-pointer" : "opacity-50 cursor-not-allowed"} ${isPassed ? "border border-emerald-200" : ""}`}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isPassed ? "bg-emerald-500 text-white" : !accessible ? "bg-surface-container text-outline" : "bg-primary/10 text-primary"}`}>
                    {!dejaInscrit
                      ? <span className="text-xs font-bold">{i + 1}</span>
                      : !accessible
                      ? <span className="material-symbols-outlined text-[16px]">lock</span>
                      : isPassed
                      ? <span className="material-symbols-outlined text-[16px]">check</span>
                      : <span className="text-xs font-bold">{i + 1}</span>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-on-surface">{m.titre}</p>
                    {!accessible && dejaInscrit && <p className="text-xs text-on-surface-variant mt-0.5">Valide le module précédent pour débloquer</p>}
                    {isPassed && <p className="text-xs text-emerald-600 mt-0.5 font-medium">Quiz validé ✓</p>}
                    {accessible && !isPassed && <p className="text-xs text-on-surface-variant mt-0.5">{m.description}</p>}
                  </div>
                  {accessible && (
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">chevron_right</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* CTA test final */}
        {dejaInscrit && totalMods > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm text-center space-y-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Certification</p>
            <h3 className="font-extrabold text-lg text-on-surface">Test final certifié</h3>
            <p className="text-sm text-on-surface-variant">20 questions · Score minimum 70% · Skill Passport</p>
            {passedCount < totalMods && (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">info</span>
                {passedCount}/{totalMods} modules validés — complète tous les modules d&apos;abord
              </div>
            )}
            {passedCount >= totalMods && (
              <button
                onClick={() => router.push(`/mjs/beneficiaire/parcours/${id}/test`)}
                className="inline-block bg-primary text-on-primary px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                Passer le test →
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}