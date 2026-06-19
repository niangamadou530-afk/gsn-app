"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Beneficiaire = { prenom: string; nom: string };

type PassportInfo = {
  parcours_titre: string;
  secteur_nom: string;
  niveau: string | null;
  delivre_le: string;
};

export default function ProfilBeneficiairePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [beneficiaire, setBeneficiaire] = useState<Beneficiaire | null>(null);
  const [passports, setPassports] = useState<PassportInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/mjs/recruteur/connexion"); return; }

      const { data: recruteur } = await supabase
        .from("mjs_recruteurs")
        .select("id")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .maybeSingle();

      if (!recruteur) { router.push("/mjs/recruteur/connexion"); return; }

      const { data: ben } = await supabase
        .from("mjs_beneficiaires")
        .select("prenom, nom")
        .eq("user_id", userId)
        .eq("tenant_id", "mjs")
        .maybeSingle();

      if (!ben) { router.push("/mjs/recruteur/dashboard"); return; }
      setBeneficiaire(ben);

      const { data: pass } = await supabase
        .from("mjs_skill_passports")
        .select(`
          delivre_le,
          mjs_parcours ( titre, niveau, mjs_secteurs ( nom ) )
        `)
        .eq("user_id", userId)
        .eq("tenant_id", "mjs")
        .order("delivre_le", { ascending: false });

      if (pass) {
        const mapped = (pass as any[]).map((p) => ({
          parcours_titre: p.mjs_parcours?.titre ?? "—",
          secteur_nom: p.mjs_parcours?.mjs_secteurs?.nom ?? "—",
          niveau: p.mjs_parcours?.niveau ?? null,
          delivre_le: p.delivre_le,
        }));
        setPassports(mapped);
      }

      setLoading(false);
    }
    load();
  }, [userId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">Chargement...</p>
      </main>
    );
  }

  if (!beneficiaire) return null;

  const niveauLabel: Record<string, string> = {
    debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé",
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => router.push("/mjs/recruteur/dashboard")}
          className="text-primary text-sm font-bold mb-6 hover:opacity-80 transition-opacity"
        >
          ← Retour aux profils
        </button>

        {/* En-tête profil */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center font-bold text-xl text-on-primary-container flex-shrink-0">
            {beneficiaire.prenom[0]}{beneficiaire.nom[0]}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-background">
              {beneficiaire.prenom} {beneficiaire.nom}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {passports.length} certification{passports.length !== 1 ? "s" : ""} PNACIJ
            </p>
          </div>
        </div>

        {/* Liste des Skill Passports */}
        <h2 className="text-lg font-extrabold mb-4">Compétences certifiées</h2>

        {passports.length === 0 ? (
          <p className="text-on-surface-variant text-sm">Aucune certification pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {passports.map((p, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-tertiary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[22px]">workspace_premium</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface text-sm">{p.parcours_titre}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {p.secteur_nom}
                    {p.niveau && ` · ${niveauLabel[p.niveau] ?? p.niveau}`}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant flex-shrink-0">
                  {new Date(p.delivre_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}