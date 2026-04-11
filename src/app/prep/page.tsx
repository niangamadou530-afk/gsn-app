"use client";

import Link from "next/link";

const STATS = [
  { icon: "menu_book", value: "10 000+", label: "épreuves corrigées" },
  { icon: "history_edu", value: "Depuis 2000", label: "archives disponibles" },
  { icon: "auto_awesome", value: "IA", label: "programme personnalisé" },
];

export default function PrepPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">GSN</span>
          <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#FF6B00" }}>PREP</span>
        </div>
        <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium">
          ← Accueil GSN
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FF6B00" + "20" }}>
            <span className="material-symbols-outlined text-[40px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-on-surface leading-tight">
            Réussis ton <span style={{ color: "#FF6B00" }}>BFEM</span> ou ton <span className="text-primary">BAC</span><br />avec l&apos;IA
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            Programme personnalisé, épreuves corrigées et examens blancs adaptés à ton niveau et ton pays.
          </p>
        </section>

        {/* CTA Buttons */}
        <section className="grid grid-cols-2 gap-4">
          <Link href="/prep/onboarding?exam=BFEM"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-400 bg-orange-50 transition-all active:scale-[0.97] shadow-sm">
            <span className="material-symbols-outlined text-[36px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <div className="text-center">
              <p className="font-extrabold text-on-surface">Je prépare</p>
              <p className="text-lg font-black" style={{ color: "#FF6B00" }}>le BFEM</p>
              <p className="text-xs text-on-surface-variant mt-1">3ème · Brevet</p>
            </div>
          </Link>
          <Link href="/prep/onboarding?exam=BAC"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-primary/20 hover:border-primary bg-primary/5 transition-all active:scale-[0.97] shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <div className="text-center">
              <p className="font-extrabold text-on-surface">Je prépare</p>
              <p className="text-lg font-black text-primary">le BAC</p>
              <p className="text-xs text-on-surface-variant mt-1">Terminale · Baccalauréat</p>
            </div>
          </Link>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4 text-center shadow-sm space-y-2">
              <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="font-extrabold text-on-surface text-sm leading-tight">{s.value}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-on-surface">Ce que GSN PREP t&apos;offre</h2>
          {[
            { icon: "route", title: "Programme IA personnalisé", desc: "Adapté à ton niveau, ta série et ton pays" },
            { icon: "quiz", title: "Examens blancs", desc: "Avec correction et explications détaillées" },
            { icon: "library_books", title: "Bibliothèque d'épreuves", desc: "Annales depuis 2000, corrigées par l'IA" },
            { icon: "trending_up", title: "Suivi de progression", desc: "Visualise tes progrès matière par matière" },
            { icon: "self_improvement", title: "Gestion du stress", desc: "Techniques et méthodes pour le jour J" },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{f.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Start CTA */}
        <Link href="/prep/onboarding"
          className="block w-full py-4 text-center font-black text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all text-lg"
          style={{ backgroundColor: "#FF6B00" }}>
          Commencer maintenant →
        </Link>

      </div>
    </main>
  );
}
