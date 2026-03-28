"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Skill = { domain: string; title?: string; score: number; date: string; cert_id: string; weeks?: number; level?: string };

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const months = ["jan","fév","mars","avr","mai","juin","juil","août","sep","oct","nov","déc"];
  return `${d} ${months[m - 1]} ${y}`;
}

const CREDIT_THRESHOLD = 50;

const DOMAIN_ICONS: Record<string, string> = {
  "Marketing": "campaign",
  "Développement": "code",
  "Web": "code",
  "Design": "palette",
  "Finance": "account_balance",
  "Agriculture": "eco",
  "Langues": "translate",
};

function getDomainIcon(domain: string): string {
  if (!domain) return "workspace_premium";
  for (const key of Object.keys(DOMAIN_ICONS)) {
    if (domain.toLowerCase().includes(key.toLowerCase())) return DOMAIN_ICONS[key];
  }
  return "workspace_premium";
}

const SKILL_COLORS = ["#005bbf", "#2b5bb5", "#9c27b0", "#ff9800", "#4caf50"];
function skillColor(i: number): string { return SKILL_COLORS[i % SKILL_COLORS.length]; }

export default function ScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session) { router.replace("/login"); return; }
      const { data, error: dbErr } = await supabase.from("users").select("score, skills")
        .eq("id", sessionData.session.user.id).single();
      console.log('[ScorePage] skills from DB:', data?.skills, '| score:', data?.score, '| dbErr:', dbErr);
      setScore(typeof data?.score === "number" ? data.score : 0);
      const rawSkills = Array.isArray(data?.skills) ? data.skills : [];
      // Guard against malformed skill objects
      setSkills(rawSkills.filter((s: any) => s && typeof s === "object"));
    } catch (e) {
      console.error("[ScorePage] load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const eligible = score >= CREDIT_THRESHOLD;
  const progressPct = Math.min(100, Math.round((score / CREDIT_THRESHOLD) * 100));
  // SVG ring: r=88, circumference = 2πr ≈ 552.9
  const circumference = 2 * Math.PI * 88;
  const strokeOffset = circumference * (1 - Math.min(1, score / 100));

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 flex justify-between items-center px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-primary">GSN</span>
        <Link href="/learn/onboarding" className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </Link>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-8">

        {/* Score ring hero */}
        <section className="flex flex-col items-center justify-center text-center space-y-4 py-6">
          {loading ? (
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle className="text-surface-container-highest" cx="96" cy="96" r="88"
                    fill="transparent" stroke="currentColor" strokeWidth="12" />
                  <circle className="text-primary transition-all duration-1000" cx="96" cy="96" r="88"
                    fill="transparent" stroke="currentColor" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-extrabold tracking-tighter text-on-surface">
                    {score}<span className="text-xl text-on-surface-variant font-medium">/100</span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mt-1">Score Global</span>
                </div>
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-tertiary-fixed rounded-full gap-2">
                <span className="material-symbols-outlined text-sm text-on-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span className="text-xs font-bold text-on-tertiary-fixed">
                  {score >= 80 ? "Expert Digital" : score >= 50 ? "Professionnel Confirmé" : score >= 20 ? "Apprenant Actif" : "Débutant Motivé"}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Micro-credit eligibility */}
        <section className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Éligibilité Micro-crédit</h2>
              <p className="text-sm text-on-surface-variant">Basé sur vos performances</p>
            </div>
            {eligible ? (
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-[11px] font-bold">Éligible</span>
              </div>
            ) : (
              <div className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full">
                <span className="text-[11px] font-bold">En cours</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-on-surface-variant">Seuil d&apos;activation</span>
              <span className="text-primary">{Math.min(score, CREDIT_THRESHOLD)} / {CREDIT_THRESHOLD} pts</span>
            </div>
            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {eligible ? (
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-primary/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Crédit disponible</p>
                <p className="text-xl font-extrabold text-primary">250 000 FCFA</p>
              </div>
              <Link href="/wallet" className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-primary/20 active:scale-95 transition-all">
                Demander
              </Link>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant">
              Encore <strong className="text-on-surface">{CREDIT_THRESHOLD - score} points</strong> à obtenir ·{" "}
              <Link href="/learn/onboarding" className="text-primary font-bold hover:underline">Obtenir une certification</Link>
            </p>
          )}
        </section>

        {/* Skill Passport */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Skill Passport</h2>
          </div>

          {loading ? null : skills.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">workspace_premium</span>
              <p className="text-on-surface-variant text-sm mb-4">Aucune compétence certifiée pour le moment.</p>
              <Link href="/learn/onboarding"
                className="inline-block bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-primary/20 active:scale-95 transition-all">
                Commencer un parcours
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm space-y-4"
                  style={{ borderLeft: `4px solid ${skillColor(i)}` }}
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${skillColor(i)}15`, color: skillColor(i) }}
                    >
                      <span className="material-symbols-outlined text-[20px]">{getDomainIcon(skill.domain)}</span>
                    </div>
                    <span className="text-2xl font-black" style={{ color: `${skillColor(i)}30` }}>{skill.score}%</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">{skill.domain ?? "Formation"}</h3>
                    {skill.level && <p className="text-xs text-on-surface-variant mt-0.5">{skill.level}</p>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {formatDate(skill.date)}
                    </span>
                    {skill.weeks && (
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {skill.weeks} sem.
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-outline break-all">{skill.cert_id}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Scoring criteria */}
        <section className="bg-surface-container-low rounded-2xl p-6 space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Critères de Scoring</h2>
          {[
            { label: "Formations académiques", pct: Math.min(100, skills.length * 20), color: "#005bbf" },
            { label: "Certifications obtenues", pct: Math.min(100, skills.length * 15), color: "#2b5bb5" },
            { label: "Score total", pct: Math.min(100, score), color: "#005bbf" },
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface">{item.label}</span>
                <span className="font-bold">{item.pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/learn" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">school</span>
          <span className="text-[10px] font-medium mt-0.5">Apprendre</span>
        </Link>
        <Link href="/missions" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[10px] font-medium mt-0.5">Missions</span>
        </Link>
        <Link href="/wallet" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-medium mt-0.5">Wallet</span>
        </Link>
        <Link href="/score" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          <span className="text-[10px] font-medium mt-0.5">Score</span>
        </Link>
      </nav>
    </main>
  );
}
