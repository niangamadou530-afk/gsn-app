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

const DOMAIN_ICONS: Record<string, string> = {
  "dev-web":   "code",
  "data":      "psychology",
  "cybersec":  "security",
  "ux":        "palette",
  "ecommerce": "storefront",
  "cloud":     "cloud",
};

const DOMAIN_COLORS: Record<string, string> = {
  "dev-web":   "#005bbf",
  "data":      "#2b5bb5",
  "cybersec":  "#7b1fa2",
  "ux":        "#e65100",
  "ecommerce": "#2e7d32",
  "cloud":     "#00695c",
};

type UserData = {
  name: string;
  score: number;
  skills: any[];
  region: string | null;
};

type Enrollment = {
  domaine: string;
  niveau: string;
  objectif: string;
  region: string;
  course_id: string | null;
  skill_passport_issued: boolean;
  inserted: boolean;
  enrolled_at: string;
};

export default function MctnDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.replace("/login"); return; }

    const [userRes, enrollRes] = await Promise.all([
      supabase.from("users").select("name, score, skills, region").eq("id", authUser.id).single(),
      supabase.from("pfimn_enrollments").select("*").eq("user_id", authUser.id).single(),
    ]);

    setUser(userRes.data ?? null);
    setEnrollment(enrollRes.data ?? null);
    setLoading(false);
  }

  async function handleSignout() {
    await supabase.auth.signOut();
    router.replace("/mctn");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const score        = user?.score ?? 0;
  const skills       = Array.isArray(user?.skills) ? user.skills : [];
  const certCount    = skills.length;
  const domaine      = enrollment?.domaine ?? "";
  const domainLabel  = DOMAIN_LABELS[domaine] ?? domaine;
  const domainIcon   = DOMAIN_ICONS[domaine]  ?? "school";
  const domainColor  = DOMAIN_COLORS[domaine] ?? "#005bbf";

  // Progression estimée
  const hasCourse    = !!enrollment?.course_id;
  const hasPassport  = enrollment?.skill_passport_issued ?? false;
  const hasInsertion = enrollment?.inserted ?? false;

  const steps = [
    { label: "Inscription PFIMN",    done: !!enrollment,  icon: "how_to_reg" },
    { label: "Parcours démarré",     done: hasCourse,     icon: "school" },
    { label: "Skill Passport obtenu",done: hasPassport,   icon: "workspace_premium" },
    { label: "Insertion tech",       done: hasInsertion,  icon: "work" },
  ];
  const stepsCompleted = steps.filter((s) => s.done).length;
  const progressPct   = Math.round((stepsCompleted / steps.length) * 100);

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px]">GSN</span>
          </div>
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">PFIMN</span>
        </div>
        <button
          onClick={handleSignout}
          className="text-white/60 hover:text-white active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </button>
      </header>

      <div className="pt-20 px-6 max-w-2xl mx-auto space-y-6">

        {/* Hero salutation */}
        <section className="pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">PFIMN · Tableau de bord</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mt-1">
            Bonjour, <span className="text-primary">{user?.name?.split(" ")[0] ?? "Bénéficiaire"}</span>
          </h1>
          {enrollment && (
            <p className="text-sm text-on-surface-variant mt-1">
              {domainLabel} · {enrollment.niveau} · {enrollment.region}
            </p>
          )}
        </section>

        {/* Score badge */}
        <section className="bg-gradient-to-br from-[#0a1628] to-[#0d2050] rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="transparent" stroke="#005bbf" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(1, score / 100))}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">{score}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">Score GSN</p>
            <p className="text-white/60 text-xs mt-0.5">
              {score >= 80 ? "Expert Digital" : score >= 50 ? "Professionnel Confirmé" : score >= 20 ? "Apprenant Actif" : "Débutant Motivé"}
            </p>
            <p className="text-white/50 text-xs mt-1">{certCount} certification{certCount > 1 ? "s" : ""} obtenue{certCount > 1 ? "s" : ""}</p>
          </div>
          <Link href="/score"
            className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all border border-white/10">
            Voir
          </Link>
        </section>

        {/* Progression PFIMN */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-on-surface">Progression PFIMN</h2>
            <span className="text-sm font-extrabold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="space-y-2.5">
            {steps.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-primary" : "bg-surface-container"}`}>
                  {s.done
                    ? <span className="material-symbols-outlined text-white text-[16px]">check</span>
                    : <span className="material-symbols-outlined text-outline text-[16px]">{s.icon}</span>
                  }
                </div>
                <span className={`text-sm font-medium ${s.done ? "text-on-surface" : "text-on-surface-variant"}`}>{s.label}</span>
                {s.done && <span className="ml-auto text-[10px] font-bold text-primary">Complété</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Domaine inscrit */}
        {enrollment && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Mon métier NDT</h2>
            <div className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 shadow-sm"
              style={{ borderLeft: `4px solid ${domainColor}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${domainColor}15`, color: domainColor }}>
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{domainIcon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-sm">{domainLabel}</p>
                <p className="text-xs text-on-surface-variant">{enrollment.niveau} · {enrollment.objectif}</p>
              </div>
              <Link href="/mctn/learn"
                className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all">
                {hasCourse ? "Continuer" : "Démarrer"}
              </Link>
            </div>
          </section>
        )}

        {/* Actions rapides */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/mctn/learn",  icon: "school",              label: "Mes parcours",    color: "#005bbf", desc: "6 métiers NDT" },
              { href: "/score",       icon: "workspace_premium",   label: "Skill Passport",  color: "#2b5bb5", desc: `${certCount} cert.` },
              { href: "/missions",    icon: "work",                label: "GSN WORK",        color: "#2e7d32", desc: "Offres d'emploi" },
              { href: "/wallet",      icon: "account_balance_wallet", label: "GSN PAY",      color: "#e65100", desc: "Micro-crédit" },
            ].map((a) => (
              <Link key={a.href} href={a.href}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                </div>
                <p className="font-bold text-sm text-on-surface">{a.label}</p>
                <p className="text-xs text-on-surface-variant">{a.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Skill Passport preview */}
        {certCount > 0 && (
          <section className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Skill Passport</h2>
              <Link href="/score" className="text-primary text-xs font-bold hover:underline">Voir tout</Link>
            </div>
            {skills.slice(0, 2).map((sk: any, i: number) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-on-surface truncate">{sk.domain ?? sk.title ?? "Formation"}</p>
                  <p className="text-xs text-on-surface-variant font-mono truncate">{sk.cert_id}</p>
                </div>
                <span className="text-primary font-extrabold text-sm shrink-0">
                  {typeof sk.score === "number" ? `${sk.score}%` : "—"}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Footer PFIMN */}
        <div className="text-center py-2">
          <p className="text-[10px] text-outline font-medium">
            PFIMN · MCTN · New Deal Technologique · Vision Sénégal 2050
          </p>
        </div>

      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/mctn/dashboard" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/mctn/learn" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">school</span>
          <span className="text-[10px] font-medium mt-0.5">Parcours</span>
        </Link>
        <Link href="/score" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">workspace_premium</span>
          <span className="text-[10px] font-medium mt-0.5">Passport</span>
        </Link>
        <Link href="/missions" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">work</span>
          <span className="text-[10px] font-medium mt-0.5">WORK</span>
        </Link>
      </nav>
    </main>
  );
}
