"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        name: fullName,
        score: 0,
      });

      if (insertError) {
        setLoading(false);
        setErrorMessage(insertError.message);
        return;
      }
    }

    setLoading(false);
    setSuccessMessage("Compte créé avec succès. Tu peux maintenant te connecter.");
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">

      {/* Top bar */}
      <header className="w-full flex justify-between items-center px-6 py-5">
        <img src="/images/gsn-logo-transparent.png" alt="GSN" style={{width:"140px", height:"auto"}} />
        <Link href="/login" className="text-primary text-sm font-bold hover:underline">
          Se connecter
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-md mx-auto w-full">

        {/* Branding */}
        <div className="mb-10">
          <img src="/images/gsn-logo-transparent.png" alt="GSN Global Skills Network" style={{width:"140px", height:"auto"}} className="mb-6" />
          <h1 className="text-[2.2rem] font-extrabold tracking-tight text-on-background leading-tight mb-2">
            Crée ton<br /><span className="text-primary">compte GSN</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Rejoins le réseau et développe tes compétences numériques.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">person</span>
              <input
                type="text"
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-11 pr-4 py-4 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">mail</span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-11 pr-4 py-4 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">lock</span>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-11 pr-4 py-4 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 bg-error/10 text-error rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
            ) : (
              <>
                Créer mon compte
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-8">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>

      {/* Decorative glows */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}
