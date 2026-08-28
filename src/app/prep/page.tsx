"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";

const STATS = [
  { icon: "menu_book", valueKey: "prep.landing.stat1Value", labelKey: "prep.landing.stat1Label" },
  { icon: "history_edu", valueKey: "prep.landing.stat2Value", labelKey: "prep.landing.stat2Label" },
  { icon: "auto_awesome", valueKey: "prep.landing.stat3Value", labelKey: "prep.landing.stat3Label" },
];

const FEATURES = [
  { icon: "route", titleKey: "prep.landing.feature1Title", descKey: "prep.landing.feature1Desc" },
  { icon: "quiz", titleKey: "prep.landing.feature2Title", descKey: "prep.landing.feature2Desc" },
  { icon: "library_books", titleKey: "prep.landing.feature3Title", descKey: "prep.landing.feature3Desc" },
  { icon: "trending_up", titleKey: "prep.landing.feature4Title", descKey: "prep.landing.feature4Desc" },
  { icon: "self_improvement", titleKey: "prep.landing.feature5Title", descKey: "prep.landing.feature5Desc" },
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
          {t("prep.landing.backHome")}
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FF6B00" + "20" }}>
            <span className="material-symbols-outlined text-[40px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <h1 className="text-[2rem] font-extrabold tracking-tight text-on-surface leading-tight">
            {t("prep.landing.headlinePart1")} <span style={{ color: "#FF6B00" }}>BFEM</span> {t("prep.landing.headlinePart2")} <span className="text-primary">BAC</span><br />{t("prep.landing.headlinePart3")}
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            {t("prep.landing.subtitle")}
          </p>
        </section>

        {/* CTA Buttons */}
        <section className="grid grid-cols-2 gap-4">
          <Link href="/prep/onboarding?exam=BFEM"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-400 bg-orange-50 transition-all active:scale-[0.97] shadow-sm">
            <span className="material-symbols-outlined text-[36px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>assignment</span>
            <div className="text-center">
              <p className="font-extrabold text-on-surface">{t("prep.landing.iPrepare")}</p>
              <p className="text-lg font-black" style={{ color: "#FF6B00" }}>{t("prep.landing.bfemLabel")}</p>
              <p className="text-xs text-on-surface-variant mt-1">{t("prep.landing.bfemSub")}</p>
            </div>
          </Link>
          <Link href="/prep/onboarding?exam=BAC"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-primary/20 hover:border-primary bg-primary/5 transition-all active:scale-[0.97] shadow-sm">
            <span className="material-symbols-outlined text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <div className="text-center">
              <p className="font-extrabold text-on-surface">{t("prep.landing.iPrepare")}</p>
              <p className="text-lg font-black text-primary">{t("prep.landing.bacLabel")}</p>
              <p className="text-xs text-on-surface-variant mt-1">{t("prep.landing.bacSub")}</p>
            </div>
          </Link>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {STATS.map(s => (
            <div key={s.labelKey} className="bg-surface-container-lowest rounded-2xl p-4 text-center shadow-sm space-y-2">
              <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="font-extrabold text-on-surface text-sm leading-tight">{t(s.valueKey)}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">{t(s.labelKey)}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-on-surface">{t("prep.landing.featuresTitle")}</h2>
          {FEATURES.map(f => (
            <div key={f.titleKey} className="flex items-start gap-4 bg-surface-container-lowest rounded-xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{t(f.titleKey)}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{t(f.descKey)}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Start CTA */}
        <Link href="/prep/onboarding"
          className="block w-full py-4 text-center font-black text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all text-lg"
          style={{ backgroundColor: "#FF6B00" }}>
          {t("prep.landing.startCta")}
        </Link>

      </div>
    </main>
  );
}
