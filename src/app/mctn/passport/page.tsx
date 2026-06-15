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
  "dev-web": "code", data: "psychology", cybersec: "security",
  ux: "palette", ecommerce: "storefront", cloud: "cloud",
};
const DOMAIN_COLORS: Record<string, string> = {
  "dev-web": "#005bbf", data: "#2b5bb5", cybersec: "#7b1fa2",
  ux: "#e65100", ecommerce: "#2e7d32", cloud: "#00695c",
};

type Enrollment = {
  domaine: string;
  niveau: string;
  objectif: string;
  skill_passport_issued: boolean;
  course_id: string | null;
  enrolled_at: string;
};

type CourseData = {
  title: string;
  test_score: number;
  certificate_id: string;
  completed_at: string;
};

export default function MctnPassportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Bénéficiaire");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const [profileRes, enrollRes] = await Promise.all([
      supabase.from("users").select("name").eq("id", user.id).single(),
      supabase.from("pfimn_enrollments")
        .select("domaine, niveau, objectif, skill_passport_issued, course_id, enrolled_at")
        .eq("user_id", user.id).single(),
    ]);

    setUserName(profileRes.data?.name ?? "Bénéficiaire");
    const enroll = enrollRes.data as Enrollment | null;
    setEnrollment(enroll);

    if (enroll?.course_id) {
      const { data: course } = await supabase
        .from("user_courses")
        .select("title, test_score, certificate_id, completed_at")
        .eq("id", enroll.course_id)
        .single();
      if (course?.certificate_id) setCourseData(course as CourseData);
    }

    setLoading(false);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const domaine      = enrollment?.domaine ?? "";
  const domainLabel  = DOMAIN_LABELS[domaine] ?? domaine;
  const domainIcon   = DOMAIN_ICONS[domaine] ?? "school";
  const domainColor  = DOMAIN_COLORS[domaine] ?? "#005bbf";
  const isIssued     = enrollment?.skill_passport_issued ?? false;
  const certId       = courseData?.certificate_id ?? null;
  const score        = courseData?.test_score ?? null;
  const issuedDate   = courseData?.completed_at ? formatDate(courseData.completed_at) : null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .passport-card { box-shadow: none !important; }
        }
      `}</style>

      <main className="min-h-screen bg-surface text-on-surface pb-28">

        {/* Top bar */}
        <header className="no-print fixed top-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-md">
          <div className="flex items-center gap-2">
            <Link href="/mctn/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </Link>
            <span className="text-sm font-bold text-white/80">Skill Passport PFIMN</span>
          </div>
          {isIssued && (
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[16px]">download</span>
              Télécharger
            </button>
          )}
        </header>

        <div className="pt-20 px-6 max-w-2xl mx-auto space-y-6">

          {/* Titre */}
          <div className="pt-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              PFIMN · NDT Sénégal 2050
            </p>
            <h1 className="text-2xl font-extrabold text-on-surface">Skill Passport</h1>
          </div>

          {/* Passport card */}
          <div className="passport-card relative bg-gradient-to-br from-[#0a1628] to-[#0d2050] rounded-3xl overflow-hidden shadow-2xl">

            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none"
              style={{ backgroundColor: `${domainColor}30` }} />

            <div className="relative p-6 space-y-5">

              {/* Header passport */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
                    Passeport de Compétences Numériques
                  </p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    République du Sénégal · MCTN
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isIssued ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span className="text-[11px] font-bold">Délivré</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-white/10 text-white/50 border border-white/10 px-3 py-1.5 rounded-full">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span className="text-[11px] font-bold">En attente</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Titulaire */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-white text-[32px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Titulaire</p>
                  <p className="text-xl font-extrabold text-white mt-0.5">{userName}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Inscrit le {enrollment?.enrolled_at ? formatDate(enrollment.enrolled_at) : "—"}
                  </p>
                </div>
              </div>

              {/* Domaine certifié */}
              {enrollment && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${domainColor}20`, border: `1.5px solid ${domainColor}40` }}>
                    <span className="material-symbols-outlined text-[22px]"
                      style={{ color: domainColor, fontVariationSettings: "'FILL' 1" }}>
                      {domainIcon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Métier NDT certifié
                    </p>
                    <p className="text-sm font-extrabold text-white mt-0.5">{domainLabel}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${domainColor}25`, color: domainColor }}>
                        {enrollment.niveau}
                      </span>
                      <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                        {enrollment.objectif}
                      </span>
                    </div>
                  </div>
                  {score !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-white">{score}%</p>
                      <p className="text-[10px] text-white/40 font-bold">Score</p>
                    </div>
                  )}
                </div>
              )}

              {/* Certificat ID */}
              {isIssued && certId && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Identifiant de certification
                  </p>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <span className="font-mono text-xs text-white/70 flex-1 break-all">{certId}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(certId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="shrink-0 text-white/40 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copied ? "check_circle" : "content_copy"}
                      </span>
                    </button>
                  </div>
                  {issuedDate && (
                    <p className="text-[10px] text-white/40 font-medium text-right">
                      Délivré le {issuedDate}
                    </p>
                  )}
                </div>
              )}

              {/* Footer passport */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    Programme PFIMN
                  </p>
                  <p className="text-[10px] text-white/20 font-medium">
                    New Deal Technologique · Vision Sénégal 2050
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">GSN</p>
                  <p className="text-[10px] text-white/20 font-medium">Global Skills Network</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pas encore certifié */}
          {!isIssued && (
            <div className="bg-surface-container-low rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-sm">Passport pas encore délivré</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Complète ton parcours de formation PFIMN et réussis le test final (70% minimum)
                  pour recevoir ton Skill Passport automatiquement.
                </p>
                <Link href="/mctn/learn"
                  className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl mt-3 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[15px]">school</span>
                  Accéder à mon parcours
                </Link>
              </div>
            </div>
          )}

          {/* Actions si certifié */}
          {isIssued && courseData && (
            <div className="space-y-3">
              <Link href={`/learn/${enrollment?.course_id}/certificate`}
                className="flex items-center gap-3 w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">Voir mon certificat GSN</p>
                  <p className="text-xs text-on-surface-variant">Certificat officiel · Score {score}%</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  arrow_forward
                </span>
              </Link>

              <Link href="/mctn/dashboard"
                className="flex items-center gap-3 w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">Mon Score GSN</p>
                  <p className="text-xs text-on-surface-variant">Toutes mes certifications</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  arrow_forward
                </span>
              </Link>

              <Link href="/mctn/work"
                className="flex items-center gap-3 w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${domainColor}15` }}>
                  <span className="material-symbols-outlined text-[20px]"
                    style={{ color: domainColor, fontVariationSettings: "'FILL' 1" }}>work</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">Offres d'emploi NDT</p>
                  <p className="text-xs text-on-surface-variant">GSN WORK · Entreprises tech</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-2">
            <p className="text-[10px] text-outline font-medium">
              PFIMN · MCTN · New Deal Technologique · Vision Sénégal 2050
            </p>
          </div>
        </div>

        {/* Bottom nav */}
        <nav className="no-print fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
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
            className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <span className="text-[10px] font-medium mt-0.5">Passport</span>
          </Link>
          <Link href="/mctn/work"
            className="flex flex-col items-center text-outline active:scale-90 transition-transform">
            <span className="material-symbols-outlined">work</span>
            <span className="text-[10px] font-medium mt-0.5">WORK</span>
          </Link>
          <Link href="/mctn/pay"
            className="flex flex-col items-center text-outline active:scale-90 transition-transform">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-[10px] font-medium mt-0.5">PAY</span>
          </Link>
        </nav>
      </main>
    </>
  );
}
