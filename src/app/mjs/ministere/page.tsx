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
  genre: string | null;
  region: string | null;
  situation_handicap: boolean | null;
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
  parcours_id: string;
  parcours_titre: string;
  secteur_nom: string;
  secteur_slug: string;
};

type RecruteurDetail = {
  id: string;
  user_id: string;
  nom: string;
  entreprise: string;
  email: string;
  created_at: string;
  offres_count: number;
  regions: string[];
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
    handicappedCount: number;
  };
  sectorsBreakdown: SectorStats[];
  insertionBreakdown: {
    insere: number;
    entrepreneuriat: number;
    recherche: number;
    etudes: number;
  };
  genderBreakdown: {
    male: number;
    female: number;
    total: number;
  };
  regionBreakdown: Record<string, number>;
  latestPassports: PassportLog[];
  allPassports: PassportLog[];
  recruteurs: RecruteurDetail[];
  beneficiaires: Beneficiaire[];
};

export default function MjsMinistereDashboard() {
  const router = useRouter();
  const [data, setData] = useState<MjsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // General Tab State
  const [activeTab, setActiveTab] = useState<"kpis" | "beneficiaires" | "recruteurs" | "passports" | "secteurs">("kpis");

  // Beneficiary Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedHandicapOnly, setSelectedHandicapOnly] = useState(false);

  // Recruiter Filters
  const [recruteurSearchTerm, setRecruteurSearchTerm] = useState("");
  const [recruteurRegion, setRecruteurRegion] = useState("");

  // Passport Filters
  const [passportSearchTerm, setPassportSearchTerm] = useState("");

  // Modal State for Certificate preview
  const [selectedPassportForPreview, setSelectedPassportForPreview] = useState<PassportLog | null>(null);

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

  // Filter Beneficiaries
  const filteredBeneficiaires = data.beneficiaires.filter((b) => {
    const fullName = `${b.prenom} ${b.nom}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || b.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector =
      !selectedSector || b.parcours.some((p) => p.secteur.toLowerCase() === selectedSector.toLowerCase());
    const matchesStatus = !selectedStatus || b.statut_insertion === selectedStatus;
    const matchesRegion = !selectedRegion || b.region === selectedRegion;
    const matchesGenre = !selectedGenre || b.genre === selectedGenre;
    const matchesHandicap = !selectedHandicapOnly || b.situation_handicap === true;

    return matchesSearch && matchesSector && matchesStatus && matchesRegion && matchesGenre && matchesHandicap;
  });

  // Filter Recruiters
  const filteredRecruteurs = (data.recruteurs || []).filter((r) => {
    const matchesSearch = r.entreprise.toLowerCase().includes(recruteurSearchTerm.toLowerCase()) || r.nom.toLowerCase().includes(recruteurSearchTerm.toLowerCase());
    const matchesRegion = !recruteurRegion || r.regions.includes(recruteurRegion);
    return matchesSearch && matchesRegion;
  });

  // Filter Passports
  const filteredPassports = (data.allPassports || []).filter((p) => {
    const matchesSearch =
      p.beneficiaire_nom.toLowerCase().includes(passportSearchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(passportSearchTerm.toLowerCase()) ||
      p.parcours_titre.toLowerCase().includes(passportSearchTerm.toLowerCase());
    return matchesSearch;
  });

  // Export Beneficiaries (Uses Active Filters)
  const exportToCSV = () => {
    if (filteredBeneficiaires.length === 0) return;

    const headers = [
      "Prénom",
      "Nom",
      "Email",
      "Genre",
      "Région",
      "Handicap",
      "Statut d'Insertion",
      "Date d'Inscription",
      "Nombre de Certifications",
      "Progression Moyenne",
      "Parcours suivis"
    ];

    const rows = filteredBeneficiaires.map((b) => {
      const statusLabel = statusLabels[b.statut_insertion] || b.statut_insertion;
      const dateStr = new Date(b.created_at).toLocaleDateString("fr-FR");
      const coursesStr = b.parcours.map((p) => `${p.titre} (${p.progression}%${p.certifie ? " - Certifié" : ""})`).join(" | ");

      return [
        b.prenom,
        b.nom,
        b.email,
        b.genre === "M" ? "Homme" : b.genre === "F" ? "Femme" : "n/a",
        b.region || "n/a",
        b.situation_handicap ? "Oui" : "Non",
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
    const filename = `Rapport_Filtre_PNACIJ_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Partners
  const exportRecruteursToCSV = () => {
    if (filteredRecruteurs.length === 0) return;

    const headers = ["Entreprise", "Contact", "Email", "Date Partenariat", "Offres Publiées", "Régions d'Activité"];
    const rows = filteredRecruteurs.map((r) => [
      r.entreprise,
      r.nom,
      r.email,
      new Date(r.created_at).toLocaleDateString("fr-FR"),
      r.offres_count,
      r.regions.join(" | ")
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(";"),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `Partenaires_PNACIJ_MJS_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              disabled={filteredBeneficiaires.length === 0}
              className="flex-1 md:flex-initial py-3 px-5 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/15 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Exporter CSV
            </button>
          </div>
        </header>

        {/* Tab Selector (Print: Hidden) */}
        <div className="flex flex-wrap border-b border-outline-variant/20 mb-8 print:hidden">
          <button
            onClick={() => setActiveTab("kpis")}
            className={`py-4 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
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
            className={`py-4 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "beneficiaires"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            Bénéficiaires ({filteredBeneficiaires.length})
          </button>
          <button
            onClick={() => setActiveTab("recruteurs")}
            className={`py-4 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "recruteurs"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">handshake</span>
            Partenaires ({filteredRecruteurs.length})
          </button>
          <button
            onClick={() => setActiveTab("passports")}
            className={`py-4 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "passports"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            Passeports ({filteredPassports.length})
          </button>
          <button
            onClick={() => setActiveTab("secteurs")}
            className={`py-4 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
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

            {/* Demographic Breakdown Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Handicap KPI */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-red-600 text-[22px]">accessibility</span>
                </div>
                <p className="text-4xl font-extrabold text-on-background tracking-tight">{data.kpis.handicappedCount}</p>
                <p className="text-sm font-semibold text-on-surface-variant mt-1.5">Personnes en Situation de Handicap</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="font-bold text-red-600">
                    {data.kpis.totalInscrits > 0
                      ? Math.round((data.kpis.handicappedCount / data.kpis.totalInscrits) * 100)
                      : 0}
                    %
                  </span>{" "}
                  de la population
                </div>
              </div>

              {/* Gender Distribution (Progress bar layout) */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Répartition par Genre</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Parité parmi les inscrits</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">wc</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-semibold text-on-surface">Hommes</div>
                    <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{
                          width: `${
                            data.genderBreakdown.total > 0
                              ? (data.genderBreakdown.male / data.genderBreakdown.total) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-bold text-on-surface">
                      {data.genderBreakdown.male}{" "}
                      <span className="text-xs text-on-surface-variant font-normal">
                        (
                        {data.genderBreakdown.total > 0
                          ? Math.round((data.genderBreakdown.male / data.genderBreakdown.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-semibold text-on-surface">Femmes</div>
                    <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="bg-pink-500 h-full rounded-full transition-all"
                        style={{
                          width: `${
                            data.genderBreakdown.total > 0
                              ? (data.genderBreakdown.female / data.genderBreakdown.total) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-bold text-on-surface">
                      {data.genderBreakdown.female}{" "}
                      <span className="text-xs text-on-surface-variant font-normal">
                        (
                        {data.genderBreakdown.total > 0
                          ? Math.round((data.genderBreakdown.female / data.genderBreakdown.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Region Distribution */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Top Régions</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Inscriptions par région sénégalaise</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                  {Object.entries(data.regionBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([region, count]) => {
                      const percentage = data.kpis.totalInscrits > 0 ? Math.round((count / data.kpis.totalInscrits) * 100) : 0;
                      return (
                        <div key={region} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-on-surface mb-0.5">{region}</div>
                            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-on-surface">{count}</div>
                            <div className="text-xs text-on-surface-variant">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
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
                              className="bg-tertiary transition-all duration-500 border-l border-white/20 animate-pulse"
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
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col gap-4 print:hidden">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <div className="flex-grow relative">
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

                <div className="flex flex-wrap gap-3">
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
                    <option value="">Tous les Statuts</option>
                    {Object.entries(statusLabels).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Demographic Filters */}
              <div className="pt-3 border-t border-outline-variant/10 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">Région</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Toutes les régions</option>
                    {["Dakar", "Thiès", "Diourbel", "Saint-Louis", "Kaolack", "Ziguinchor", "Kolda", "Fatick", "Louga", "Matam", "Tambacounda", "Kédougou", "Sédhiou", "Kaffrine"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Tous</option>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={selectedHandicapOnly}
                      onChange={(e) => setSelectedHandicapOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    Uniquement les personnes en situation de handicap
                  </label>
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6">Bénéficiaire</th>
                      <th className="py-4 px-6">Genre / Région</th>
                      <th className="py-4 px-6">Date Inscription</th>
                      <th className="py-4 px-6">Parcours suivis</th>
                      <th className="py-4 px-6 text-center">Prog. Moyenne</th>
                      <th className="py-4 px-6 text-center">Certifs</th>
                      <th className="py-4 px-6">Statut Insertion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {filteredBeneficiaires.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant">
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
                            <span className="block text-xs">{b.genre === "M" ? "Homme" : b.genre === "F" ? "Femme" : "Genre n/a"}</span>
                            <span className="block text-xs font-bold text-on-surface">{b.region || "n/a"}</span>
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
                          <td className="py-4 px-6 flex items-center gap-1.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                statusColors[b.statut_insertion] || "bg-outline-variant/10 text-on-surface-variant"
                              }`}
                            >
                              {statusLabels[b.statut_insertion] || b.statut_insertion}
                            </span>
                            {b.situation_handicap && (
                              <span className="bg-red-500/10 text-red-700 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Handicap
                              </span>
                            )}
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
        {/* TAB 3: RECRUITERS / PARTNERS DATABASE LIST */}
        {/* ============================================================ */}
        {activeTab === "recruteurs" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter bar */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center print:hidden">
              <div className="flex-grow relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par entreprise ou contact..."
                  value={recruteurSearchTerm}
                  onChange={(e) => setRecruteurSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={recruteurRegion}
                  onChange={(e) => setRecruteurRegion(e.target.value)}
                  className="px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Toutes les Régions d'Activité</option>
                  {["Dakar", "Thiès", "Diourbel", "Saint-Louis", "Kaolack", "Ziguinchor", "Kolda", "Fatick", "Louga", "Matam", "Tambacounda", "Kédougou", "Sédhiou", "Kaffrine"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <button
                  onClick={exportRecruteursToCSV}
                  disabled={filteredRecruteurs.length === 0}
                  className="py-3 px-5 bg-secondary text-on-secondary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Exporter CSV
                </button>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6">Entreprise / Recruteur</th>
                      <th className="py-4 px-6">Date Partenariat</th>
                      <th className="py-4 px-6">Contact Email</th>
                      <th className="py-4 px-6 text-center">Offres Publiées</th>
                      <th className="py-4 px-6">Régions d'Activité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {filteredRecruteurs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                          Aucune entreprise partenaire ne correspond à ces critères.
                        </td>
                      </tr>
                    ) : (
                      filteredRecruteurs.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary font-bold text-xs flex items-center justify-center uppercase">
                                {r.entreprise[0] || "E"}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{r.entreprise}</p>
                                <p className="text-xs text-on-surface-variant font-medium mt-0.5">{r.nom}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant font-medium">
                            {new Date(r.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-4 px-6 font-semibold text-primary">
                            <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-on-surface">
                            {r.offres_count > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                {r.offres_count} offres
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/40">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {r.regions.length === 0 ? (
                                <span className="text-xs text-on-surface-variant/60 italic">Aucune offre active</span>
                              ) : (
                                r.regions.map((reg, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-md font-semibold border border-outline-variant/10"
                                  >
                                    {reg}
                                  </span>
                                ))
                              )}
                            </div>
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
        {/* TAB 4: PASSPORTS DATABASE LIST */}
        {/* ============================================================ */}
        {activeTab === "passports" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter bar */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center print:hidden">
              <div className="flex-grow relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par jeune certifié, titre de parcours ou ID..."
                  value={passportSearchTerm}
                  onChange={(e) => setPassportSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* List Table */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6">ID unique du Passeport</th>
                      <th className="py-4 px-6">Bénéficiaire certifié</th>
                      <th className="py-4 px-6">Compétence / Parcours</th>
                      <th className="py-4 px-6">Secteur</th>
                      <th className="py-4 px-6">Délivré le</th>
                      <th className="py-4 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-sm">
                    {filteredPassports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                          Aucun passeport de compétences ne correspond à ces critères.
                        </td>
                      </tr>
                    ) : (
                      filteredPassports.map((p) => (
                        <tr key={p.id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase">
                            {p.id}
                          </td>
                          <td className="py-4 px-6 font-bold text-on-surface">
                            {p.beneficiaire_nom}
                          </td>
                          <td className="py-4 px-6 font-semibold text-primary">
                            {p.parcours_titre}
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-xs bg-[#00853f]/10 text-[#00853f] border border-[#00853f]/20 px-2.5 py-0.5 rounded-full font-bold">
                              {p.secteur_nom}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant font-medium">
                            {new Date(p.delivre_le).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => setSelectedPassportForPreview(p)}
                              className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 font-bold rounded-lg text-xs hover:bg-primary/20 active:scale-95 transition-all inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              Visualiser
                            </button>
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
        {/* TAB 5: SECTOR ANALYSIS & DETAILED CHARTS */}
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

      {/* Certificate Preview Modal */}
      {selectedPassportForPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-2xl w-full border border-outline-variant/30 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">workspace_premium</span>
                Aperçu Officiel du Passeport de Compétence
              </h2>
              <button
                onClick={() => setSelectedPassportForPreview(null)}
                className="p-1.5 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] flex-1 flex flex-col items-center bg-surface-container-lowest">
              {/* Premium tricolor certificate container */}
              <div className="relative bg-surface-container-lowest rounded-2xl border-t-4 border-[#009639] w-full max-w-lg p-1 shadow-md overflow-hidden">
                {/* Flag Top Banner */}
                <div className="h-1 w-full flex text-center">
                  <div className="w-1/3 h-full bg-[#009639]" />
                  <div className="w-1/3 h-full bg-[#FCD116]" />
                  <div className="w-1/3 h-full bg-[#E31B23]" />
                </div>

                <div className="border-[6px] border-surface-container-high m-2 p-5 flex flex-col items-center text-center text-[10px]">
                  {/* Republic header */}
                  <div className="mb-4 flex flex-col items-center">
                    <span className="text-[7px] font-bold tracking-widest uppercase text-on-surface-variant mb-0.5">
                      RÉPUBLIQUE DU SÉNÉGAL
                    </span>
                    <span className="text-[6px] font-extrabold tracking-widest text-[#009639] uppercase">
                      MINISTÈRE DE LA JEUNESSE, DES SPORTS ET DE LA CULTURE
                    </span>
                    <div className="w-4 h-4 relative flex items-center justify-center my-1 text-xs text-[#009639]">
                      ★
                    </div>
                    <span className="text-[6px] font-bold text-on-surface-variant uppercase tracking-tighter">
                      PROGRAMME NATIONAL D'APPUI A LA CITOYENNETE ET A L'INSERTION DES JEUNES
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-[#009639] mb-4 uppercase">
                    PASSEPORT DE COMPÉTENCE CERTIFIÉ
                  </h3>

                  <p className="text-on-surface-variant italic mb-1 text-[8px]">Ce document officiel est décerné à</p>
                  <h4 className="text-sm font-extrabold text-on-surface leading-none border-b border-[#009639]/20 pb-1.5 inline-block px-3">
                    {selectedPassportForPreview.beneficiaire_nom}
                  </h4>

                  <p className="text-on-surface-variant mt-3 mb-1 text-[8px]">
                    Pour avoir complété avec succès le parcours de formation et validé l'évaluation :
                  </p>
                  <p className="text-xs font-extrabold text-primary px-4">
                    {selectedPassportForPreview.parcours_titre}
                  </p>
                  <p className="text-[7px] text-on-surface-variant mt-1 font-semibold">
                    Secteur : {selectedPassportForPreview.secteur_nom}
                  </p>

                  {/* Divider */}
                  <div className="w-full max-w-[280px] my-3 border-t border-outline-variant/30 flex justify-between pt-2 mx-auto text-[7px] text-on-surface-variant font-medium">
                    <div>
                      <span className="block font-bold">Statut</span>
                      <span className="text-[#009639] font-bold">★ Validé</span>
                    </div>
                    <div>
                      <span className="block font-bold">Délivré le</span>
                      <span className="font-bold text-on-surface">
                        {new Date(selectedPassportForPreview.delivre_le).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div>
                      <span className="block font-bold">ID Certificat</span>
                      <span className="font-mono text-[7px] font-semibold text-on-surface uppercase">
                        {selectedPassportForPreview.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Signatures block */}
                  <div className="flex justify-between items-end w-full max-w-[320px] mt-2 text-[6px] text-on-surface-variant">
                    <div className="flex flex-col items-start">
                      <p className="font-bold uppercase tracking-wider mb-4">Le Secrétaire PNACIJ</p>
                      <div className="w-12 border-b border-on-surface-variant/30 mb-0.5" />
                      <span className="italic">Signature autorisée</span>
                    </div>

                    {/* Seal */}
                    <div className="w-10 h-10 rounded-full border border-dashed border-[#FCD116] flex items-center justify-center p-0.5 opacity-80 rotate-12 scale-90">
                      <div className="w-full h-full bg-[#FCD116]/10 rounded-full flex flex-col items-center justify-center leading-none">
                        <span className="text-[4px] font-extrabold text-[#FCD116]">PNACIJ</span>
                        <span className="text-[8px] text-[#009639]">★</span>
                        <span className="text-[3px] font-bold text-[#E31B23]">MJS</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <p className="font-bold uppercase tracking-wider mb-4">Le Secrétaire Général MJS</p>
                      <div className="w-12 border-b border-on-surface-variant/30 mb-0.5" />
                      <span className="italic">Cachet officiel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedPassportForPreview(null)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl text-xs hover:bg-surface-container active:scale-95 transition-all"
              >
                Fermer
              </button>
              <button
                onClick={async () => {
                  try {
                    const [html2canvasModule, jspdfModule] = await Promise.all([
                      import("html2canvas-pro"),
                      import("jspdf")
                    ]);

                    const html2canvasPro = html2canvasModule.default;
                    const jsPDF = jspdfModule.jsPDF;
                    const element = document.querySelector(".fixed .relative.border-t-4");

                    if (element) {
                      const canvas = await html2canvasPro(element as HTMLElement, {
                        scale: 2,
                        useCORS: true,
                        logging: false
                      });
                      const imgData = canvas.toDataURL("image/jpeg", 0.98);
                      const pdf = new jsPDF({
                        orientation: "portrait",
                        unit: "mm",
                        format: "a4"
                      });
                      const imgWidth = 210;
                      const pageHeight = 297;
                      const imgHeight = (canvas.height * imgWidth) / canvas.width;
                      let position = 0;
                      if (imgHeight < pageHeight) {
                        position = (pageHeight - imgHeight) / 2;
                      }
                      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                      pdf.save(`PNACIJ_Verification_${selectedPassportForPreview.beneficiaire_nom.replace(/\s+/g, "_")}.pdf`);
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Erreur lors de l'export PDF.");
                  }
                }}
                className="px-4 py-2 text-white font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #009639, #007a2e)', color: '#ffffff' }}
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                Télécharger PDF officiel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Glows (Print: Hidden) */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-[#005bbf]/5 rounded-full blur-[100px] pointer-events-none print:hidden" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-[#adc7ff]/5 rounded-full blur-[80px] pointer-events-none print:hidden" />
    </main>
  );
}