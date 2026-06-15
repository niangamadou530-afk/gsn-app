"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileType = "beneficiaire" | "recruteur" | "";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [profileType, setProfileType] = useState<ProfileType>("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

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
        profile_type: profileType || "recruteur",
      });

      if (insertError) {
        setLoading(false);
        setErrorMessage(insertError.message);
        return;
      }
    }

    setLoading(false);
    if (profileType === "beneficiaire") {
      router.push("/mjs"); {/*route dashboard beneficiaire*/}
    } else {
      router.push("/dashboard"); {/*route dashboard recruteur*/}
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">

      {/* Top bar */}
      <header className="w-full flex justify-between items-center px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-primary">GSN</span>
        <Link href="/login" className="text-primary text-sm font-bold hover:underline">
          Se connecter
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-md mx-auto w-full">

        {/* Branding */}
        <div className="mb-10">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <span className="text-on-primary font-black text-xl">GSN</span>
          </div>
          <h1 className="text-[2.2rem] font-extrabold tracking-tight text-on-background leading-tight mb-2">
            Crée ton<br /><span className="text-primary">compte GSN</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Rejoins le réseau et développe tes compétences numériques.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-surface-container"}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-surface-container"}`} />
        </div>

        {/* Step 1 — Profile type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface mb-1">Vous etes…</h2>
              <p className="text-on-surface-variant text-sm">Choisis ton profil pour une expérience personnalisée.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setProfileType("beneficiaire")}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${profileType === "beneficiaire" ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-surface-container-lowest shadow-sm"}`}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🙍‍♂️</span>
                  <div>
                    <p className="font-bold text-on-surface">Beneficiaire PNACIJ</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Je suis un beneficiaire du programme PNACIJ</p>
                  </div>
                  {profileType === "beneficiaire" && (
                    <span className="ml-auto material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setProfileType("recruteur")}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${profileType === "recruteur" ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-surface-container-lowest shadow-sm"}`}>
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🏫</span>
                  <div>
                    <p className="font-bold text-on-surface">Recruteur / Partenaire MJS</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Je suis un recruteur ou un partenaire de la ministere</p>
                  </div>
                  {profileType === "recruteur" && (
                    <span className="ml-auto material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </div>
              </button>

            </div>

            <button
              disabled={!profileType} 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 mt-2">
              Continuer
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2 — Account details */}
        {step === 2 && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setStep(1)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg">{profileType === "beneficiaire" ? "🙍‍♂️" : "🏫"}</span>
                <span className="text-sm font-semibold text-on-surface-variant">{profileType === "beneficiaire" ? "Beneficiaire" : "Recruteur / Partenaire MJS"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">person</span>
                <input
                  type="text"
                  placeholder={profileType === "beneficiaire" ? "nom complet" : "nom du partenaire"}
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
        )}

        <p className="text-center text-sm text-on-surface-variant mt-8">
          Déjà inscrit ?{" "}
          <Link href="/mjs/login" className="text-primary font-bold hover:underline">
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
