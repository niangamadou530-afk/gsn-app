"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileType = "beneficiaire" | "recruteur" | "";

export default function AccueilPage() {
  const router = useRouter();
  const [profileType, setProfileType] = useState<ProfileType>("");


  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">

      <div className="flex-1 flex flex-col justify-center px-6 pb-16 max-w-md mx-auto w-full">

        {/* Branding */}
        <div className="mb-3 mt-3">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <span className="text-on-primary font-black text-xl">GSN</span>
          </div>
          <h1 className="text-[2.2rem] font-extrabold tracking-tight text-on-background leading-tight mb-2">
            Bienvenue dans l'<br /><span className="text-primary">Espace MJS</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Rejoins le réseau et développe tes compétences numériques.
          </p>
        </div>

        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1 rounded-full transition-colors bg-primary" />
        </div>


        {
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
              onClick={() => {
                profileType === "beneficiaire"
                ? router.push("/mjs/beneficiaire/connexion")
                : router.push("/mjs/recruteur/connexion");
                setProfileType("");
              }}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 mt-2">
              Choisir
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </button>
          </div>
        }

      </div>

      {/* Decorative glows */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}
