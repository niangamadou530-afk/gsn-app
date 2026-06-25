"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MjsNavbar from "../MjsNavbar";

type Beneficiaire = {
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  genre: string | null;
  region: string | null;
  situation_handicap: boolean | null;
  statut_insertion: string | null;
};

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

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    telephone: "",
    genre: "",
    region: "",
    situation_handicap: false,
    statut_insertion: "recherche",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("mjs_beneficiaires")
        .update({
          telephone: profileData.telephone || null,
          genre: profileData.genre || null,
          region: profileData.region || null,
          situation_handicap: profileData.situation_handicap,
          statut_insertion: profileData.statut_insertion,
        })
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs");

      if (error) {
        console.error("Error updating profile:", error);
        alert("Erreur lors de la mise à jour du profil.");
      } else {
        alert("Profil mis à jour avec succès !");
        setBeneficiaire((prev) =>
          prev
            ? {
                ...prev,
                telephone: profileData.telephone || null,
                genre: profileData.genre || null,
                region: profileData.region || null,
                situation_handicap: profileData.situation_handicap,
                statut_insertion: profileData.statut_insertion,
              }
            : null
        );
        setShowProfileModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/mjs/beneficiaire/connexion");
        return;
      }

      const { data: ben } = await supabase
        .from("mjs_beneficiaires")
        .select("prenom, nom, email, telephone, genre, region, situation_handicap, statut_insertion")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .maybeSingle();

      if (ben) {
        setBeneficiaire(ben);
        setProfileData({
          telephone: ben.telephone || "",
          genre: ben.genre || "",
          region: ben.region || "",
          situation_handicap: !!ben.situation_handicap,
          statut_insertion: ben.statut_insertion || "recherche",
        });
      }

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface-variant"
              title="Modifier mon profil"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/mjs");
              }}
              className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all text-on-surface-variant"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center font-bold text-lg text-on-primary-container">
              {(beneficiaire.prenom?.[0] ?? "")}{(beneficiaire.nom?.[0] ?? "")}
            </div>
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

        {/* Profil & Infos de contact */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface">Mon Profil & Coordonnées</h2>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Modifier
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Téléphone</p>
              <p className="font-semibold text-on-surface mt-0.5">{beneficiaire.telephone || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Région</p>
              <p className="font-semibold text-on-surface mt-0.5">{beneficiaire.region || "Non renseignée"}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Genre</p>
              <p className="font-semibold text-on-surface mt-0.5">
                {beneficiaire.genre === "M" ? "Homme" : beneficiaire.genre === "F" ? "Femme" : "Non spécifié"}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Handicap</p>
              <p className="font-semibold text-on-surface mt-0.5">
                {beneficiaire.situation_handicap ? "Oui" : "Non"}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Statut Pro</p>
              <p className="font-semibold text-on-surface mt-0.5 truncate">
                {beneficiaire.statut_insertion === "insere"
                  ? "Salarié/Inséré"
                  : beneficiaire.statut_insertion === "entrepreneuriat"
                  ? "Indépendant"
                  : beneficiaire.statut_insertion === "etudes"
                  ? "Études/Formation"
                  : "En recherche"}
              </p>
            </div>
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

      {/* Modal Modifier Profil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-highest rounded-3xl shadow-lg max-w-md w-full p-8 border border-outline-variant/30 text-on-surface">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-on-surface">Mettre à jour mon profil</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                  Numéro de Téléphone *
                </label>
                <input
                  type="text"
                  value={profileData.telephone}
                  onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                  placeholder="Ex: +221 77 123 45 67"
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                    Genre
                  </label>
                  <select
                    value={profileData.genre}
                    onChange={(e) => setProfileData({ ...profileData, genre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                    Région
                  </label>
                  <select
                    value={profileData.region}
                    onChange={(e) => setProfileData({ ...profileData, region: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionner</option>
                    {["Dakar", "Thiès", "Diourbel", "Saint-Louis", "Kaolack", "Ziguinchor", "Kolda", "Fatick", "Louga", "Matam", "Tambacounda", "Kédougou", "Sédhiou", "Kaffrine"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-on-surface-variant mb-1 block">
                  Statut professionnel / Insertion
                </label>
                <select
                  value={profileData.statut_insertion}
                  onChange={(e) => setProfileData({ ...profileData, statut_insertion: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recherche">En recherche d'emploi</option>
                  <option value="insere">Salarié / Inséré professionnellement</option>
                  <option value="entrepreneuriat">Auto-emploi / Entrepreneur</option>
                  <option value="etudes">En études / Formation</option>
                </select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="situation_handicap"
                  checked={profileData.situation_handicap}
                  onChange={(e) => setProfileData({ ...profileData, situation_handicap: e.target.checked })}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <label htmlFor="situation_handicap" className="text-sm font-bold text-on-surface-variant cursor-pointer select-none">
                  Je suis en situation de handicap
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2.5 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingProfile ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MjsNavbar />
    </main>
  );
}