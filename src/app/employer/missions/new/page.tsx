"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";

const DOMAINS = [
  "Marketing Digital",
  "Développement Web",
  "Design Graphique",
  "Comptabilité & Finance",
  "Gestion de Projet",
  "Cybersécurité",
  "Data & IA",
  "Autre",
];

function domainLabel(d: string) {
  const map: Record<string, string> = {
    "Marketing Digital": t("work.employerMissionNew.domains.marketing"),
    "Développement Web": t("work.employerMissionNew.domains.webDev"),
    "Design Graphique": t("work.employerMissionNew.domains.design"),
    "Comptabilité & Finance": t("work.employerMissionNew.domains.finance"),
    "Gestion de Projet": t("work.employerMissionNew.domains.projectMgmt"),
    "Cybersécurité": t("work.employerMissionNew.domains.cybersecurity"),
    "Data & IA": t("work.employerMissionNew.domains.dataAI"),
    "Autre": t("work.employerMissionNew.domains.other"),
  };
  return map[d] ?? d;
}

export default function NewMissionPage() {
  const router = useRouter();
  const [employerId, setEmployerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [budgetFcfa, setBudgetFcfa] = useState("");
  const [durationType, setDurationType] = useState<"short" | "long" | "freelance">("short");
  const [minScore, setMinScore] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/employer/login"); return; }
      const { data: emps } = await supabase.from("employers").select("id").eq("auth_id", auth.user.id).limit(1);
      const emp = emps?.[0] ?? null;
      if (!emp) { router.replace("/employer/login"); return; }
      setEmployerId(emp.id);
    }
    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employerId) return;
    setError("");
    setLoading(true);
    try {
      const { error: insertErr } = await supabase.from("employer_missions").insert({
        employer_id: employerId,
        title: title.trim(),
        description: description.trim() || null,
        domain,
        budget_fcfa: parseInt(budgetFcfa) || 0,
        duration_type: durationType,
        min_gsn_score: parseInt(minScore) || 0,
        status: "active",
      });
      if (insertErr) { setError(insertErr.message); return; }
      router.push("/employer/dashboard");
    } catch {
      setError(t("work.employerMissionNew.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-fixed/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary-fixed/20 blur-[120px] rounded-full" />
      </div>

      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/employer/dashboard" className="text-outline hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <h1 className="font-bold text-on-surface text-lg">{t("work.employerMissionNew.headerTitle")}</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface ml-1">{t("work.employerMissionNew.titleLabel")}</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">work</span>
              <input
                type="text" placeholder={t("work.employerMissionNew.titlePlaceholder")} required
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
              />
            </div>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface ml-1">{t("work.employerMissionNew.domainLabel")}</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">category</span>
              <select
                value={domain} onChange={e => setDomain(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-on-surface outline-none appearance-none"
              >
                {DOMAINS.map(d => <option key={d} value={d}>{domainLabel(d)}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Duration type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface ml-1">{t("work.employerMissionNew.durationTypeLabel")}</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "short", label: t("work.employerMissionNew.duration.short"), icon: "schedule" },
                { value: "long", label: t("work.employerMissionNew.duration.long"), icon: "calendar_month" },
                { value: "freelance", label: t("work.employerMissionNew.duration.freelance"), icon: "laptop_mac" },
              ] as const).map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setDurationType(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-xl font-semibold text-sm transition-all border-2 ${durationType === opt.value ? "border-primary bg-primary/8 text-primary" : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-primary/40"}`}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: `'FILL' ${durationType === opt.value ? 1 : 0}` }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface ml-1">{t("work.employerMissionNew.descriptionLabel")}</label>
            <textarea
              placeholder={t("work.employerMissionNew.descriptionPlaceholder")}
              value={description} onChange={e => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none resize-none"
            />
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface ml-1">{t("work.employerMissionNew.budgetLabel")}</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">payments</span>
              <input
                type="number" placeholder={t("work.employerMissionNew.budgetPlaceholder")} min={0}
                value={budgetFcfa} onChange={e => setBudgetFcfa(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-outline-variant outline-none"
              />
            </div>
          </div>

          {/* Min GSN score */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface ml-1">{t("work.employerMissionNew.minScoreLabel", { score: minScore })}</label>
            <div className="flex items-center gap-4 px-1">
              <span className="material-symbols-outlined text-outline text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <input
                type="range" min={0} max={100} step={5}
                value={minScore} onChange={e => setMinScore(e.target.value)}
                className="flex-1 accent-primary"
              />
              <span className="text-primary font-bold text-sm w-10 text-right">{minScore}%</span>
            </div>
            <p className="text-xs text-on-surface-variant ml-1">{t("work.employerMissionNew.minScoreHelp")}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error/10 text-error rounded-xl px-4 py-3 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-[0_4px_12px_rgba(0,91,191,0.25)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" /> {t("work.employerMissionNew.submitting")}</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>publish</span> {t("work.employerMissionNew.submit")}</>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
