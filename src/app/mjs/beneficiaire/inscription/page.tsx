"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function InscriptionBeneficiairePage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    // 1. Créer le compte Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nom, prenom } },
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Un compte existe déjà avec cet email."
        : "Une erreur est survenue. Réessaie.");
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Une erreur est survenue. Réessaie.");
      setLoading(false);
      return;
    }

    // 2. Créer la fiche bénéficiaire (sans secteur pour l'instant)
    const { error: insertError } = await supabase
      .from("mjs_beneficiaires")
      .insert({
        user_id: data.user.id,
        tenant_id: "mjs",
        nom,
        prenom,
      });

    if (insertError) {
      console.error("Insert error:", JSON.stringify(insertError, null, 2));
      setError("Compte créé mais erreur lors de l'enregistrement du profil.");
      setLoading(false);
      return;
    }

    // 3. Rediriger vers le choix du secteur
    router.push("/mjs/onboarding");
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-md mx-auto w-full">

        <div className="mb-6 mt-3">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <span className="text-on-primary font-black text-xl">GSN</span>
          </div>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-on-background leading-tight mb-2">
            Crée ton <span className="text-primary">compte</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Rejoins le programme PNACIJ en quelques secondes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-on-surface mb-1.5 block">Prénom</label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Fatou"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-on-surface mb-1.5 block">Nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Diallo"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-on-surface mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton.email@exemple.com"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-on-surface mb-1.5 block">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-medium px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 mt-2"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-on-surface-variant text-sm mt-6">
          Déjà inscrit ?{" "}
          <button
            onClick={() => router.push("/mjs/beneficiaire/connexion")}
            className="text-primary font-bold"
          >
            Connecte-toi
          </button>
        </p>

      </div>

      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}