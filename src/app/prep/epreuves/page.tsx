"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ExamTab = "BAC" | "BFEM";

const SITE_BAC  = "https://officedubac.sn/";
const SITE_BFEM = "https://sunudaara.com/";

export default function EpreuvesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ExamTab>("BAC");

  const site = tab === "BAC" ? SITE_BAC : SITE_BFEM;
  const siteName = tab === "BAC" ? "officedubac.sn" : "sunudaara.com";

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/prep/dashboard")} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold text-on-surface">Épreuves & Corrigés</h1>
      </header>

      <div className="px-6 py-4 space-y-5">

        {/* BAC / BFEM */}
        <div className="flex gap-2 bg-surface-container rounded-xl p-1">
          {(["BAC", "BFEM"] as ExamTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${tab === t ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-bold text-on-surface text-sm">Épreuves & Corrigés {tab}</p>
          <p className="text-sm text-on-surface-variant">
            {tab === "BAC"
              ? "Toutes les épreuves et corrigés officiels du BAC sénégalais sont disponibles sur officedubac.sn. Navigue sur le site pour trouver ta série, matière et année."
              : "Toutes les épreuves et corrigés du BFEM sont disponibles sur sunudaara.com. Navigue sur le site pour trouver ta matière et année."}
          </p>
        </div>

        {/* Bouton principal */}
        <button
          onClick={() => window.open(site, "_blank")}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white active:scale-[0.98] transition-transform"
          style={{ backgroundColor: "#FF6B00" }}>
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>open_in_new</span>
          Accéder aux épreuves
        </button>

        <p className="text-xs text-center text-on-surface-variant">
          Ouvre <span className="font-semibold">{siteName}</span> dans un nouvel onglet
        </p>

      </div>
    </main>
  );
}
