"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Recruteur = { nom: string; entreprise: string };

type Offre = {
  id: string;
  titre: string;
  description: string;
  salaire: string | null;
  localisation: string;
  created_at: string;
};

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
  const [offres, setOffres] = useState<Offre[]>([]);
  const [secteurFiltre, setSecteurFiltre] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ titre: "", description: "", localisation: "", salaire: "" });
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
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

      // Fetch recruiter's published offers
      const { data: offersData } = await supabase
        .from("mjs_offres")
        .select("id, titre, description, salaire, localisation, created_at")
        .eq("recruteur_id", user.id)
        .eq("tenant_id", "mjs")
        .order("created_at", { ascending: false });

      setOffres((offersData ?? []) as Offre[]);

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

      // Fetch candidatures for recruiter's offers
      const { data: candData } = await supabase
        .from("mjs_candidatures")
        .select(`
          id,
          offre_id,
          user_id,
          created_at,
          mjs_offres ( titre, recruteur_id )
        `)
        .eq("tenant_id", "mjs");

      const myCandidatures = (candData ?? []).filter((c: any) => c.mjs_offres?.recruteur_id === user.id);

      if (myCandidatures.length > 0) {
        const candidateIds = Array.from(new Set(myCandidatures.map((c: any) => c.user_id)));
        const { data: candProfiles } = await supabase
          .from("mjs_beneficiaires")
          .select("user_id, prenom, nom, email, telephone")
          .in("user_id", candidateIds)
          .eq("tenant_id", "mjs");

        const profileMap = new Map((candProfiles ?? []).map((cp) => [cp.user_id, cp]));

        const mappedCands = myCandidatures.map((c: any) => ({
          id: c.id,
          offre_id: c.offre_id,
          offre_titre: c.mjs_offres?.titre || "Offre",
          user_id: c.user_id,
          prenom: profileMap.get(c.user_id)?.prenom ?? "Candidat",
          nom: profileMap.get(c.user_id)?.nom ?? "Inconnu",
          email: profileMap.get(c.user_id)?.email ?? null,
          telephone: profileMap.get(c.user_id)?.telephone ?? null,
          created_at: c.created_at
        }));

        setCandidatures(mappedCands);
      } else {
        setCandidatures([]);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const handleAddOffre = async () => {
    if (!formData.titre || !formData.description || !formData.localisation) {
      alert("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !recruteur) return;

      const { data: newOffres, error } = await supabase
        .from("mjs_offres")
        .insert({
          tenant_id: "mjs",
          recruteur_id: userData.user.id,
          titre: formData.titre,
          entreprise: recruteur.entreprise,
          description: formData.description,
          salaire: formData.salaire || null,
          localisation: formData.localisation
        })
        .select();

      if (error) {
        console.error("Error creating offer:", error);
        alert("Erreur lors de la création de l'offre.");
      } else {
        alert("Offre d'emploi publiée avec succès !");
        if (newOffres && newOffres[0]) {
          setOffres([newOffres[0] as Offre, ...offres]);
        }
        setFormData({ titre: "", description: "", localisation: "", salaire: "" });
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">add</span>
            Ajouter une offre
          </button>
        </div>

        {/* Modal Ajouter Offre */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container-highest rounded-3xl shadow-lg max-w-md w-full p-8 border border-outline-variant/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-on-surface">Nouvelle Offre d'Emploi</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-surface-container rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 mb-6 text-on-surface">
                <div>
                  <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                    Titre du poste *
                  </label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Ex: Développeur Full Stack"
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le poste, les responsabilités et les qualifications requises..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                    Localisation (Région) *
                  </label>
                  <select
                    value={formData.localisation}
                    onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionner une région</option>
                    {["Dakar", "Thiès", "Diourbel", "Saint-Louis", "Kaolack", "Ziguinchor", "Kolda", "Fatick", "Louga", "Matam", "Tambacounda", "Kédougou", "Sédhiou", "Kaffrine"].map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                    Salaire proposé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.salaire}
                    onChange={(e) => setFormData({ ...formData, salaire: e.target.value })}
                    placeholder="Ex: 250 000 - 350 000 FCFA"
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddOffre}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? "Création..." : "Créer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mes Offres Publiées */}
        {offres.length > 0 && (
          <div className="mb-10 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-on-surface mb-4">Mes Offres Publiées ({offres.length})</h2>
            <div className="space-y-3">
              {offres.map((offre) => (
                <div key={offre.id} className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-on-surface">{offre.titre}</h3>
                      <p className="text-xs text-on-surface-variant">{offre.localisation}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                      {new Date(offre.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">{offre.description}</p>
                  {offre.salaire && (
                    <p className="text-xs font-bold text-tertiary">{offre.salaire}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidatures Reçues */}
        <div className="mb-10 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4">Candidatures reçues ({candidatures.length})</h2>
          {candidatures.length === 0 ? (
            <div className="text-center py-10 px-4 bg-surface-container/30 rounded-2xl border border-outline-variant/10 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 text-outline-variant block">mail_outline</span>
              Aucune candidature reçue pour le moment.
              <p className="text-xs text-on-surface-variant/75 mt-1 max-w-sm mx-auto">
                Dès que des jeunes certifiés postuleront à vos offres d'emploi actives, leurs coordonnées s'afficheront ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidatures.map((cand) => (
                <div key={cand.id} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20 flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center uppercase">
                        {(cand.prenom?.[0] ?? "")}{(cand.nom?.[0] ?? "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-on-surface text-sm truncate">{cand.prenom} {cand.nom}</p>
                        <p className="text-xs text-on-surface-variant truncate">Postule pour : <span className="font-semibold text-primary">{cand.offre_titre}</span></p>
                      </div>
                    </div>

                    {/* Contacts du candidat */}
                    <div className="pt-2 border-t border-outline-variant/10 space-y-1.5">
                      {cand.email && (
                        <a
                          href={`mailto:${cand.email}`}
                          className="flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[15px]">mail</span>
                          <span className="truncate">{cand.email}</span>
                        </a>
                      )}
                      {cand.telephone && (
                        <a
                          href={`tel:${cand.telephone}`}
                          className="flex items-center gap-2 text-xs text-secondary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[15px]">phone</span>
                          <span>{cand.telephone}</span>
                        </a>
                      )}
                      {!cand.email && !cand.telephone && (
                        <p className="text-xs text-on-surface-variant italic">Aucune coordonnée renseignée</p>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Reçue le {new Date(cand.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/mjs/recruteur/profil/${cand.user_id}`)}
                    className="mt-4 py-2 px-4 bg-primary-container text-on-primary-container text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all inline-flex items-center justify-center gap-1 self-start"
                  >
                    Voir le Skill Passport
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          )}
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