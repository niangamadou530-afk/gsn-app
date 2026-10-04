"use client";

import { FormEvent, useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { phoneToFakeEmail, normalizePhone, isValidPhone } from "@/lib/phoneUtils";
import { t } from "@/lib/i18n";

type ProfileType = "eleve" | "professionnel" | "Beneficiaire du PNACIJ" | "";
type AuthMethod  = "email" | "phone";

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourceParam = searchParams.get("source");
  const examParam = searchParams.get("exam");
  const isFromPrep = sourceParam === "prep" || Boolean(examParam);

  const [step, setStep] = useState<1 | 2>(1);
  const [profileType, setProfileType] = useState<ProfileType>(isFromPrep ? "eleve" : "");
  const [authMethod, setAuthMethod]   = useState<AuthMethod>("email");
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isFromPrep) {
      setProfileType("eleve");
    }
  }, [isFromPrep]);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (authMethod === "phone" && !isValidPhone(phone)) {
      setErrorMessage(t("auth.signup.invalidPhone"));
      return;
    }

    setLoading(true);

    const authEmail = authMethod === "phone" ? phoneToFakeEmail(phone) : email;
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password });

    if (error) {
      setLoading(false);
      setErrorMessage(
        error.message === "User already registered"
          ? authMethod === "phone"
            ? t("auth.signup.phoneTaken")
            : t("auth.signup.emailTaken")
          : error.message
      );
      return;
    }

    if (!data.session) {
      setLoading(false);
      setErrorMessage(
        authMethod === "phone"
          ? t("auth.signup.phoneTakenLogin")
          : t("auth.signup.emailTakenLogin")
      );
      return;
    }

    const userId = data.user?.id;
    // Règle stricte : un compte venu de PREP est TOUJOURS créé avec le profil élève
    const finalProfileType = isFromPrep ? "eleve" : (profileType || "professionnel");

    if (userId) {
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        name: fullName,
        score: 0,
        profile_type: finalProfileType,
      });
      if (insertError) {
        setLoading(false);
        setErrorMessage(insertError.message);
        return;
      }
    }

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
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Top bar */}
      <header className="w-full flex justify-between items-center px-4 sm:px-6 py-3 sm:py-5">
        <span className="text-xl font-bold tracking-tight text-primary">GSN</span>
        <Link href="/login" className="text-primary text-sm font-bold hover:underline">
          {t("auth.signup.login")}
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-6 sm:pb-12 max-w-md mx-auto w-full">
        {/* Branding - compact on mobile to keep button in viewport */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-[2.2rem] font-extrabold tracking-tight text-on-background leading-tight mb-1 sm:mb-2">
            {t("auth.signup.title.line1")}<br /><span className="text-primary">{t("auth.signup.title.line2")}</span>
          </h1>
          <p className="text-xs sm:text-base text-on-surface-variant leading-relaxed">
            {t("auth.signup.subtitle")}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-surface-container"}`} />
          <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-surface-container"}`} />
        </div>

        {/* ── Step 1 : Profil ── */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-on-surface mb-0.5 sm:mb-1">{t("auth.signup.step1.title")}</h2>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t("auth.signup.step1.subtitle")}</p>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {/* Option Élève */}
              <button
                type="button"
                onClick={() => setProfileType("eleve")}
                className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                  profileType === "eleve"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-outline-variant/30 bg-surface-container-lowest shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <span className="text-2xl sm:text-3xl shrink-0">🎓</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-on-surface text-sm sm:text-base">{t("auth.signup.step1.student")}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 truncate sm:whitespace-normal">
                      {isFromPrep && examParam ? `Préparation ${examParam} 2027` : t("auth.signup.step1.studentDesc")}
                    </p>
                  </div>
                  {profileType === "eleve" && (
                    <span className="ml-auto material-symbols-outlined text-primary text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </div>
              </button>

              {/* Option Professionnel : visible avec cadenas si provenance de PREP */}
              <button
                type="button"
                disabled={isFromPrep}
                onClick={() => !isFromPrep && setProfileType("professionnel")}
                className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all ${
                  isFromPrep
                    ? "border-outline-variant/20 bg-surface-container-low/40 opacity-70 cursor-not-allowed"
                    : profileType === "professionnel"
                    ? "border-primary bg-primary/5 active:scale-[0.98]"
                    : "border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <span className="text-2xl sm:text-3xl shrink-0">👨‍💼</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-on-surface text-sm sm:text-base">{t("auth.signup.step1.professional")}</p>
                      {isFromPrep && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          <span>GSN Pro</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {isFromPrep
                        ? "Réservé à l'espace professionnel (inscription élève sélectionnée)"
                        : t("auth.signup.step1.professionalDesc")}
                    </p>
                  </div>
                  {profileType === "professionnel" && !isFromPrep && (
                    <span className="ml-auto material-symbols-outlined text-primary text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </div>
              </button>
            </div>

            <button
              disabled={!profileType}
              onClick={() => setStep(2)}
              className="w-full py-3.5 sm:py-4 bg-primary text-on-primary font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 mt-2"
            >
              {t("auth.signup.step1.continue")}
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ── Step 2 : Identifiants ── */}
        {step === 2 && (
          <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">{profileType === "eleve" ? "🎓" : "👨‍💼"}</span>
                <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                  {profileType === "eleve" ? t("auth.signup.step1.student") : t("auth.signup.step1.professional")}
                  {examParam && ` (${examParam})`}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {/* Nom complet */}
              <div className="relative">
                <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] sm:text-[20px]">
                  person
                </span>
                <input
                  type="text"
                  placeholder={t("auth.signup.step2.fullNamePlaceholder")}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              {/* Toggle Email / Téléphone */}
              <div className="flex rounded-xl overflow-hidden border-2 border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-colors ${
                    authMethod === "email"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px]">mail</span>
                  {t("auth.signup.step2.emailTab")}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-colors ${
                    authMethod === "phone"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px]">phone</span>
                  {t("auth.signup.step2.phoneTab")}
                </button>
              </div>

              {/* Email ou téléphone */}
              {authMethod === "email" ? (
                <div className="relative">
                  <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] sm:text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder={t("auth.signup.step2.emailPlaceholder")}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] sm:text-[20px]">
                    phone
                  </span>
                  <input
                    type="tel"
                    placeholder="+221 77 123 45 67"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              )}

              {/* Mot de passe */}
              <div className="relative">
                <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] sm:text-[20px]">
                  lock
                </span>
                <input
                  type="password"
                  placeholder={t("auth.signup.step2.passwordPlaceholder")}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 bg-error/10 text-error rounded-xl px-3.5 py-2.5">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 bg-primary text-on-primary font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
              ) : (
                <>{t("auth.signup.step2.submit")} <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_forward</span></>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs sm:text-sm text-on-surface-variant mt-4 sm:mt-6">
          {t("auth.signup.alreadyRegistered")}{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            {t("auth.signup.login")}
          </Link>
        </p>
      </div>

      {/* Decorative glows */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignupPageInner />
    </Suspense>
  );
}
