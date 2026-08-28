"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { phoneToFakeEmail, isValidPhone } from "@/lib/phoneUtils";
import { t } from "@/lib/i18n";

type AuthMethod = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
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

    if (authMethod === "phone" && !isValidPhone(phone)) {
      setErrorMessage(t("auth.login.invalidPhone"));
      return;
    }

    setLoading(true);
    const authEmail = authMethod === "phone" ? phoneToFakeEmail(phone) : email;
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });

    if (error) {
      setLoading(false);
      setErrorMessage(
        error.message === "Invalid login credentials"
          ? authMethod === "phone"
            ? t("auth.login.invalidPhoneCreds")
            : t("auth.login.invalidEmailCreds")
          : error.message
      );
      return;
    }

    const userId = authData.user?.id;
    if (userId) {
      const { data: profile } = await supabase.from("users").select("profile_type").eq("id", userId).single();
      setLoading(false);
      router.push(profile?.profile_type === "eleve" ? "/prep/dashboard" : "/dashboard");
    } else {
      setLoading(false);
      router.push("/dashboard");
    }
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
            <h1 className="text-5xl font-extrabold tracking-tight text-primary leading-none mb-2">GSN</h1>
            <p className="text-on-surface-variant font-medium tracking-wide">{t("auth.tagline")}</p>
          </div>
        </header>

        {/* Card */}
        <section className="w-full bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(25,28,35,0.06)] space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Toggle Email / Téléphone */}
            <div className="flex rounded-xl overflow-hidden border-2 border-outline-variant/30">
              <button
                type="button"
                onClick={() => { setAuthMethod("email"); setErrorMessage(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${authMethod === "email" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[16px]">mail</span>
                {t("auth.login.emailTab")}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod("phone"); setErrorMessage(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${authMethod === "phone" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[16px]">phone</span>
                {t("auth.login.phoneTab")}
              </button>
            </div>

            {/* Email ou numéro */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface ml-1">
                {authMethod === "email" ? t("auth.login.emailLabel") : t("auth.login.phoneLabel")}
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">
                  {authMethod === "email" ? "mail" : "phone"}
                </span>
                {authMethod === "email" ? (
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t("auth.login.emailPlaceholder")}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                  />
                ) : (
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                  />
                )}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-on-surface" htmlFor="password">{t("auth.login.passwordLabel")}</label>
                <a
                  href="https://wa.me/221781246504?text=Hello%2C%20I%20forgot%20my%20GSN%20Prep%20password.%20My%20login%20%28email%20or%20phone%20number%29%20is%3A%20%5Bplease%20fill%20in%5D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline">
                  {t("auth.login.forgotPassword")}
                </a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
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
              className="w-full bg-primary-container text-on-primary-container font-bold py-4 rounded-xl shadow-[0_4px_12px_rgba(0,91,191,0.2)] hover:shadow-[0_8px_24px_rgba(0,91,191,0.3)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
              {loading ? t("auth.login.submitting") : t("auth.login.submit")}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-outline-variant text-xs font-medium">{t("auth.login.or")}</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <Link
            href="/signup"
            className="block w-full text-center py-3.5 bg-surface border border-outline-variant/20 rounded-xl font-semibold text-primary hover:bg-surface-container-low transition-colors active:scale-[0.98] duration-200">
            {t("auth.login.createAccount")}
          </Link>
        </section>

        <footer className="flex items-center justify-center space-x-6 text-outline font-medium text-xs">
          <a className="hover:text-on-surface transition-colors" href="#">{t("auth.footer.terms")}</a>
          <span className="w-1 h-1 bg-outline-variant rounded-full" />
          <a className="hover:text-on-surface transition-colors" href="#">{t("auth.footer.privacy")}</a>
        </footer>
      </div>
    </main>
  );
}
