"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ModuleContenu = { id: string; titre: string; description: string; contenu: string };

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
  const [modulesFaits, setModulesFaits] = useState<Set<string>>(new Set());
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
      const ids = (insc as any).mjs_progression?.[0]?.modules_faits_ids ?? [];
      setModulesFaits(new Set(ids));
    }

    setLoading(false);
  }

  // Génère le contenu détaillé via l'IA (une seule fois, partagé pour tout le monde)
  async function genererContenu(p: Parcours) {
    setGenerating(true);
    try {
      const prompt = `Génère le contenu détaillé d'un parcours de formation intitulé "${p.titre}" (secteur: ${p.mjs_secteurs?.nom}, niveau: ${p.niveau}, durée: ${p.duree_semaines} semaines).

Réponds UNIQUEMENT avec un tableau JSON (sans texte autour) de ${p.modules_total} modules :
[
  {
    "id": "m1",
    "titre": "Titre du module",
    "description": "Description courte en 1 phrase",
    "contenu": "Contenu pédagogique détaillé en 4 à 6 paragraphes, expliquant les concepts clés, exemples concrets et conseils pratiques."
  }
]

Tout en français, exactement ${p.modules_total} modules.`;

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

      // Sauvegarde sur le parcours (partagé pour tous les futurs bénéficiaires)
      const { error: updateError } = await supabase
        .from("mjs_parcours")
        .update({ modules_contenu: modules })
        .eq("id", p.id);

      if (updateError) throw updateError;

      setParcours({ ...p, modules_contenu: modules });
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la génération du contenu : " + (err.message || "réessaie"));
    } finally {
      setGenerating(false);
    }
  }

  async function sInscrire() {
    if (!parcours || !userId) return;
    setInscribing(true);

    try {
      // 1. Créer l'inscription
      const { error: inscError } = await supabase
        .from("mjs_inscriptions")
        .insert({ user_id: userId, tenant_id: "mjs", parcours_id: parcours.id });

      if (inscError) throw inscError;

      // 2. Créer la ligne de progression initiale
      const { error: progError } = await supabase
        .from("mjs_progression")
        .insert({
          user_id: userId,
          tenant_id: "mjs",
          parcours_id: parcours.id,
          modules_faits: 0,
          pourcentage: 0,
          modules_faits_ids: [],
        });

      if (progError) throw progError;

      // 3. Si le contenu n'existe pas encore, le générer maintenant
      if (!parcours.modules_contenu || parcours.modules_contenu.length === 0) {
        await genererContenu(parcours);
      }

      setDejaInscrit(true);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'inscription : " + (err.message || "réessaie"));
    } finally {
      setInscribing(false);
    }
  }

  async function toggleModule(moduleId: string) {
    if (!parcours || !userId) return;

    const nouveauxFaits = new Set(modulesFaits);
    if (nouveauxFaits.has(moduleId)) {
      nouveauxFaits.delete(moduleId);
    } else {
      nouveauxFaits.add(moduleId);
    }
    setModulesFaits(nouveauxFaits);

    const total = parcours.modules_total || parcours.modules_contenu?.length || 1;
    const pourcentage = Math.round((nouveauxFaits.size / total) * 100);

    await supabase
      .from("mjs_progression")
      .update({
        modules_faits: nouveauxFaits.size,
        pourcentage,
        modules_faits_ids: Array.from(nouveauxFaits),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("parcours_id", parcours.id)
      .eq("tenant_id", "mjs");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">Chargement...</p>
      </main>
    );
  }

  if (!parcours) return null;

  const niveauLabel: Record<string, string> = {
    debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé",
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => router.push("/mjs/beneficiaire/parcours")}
          className="text-primary text-sm font-bold mb-6 hover:opacity-80 transition-opacity"
        >
          ← Tous les parcours
        </button>

        {/* En-tête */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm mb-8">
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
            {parcours.mjs_secteurs?.nom}
          </p>
          <h1 className="text-2xl font-extrabold text-on-background mb-2">{parcours.titre}</h1>
          {parcours.description && (
            <p className="text-on-surface-variant text-sm mb-4">{parcours.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-5">
            {parcours.niveau && <span>{niveauLabel[parcours.niveau] ?? parcours.niveau}</span>}
            {parcours.duree_semaines && <span>· {parcours.duree_semaines} semaines</span>}
            {parcours.modules_total && <span>· {parcours.modules_total} modules</span>}
          </div>

          {!dejaInscrit && (
            <button
              onClick={sInscrire}
              disabled={inscribing || generating}
              className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {generating ? "L'IA prépare le contenu…" : inscribing ? "Inscription..." : "S'inscrire à ce parcours"}
            </button>
          )}

          {dejaInscrit && (
            <div className="bg-primary-container rounded-xl p-3 text-center text-sm font-bold text-on-primary-container">
              Tu es inscrit à ce parcours
            </div>
          )}
        </div>

        {/* Contenu / modules */}
        {!parcours.modules_contenu && !generating && (
          <p className="text-on-surface-variant text-sm text-center py-8">
            Le contenu détaillé sera généré par l'IA dès ton inscription.
          </p>
        )}

        {generating && (
          <div className="flex flex-col items-center py-12 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-on-surface-variant text-sm">L'IA prépare le contenu du parcours…</p>
          </div>
        )}

        {parcours.modules_contenu && parcours.modules_contenu.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold mb-2">Modules</h2>
            {parcours.modules_contenu.map((m, i) => {
              const fait = modulesFaits.has(m.id);
              return (
                <div key={m.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    {dejaInscrit ? (
                      <button
                        onClick={() => toggleModule(m.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          fait ? "bg-primary" : "bg-surface-container border-2 border-outline-variant"
                        }`}
                      >
                        {fait && <span className="material-symbols-outlined text-on-primary text-[16px]">check</span>}
                      </button>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-on-surface-variant">{i + 1}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-on-surface text-sm">{i + 1}. {m.titre}</p>
                      <p className="text-xs text-on-surface-variant mt-1 mb-3">{m.description}</p>
                      {dejaInscrit && (
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{m.contenu}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}