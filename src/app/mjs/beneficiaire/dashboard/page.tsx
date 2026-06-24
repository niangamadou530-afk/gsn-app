"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Beneficiaire = { prenom: string | null; nom: string | null };

type InscriptionRow = {
  parcours_id: string;
  mjs_parcours: {
    id: string;
    titre: string;
    modules_total: number;
    mjs_secteurs: { nom: string; icone: string | null } | null;
  } | null;
  pourcentage: number;
  certifie: boolean;
};

export default function DashboardBeneficiairePage() {
  const router = useRouter();
  const [beneficiaire, setBeneficiaire] = useState<Beneficiaire | null>(null);
  const [inscriptions, setInscriptions] = useState<InscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/mjs/beneficiaire/connexion");
        return;
      }

      const { data: ben } = await supabase
        .from("mjs_beneficiaires")
        .select("prenom, nom")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .maybeSingle();

      setBeneficiaire(ben);

      const [{ data: insc }, { data: progressions }, { data: passports }] = await Promise.all([
        supabase
          .from("mjs_inscriptions")
          .select(`
            parcours_id,
            mjs_parcours (
              id, titre, modules_total,
              mjs_secteurs ( nom, icone )
            )
          `)
          .eq("user_id", user.id)
          .eq("tenant_id", "mjs"),
        supabase
          .from("mjs_progression")
          .select("parcours_id, pourcentage")
          .eq("user_id", user.id)
          .eq("tenant_id", "mjs"),
        supabase
          .from("mjs_skill_passports")
          .select("parcours_id")
          .eq("user_id", user.id)
          .eq("tenant_id", "mjs"),
      ]);

      const progMap = new Map((progressions ?? []).map((p) => [p.parcours_id, p.pourcentage ?? 0]));
      const passportSet = new Set((passports ?? []).map((p) => p.parcours_id));

      if (insc) {
        setInscriptions(
          insc.map((row) => ({
            parcours_id: row.parcours_id,
            mjs_parcours: (() => {
              if (!row.mjs_parcours) return null;
              const p = Array.isArray(row.mjs_parcours) ? row.mjs_parcours[0] : (row.mjs_parcours as any);
              if (!p) return null;
              return {
                id: p.id,
                titre: p.titre,
                modules_total: p.modules_total,
                mjs_secteurs: Array.isArray(p.mjs_secteurs) ? p.mjs_secteurs[0] || null : p.mjs_secteurs || null,
              };
            })() as InscriptionRow["mjs_parcours"],
            pourcentage: progMap.get(row.parcours_id) ?? 0,
            certifie: passportSet.has(row.parcours_id),
          }))
        );
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

  if (!beneficiaire) return null;

  const parcoursActifs = inscriptions.filter((i) => !i.certifie);
  const parcoursTermines = inscriptions.filter((i) => i.certifie);

  const moyenne = inscriptions.length > 0
    ? Math.round(
        inscriptions.reduce((sum, i) => sum + i.pourcentage, 0) / inscriptions.length
      )
    : 0;

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-on-surface-variant text-base">Bonjour,</p>
            <h1 className="text-4xl font-extrabold text-on-background">{beneficiaire.prenom}</h1>
          </div>
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center font-bold text-lg text-on-primary-container">
            {(beneficiaire.prenom?.[0] ?? "")}{(beneficiaire.nom?.[0] ?? "")}
          </div>
        </div>

        {/* Métriques globales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <p className="text-4xl font-extrabold text-primary">{inscriptions.length}</p>
            <p className="text-sm text-on-surface-variant mt-1">Parcours suivis</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <p className="text-4xl font-extrabold text-primary">{moyenne}%</p>
            <p className="text-sm text-on-surface-variant mt-1">Progression moyenne</p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <p className="text-4xl font-extrabold text-tertiary">{parcoursTermines.length}</p>
            <p className="text-sm text-on-surface-variant mt-1">Parcours terminés</p>
          </div>
        </div>

        {/* Parcours en cours */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold">Mes parcours en cours</h2>
          <button
            onClick={() => router.push("/mjs/beneficiaire/parcours")}
            className="text-primary text-sm font-bold hover:opacity-80 transition-opacity"
          >
            + Explorer de nouveaux parcours
          </button>
        </div>

        {inscriptions.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-sm mb-10">
            <span className="material-symbols-outlined text-on-surface-variant text-[40px] mb-3 block">school</span>
            <p className="text-on-surface-variant mb-4">
              Tu n'as encore rejoint aucun parcours de formation.
            </p>
            <button
              onClick={() => router.push("/mjs/beneficiaire/parcours")}
              className="py-3 px-6 bg-primary text-on-primary font-bold rounded-xl active:scale-[0.98] transition-all"
            >
              Découvrir les parcours
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {parcoursActifs.map((i) => {
              const p = i.mjs_parcours;
              const prog = i.pourcentage;
              if (!p) return null;
              return (
                <button
                  key={i.parcours_id}
                  onClick={() => router.push(`/mjs/beneficiaire/parcours/${p.id}`)}
                  className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-primary-container text-[22px]">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-sm truncate">{p.titre}</p>
                      <p className="text-xs text-on-surface-variant">{p.mjs_secteurs?.nom}</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${prog}%` }} />
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant">{prog}% complété</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Parcours terminés */}
        {parcoursTermines.length > 0 && (
          <>
            <h2 className="text-xl font-extrabold mb-4">Parcours terminés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parcoursTermines.map((i) => {
                const p = i.mjs_parcours;
                if (!p) return null;
                return (
                  <button
                    key={i.parcours_id}
                    onClick={() => router.push(`/mjs/beneficiaire/skill-passport/${p.id}`)}
                    className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md flex items-center gap-3 active:scale-[0.98] transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-tertiary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-tertiary-container text-[22px]">workspace_premium</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface text-sm truncate">{p.titre}</p>
                      <p className="text-xs text-on-surface-variant">{p.mjs_secteurs?.nom} · Certifié</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

      </div>
    </main>
  );
}