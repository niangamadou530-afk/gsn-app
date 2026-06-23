"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ParcoursListItem, Secteur } from "./types";
import { NIVEAU_LABEL } from "./types";

export default function ListeParcoursPage() {
  const router = useRouter();
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [parcours, setParcours] = useState<ParcoursListItem[]>([]);
  const [inscritIds, setInscritIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/mjs/beneficiaire/connexion");
      return;
    }

    const [{ data: secteursData }, { data: parcoursData }, { data: inscriptions }] = await Promise.all([
      supabase
        .from("mjs_secteurs")
        .select("id, nom, slug, icone, ordre")
        .eq("tenant_id", "mjs")
        .order("ordre"),
      supabase
        .from("mjs_parcours")
        .select("id, titre, description, niveau, duree_semaines, modules_total, secteur_id")
        .eq("tenant_id", "mjs")
        .order("ordre"),
      supabase
        .from("mjs_inscriptions")
        .select("parcours_id")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs"),
    ]);

    setSecteurs((secteursData ?? []) as Secteur[]);
    setParcours((parcoursData ?? []) as ParcoursListItem[]);
    setInscritIds(new Set((inscriptions ?? []).map((i) => i.parcours_id)));
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <button
          onClick={() => router.push("/mjs/beneficiaire/dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-base font-bold text-primary">Parcours de formation</span>
        <div className="w-10" />
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Explorer les parcours</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Choisis un parcours par secteur et inscris-toi pour commencer.
          </p>
        </div>

        {secteurs.map((secteur) => {
          const items = parcours.filter((p) => p.secteur_id === secteur.id);
          if (items.length === 0) return null;

          return (
            <section key={secteur.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-[18px]">
                    {secteur.icone ? secteur.icone.replace("ti-", "") : "category"}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-on-surface">{secteur.nom}</h2>
              </div>

              <div className="space-y-3">
                {items.map((p) => {
                  const inscrit = inscritIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/mjs/beneficiaire/parcours/${p.id}`)}
                      className="w-full text-left bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-on-surface">{p.titre}</p>
                          {p.description && (
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{p.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-on-surface-variant">
                            {p.niveau && <span>{NIVEAU_LABEL[p.niveau] ?? p.niveau}</span>}
                            {p.duree_semaines && <span>· {p.duree_semaines} sem.</span>}
                            <span>· {p.modules_total} modules</span>
                          </div>
                        </div>
                        {inscrit && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                            Inscrit
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {parcours.length === 0 && (
          <p className="text-center text-on-surface-variant text-sm py-12">
            Aucun parcours disponible pour le moment.
          </p>
        )}
      </div>
    </main>
  );
}
