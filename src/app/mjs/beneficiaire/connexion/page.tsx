"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ConnexionBeneficiairePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Vérifie si le bénéficiaire a déjà choisi un secteur
    const { data: beneficiaire } = await supabase
      .from("mjs_beneficiaires")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("tenant_id", "mjs")
      .maybeSingle();

    if (!beneficiaire) {
      setErrorMessage("Ce compte n'existe pas!");
      setLoading(false);
      setEmail("");
      setPassword("");
    } else {
      router.push("/mjs/beneficiaire/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-md mx-auto w-full">

        <div className="mb-8 mt-3">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <span className="text-on-primary font-black text-xl">GSN</span>
          </div>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-on-background leading-tight mb-2">
            Connexion <span className="text-primary">bénéficiaire</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Accède à tes parcours de formation PNACIJ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-medium px-1">{error}</p>
          )}

          {errorMessage && (
            <p className="text-error text-sm font-medium px-1">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 mt-2"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-on-surface-variant text-sm mt-6">
          Pas encore de compte ?{" "}
          <button
            onClick={() => router.push("/mjs/beneficiaire/inscription")}
            className="text-primary font-bold"
          >
            Inscris-toi
          </button>
        </p>

      </div>

      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}