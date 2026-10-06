"use client";

import { FormEvent, useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { phoneToFakeEmail, normalizePhone, isValidPhone } from "@/lib/phoneUtils";
import {
  isDisposableEmail,
  checkClientRateLimit,
  recordClientAttempt,
  resetClientRateLimit,
  getFriendlyAuthErrorMessage,
} from "@/lib/securityUtils";
import { PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";
import { t } from "@/lib/i18n";

type ProfileType = "eleve" | "professionnel" | "Beneficiaire du PNACIJ" | "";
type AuthMethod  = "email" | "phone";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourceParam = searchParams.get("source");
  const examParam = searchParams.get("exam");
  const isFromPrep = sourceParam === "prep" || Boolean(examParam);

  const [step, setStep] = useState<1 | 2>(1);
  const [profileType, setProfileType] = useState<ProfileType>(isFromPrep ? "eleve" : "");
  // Pour PREP : le téléphone est la méthode principale par défaut
  const [authMethod, setAuthMethod]   = useState<AuthMethod>(isFromPrep ? "phone" : "email");
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState(isFromPrep ? "+221 " : "");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    if (isFromPrep) {
      setProfileType("eleve");
      setAuthMethod("phone");
      if (!phone) setPhone("+221 ");
    }
  }, [isFromPrep]);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsExistingUser(false);

    const targetIdentifier = authMethod === "phone" ? normalizePhone(phone) : email.trim().toLowerCase();

    // 1. Contrôle de débit côté serveur (persistant sur Vercel/multi-instance)
    try {
      const rlRes = await fetch("/api/auth/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", identifier: targetIdentifier }),
      });
      const rlData = await rlRes.json();
      if (!rlRes.ok || rlData.allowed === false) {
        setErrorMessage(
          rlData.error || `Trop de tentatives d'inscription. Patiente ${rlData.waitMinutes || 15} minute(s).`
        );
        return;
      }
    } catch {
      // Ignorer si réseau instable
    }

    // 2. Validation téléphone sénégalais (obligatoire en mode téléphone)
    if (authMethod === "phone" && !isValidPhone(phone)) {
      setErrorMessage("Numéro de téléphone sénégalais invalide (ex : 77 123 45 67 ou +221 77 123 45 67).");
      return;
    }

    // 3. Validation email si renseigné (obligatoire en mode email, ou optionnel en mode téléphone)
    if (authMethod === "email") {
      if (!email.trim()) {
        setErrorMessage("Veuillez renseigner une adresse email valide.");
        return;
      }
      if (isDisposableEmail(email)) {
        setErrorMessage("Les adresses email temporaires ou jetables ne sont pas autorisées pour créer un compte.");
        return;
      }
    } else if (email.trim() && isDisposableEmail(email)) {
      setErrorMessage("L'adresse email optionnelle renseignée provient d'un service temporaire. Laisse le champ vide ou utilise une adresse email valide.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Ton mot de passe doit comporter au moins 6 caractères pour sécuriser ton compte.");
      return;
    }

    setLoading(true);
    recordClientAttempt("signup");

    const authEmail = authMethod === "phone" ? phoneToFakeEmail(phone) : email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
    });

    if (error) {
      setLoading(false);
      const friendly = getFriendlyAuthErrorMessage(error.message, authMethod);
      setErrorMessage(friendly.message);
      if (friendly.isAlreadyRegistered) {
        setIsExistingUser(true);
      }
      return;
    }

    // Si l'utilisateur existait déjà (Supabase renvoie parfois session nulle)
    if (!data.session && !data.user) {
      setLoading(false);
      setIsExistingUser(true);
      setErrorMessage(
        authMethod === "phone"
          ? "Ce numéro est déjà inscrit. Veux-tu te connecter ?"
          : "Cette adresse email est déjà inscrite. Veux-tu te connecter ?"
      );
      return;
    }

    const userId = data.user?.id;
    // Règle stricte : un compte venu de PREP est TOUJOURS créé avec le profil élève
    const finalProfileType = isFromPrep ? "eleve" : (profileType || "professionnel");

    if (userId) {
      // Synchronisation sécurisée côté serveur via API route
      try {
        await fetch("/api/auth/register-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: fullName.trim(),
            email: email.trim() ? email.trim().toLowerCase() : null,
            phone: authMethod === "phone" ? phone : null,
            profileType: finalProfileType,
            source: sourceParam,
            exam: examParam,
          }),
        });
      } catch (apiErr) {
        console.warn("API register-profile notice:", apiErr);
      }

      // Fallback direct Supabase
      const { error: insertError } = await supabase.from("users").upsert({
        id: userId,
        name: fullName.trim() || "Utilisateur GSN",
        score: 0,
        profile_type: finalProfileType,
      });

      if (insertError) {
        console.warn("Supabase users fallback notice:", insertError.message);
      }
    }

    resetClientRateLimit("signup");
    setLoading(false);

    if (finalProfileType === "eleve") {
      const params = new URLSearchParams();
      if (examParam) params.set("exam", examParam);
      if (authMethod === "phone") params.set("phone", normalizePhone(phone));
      const qs = params.toString();
      router.push(`/prep/onboarding${qs ? `?${qs}` : ""}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-3 sm:p-6 relative overflow-x-hidden selection:bg-[#005bbf]/15 selection:text-[#005bbf]">
      {/* Decorative ambient gradients */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100/60 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-100/50 rounded-full blur-[100px]" />
      </div>

      {/* Top Nav */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-2 sm:py-3">
        <Link href={isFromPrep ? "/prep" : "/"} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#005bbf] to-[#1a73e8] flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            GSN
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            {isFromPrep ? "PREP" : "GLOBAL SKILLS"}
          </span>
          {isFromPrep && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00] border border-orange-200">
              Sénégal 2027
            </span>
          )}
        </Link>

        <Link
          href={isFromPrep ? "/login?source=prep" : "/login"}
          className="text-xs sm:text-sm font-bold text-[#005bbf] hover:underline"
        >
          Déjà inscrit ?
        </Link>
      </header>

      {/* Main Signup Card */}
      <div className="w-full max-w-md mx-auto my-auto py-2 sm:py-4">
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-5">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {step === 1 ? "Créer ton compte" : "Finalise ton inscription"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isFromPrep
                ? "Accède gratuitement aux annales, corrigés officiels et au Coach IA"
                : "Rejoins la plateforme d'apprentissage et d'opportunités"}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-7 h-1.5 rounded-full transition-all ${
                step === 1 ? "bg-[#005bbf] w-10" : "bg-slate-200"
              }`}
            />
            <span
              className={`w-7 h-1.5 rounded-full transition-all ${
                step === 2 ? "bg-[#005bbf] w-10" : "bg-slate-200"
              }`}
            />
          </div>

          {/* ── Étape 1 : Choix du profil ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Choisis ton profil :</p>
              </div>

              <div className="space-y-2.5">
                {/* Option Élève */}
                <button
                  type="button"
                  onClick={() => setProfileType("eleve")}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    profileType === "eleve"
                      ? "border-[#005bbf] bg-blue-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">🎓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-sm text-slate-900">Élève / Candidat</p>
                        {isFromPrep && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00]">
                            {examParam || "BAC & BFEM"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Pour réviser les examens nationaux du Sénégal et accéder aux annales.
                      </p>
                    </div>
                    {profileType === "eleve" && (
                      <span className="material-symbols-outlined text-[#005bbf] text-[20px] shrink-0 font-bold">
                        check_circle
                      </span>
                    )}
                  </div>
                </button>

                {/* Option Professionnel (Cadenas actif si provenance PREP) */}
                <button
                  type="button"
                  disabled={isFromPrep}
                  onClick={() => !isFromPrep && setProfileType("professionnel")}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isFromPrep
                      ? "border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed"
                      : profileType === "professionnel"
                      ? "border-[#005bbf] bg-blue-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">👨‍💼</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-sm text-slate-900">Professionnel</p>
                        {isFromPrep && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[13px]">lock</span>
                            <span>Espace Pro</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isFromPrep
                          ? "Réservé aux pros (inscription élève présélectionnée depuis PREP)."
                          : "Entreprises, formateurs et demandeurs d'emploi GSN."}
                      </p>
                    </div>
                    {profileType === "professionnel" && !isFromPrep && (
                      <span className="material-symbols-outlined text-[#005bbf] text-[20px] shrink-0 font-bold">
                        check_circle
                      </span>
                    )}
                  </div>
                </button>
              </div>

              <button
                type="button"
                disabled={!profileType}
                onClick={() => setStep(2)}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#005bbf] to-[#004799] hover:from-[#004fa8] hover:to-[#003b80] text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* ── Étape 2 : Identifiants ── */}
          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Changer de profil</span>
                </button>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#005bbf] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  <span>{profileType === "eleve" ? "🎓 Élève" : "👨‍💼 Pro"}</span>
                </span>
              </div>

              {/* Nom complet */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 ml-0.5">
                  Prénom & Nom
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    placeholder="ex : Fatou Ndiaye"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none"
                  />
                </div>
              </div>

              {/* CAS A : PREP -> TÉLÉPHONE EN PREMIER (champ principal), EMAIL EN SECOND (optionnel) */}
              {isFromPrep ? (
                <div className="space-y-3 pt-1">
                  {/* Champ Téléphone Principal (+221 par défaut) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between ml-0.5">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>Numéro de téléphone (+221)</span>
                        <span className="text-[10px] text-[#005bbf] font-extrabold uppercase bg-blue-50 px-1.5 py-0.2 rounded">
                          Principal
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMethod(authMethod === "phone" ? "email" : "phone");
                          setErrorMessage("");
                        }}
                        className="text-[11px] font-bold text-[#005bbf] hover:underline"
                      >
                        {authMethod === "phone" ? "Utiliser un email à la place" : "Revenir au numéro (+221)"}
                      </button>
                    </div>

                    {authMethod === "phone" ? (
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                          call
                        </span>
                        <input
                          type="tel"
                          placeholder="+221 77 123 45 67"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          autoComplete="tel"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none font-medium"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                          mail
                        </span>
                        <input
                          type="email"
                          placeholder="fatou@exemple.sn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Champ Email Optionnel (affiché uniquement en mode téléphone) */}
                  {authMethod === "phone" && (
                    <div className="space-y-1 bg-slate-50/70 p-2.5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between ml-0.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">mail</span>
                          <span>Adresse email (optionnel)</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">Facultatif</span>
                      </div>
                      <input
                        type="email"
                        placeholder="ex : fatou@exemple.sn (pour sécuriser ton compte)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf]/15 transition-all outline-none"
                      />
                      <p className="text-[10px] text-slate-500 leading-tight px-0.5">
                        Pour recevoir tes bilans de révision et synthèses de cours (facultatif).
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* CAS B : HORS PREP -> Onglets classiques Email / Téléphone */
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 gap-1">
                    <button
                      type="button"
                      onClick={() => { setAuthMethod("email"); setErrorMessage(""); setIsExistingUser(false); }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
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
                      onClick={() => { setAuthMethod("phone"); setErrorMessage(""); setIsExistingUser(false); }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                        authMethod === "phone"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
                      <span>Téléphone (+221)</span>
                    </button>
                  </div>

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
                          type="email"
                          placeholder="ex : fatou@exemple.sn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none"
                        />
                      ) : (
                        <input
                          type="tel"
                          placeholder="77 123 45 67 ou +221 77..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          autoComplete="tel"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none font-medium"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mot de passe */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 ml-0.5">
                  Mot de passe (au moins 6 caractères)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#005bbf] focus:ring-2 focus:ring-[#005bbf]/15 transition-all outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Messages d'erreur & Redirection intelligente */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-700 text-xs font-medium">
                    <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5">
                      info
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                  {isExistingUser && (
                    <Link
                      href={isFromPrep ? "/login?source=prep" : "/login"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">login</span>
                      <span>Se connecter directement</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Bouton S'inscrire */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#E05300] hover:from-[#f06400] hover:to-[#c84a00] text-white font-extrabold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>S&apos;inscrire et commencer</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Lien vers connexion */}
          <div className="pt-1 text-center">
            <p className="text-xs text-slate-500">
              Déjà un compte ?{" "}
              <Link
                href={isFromPrep ? "/login?source=prep" : "/login"}
                className="font-bold text-[#005bbf] hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 text-sm">Chargement...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
