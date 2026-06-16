"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Secteur = { id: string; nom: string; icone: string | null };

type Parcours = {
  id: string;
  titre: string;
  description: string | null;
  niveau: string | null;
  duree_semaines: number | null;
  secteur_id: string;
  mjs_secteurs: { nom: string; icone: string | null } | null;
};

type InscriptionInfo = { parcours_id: string; pourcentage: number };

export default function ListeParcoursPage() {
  const router = useRouter();
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [inscriptions, setInscriptions] = useState<Map<string, number>>(new Map());
  const [secteurFiltre, setSecteurFiltre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/mjs/beneficiaire/connexion");
        return;
      }

      const [{ data: sect }, { data: parc }, { data: insc }] = await Promise.all([
        supabase.from("mjs_secteurs").select("id, nom, icone").eq("tenant_id", "mjs").order("ordre"),
        supabase
          .from("mjs_parcours")
          .select("id, titre, description, niveau, duree_semaines, secteur_id, mjs_secteurs ( nom, icone )")
          .eq("tenant_id", "mjs")
          .order("ordre"),
        supabase
          .from("mjs_inscriptions")
          .select("parcours_id, mjs_progression ( pourcentage )")
          .eq("user_id", user.id)
          .eq("tenant_id", "mjs"),
      ]);

      if (sect) setSecteurs(sect);
      if (parc) setParcours(parc as unknown as Parcours[]);

      if (insc) {
        const map = new Map<string, number>();
        for (const i of insc as any[]) {
          map.set(i.parcours_id, i.mjs_progression?.[0]?.pourcentage ?? 0);
        }
        setInscriptions(map);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">Chargement...</p>
      </main>
    );
  }

  const niveauLabel: Record<string, string> = {
    debutant: "Débutant",
    intermediaire: "Intermédiaire",
    avance: "Avancé",
  };

  const parcoursFiltres = secteurFiltre
    ? parcours.filter((p) => p.secteur_id === secteurFiltre)
    : parcours;

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-on-background">Parcours de formation</h1>
          <button
            onClick={() => router.push("/mjs/beneficiaire/dashboard")}
            className="text-primary text-sm font-bold hover:opacity-80 transition-opacity"
          >
            ← Mon dashboard
          </button>
        </div>

        {/* Filtres par secteur */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSecteurFiltre(null)}
            className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${
              secteurFiltre === null
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant"
            }`}
          >
            Tous
          </button>
          {secteurs.map((s) => (
            <button
              key={s.id}
              onClick={() => setSecteurFiltre(s.id)}
              className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${
                secteurFiltre === s.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              {s.nom}
            </button>
          ))}
        </div>

        {/* Liste des parcours */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parcoursFiltres.map((p) => {
            const dejaInscrit = inscriptions.has(p.id);
            const progression = inscriptions.get(p.id) ?? 0;

            if (dejaInscrit) {
              return (
                <div
                  key={p.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm opacity-80 cursor-default"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-primary-container text-[22px]">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-sm truncate">{p.titre}</p>
                      <p className="text-xs text-on-surface-variant">{p.mjs_secteurs?.nom}</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progression}%` }} />
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant">
                    {progression >= 100 ? "Terminé ✓" : `${progression}% complété — déjà inscrit`}
                  </p>
                </div>
              );
            }

            return (
              <button
                key={p.id}
                onClick={() => router.push(`/mjs/beneficiaire/parcours/${p.id}`)}
                className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container text-[22px]">school</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{p.titre}</p>
                    <p className="text-xs text-on-surface-variant">{p.mjs_secteurs?.nom}</p>
                  </div>
                </div>
                {p.description && (
                  <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  {p.niveau && <span>{niveauLabel[p.niveau] ?? p.niveau}</span>}
                  {p.niveau && p.duree_semaines && <span>·</span>}
                  {p.duree_semaines && <span>{p.duree_semaines} semaines</span>}
                </div>
              </button>
            );
          })}
        </div>

        {parcoursFiltres.length === 0 && (
          <p className="text-on-surface-variant text-center py-12">Aucun parcours disponible pour ce secteur.</p>
        )}

      </div>
    </main>
  );
}