"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getExamCountdown, PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";
import { LiveExamCountdownCard } from "@/components/LiveExamCountdown";
import { FaqSection } from "@/components/FaqSection";
import { Reveal } from "@/components/Reveal";

export default function PrepLandingPage() {
  const [selectedExam, setSelectedExam] = useState<"BAC" | "BFEM">("BAC");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const countdownBac = getExamCountdown("BAC");
  const countdownBfem = getExamCountdown("BFEM");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] overflow-x-hidden">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#005bbf] to-[#1a73e8] flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                GSN
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">PREP</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF6B00]">
                  Sénégal 2027
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-700 whitespace-nowrap">
            <a href="#programmes" className="hover:text-[#005bbf] transition-colors whitespace-nowrap">Examens & Séries</a>
            <a href="#fonctionnalites" className="hover:text-[#005bbf] transition-colors whitespace-nowrap">Outils IA</a>
            <a href="#annales" className="hover:text-[#005bbf] transition-colors whitespace-nowrap">Annales & Corrigés</a>
            <a href="#faq" className="hover:text-[#005bbf] transition-colors whitespace-nowrap">FAQ</a>
            <Link href="/prep/parent" className="hover:text-purple-700 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 font-bold text-purple-700">
              <span className="material-symbols-outlined text-[16px] text-purple-600">family_restroom</span>
              <span className="whitespace-nowrap">Espace Parents</span>
            </Link>
          </nav>

          {/* Action Buttons & Mobile Access */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Direct Button (Tableau de bord ONLY - no duplicate Parents button!) */}
            <Link
              href="/prep/dashboard"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#005bbf] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              <span className="whitespace-nowrap">Tableau de bord</span>
            </Link>

            {/* Mobile Dropdown Menu for Parents & Dashboard */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${
                  mobileMenuOpen
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                }`}
                title="Accès rapide Parents & Tableau de bord"
                aria-label="Accès rapide"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {mobileMenuOpen ? "close" : "widgets"}
                </span>
              </button>

              {/* Mobile Quick Dropdown Popover */}
              {mobileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 tracking-wider">
                    Accès direct
                  </p>
                  <Link
                    href="/prep/parent"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                    <span>Espace Parents</span>
                  </Link>
                  <Link
                    href="/prep/dashboard"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#005bbf] hover:bg-blue-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    <span>Tableau de bord</span>
                  </Link>
                  <div className="h-px bg-slate-100 my-1" />
                  <a
                    href="#programmes"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    <span>Séries BAC & BFEM</span>
                  </a>
                  <a
                    href="#annales"
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_stories</span>
                    <span>Annales & Corrigés</span>
                  </a>
                </div>
              )}
            </div>

            {/* Connexion & S'inscrire - fully visible at 360px without clipping */}
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
              style={{ backgroundColor: "#FF6B00" }}
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/50 to-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and Call to action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#005bbf] text-xs font-bold tracking-tight">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Conforme au programme officiel de l&apos;Office du Baccalauréat</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Réussis ton <span className="text-[#FF6B00]">BFEM</span> ou ton <span className="text-[#005bbf]">BAC 2027</span> avec mention.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Toutes les annales officielles avec corrigés détaillés, un Coach IA pédagogue 24h/24, des quiz interactifs et le simulateur de moyenne officiel du Sénégal.
              </p>

              {/* Exam Switcher Buttons */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Sélectionne ton objectif pour démarrer :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
                  <Link
                    href="/signup?source=prep&exam=BAC"
                    className="p-4 rounded-2xl border-2 border-orange-300 bg-white hover:border-[#FF6B00] shadow-sm hover:shadow-md transition-all text-left group flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[24px]">school</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">Candidat au BAC</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00]">2027</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Séries S1, S2, L1, L2, STEG, T...</p>
                      <p className="text-[11px] font-semibold text-[#FF6B00] mt-1.5 flex items-center gap-1" suppressHydrationWarning>
                        J-{countdownBac.days} jours restants <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/signup?source=prep&exam=BFEM"
                    className="p-4 rounded-2xl border-2 border-blue-200 bg-white hover:border-[#005bbf] shadow-sm hover:shadow-md transition-all text-left group flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#005bbf] shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-[24px]">assignment</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">Candidat au BFEM</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#005bbf]">2027</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Collège · 3ème générale & arabe</p>
                      <p className="text-[11px] font-semibold text-[#005bbf] mt-1.5 flex items-center gap-1" suppressHydrationWarning>
                        J-{countdownBfem.days} jours restants <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Discreet existing account link */}
                <div className="mt-2.5 text-center sm:text-left">
                  <p className="text-xs text-slate-500 font-medium">
                    Tu as déjà un compte élève ?{" "}
                    <Link href="/login" className="font-bold text-[#005bbf] hover:underline">
                      J&apos;ai déjà un compte
                    </Link>
                  </p>
                </div>

                {/* Direct Action Button */}
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto lg:mx-0">
                  <Link
                    href="/prep/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#005bbf] hover:bg-[#004ba0] text-white text-sm font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    <span>Accéder au Tableau de bord</span>
                  </Link>
                  <Link
                    href="/prep/epreuves"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-xs active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                    <span>Consulter les annales</span>
                  </Link>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Sujets réels 2023-2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Corrigés officiels validés</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Accessible sur mobile & PC</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Visual Backdrop Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-[4/3] sm:aspect-[16/10]">
                  <Image
                    src="/images/prep_hero_students.jpg"
                    alt="Élèves sénégalais révisant pour le BAC et le BFEM"
                    fill
                    className="object-cover"
                    priority
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                  {/* Overlaid Banner at Bottom - fully visible without obstruction */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Session 2027</p>
                        <p className="font-extrabold text-base sm:text-lg">Prépare ton avenir dès maintenant</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <span className="material-symbols-outlined text-[20px] text-white">bolt</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Stat Card (Annales complètes - updated to +600) */}
                <div className="absolute -top-3 right-2 sm:-top-4 sm:-right-4 bg-white rounded-2xl p-2.5 sm:p-3.5 shadow-xl border border-slate-100 flex items-center gap-2 sm:gap-3 z-20 max-w-[calc(100%-1rem)]">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-[18px] sm:text-[22px]">auto_stories</span>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Annales complètes</p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">+600 épreuves et corrigés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countdown & Key Milestones Bar with Live Real-Time Countdowns */}
      <section className="bg-slate-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1 text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B00]">Calendrier officiel 2027</p>
              <h2 className="text-xl sm:text-2xl font-extrabold">Les dates clés des examens</h2>
              <p className="text-xs text-slate-400">Reste informé pour organiser tes révisions sereinement.</p>
            </div>

            {/* BAC Aesthetic Timer */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-700/80 shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-500/20 text-[#FF9E4A] border border-orange-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] animate-pulse" />
                  Baccalauréat 2027
                </span>
                <span className="text-xs text-amber-200 font-bold">{countdownBac.displayDate}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 bg-slate-950/70 rounded-2xl p-3 border border-slate-700/80 text-center">
                  <span className="block text-3xl sm:text-4xl font-black text-[#FF7A1A] tabular-nums" suppressHydrationWarning>
                    {countdownBac.days}
                  </span>
                  <span className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">Jours restants</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#FF7A1A]">event_available</span>
                    <span className="font-semibold">Session Normale</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#FF7A1A]">verified</span>
                    <span className="text-slate-300">Toutes séries</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800">
                <p className="text-[11px] text-slate-300 font-medium">
                  Date de référence : la plupart des séries (date estimée, à confirmer)
                </p>
              </div>
            </div>

            {/* BFEM Aesthetic Timer */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-700/80 shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-sky-500/20 text-[#7dd3fc] border border-sky-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                  BFEM 2027
                </span>
                <span className="text-xs text-sky-200 font-bold">{countdownBfem.displayDate}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 bg-slate-950/70 rounded-2xl p-3 border border-slate-700/80 text-center">
                  <span className="block text-3xl sm:text-4xl font-black text-[#38bdf8] tabular-nums" suppressHydrationWarning>
                    {countdownBfem.days}
                  </span>
                  <span className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">Jours restants</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">event_available</span>
                    <span className="font-semibold">Collège · 3ème</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">school</span>
                    <span className="text-slate-300">Brevet national</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800">
                <p className="text-[11px] text-slate-300 font-medium">
                  Date de référence du BFEM (estimée, à confirmer)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Espace Parents Banner (Visible sur web et mobile avec carte claire) */}
      <section className="py-6 sm:py-8 bg-gradient-to-r from-purple-50 via-white to-blue-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200/90 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[32px]">family_restroom</span>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                    Espace Parents & Tuteurs
                  </span>
                  <span className="text-xs text-slate-700 font-bold">Code sécurisé à 6 caractères</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  Vous êtes parent d&apos;un candidat au BAC ou au BFEM ?
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-xl">
                  Suivez les résultats des quiz, la régularité du travail et le niveau par matière de votre enfant en toute sérénité sans créer de compte compliqué.
                </p>
              </div>
            </div>

            <Link
              href="/prep/parent"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm shadow-md shadow-purple-500/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">vpn_key</span>
              <span>Accéder à l&apos;Espace Parents</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="fonctionnalites" className="pt-10 pb-14 sm:pt-12 sm:pb-18 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#FF6B00]">Tout pour réussir</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Une boîte à outils complète conçue pour le système éducatif sénégalais.
            </h2>
            <p className="text-sm sm:text-base text-slate-700 font-medium">
              Des technologies modernes combinées aux barèmes officiels de notation de l&apos;Office du Bac et du Ministère de l&apos;Éducation Nationale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Coach IA */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-[#005bbf] text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="material-symbols-outlined text-[26px]">smart_toy</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 min-h-[3.25rem] flex items-center">
                  Coach IA Pédagogique
                </h3>
                <p className="text-sm text-slate-700 font-medium leading-relaxed flex-1">
                  Pose tes questions à toute heure. Il t&apos;explique les théorèmes complexes, t&apos;aide à structurer ta dissertation philosophique et sait même t&apos;expliquer un concept en Wolof si nécessaire&nbsp;!
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/70">
                <Link href="/login" className="text-xs font-bold text-[#005bbf] hover:underline flex items-center gap-1">
                  Tester le coach avec un exercice <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Annales & Corrigés */}
            <div className="bg-gradient-to-br from-slate-50 to-orange-50/50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <span className="material-symbols-outlined text-[26px]">description</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 min-h-[3.25rem] flex items-center">
                  Annales 2023-2026
                </h3>
                <p className="text-sm text-slate-700 font-medium leading-relaxed flex-1">
                  Plus de 600 épreuves et corrigés réels du 1er groupe, 2ème groupe et sessions de remplacement numérisés haute définition.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/70">
                <Link href="/login" className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1">
                  Consulter les sujets récents <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Simulateur de Moyenne & Orientation */}
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="material-symbols-outlined text-[26px]">calculate</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 min-h-[3.25rem] flex items-center">
                  Simulateur & Orientation
                </h3>
                <p className="text-sm text-slate-700 font-medium leading-relaxed flex-1">
                  Calcule ta note estimée au BAC selon tes notes de contrôle et découvre les filières universitaires (UCAD, UGB, USSEIN, etc.) adaptées à ton profil.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/70">
                <Link href="/login" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  Calculer mes points et débouchés <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Series & Programs Showcase */}
      <section id="programmes" className="pt-10 pb-12 sm:pt-12 sm:pb-14 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#005bbf]">Programmes officiels</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Toutes les séries prises en charge</h2>
              <p className="text-sm text-slate-700 font-medium">Du BFEM aux séries scientifiques, littéraires et techniques.</p>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-200/80 self-start">
              <button
                onClick={() => setSelectedExam("BAC")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedExam === "BAC" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Baccalauréat (13 séries)
              </button>
              <button
                onClick={() => setSelectedExam("BFEM")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedExam === "BFEM" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                BFEM (3ème)
              </button>
            </div>
          </div>

          {selectedExam === "BAC" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { code: "Série S2", title: "Sciences Expérimentales", matieres: "Maths, PC, SVT, Philo" },
                { code: "Série S1", title: "Mathématiques & PC", matieres: "Maths approfondies, PC" },
                { code: "Série L2", title: "Langues & Sciences Humaines", matieres: "Philo, Français, HG, LV2" },
                { code: "Série L1", title: "Langues & Littérature", matieres: "Français, Philo, Latin/Grec" },
                { code: "Série L'1 / L-AR", title: "Option Arabe", matieres: "Civilisation islamique, Arabe" },
                { code: "Série STEG", title: "Sciences & Tech. de Gestion", matieres: "Compta, Éco, Droit, Maths" },
                { code: "Série STIDD / T1-T2", title: "Sciences Industrielles", matieres: "Mécanique, Électrotechnique" },
                { code: "Série F6", title: "Chimie & Laboratoire", matieres: "Chimie organique, Physique" },
              ].map((s) => (
                <div key={s.code} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:border-[#005bbf] hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-[#005bbf]">{s.code}</span>
                    <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full uppercase">BAC 2027</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">{s.title}</p>
                  <p className="text-[11px] text-slate-700 font-medium mt-1 line-clamp-1">{s.matieres}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-2">
                <span className="font-extrabold text-base text-[#FF6B00]">BFEM Enseignement Général</span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">
                  Français (Texte suivi de questions, Dictée), Mathématiques, PC, SVT, Histoire-Géographie, Anglais, EPS.
                </p>
                <p className="text-xs text-[#005bbf] font-bold pt-2">Annales complètes depuis 2014</p>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-2">
                <span className="font-extrabold text-base text-[#005bbf]">BFEM Option Franco-Arabe</span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 leading-relaxed">
                  Épreuves spécifiques de langue arabe, études islamiques et matières scientifiques en bilingue.
                </p>
                <p className="text-xs text-[#005bbf] font-bold pt-2">Sujets numérisés avec corrigés types</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Real-Time Countdowns (Direct Synchro UTC Sénégal) - Juste après Programmes officiels */}
      <section className="py-12 sm:py-16 bg-slate-950 text-white border-t border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">
                Direct Synchro Sénégal (UTC)
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Compte à rebours officiel en direct
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Suis le temps restant à la seconde près (jours, heures, minutes, secondes) pour chaque examen national.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Heure de Dakar (GMT+0) · Mise à jour à la seconde</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LiveExamCountdownCard examId="BAC" themeColor="orange" />
            <LiveExamCountdownCard examId="BFEM" themeColor="blue" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Reveal direction="up">
        <FaqSection />
      </Reveal>

      {/* Call to action banner */}
      <section className="py-16 bg-gradient-to-tr from-[#005bbf] to-[#004493] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
            <span>🚀 Inscription 100% gratuite pendant la phase de lancement</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Prêt à faire partie des majors de promotion au Sénégal ?
          </h2>

          <p className="text-blue-100 text-base max-w-xl mx-auto">
            Rejoins dès aujourd&apos;hui les élèves des lycées d&apos;excellence, collèges et lycées publics et privés de Dakar, Thiès, Saint-Louis, Kaolack, Ziguinchor...
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-slate-900 bg-white hover:bg-slate-100 shadow-xl active:scale-95 transition-all"
            >
              Créer mon compte élève →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white font-black text-xs">
              G
            </div>
            <span className="font-bold text-slate-200">GSN PREP · Sénégal 2027</span>
            <span>· Tous droits réservés</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2">
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/prep/parent" className="hover:text-white transition-colors">Espace Parents</Link>
            <a href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Support WhatsApp</a>
            <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="/login" className="hover:text-white transition-colors">Espace Élève</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
