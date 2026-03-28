"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErrorMessage(error.message); return; }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-surface text-on-background flex flex-col items-center justify-center p-6">
      {/* Ambient glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-fixed/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary-fixed/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center space-y-8">

        {/* Header */}
        <header className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <img src="/images/gsn-logo-transparent.png" alt="GSN Global Skills Network" style={{width:"200px", height:"auto", background:"transparent", mixBlendMode:"multiply"}} className="mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium tracking-wide">Apprends, travaille, gagne</p>
          </div>
        </header>

        {/* Card */}
        <section className="w-full bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(25,28,35,0.06)] space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1" htmlFor="email">Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-on-surface" htmlFor="password">Mot de passe</label>
                <a className="text-xs font-bold text-primary hover:underline" href="#">Mot de passe oublié ?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl shadow-[0_4px_12px_rgba(0,91,191,0.2)] hover:shadow-[0_8px_24px_rgba(0,91,191,0.3)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-outline-variant text-xs font-medium">OU</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <Link
            href="/signup"
            className="block w-full text-center py-3.5 bg-surface border border-outline-variant/20 rounded-xl font-semibold text-primary hover:bg-surface-container-low transition-colors active:scale-[0.98] duration-200"
          >
            Créer mon compte
          </Link>
        </section>

        <footer className="flex items-center justify-center space-x-6 text-outline font-medium text-xs">
          <a className="hover:text-on-surface transition-colors" href="#">Conditions d&apos;utilisation</a>
          <span className="w-1 h-1 bg-outline-variant rounded-full" />
          <a className="hover:text-on-surface transition-colors" href="#">Confidentialité</a>
        </footer>
      </div>
    </main>
  );
}
