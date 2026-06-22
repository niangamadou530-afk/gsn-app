"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Recruteur = { nom: string; entreprise: string };

type ProfilCertifie = {
  user_id: string;
  prenom: string;
  nom: string;
  parcours_titre: string;
  secteur_nom: string;
  delivre_le: string;
};

export default function DashboardRecruteurPage() {
  const router = useRouter();
  const [recruteur, setRecruteur] = useState<Recruteur | null>(null);
  const [profils, setProfils] = useState<ProfilCertifie[]>([]);
  const [secteurFiltre, setSecteurFiltre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/mjs/recruteur/connexion"); return; }

      const { data: rec } = await supabase
        .from("mjs_recruteurs")
        .select("nom, entreprise")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .maybeSingle();

      if (!rec) { router.push("/mjs/recruteur/connexion"); return; }
      setRecruteur(rec);

      // 1. Récupère les skill passports avec le parcours (relation FK existante)
      const { data: passportsRaw, error: passErr } = await supabase
        .from("mjs_skill_passports")
        .select(`
          user_id, delivre_le,
          mjs_parcours ( titre, mjs_secteurs ( nom ) )
        `)
        .eq("tenant_id", "mjs")
        .order("delivre_le", { ascending: false });

      console.log("passportsRaw:", passportsRaw, "error:", passErr);

      if (!passportsRaw || passportsRaw.length === 0) {
        setProfils([]);
        setLoading(false);
        return;
      }

      // 2. Récupère les bénéficiaires correspondants séparément
      const userIds = Array.from(new Set(passportsRaw.map((p) => p.user_id)));
      const { data: beneficiaires, error: benErr } = await supabase
        .from("mjs_beneficiaires")
        .select("user_id, prenom, nom")
        .in("user_id", userIds)
        .eq("tenant_id", "mjs");

      console.log("beneficiaires:", beneficiaires, "error:", benErr);

      const benMap = new Map((beneficiaires ?? []).map((b) => [b.user_id, b]));

      const mapped = (passportsRaw as any[]).map((p) => ({
        user_id: p.user_id,
        prenom: benMap.get(p.user_id)?.prenom ?? "—",
        nom: benMap.get(p.user_id)?.nom ?? "",
        parcours_titre: p.mjs_parcours?.titre ?? "—",
        secteur_nom: p.mjs_parcours?.mjs_secteurs?.nom ?? "—",
        delivre_le: p.delivre_le,
      }));
      setProfils(mapped);

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

  if (!recruteur) return null;

  const secteurs = Array.from(new Set(profils.map((p) => p.secteur_nom)));
  const profilsFiltres = secteurFiltre ? profils.filter((p) => p.secteur_nom === secteurFiltre) : profils;

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-on-surface-variant text-base">{recruteur.entreprise}</p>
            <h1 className="text-3xl font-extrabold text-on-background">Profils certifiés PNACIJ</h1>
          </div>
        </div>

        {/* Filtres par secteur */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSecteurFiltre(null)}
            className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${
              secteurFiltre === null ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant"
            }`}
          >
            Tous ({profils.length})
          </button>
          {secteurs.map((s) => (
            <button
              key={s}
              onClick={() => setSecteurFiltre(s)}
              className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${
                secteurFiltre === s ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {profilsFiltres.length === 0 ? (
          <p className="text-on-surface-variant text-center py-16">
            Aucun profil certifié pour l'instant{secteurFiltre ? " dans ce secteur" : ""}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profilsFiltres.map((p, i) => (
              <button
                key={i}
                onClick={() => router.push(`/mjs/recruteur/profil/${p.user_id}`)}
                className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container flex-shrink-0">
                    {p.prenom[0]}{p.nom[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-on-surface-variant">{p.secteur_nom}</p>
                  </div>
                </div>
                <div className="bg-tertiary-container rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">workspace_premium</span>
                  <p className="text-xs font-bold text-on-tertiary-container">{p.parcours_titre}</p>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}