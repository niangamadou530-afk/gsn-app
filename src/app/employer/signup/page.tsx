"use client";

import Link from "next/link";
import { GSN_SIGNUP_CLOSED_MESSAGE } from "@/lib/prep-config";
import { GsnLogo } from "@/components/GsnLogo";

export default function EmployerSignupPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <header className="flex flex-col items-center space-y-3 text-center">
          <GsnLogo size={56} />
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Espace Employeur · WORK
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm">
              Global Skills Network
            </p>
          </div>
        </header>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Inscriptions temporairement fermées
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {GSN_SIGNUP_CLOSED_MESSAGE}
            </p>
            <p className="text-xs text-slate-500 pt-1">
              Les testeurs disposant déjà d&apos;un compte peuvent continuer à se connecter normalement.
            </p>
          </div>

          <div className="pt-3 space-y-2">
            <Link
              href="/employer/login"
              className="w-full py-3.5 px-4 rounded-xl bg-[#005bbf] hover:bg-[#004799] text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Se connecter à mon compte existant</span>
            </Link>

            <Link
              href="/signup?source=prep"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Découvrir l&apos;espace élève GSN PREP</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
