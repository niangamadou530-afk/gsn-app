"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EmployerSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) { setError(authErr.message); return; }

      // signInWithPassword pour obtenir le vrai auth.uid()
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      console.log("[signup] signIn user.id:", loginData?.user?.id, "loginErr:", loginErr?.message);
      if (loginErr || !loginData.user) { setError("Compte créé, mais connexion automatique échouée. Connecte-toi manuellement."); return; }

      const { data: insertData, error: empErr } = await supabase.from("employers").insert({
        auth_id: loginData.user.id,
        email,
        company_name: company,
      }).select();
      console.log("[signup] insert result:", insertData, "error:", empErr?.message, empErr?.code);

      router.push("/employer/dashboard");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-fixed/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary-fixed/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <header className="flex flex-col items-center space-y-3 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_business</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Créer un compte employeur</h1>
          <p className="text-on-surface-variant text-sm">Recrutez les meilleurs talents GSN</p>
        </header>

        <section className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0_8px_24px_rgba(25,28,35,0.07)] space-y-5">
          <form onSubmit={handleSignup} className="space-y-5">

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="company">Nom de l&apos;entreprise</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">business</span>
                <input id="company" type="text" placeholder="Acme Corp" required value={company} onChange={e => setCompany(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="email">Email professionnel</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                <input id="email" type="email" placeholder="contact@entreprise.com" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="password">Mot de passe</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                <input id="password" type="password" placeholder="••••••••" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none" />
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
                <><div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" /> Création…</>
              ) : (
                <><span className="material-symbols-outlined text-[20px]">check_circle</span> Créer mon compte</>
              )}
            </button>
          </form>
        </section>

        <p className="text-center text-sm text-on-surface-variant">
          Déjà un compte ?{" "}
          <Link href="/employer/login" className="text-primary font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
