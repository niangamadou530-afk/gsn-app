"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DOMAINS = [
  { id: "",          label: "Tous les domaines", icon: "hub" },
  { id: "dev-web",   label: "Dev Web & Mobile",  icon: "code",       color: "#005bbf" },
  { id: "data",      label: "Data Science & IA", icon: "psychology", color: "#2b5bb5" },
  { id: "cybersec",  label: "Cybersécurité",     icon: "security",   color: "#7b1fa2" },
  { id: "ux",        label: "UX Design",         icon: "palette",    color: "#e65100" },
  { id: "ecommerce", label: "E-commerce",        icon: "storefront", color: "#2e7d32" },
  { id: "cloud",     label: "Cloud & DevOps",    icon: "cloud",      color: "#00695c" },
];

const DOMAIN_LABELS: Record<string, string> = {
  "dev-web":   "Développement Web & Mobile",
  "data":      "Data Science & IA",
  "cybersec":  "Cybersécurité & Sys. Admin",
  "ux":        "UX Design & Contenu Digital",
  "ecommerce": "E-commerce & Marketing",
  "cloud":     "Cloud Computing & DevOps",
};
const DOMAIN_COLORS: Record<string, string> = {
  "dev-web": "#005bbf", data: "#2b5bb5", cybersec: "#7b1fa2",
  ux: "#e65100", ecommerce: "#2e7d32", cloud: "#00695c",
};
const DOMAIN_ICONS: Record<string, string> = {
  "dev-web": "code", data: "psychology", cybersec: "security",
  ux: "palette", ecommerce: "storefront", cloud: "cloud",
};

type Profile = {
  user_id: string;
  name: string;
  domaine: string;
  niveau: string;
  objectif: string;
  skill_passport_issued: boolean;
  enrolled_at: string;
  score: number | null;
};

export default function MctnRecruiterPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, [domainFilter, certifiedOnly]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (domainFilter) params.set("domaine", domainFilter);
      if (certifiedOnly) params.set("certified", "true");
      const res = await fetch(`/api/mctn/profiles?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setProfiles(data.profiles ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }

  const filtered = profiles.filter((p) =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    DOMAIN_LABELS[p.domaine]?.toLowerCase().includes(search.toLowerCase())
  );

  const certifiedCount = profiles.filter((p) => p.skill_passport_issued).length;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-md">
        <div className="flex items-center gap-2">
          <Link href="/mctn"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </Link>
          <div>
            <span className="text-sm font-bold text-white/90">PFIMN · Recruteurs</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          NDT Sénégal
        </div>
      </header>

      <div className="pt-20 px-6 max-w-3xl mx-auto space-y-6">

        {/* Hero */}
        <section className="pt-4 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Dashboard Recruteur
          </p>
          <h1 className="text-2xl font-extrabold text-on-surface">Profils PFIMN</h1>
          <p className="text-sm text-on-surface-variant">
            Bénéficiaires certifiés · New Deal Technologique · Sénégal
          </p>
        </section>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Inscrits", value: profiles.length, icon: "group", color: "#005bbf" },
            { label: "Certifiés", value: certifiedCount, icon: "workspace_premium", color: "#2e7d32" },
            { label: "Taux", value: profiles.length > 0 ? `${Math.round((certifiedCount / profiles.length) * 100)}%` : "—", icon: "trending_up", color: "#7b1fa2" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm text-center space-y-1">
              <span className="material-symbols-outlined text-[22px]"
                style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="text-xl font-extrabold text-on-surface">{s.value}</p>
              <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl px-3 py-2.5 border border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un profil…"
              className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
            />
          </div>

          {/* Certified toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCertifiedOnly((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${
                certifiedOnly
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600"
                  : "bg-surface-container border-outline-variant/30 text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: certifiedOnly ? "'FILL' 1" : "'FILL' 0" }}>
                workspace_premium
              </span>
              Certifiés uniquement
            </button>
          </div>

          {/* Domain chips */}
          <div className="flex gap-2 flex-wrap">
            {DOMAINS.map((d) => {
              const isActive = domainFilter === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDomainFilter(d.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all active:scale-95 ${
                    isActive
                      ? "text-white border-transparent"
                      : "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant"
                  }`}
                  style={isActive ? { backgroundColor: d.color ?? "#005bbf", borderColor: d.color ?? "#005bbf" } : {}}
                >
                  <span className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {d.icon}
                  </span>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des profils */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
            <span className="material-symbols-outlined text-red-500 text-[28px]">error</span>
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <p className="text-xs text-red-500">
              Vérifiez que SUPABASE_SERVICE_ROLE_KEY est défini dans .env.local
            </p>
            <button onClick={load}
              className="mt-2 text-xs font-bold text-red-600 underline hover:no-underline">
              Réessayer
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-low rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant block mb-3">
              person_search
            </span>
            <p className="text-on-surface-variant font-medium text-sm">
              Aucun profil trouvé pour ces filtres.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant font-medium">
              {filtered.length} profil{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
            </p>
            {filtered.map((p, i) => {
              const color = DOMAIN_COLORS[p.domaine] ?? "#005bbf";
              const icon  = DOMAIN_ICONS[p.domaine] ?? "school";
              const label = DOMAIN_LABELS[p.domaine] ?? p.domaine;
              return (
                <div
                  key={p.user_id}
                  className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-center gap-4"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm text-white"
                    style={{ backgroundColor: color }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-on-surface truncate">{p.name}</p>
                      {p.skill_passport_issued && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[11px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Certifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]"
                        style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <p className="text-xs text-on-surface-variant truncate">{label}</p>
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}15`, color }}>
                        {p.niveau}
                      </span>
                      <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                        {p.objectif}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    {p.score !== null ? (
                      <p className="text-lg font-extrabold text-on-surface">{p.score}%</p>
                    ) : (
                      <p className="text-xs text-on-surface-variant">En cours</p>
                    )}
                    <p className="text-[10px] text-on-surface-variant">{formatDate(p.enrolled_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info accès */}
        <div className="bg-surface-container-low rounded-2xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            <p className="text-sm font-bold text-on-surface">Espace recruteur PFIMN</p>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Accès réservé aux entreprises tech partenaires et administrations NDT.
              Les profils certifiés ont validé leur parcours PFIMN avec un score ≥ 70%.
            </p>
          </div>
        </div>

        <div className="text-center py-2">
          <p className="text-[10px] text-outline font-medium">
            PFIMN · MCTN · New Deal Technologique · Vision Sénégal 2050
          </p>
        </div>
      </div>
    </main>
  );
}
