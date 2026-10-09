"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { phoneToFakeEmail, isValidPhone, normalizePhone } from "@/lib/phoneUtils";
import { checkClientRateLimit, recordClientAttempt, resetClientRateLimit, getFriendlyAuthErrorMessage } from "@/lib/securityUtils";
import { PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";
import { t } from "@/lib/i18n";
import { GsnLogo } from "@/components/GsnLogo";

type AuthMethod = "email" | "phone";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourceParam = searchParams.get("source");
  const examParam = searchParams.get("exam");
  const isFromPrep = sourceParam === "prep" || Boolean(examParam);

  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const targetIdentifier = authMethod === "phone" ? normalizePhone(phone) : email.trim().toLowerCase();

    // 1. Contrôle de débit côté serveur (persistant sur Vercel/multi-instance)
    try {
      const rlRes = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", identifier: targetIdentifier }),
      });
      const rlData = await rlRes.json();
      if (!rlRes.ok || rlData.allowed === false) {
        setErrorMessage(
          rlData.error || `Trop de tentatives pour ce compte. Patiente ${rlData.waitMinutes || 15} minute(s).`
        );
        return;
      }
    } catch {
      // Ignorer si réseau temporairement inaccessible
    }

    if (authMethod === "phone" && !isValidPhone(phone)) {
      setErrorMessage("Numéro de téléphone sénégalais invalide (ex : 77 123 45 67 ou +221 77 123 45 67).");
      return;
    }

    setLoading(true);
    recordClientAttempt("login");

    const authEmail = authMethod === "phone" ? phoneToFakeEmail(phone) : email.trim();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error) {
      setLoading(false);
      const friendly = getFriendlyAuthErrorMessage(error.message, authMethod);
      setErrorMessage(friendly.message);
      return;
    }

    // Réinitialisation du compteur de tentatives en cas de succès (local et serveur)
    resetClientRateLimit("login");
    try {
      await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", identifier: targetIdentifier, success: true }),
      });
    } catch {}

    const userId = authData.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("users")
        .select("profile_type")
        .eq("id", userId)
        .maybeSingle();

      setLoading(false);
      // Redirection selon le profil
      if (profile?.profile_type === "eleve" || isFromPrep) {
        router.push("/prep/dashboard");
      } else {
        router.push("/dashboard");
      }
    } else {
      setLoading(false);
      router.push("/dashboard");
    }
  }

  // Lien WhatsApp d'assistance pour mot de passe
  const enteredIdentifier = authMethod === "phone" ? (phone.trim() || "[Indiquer mon numéro]") : (email.trim() || "[Indiquer mon email]");
  const whatsappHelpUrl = PREP_WHATSAPP_SUPPORT.getPasswordResetUrl(enteredIdentifier);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-3 sm:p-6 relative overflow-x-hidden selection:bg-[#005bbf]/15 selection:text-[#005bbf]">
      {/* Decorative ambient gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100/60 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-100/50 rounded-full blur-[100px]" />
      </div>

      {/* Top Simple Nav : aucun logo ni nom de marque */}
      <header className="w-full max-w-md mx-auto flex items-center justify-end py-2 sm:py-3">
        <Link
          href={isFromPrep ? "/signup?source=prep" : "/signup"}
          className="text-xs sm:text-sm font-bold text-[#005bbf] hover:underline px-1 py-1"
        >
          Créer un compte
        </Link>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-2 sm:py-4">
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-5">
          {/* Header Title */}
          <div className="text-center space-y-3">
            <div className="flex flex-col items-center justify-center gap-2.5 pb-1">
              <div className="w-[108px] h-[108px] sm:w-[124px] sm:h-[124px] flex items-center justify-center">
                <GsnLogo size={116} />
              </div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-800">
                Global Skills Network
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Connexion à ton espace
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isFromPrep
                ? "Retrouve tes quiz, cours et progression pour le BAC & BFEM"
                : "Entre tes identifiants pour accéder à tes programmes"}
            </p>
          </div>

          {/* Toggle Email / Téléphone */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 gap-1">
            <button
              type="button"
              onClick={() => { setAuthMethod("email"); setErrorMessage(""); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMethod === "email"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod("phone"); setErrorMessage(""); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMethod === "phone"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
              <span>Téléphone (+221)</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Field: Email or Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 ml-0.5">
                {authMethod === "email" ? "Adresse email" : "Numéro de téléphone sénégalais"}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  {authMethod === "email" ? "mail" : "call"}
                </span>
                {authMethod === "email" ? (
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex : eleve@exemple.sn"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none"
                  />
                ) : (
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="77 123 45 67 ou +221 77..."
                    required
                    autoComplete="tel"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none font-medium"
                  />
                )}
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-0.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="password">
                  Mot de passe
                </label>
                <a
                  href={whatsappHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#005bbf] hover:underline"
                  title="Aide par WhatsApp"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-medium animate-in fade-in">
                <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5">
                  info
                </span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#005bbf] to-[#004799] hover:from-[#004fa8] hover:to-[#003b80] text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Se connecter</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink mx-3 text-slate-400 text-xs font-semibold">ou</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Sign up prompt */}
          <Link
            href={isFromPrep ? "/signup?source=prep" : "/signup"}
            className="block w-full text-center py-2.5 sm:py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm transition-colors"
          >
            Pas encore de compte ? S&apos;inscrire
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center py-3 text-[11px] text-slate-500 flex items-center justify-center gap-4">
        <span>© 2026 GSN</span>
        <span>·</span>
        <Link href="/prep/parent" className="hover:text-slate-800 transition-colors">
          Espace Parents
        </Link>
        <span>·</span>
        <a
          href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-800 transition-colors"
        >
          Assistance WhatsApp
        </a>
      </footer>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 text-sm">Chargement...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
