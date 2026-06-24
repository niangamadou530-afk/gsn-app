"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CourseDetail = {
  parcours_id: string;
  titre: string;
  secteur: string;
  progression: number;
  certifie: boolean;
};

type Beneficiaire = {
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  created_at: string;
  statut_insertion: "recherche" | "insere" | "entrepreneuriat" | "etudes";
  parcours: CourseDetail[];
  avg_progress: number;
  certifications_count: number;
};

type SectorStats = {
  id: string;
  nom: string;
  slug: string;
  icone: string | null;
  inscrits: number;
  certifies: number;
};

type PassportLog = {
  id: string;
  delivre_le: string;
  beneficiaire_nom: string;
  parcours_titre: string;
  secteur_nom: string;
  secteur_slug: string;
};

type MjsStats = {
  kpis: {
    totalInscrits: number;
    totalFormes: number;
    totalPassports: number;
    totalCertifies: number;
    tauxInsertionGlobal: number;
    tauxInsertionCertifies: number;
    totalPartners: number;
  };
  sectorsBreakdown: SectorStats[];
  insertionBreakdown: {
    insere: number;
    entrepreneuriat: number;
    recherche: number;
    etudes: number;
  };
  latestPassports: PassportLog[];
  beneficiaires: Beneficiaire[];
};

export default function MjsMinistereDashboard() {
  const router = useRouter();
  const [data, setData] = useState<MjsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"kpis" | "beneficiaires" | "secteurs">("kpis");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/mjs/ministere/stats");
        if (!res.ok) {
          throw new Error("Erreur de communication avec le serveur");
        }
        const json = await res.json();
        if (json.error) {
          throw new Error(json.error);
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue lors du chargement des statistiques.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium animate-pulse">Chargement des données du Ministère...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-error text-[54px] mb-4">error</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Erreur de chargement</h2>
        <p className="text-on-surface-variant max-w-md mb-6">{error || "Impossible de charger le tableau de bord."}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md active:scale-95 transition-all"
        >
          Réessayer
        </button>
      </main>
    );
  }

  // Translation helpers
  const statusLabels: Record<string, string> = {
    insere: "Inséré (Emploi salarié)",
    entrepreneuriat: "Auto-emploi / Start-up",
    recherche: "En recherche d'emploi",
    etudes: "En cours d'études",
  };

  const statusColors: Record<string, string> = {
    insere: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    entrepreneuriat: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    recherche: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    etudes: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  };

  // CSV Report Exporter
  const exportToCSV = () => {
    if (!data.beneficiaires || data.beneficiaires.length === 0) return;

    const headers = [
      "Prénom",
      "Nom",
      "Email",
      "Statut d'Insertion",
      "Date d'Inscription",
      "Nombre de Certifications",
      "Progression Moyenne",
      "Parcours suivis"
    ];

    const rows = data.beneficiaires.map((b) => {
      const statusLabel = statusLabels[b.statut_insertion] || b.statut_insertion;
      const dateStr = new Date(b.created_at).toLocaleDateString("fr-FR");
      const coursesStr = b.parcours.map((p) => `${p.titre} (${p.progression}%${p.certifie ? " - Certifié" : ""})`).join(" | ");

      return [
        b.prenom,
        b.nom,
        b.email,
        statusLabel,
        dateStr,
        b.certifications_count,
        `${b.avg_progress}%`,
        coursesStr
      ];
    });

    const csvContent =
      "\uFEFF" + // BOM to force UTF-8 in Excel
      [
        headers.join(";"),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `Rapport_PNACIJ_MJS_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredBeneficiaires = data.beneficiaires.filter((b) => {
    const fullName = `${b.prenom} ${b.nom}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || b.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector =
      !selectedSector || b.parcours.some((p) => p.secteur.toLowerCase() === selectedSector.toLowerCase());

    const matchesStatus = !selectedStatus || b.statut_insertion === selectedStatus;

    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col relative pb-16">
      {/* Flag accent stripe */}
      <div className="h-2 w-full flex print:hidden">
        <div className="h-full w-1/3 bg-[#00853f]" />
        <div className="h-full w-1/3 bg-[#fdef42]" />
        <div className="h-full w-1/3 bg-[#e31b23]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#005bbf] rounded-2xl flex items-center justify-center shadow-lg shadow-[#005bbf]/10 flex-shrink-0">
              <span className="text-white font-black text-2xl">MJS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7b5500] bg-[#ffdeac] px-2 py-0.5 rounded-full">
                  PNACIJ
                </span>
                <span className="text-xs text-on-surface-variant font-semibold">République du Sénégal</span>
              </div>
              <h1 className="text-3xl font-black text-on-background tracking-tight mt-0.5">
                Ministère de la Jeunesse et des Sports
              </h1>
              <p className="text-on-surface-variant text-sm mt-0.5">
                Système national de suivi des formations et d'insertion professionnelle
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto print:hidden">
            <button
              onClick={() => window.print()}
              className="flex-1 md:flex-initial py-3 px-5 bg-surface-container-lowest border-2 border-outline-variant/30 text-on-surface font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              Imprimer PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex-1 md:flex-initial py-3 px-5 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/15 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Exporter CSV
            </button>
          </div>
        </header>

        {/* Tab Selector (Print: Hidden) */}
        <div className="flex border-b border-outline-variant/20 mb-8 print:hidden">
          <button
            onClick={() => setActiveTab("kpis")}
            className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "kpis"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("beneficiaires")}
            className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "beneficiaires"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            Bénéficiaires ({filteredBeneficiaires.length})
          </button>
          <button
            onClick={() => setActiveTab("secteurs")}
            className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "secteurs"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">pie_chart</span>
            Secteurs & Insertion
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW & KPIS */}
        {/* ============================================================ */}
        {activeTab === "kpis" && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-[22px]">group</span>
                </div>
                <p className="text-4xl font-extrabold text-on-background tracking-tight">{data.kpis.totalInscrits}</p>
                <p className="text-sm font-semibold text-on-surface-variant mt-1.5">Jeunes Inscrits</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="font-bold text-[#00853f]">+100%</span> depuis le lancement
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-secondary text-[22px]">school</span>
                </div>
                <p className="text-4xl font-extrabold text-on-background tracking-tight">{data.kpis.totalFormes}</p>
                <p className="text-sm font-semibold text-on-surface-variant mt-1.5">Bénéficiaires Formés</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="font-bold text-primary">
                    {data.kpis.totalInscrits > 0
                      ? Math.round((data.kpis.totalFormes / data.kpis.totalInscrits) * 100)
                      : 0}
                    %
                  </span>{" "}
                  du total des inscrits
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">workspace_premium</span>
                </div>
                <p className="text-4xl font-extrabold text-on-background tracking-tight">{data.kpis.totalPassports}</p>
                <p className="text-sm font-semibold text-on-surface-variant mt-1.5">Skill Passports délivrés</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="font-bold text-tertiary">{data.kpis.totalCertifies}</span> bénéficiaires certifiés
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-emerald-600 text-[22px]">trending_up</span>
                </div>
                <p className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                  {data.kpis.tauxInsertionCertifies}%
                </p>
                <p className="text-sm font-semibold text-on-surface-variant mt-1.5">Taux d'Insertion (Certifiés)</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="font-bold text-[#00853f]">{data.kpis.tauxInsertionGlobal}%</span> de taux global (tous inscrits)
                </div>
              </div>
            </div>

            {/* Quick Analytics & Charts Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sector Progress Breakdown */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Inscriptions & Certifications par Secteur</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Répartition sectorielle des bénéficiaires</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">bar_chart</span>
                </div>

                <div className="space-y-5">
                  {data.sectorsBreakdown.map((sector) => {
                    const pctInsc = data.kpis.totalInscrits > 0 ? (sector.inscrits / data.kpis.totalInscrits) * 100 : 0;
                    return (
                      <div key={sector.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface">{sector.nom}</span>
                            <span className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full font-semibold">
                              {sector.inscrits} inscrits
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-tertiary">
                            {sector.certifies} certifié{sector.certifies !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {/* Progress Bar Stacked */}
                        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden flex">
                          <div
                            className="bg-primary rounded-l-full transition-all duration-500"
                            style={{ width: `${pctInsc}%` }}
                          />
                          {sector.certifies > 0 && (
                            <div
                              className="bg-tertiary-container transition-all duration-500 border-l border-white/20"
                              style={{
                                width: `${
                                  sector.inscrits > 0
                                    ? (sector.certifies / sector.inscrits) * pctInsc
                                    : 0
                                }%`
                              }}
                              title={`${sector.certifies} certifiés`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insertion Distribution Breakdown */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Statuts d'Insertion Professionnelle</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Situation d'activité des bénéficiaires formés</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">pie_chart</span>
                </div>

                <div className="space-y-5">
                  {Object.entries(data.insertionBreakdown).map(([status, count]) => {
                    const total = data.kpis.totalInscrits || 1;
                    const percentage = Math.round((count / total) * 100);

                    // Colors setup
                    const barColor: Record<string, string> = {
                      insere: "bg-emerald-500",
                      entrepreneuriat: "bg-blue-500",
                      recherche: "bg-amber-500",
                      etudes: "bg-purple-500",
                    };

                    return (
                      <div key={status} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-semibold truncate text-on-surface-variant">
                          {statusLabels[status] || status}
                        </div>
                        <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className={`${barColor[status]} h-full rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-14 text-right text-sm font-bold text-on-surface">
                          {count} <span className="text-xs text-on-surface-variant font-normal">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant leading-relaxed">
                  <strong>Note administrative :</strong> Le taux d'insertion est actualisé en continu sur la base des formulaires déclaratifs remplis par les bénéficiaires et des signalements de recrutement effectués par les entreprises partenaires.
                </div>
              </div>
            </div>

            {/* Latest passports section */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-on-surface mb-6">Derniers Skill Passports Délivrés</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {data.latestPassports.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-6">Aucun passeport délivré récemment.</p>
                  ) : (
                    data.latestPassports.map((log, logIdx) => (
                      <li key={log.id}>
                        <div className="relative pb-8">
                          {logIdx !== data.latestPassports.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-outline-variant/30" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center ring-8 ring-surface-container-lowest">
                                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-on-surface">
                                  Skill Passport délivré à{" "}
                                  <strong className="text-on-background">{log.beneficiaire_nom}</strong> pour le parcours{" "}
                                  <span className="font-semibold text-primary">{log.parcours_titre}</span>
                                </p>
                              </div>
                              <div className="text-right text-xs whitespace-nowrap text-on-surface-variant font-medium">
                                <time>{new Date(log.delivre_le).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: BENEFICIARIES DATABASE LIST */}
        {/* ============================================================ */}
        {activeTab === "beneficiaires" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter bar */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center print:hidden">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Tous les Secteurs</option>
                  {data.sectorsBreakdown.map((s) => (
                    <option key={s.id} value={s.nom}>
                      {s.nom}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Tous les Statuts d'Insertion</option>
                  {Object.entries(statusLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6">Bénéficiaire</th>
                      <th className="py-4 px-6">Date Inscription</th>
                      <th className="py-4 px-6">Parcours suivis</th>
                      <th className="py-4 px-6 text-center">Moy. Prog</th>
                      <th className="py-4 px-6 text-center">Certifs</th>
                      <th className="py-4 px-6">Statut Insertion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {filteredBeneficiaires.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                          Aucun bénéficiaire ne correspond à votre recherche ou vos filtres.
                        </td>
                      </tr>
                    ) : (
                      filteredBeneficiaires.map((b) => (
                        <tr key={b.user_id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center uppercase">
                                {b.prenom[0]}
                                {b.nom[0]}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">
                                  {b.prenom} {b.nom}
                                </p>
                                <p className="text-xs text-on-surface-variant font-medium mt-0.5">{b.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant font-medium">
                            {new Date(b.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {b.parcours.length === 0 ? (
                                <span className="text-xs text-on-surface-variant/60 italic">Aucun parcours</span>
                              ) : (
                                b.parcours.map((p, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                                      p.certifie
                                        ? "bg-tertiary-container/30 text-tertiary border border-tertiary/10"
                                        : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                                    }`}
                                  >
                                    {p.titre}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-on-surface">
                            {b.parcours.length > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-10 bg-surface-container h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${b.avg_progress}%` }}
                                  />
                                </div>
                                <span className="text-xs">{b.avg_progress}%</span>
                              </div>
                            ) : (
                              <span className="text-on-surface-variant/40">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center font-bold">
                            {b.certifications_count > 0 ? (
                              <span className="inline-flex items-center gap-1 text-tertiary bg-tertiary/5 border border-tertiary/20 px-2 py-0.5 rounded-full text-xs">
                                <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                                {b.certifications_count}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/40">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                statusColors[b.statut_insertion] || "bg-outline-variant/10 text-on-surface-variant"
                              }`}
                            >
                              {statusLabels[b.statut_insertion] || b.statut_insertion}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SECTOR ANALYSIS & DETAILED CHARTS */}
        {/* ============================================================ */}
        {activeTab === "secteurs" && (
          <div className="space-y-8 animate-fade-in">
            {/* Sector Deep Dive cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.sectorsBreakdown.map((s) => (
                <div key={s.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-base text-on-surface">{s.nom}</h3>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">school</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-surface-container-low p-3.5 rounded-xl text-center">
                      <p className="text-2xl font-black text-primary">{s.inscrits}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 uppercase tracking-wider font-extrabold">Inscrits</p>
                    </div>
                    <div className="bg-surface-container-low p-3.5 rounded-xl text-center">
                      <p className="text-2xl font-black text-tertiary">{s.certifies}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 uppercase tracking-wider font-extrabold">Certifiés</p>
                    </div>
                  </div>

                  <div className="mt-5 text-xs text-on-surface-variant font-medium flex items-center gap-1.5 justify-center">
                    Taux de réussite :{" "}
                    <strong className="text-on-surface">
                      {s.inscrits > 0 ? Math.round((s.certifies / s.inscrits) * 100) : 0}%
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Partner / Recruiter KPI highlights */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">handshake</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-on-surface">Partenariats Économiques & Entreprises</h3>
                  <p className="text-xs text-on-surface-variant">Intégration du réseau GSN WORK avec les PME/ETI nationales</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-outline-variant/20 rounded-xl p-5 text-center">
                  <p className="text-3xl font-extrabold text-on-background">{data.kpis.totalPartners}</p>
                  <p className="text-xs text-on-surface-variant mt-1.5 font-bold">Entreprises Partenaires Actives</p>
                </div>
                <div className="border border-outline-variant/20 rounded-xl p-5 text-center">
                  <p className="text-3xl font-extrabold text-on-background">{data.kpis.totalPassports}</p>
                  <p className="text-xs text-on-surface-variant mt-1.5 font-bold">Profils Certifiés Disponibles</p>
                </div>
                <div className="border border-outline-variant/20 rounded-xl p-5 text-center">
                  <p className="text-3xl font-extrabold text-[#00853f]">{data.kpis.tauxInsertionCertifies}%</p>
                  <p className="text-xs text-on-surface-variant mt-1.5 font-bold">Taux de Recrutement Post-Certif</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Glows (Print: Hidden) */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-[#005bbf]/5 rounded-full blur-[100px] pointer-events-none print:hidden" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-[#adc7ff]/5 rounded-full blur-[80px] pointer-events-none print:hidden" />
    </main>
  );
}