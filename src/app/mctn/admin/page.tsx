"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DOMAIN_LABELS: Record<string, string> = {
  "dev-web":   "Dev Web & Mobile",
  "data":      "Data Science & IA",
  "cybersec":  "Cybersécurité",
  "ux":        "UX Design",
  "ecommerce": "E-commerce",
  "cloud":     "Cloud & DevOps",
};

const DOMAIN_COLORS: Record<string, string> = {
  "dev-web":   "#005bbf",
  "data":      "#2b5bb5",
  "cybersec":  "#7b1fa2",
  "ux":        "#e65100",
  "ecommerce": "#2e7d32",
  "cloud":     "#00695c",
};

const DOMAIN_ICONS: Record<string, string> = {
  "dev-web":   "code",
  "data":      "psychology",
  "cybersec":  "security",
  "ux":        "palette",
  "ecommerce": "storefront",
  "cloud":     "cloud",
};

type Stats = {
  kpis: {
    totalInscrits: number;
    passports: number;
    insertions: number;
    tauxInsertion: number;
    missionsActives: number;
    candidatures: number;
    totalUsers: number;
  };
  domaineBreakdown: Record<string, number>;
  objectifsNDT: {
    diplomes: { actuel: number; cible: number };
    startups: { actuel: number; cible: number };
  };
};

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function pct(actuel: number, cible: number): number {
  return Math.min(100, Math.round((actuel / cible) * 100));
}

export default function MctnAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/mctn/employer/login"); return; }

    const { data: emps } = await supabase
      .from("employers")
      .select("tenant_id")
      .eq("auth_id", auth.user.id)
      .limit(1);

    if (!emps || emps.length === 0 || emps[0].tenant_id !== "mctn") {
      router.replace("/mctn/employer/login");
      return;
    }

    const res = await fetch("/api/mctn/stats");
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erreur serveur");
      setLoading(false);
      return;
    }
    const data: Stats = await res.json();
    setStats(data);
    setLoading(false);
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const { data: rows } = await supabase
        .from("pfimn_enrollments")
        .select("user_id, domaine, niveau, objectif, skill_passport_issued, inserted, enrolled_at");

      if (!rows || rows.length === 0) { setExporting(false); return; }

      const userIds = rows.map((r: any) => r.user_id);
      const { data: users } = await supabase.from("users").select("id, name, score").in("id", userIds);
      const nameMap: Record<string, string> = {};
      const scoreMap: Record<string, number> = {};
      (users ?? []).forEach((u: any) => { nameMap[u.id] = u.name; scoreMap[u.id] = u.score; });

      const header = ["Nom", "Domaine", "Niveau", "Objectif", "Score GSN", "Skill Passport", "Inseré", "Date Inscription"];
      const lines = rows.map((r: any) => [
        nameMap[r.user_id] ?? "—",
        DOMAIN_LABELS[r.domaine] ?? r.domaine ?? "—",
        r.niveau ?? "—",
        r.objectif ?? "—",
        scoreMap[r.user_id] ?? 0,
        r.skill_passport_issued ? "Oui" : "Non",
        r.inserted ? "Oui" : "Non",
        r.enrolled_at ? new Date(r.enrolled_at).toLocaleDateString("fr-FR") : "—",
      ].map(String).join(";"));

      const csv = [header.join(";"), ...lines].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_pfimn_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-error text-[48px]">error</span>
        <p className="text-on-surface font-bold">{error}</p>
        <p className="text-on-surface-variant text-sm">Vérifiez que SUPABASE_SERVICE_ROLE_KEY est configurée dans .env.local</p>
        <Link href="/mctn/employer/dashboard" className="text-primary text-sm font-bold hover:underline">Retour</Link>
      </div>
    );
  }

  if (!stats) return null;

  const { kpis, domaineBreakdown, objectifsNDT } = stats;
  const topDomaine = Object.entries(domaineBreakdown).sort(([,a],[,b]) => b - a);
  const maxDomaine = topDomaine[0]?.[1] ?? 1;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-16">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px]">GSN</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm leading-none">Dashboard MCTN</span>
            <span className="text-white/50 text-[10px] uppercase tracking-widest">Reporting NDT</span>
          </div>
        </div>
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          {exporting ? "Export…" : "Exporter CSV"}
        </button>
      </header>

      <div className="pt-24 px-5 max-w-2xl mx-auto space-y-6">

        {/* Titre */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">PFIMN · Axe 3</p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Tableau de bord institutionnel</h1>
          <p className="text-sm text-on-surface-variant mt-1">Ministère de la Communication, des Télécommunications & du Numérique</p>
        </section>

        {/* KPIs principaux */}
        <section className="grid grid-cols-2 gap-3">
          {[
            { label: "Inscrits PFIMN",       value: fmt(kpis.totalInscrits),   icon: "group",               color: "#005bbf" },
            { label: "Skill Passports",       value: fmt(kpis.passports),       icon: "workspace_premium",   color: "#2b5bb5" },
            { label: "Insertions tech",       value: fmt(kpis.insertions),      icon: "work",                color: "#2e7d32" },
            { label: "Taux d'insertion",      value: `${kpis.tauxInsertion}%`,  icon: "trending_up",         color: "#e65100" },
            { label: "Offres NDT actives",    value: fmt(kpis.missionsActives), icon: "business_center",     color: "#00695c" },
            { label: "Candidatures",          value: fmt(kpis.candidatures),    icon: "send",                color: "#7b1fa2" },
          ].map((k) => (
            <div key={k.label} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${k.color}15`, color: k.color }}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{k.icon}</span>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">{k.value}</p>
              <p className="text-xs text-on-surface-variant">{k.label}</p>
            </div>
          ))}
        </section>

        {/* Objectifs NDT */}
        <section className="bg-gradient-to-br from-[#0a1628] to-[#0d2050] rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
            <h2 className="text-white font-bold">Objectifs NDT · Vision Sénégal 2050</h2>
          </div>

          {/* 100 000 diplômés */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-sm font-medium">100 000 diplômés numériques</p>
              <p className="text-white font-extrabold text-sm">
                {fmt(objectifsNDT.diplomes.actuel)} / 100k
              </p>
            </div>
            <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${pct(objectifsNDT.diplomes.actuel, objectifsNDT.diplomes.cible)}%` }}
              />
            </div>
            <p className="text-white/40 text-xs">
              {pct(objectifsNDT.diplomes.actuel, objectifsNDT.diplomes.cible)}% de l'objectif atteint
            </p>
          </div>

          {/* 500 startups */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-sm font-medium">500 startups tech</p>
              <p className="text-white font-extrabold text-sm">
                {objectifsNDT.startups.actuel} / 500
              </p>
            </div>
            <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#e65100] rounded-full transition-all duration-700"
                style={{ width: `${pct(objectifsNDT.startups.actuel, objectifsNDT.startups.cible)}%` }}
              />
            </div>
            <p className="text-white/40 text-xs">
              {pct(objectifsNDT.startups.actuel, objectifsNDT.startups.cible)}% de l'objectif atteint
            </p>
          </div>
        </section>

        {/* Répartition par domaine */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Répartition par métier NDT</h2>
          <div className="space-y-2">
            {topDomaine.length === 0 && (
              <p className="text-on-surface-variant text-sm text-center py-4">Aucune inscription pour l'instant</p>
            )}
            {topDomaine.map(([domaine, count]) => {
              const color = DOMAIN_COLORS[domaine] ?? "#005bbf";
              const icon  = DOMAIN_ICONS[domaine]  ?? "hub";
              const label = DOMAIN_LABELS[domaine] ?? domaine;
              const barPct = Math.round((count / maxDomaine) * 100);
              return (
                <div key={domaine} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{label}</p>
                    </div>
                    <span className="text-sm font-extrabold shrink-0" style={{ color }}>
                      {count} inscrit{count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Liens rapides */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Accès rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/mctn/recruiter",          icon: "person_search",     label: "Profils certifiés",  color: "#005bbf" },
              { href: "/mctn/employer/dashboard", icon: "business_center",   label: "Offres NDT",         color: "#2e7d32" },
              { href: "/mctn/employer/missions/new", icon: "add_circle",     label: "Nouvelle offre",     color: "#e65100" },
              { href: "/mctn",                    icon: "home",              label: "Espace PFIMN",       color: "#7b1fa2" },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all space-y-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                </div>
                <p className="text-sm font-bold text-on-surface">{a.label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Export section */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
            <div>
              <h2 className="font-bold text-on-surface">Rapport ministériel</h2>
              <p className="text-xs text-on-surface-variant">Export CSV — tous les bénéficiaires PFIMN</p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {exporting ? "Génération en cours…" : "Télécharger le rapport CSV"}
          </button>
          <p className="text-xs text-on-surface-variant text-center mt-3">
            Inclut : nom, domaine, niveau, score GSN, Skill Passport, statut insertion
          </p>
        </section>

        <div className="text-center py-4">
          <p className="text-[10px] text-outline font-medium">
            PFIMN · MCTN · New Deal Technologique · Vision Sénégal 2050 · 2025–2034
          </p>
        </div>

      </div>
    </main>
  );
}
