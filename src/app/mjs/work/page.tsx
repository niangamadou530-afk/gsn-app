"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MjsNavbar from "@/app/mjs/beneficiaire/MjsNavbar";

type Offre = {
  id: string;
  titre: string;
  entreprise: string;
  description: string;
  salaire: string | null;
  localisation: string;
  created_at: string;
};

export default function MjsWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isCertified, setIsCertified] = useState(false);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [appliedOffres, setAppliedOffres] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/mjs/beneficiaire/connexion");
        return;
      }

      // Check if user is certified (has at least one skill passport)
      const { data: passports } = await supabase
        .from("mjs_skill_passports")
        .select("id")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs");

      const hasPassport = !!(passports && passports.length > 0);
      setIsCertified(hasPassport);

      if (hasPassport) {
        // Fetch available job offers
        const [{ data: offersData }, { data: apps }] = await Promise.all([
          supabase
            .from("mjs_offres")
            .select("*")
            .eq("tenant_id", "mjs")
            .order("created_at", { ascending: false }),
          supabase
            .from("mjs_candidatures")
            .select("offre_id")
            .eq("user_id", user.id)
            .eq("tenant_id", "mjs")
        ]);

        setOffres((offersData ?? []) as Offre[]);
        if (apps) {
          setAppliedOffres(new Set(apps.map((a) => a.offre_id)));
        }
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const handleApply = async (offreId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("mjs_candidatures")
        .insert({
          tenant_id: "mjs",
          offre_id: offreId,
          user_id: user.id
        });

      if (error) {
        console.error("Error applying:", error);
        alert("Erreur lors de l'envoi de la candidature.");
      } else {
        setAppliedOffres(new Set([...appliedOffres, offreId]));
        alert("Félicitations ! Votre candidature a été transmise au recruteur avec votre Skill Passport MJS.");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-primary">GSN Work</span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#7b5500] bg-[#ffdeac] px-2.5 py-1 rounded-full">
          MJS / PNACIJ
        </span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-6">
        {!isCertified ? (
          /* Restrained / Locked Screen */
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm text-center py-16 space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <span className="material-symbols-outlined text-[44px]">lock</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-on-surface">Espace de Recrutement Verrouillé</h2>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                L'accès aux offres d'emploi partenaires du Ministère est exclusivement réservé aux jeunes diplômés ayant validé au moins un parcours de formation.
              </p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 text-xs text-on-surface-variant text-left leading-relaxed">
              <strong>Comment débloquer ?</strong>
              <p className="mt-1">Rejoignez un parcours de formation, complétez tous les modules par IA, validez le quiz final à 70% et obtenez votre **Skill Passport**. L'accès s'ouvrira automatiquement.</p>
            </div>
            <button
              onClick={() => router.push("/mjs/beneficiaire/parcours")}
              className="py-3.5 px-6 bg-primary text-on-primary font-bold rounded-xl active:scale-[0.98] transition-all shadow-md shadow-primary/20 hover:opacity-90 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">school</span>
              Commencer une formation
            </button>
          </div>
        ) : (
          /* Job Offers List */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface">Offres d'Emploi PNACIJ</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Postulez directement auprès de nos entreprises partenaires avec vos compétences certifiées.
              </p>
            </div>

            {offres.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-2 block">
                  business_center
                </span>
                <p className="text-sm text-on-surface-variant">
                  Aucune offre d'emploi n'est disponible dans votre région pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offres.map((offre) => {
                  const hasApplied = appliedOffres.has(offre.id);
                  return (
                    <div
                      key={offre.id}
                      className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {offre.localisation}
                          </span>
                          <h2 className="text-lg font-bold text-on-surface mt-1">{offre.titre}</h2>
                          <p className="text-sm text-primary font-bold">{offre.entreprise}</p>
                        </div>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {new Date(offre.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>

                      <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                        {offre.description}
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          {offre.salaire && (
                            <p className="text-sm font-extrabold text-tertiary">
                              <span className="text-xs text-on-surface-variant font-normal">Salaire :</span>{" "}
                              {offre.salaire}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => !hasApplied && handleApply(offre.id)}
                          disabled={hasApplied}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all shadow-sm ${
                            hasApplied
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default"
                              : "bg-primary text-on-primary hover:opacity-90 shadow-primary/10"
                          }`}
                        >
                          {hasApplied ? "Candidature envoyée ✓" : "Postuler"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <MjsNavbar />
    </main>
  );
}
