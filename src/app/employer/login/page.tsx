"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EmployerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr || !authData.user) { setError("Email ou mot de passe incorrect."); return; }

      const { data: employer, error: empErr } = await supabase
        .from("employers").select("id").eq("auth_id", authData.user.id).single();
      if (empErr || !employer) { setError("Aucun compte employeur associé à cet email."); return; }

      router.push("/employer/dashboard");
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-6">
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-fixed/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary-fixed/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center space-y-8">

        {/* Header */}
        <header className="flex flex-col items-center space-y-3 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-1">
            <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Espace Employeur</h1>
          <p className="text-on-surface-variant text-sm">GSN Global Skills Network</p>
        </header>

        {/* Card */}
        <section className="w-full bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_24px_rgba(25,28,35,0.07)] space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="email">Email professionnel</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                <input
                  id="email" type="email" placeholder="contact@entreprise.com" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="password">Mot de passe</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                <input
                  id="password" type={showPwd ? "text" : "password"} placeholder="••••••••" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPwd ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-error/10 text-error rounded-xl px-4 py-3 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-[0_4px_12px_rgba(0,91,191,0.25)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" /> Connexion…</>
              ) : (
                <><span className="material-symbols-outlined text-[20px]">login</span> Accéder au tableau de bord</>
              )}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-outline-variant text-xs font-medium">OU</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <Link href="/employer/signup"
            className="flex w-full items-center justify-center gap-2 py-3.5 bg-surface border border-outline-variant/20 rounded-xl font-semibold text-primary hover:bg-surface-container-low transition-colors active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Créer un compte employeur
          </Link>
        </section>

        <footer className="flex items-center justify-center space-x-6 text-outline font-medium text-xs">
          <Link href="/login" className="hover:text-on-surface transition-colors">Espace apprenant</Link>
          <span className="w-1 h-1 bg-outline-variant rounded-full" />
          <Link href="/" className="hover:text-on-surface transition-colors">Accueil GSN</Link>
        </footer>
      </div>
    </main>
  );
}
