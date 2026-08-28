"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

// Maps PFIMN domain IDs → mission domain keywords
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "dev-web":   ["web", "mobile", "react", "frontend", "développement", "dev", "next"],
  "data":      ["data", "ia", "intelligence", "machine learning", "python", "analyse"],
  "cybersec":  ["cybersécurité", "sécurité", "réseau", "admin", "linux"],
  "ux":        ["ux", "design", "ui", "contenu", "digital", "figma"],
  "ecommerce": ["ecommerce", "e-commerce", "marketing", "seo", "boutique", "crm"],
  "cloud":     ["cloud", "devops", "docker", "aws", "kubernetes"],
};

type Mission = {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  budget_fcfa: number;
  duration_type: string;
  min_gsn_score: number;
  status: string;
  created_at: string;
};

type Enrollment = {
  domaine: string;
  niveau: string;
  skill_passport_issued: boolean;
  course_id: string | null;
};

function missionMatchesDomain(mission: Mission, domainId: string): boolean {
  const keywords = DOMAIN_KEYWORDS[domainId] ?? [];
  const haystack = `${mission.title} ${mission.description ?? ""} ${mission.domain ?? ""}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

export default function MctnWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const [enrollRes, profileRes, missionsRes, appsRes] = await Promise.all([
      supabase.from("pfimn_enrollments")
        .select("domaine, niveau, skill_passport_issued, course_id")
        .eq("user_id", user.id).single(),
      supabase.from("users").select("score").eq("id", user.id).single(),
      supabase.from("employer_missions")
        .select("*").eq("status", "active").eq("tenant_id", "mctn")
        .order("created_at", { ascending: false }),
      supabase.from("applications").select("mission_id").eq("user_id", user.id),
    ]);

    setEnrollment(enrollRes.data as Enrollment | null);
    setUserScore(profileRes.data?.score ?? 0);
    setMissions((missionsRes.data ?? []) as Mission[]);
    setApplied(new Set((appsRes.data ?? []).map((a: any) => a.mission_id)));
    setLoading(false);
  }

  async function applyMission(missionId: string) {
    setApplying(missionId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      mission_id: missionId,
    });

    if (!error) {
      setApplied((prev) => new Set([...prev, missionId]));
    }
    setApplying(null);
  }

  function formatBudget(fcfa: number): string {
    if (fcfa >= 1_000_000) return `${(fcfa / 1_000_000).toFixed(1)}M FCFA`;
    if (fcfa >= 1_000)     return `${Math.round(fcfa / 1_000)}K FCFA`;
    return `${fcfa} FCFA`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const domaine      = enrollment?.domaine ?? "";
  const domainLabel  = DOMAIN_LABELS[domaine] ?? "";
  const domainColor  = DOMAIN_COLORS[domaine] ?? "#005bbf";
  const domainIcon   = DOMAIN_ICONS[domaine] ?? "work";
  const isCertified  = enrollment?.skill_passport_issued ?? false;

  const matchedMissions = missions.filter((m) =>
    domaine && missionMatchesDomain(m, domaine)
  );
  const otherMissions = missions.filter((m) =>
    !domaine || !missionMatchesDomain(m, domaine)
  );

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-md">
        <div className="flex items-center gap-2">
          <Link href="/mctn/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </Link>
          <span className="text-sm font-bold text-white/90">GSN WORK · NDT</span>
        </div>
        <span className="text-xs text-white/50 font-bold uppercase tracking-widest">PFIMN</span>
      </header>

      <div className="pt-20 px-6 max-w-2xl mx-auto space-y-6">

        {/* Profil badge */}
        {enrollment && (
          <div className="pt-4">
            <div className="bg-gradient-to-br from-[#0a1628] to-[#0d2050] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${domainColor}25`, border: `1.5px solid ${domainColor}40` }}>
                <span className="material-symbols-outlined text-[22px]"
                  style={{ color: domainColor, fontVariationSettings: "'FILL' 1" }}>{domainIcon}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Mon profil NDT</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{domainLabel}</p>
                <p className="text-xs text-white/50">{enrollment.niveau}</p>
              </div>
              {isCertified ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-full shrink-0">
                  <span className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-[11px] font-bold">Certifié</span>
                </div>
              ) : (
                <Link href="/mctn/learn"
                  className="bg-primary text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 active:scale-95 transition-all">
                  Certifier
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Offres qui matchent */}
        {domaine && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-on-surface">
                Offres correspondantes
              </h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${domainColor}15`, color: domainColor }}>
                {matchedMissions.length} offre{matchedMissions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {matchedMissions.length === 0 ? (
              <div className="bg-surface-container-low rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-outline-variant block mb-2">
                  work_off
                </span>
                <p className="text-sm text-on-surface-variant">
                  Aucune offre active dans ton domaine NDT pour l'instant.
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Reviens régulièrement, de nouvelles offres sont ajoutées.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchedMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    domainColor={domainColor}
                    userScore={userScore}
                    isApplied={applied.has(m.id)}
                    isApplying={applying === m.id}
                    isCertified={isCertified}
                    isMatch
                    onApply={() => applyMission(m.id)}
                    formatBudget={formatBudget}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Autres offres */}
        {otherMissions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-on-surface">Autres opportunités</h2>
            <div className="space-y-3">
              {otherMissions.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  domainColor="#64748b"
                  userScore={userScore}
                  isApplied={applied.has(m.id)}
                  isApplying={applying === m.id}
                  isCertified={isCertified}
                  isMatch={false}
                  onApply={() => applyMission(m.id)}
                  formatBudget={formatBudget}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </section>
        )}

        {!enrollment && (
          <div className="bg-surface-container-low rounded-2xl p-6 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline-variant block">
              assignment_ind
            </span>
            <p className="text-sm text-on-surface-variant font-medium">
              Inscris-toi au PFIMN pour accéder aux offres NDT correspondant à ton profil.
            </p>
            <Link href="/mctn/inscription"
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              S'inscrire au PFIMN
            </Link>
          </div>
        )}

        <div className="text-center py-2">
          <p className="text-[10px] text-outline font-medium">
            GSN WORK · PFIMN · NDT Sénégal 2050
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/mctn/dashboard"
          className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/mctn/learn"
          className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">school</span>
          <span className="text-[10px] font-medium mt-0.5">Parcours</span>
        </Link>
        <Link href="/mctn/passport"
          className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">workspace_premium</span>
          <span className="text-[10px] font-medium mt-0.5">Passport</span>
        </Link>
        <Link href="/mctn/work"
          className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
          <span className="text-[10px] font-medium mt-0.5">WORK</span>
        </Link>
        <Link href="/mctn/pay"
          className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-medium mt-0.5">PAY</span>
        </Link>
      </nav>
    </main>
  );
}

// ── Mission card component ──

function MissionCard({
  mission, domainColor, userScore, isApplied, isApplying,
  isCertified, isMatch, onApply, formatBudget, formatDate,
}: {
  mission: Mission;
  domainColor: string;
  userScore: number;
  isApplied: boolean;
  isApplying: boolean;
  isCertified: boolean;
  isMatch: boolean;
  onApply: () => void;
  formatBudget: (v: number) => string;
  formatDate: (v: string) => string;
}) {
  const canApply = userScore >= mission.min_gsn_score;

  return (
    <div
      className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3"
      style={{ borderLeft: `3px solid ${isMatch ? domainColor : "var(--color-outline-variant)"}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isMatch && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${domainColor}15`, color: domainColor }}>
                NDT MATCH
              </span>
            )}
            {isCertified && isMatch && (
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Passport délivré
              </span>
            )}
          </div>
          <p className="font-bold text-sm text-on-surface leading-snug">{mission.title}</p>
          {mission.domain && (
            <p className="text-xs text-on-surface-variant mt-0.5">{mission.domain}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-extrabold text-sm text-on-surface">{formatBudget(mission.budget_fcfa)}</p>
          <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
            {mission.duration_type}
          </p>
        </div>
      </div>

      {mission.description && (
        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
          {mission.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">stars</span>
            Score min. {mission.min_gsn_score}
          </span>
          {!canApply && (
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
              Score insuffisant
            </span>
          )}
          <span className="text-[10px] text-on-surface-variant">{formatDate(mission.created_at)}</span>
        </div>
        {isApplied ? (
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Candidature envoyée
          </span>
        ) : (
          <button
            onClick={onApply}
            disabled={!canApply || isApplying}
            className="text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all disabled:opacity-40"
            style={{
              backgroundColor: canApply ? `${domainColor}15` : "var(--color-surface-container)",
              color: canApply ? domainColor : "var(--color-on-surface-variant)",
            }}
          >
            {isApplying ? "…" : "Postuler"}
          </button>
        )}
      </div>
    </div>
  );
}
