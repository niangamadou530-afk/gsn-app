"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [userName, setUserName] = useState("Apprenant");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, [courseId]);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }

    const [courseRes, profileRes] = await Promise.all([
      supabase.from("user_courses").select("*").eq("id", courseId).eq("user_id", auth.user.id).single(),
      supabase.from("users").select("name").eq("id", auth.user.id).single(),
    ]);

    if (courseRes.error || !courseRes.data) { router.replace(`/learn/${courseId}/test`); return; }
    if (!courseRes.data.certificate_id) { router.replace(`/learn/${courseId}/test`); return; }

    setCourse(courseRes.data);
    setUserName(profileRes.data?.name ?? "Apprenant");
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!course) return null;

  const completedDate = course.completed_at
    ? new Date(course.completed_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  const domain = (course.title ?? "Formation").split("—")[0].trim();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .cert-wrap { box-shadow: none !important; }
        }
        .certificate-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23005bbf' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>

      <main className="min-h-screen bg-surface text-on-surface flex flex-col">

        {/* Top bar — hidden on print */}
        <header className="no-print fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 flex justify-between items-center px-6 py-4">
          <Link href={`/learn/${courseId}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <span className="text-base font-bold text-primary">Certificat GSN</span>
          <div className="w-10" />
        </header>

        <div className="flex-grow pt-24 pb-32 px-4 max-w-3xl mx-auto w-full">

          {/* Page title */}
          <div className="no-print mb-8 text-center">
            <h1 className="text-[2.2rem] font-extrabold tracking-tight text-on-surface leading-tight mb-2">
              Félicitations, {userName.split(" ")[0]} !
            </h1>
            <p className="text-on-surface-variant">Votre excellence a été reconnue et certifiée.</p>
          </div>

          {/* Certificate */}
          <div className="cert-wrap relative bg-surface-container-lowest rounded-2xl shadow-xl shadow-on-surface/5 p-1 overflow-hidden border-t-4 border-primary">
            <div className="absolute inset-0 certificate-pattern opacity-40 pointer-events-none" />
            <div className="relative border-[12px] border-surface-container-high m-4 p-8 md:p-12 flex flex-col items-center text-center">

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-primary/40 -m-1" />
              <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-primary/40 -m-1" />
              <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-primary/40 -m-1" />
              <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-primary/40 -m-1" />

              {/* Logo */}
              <div className="mb-8 flex flex-col items-center">
                <img src="/images/gsn-logo-transparent.png" alt="GSN Global Skills Network" style={{width:"220px", height:"auto"}} className="mb-2" />
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-4xl font-bold text-primary mb-10 tracking-tight">
                CERTIFICAT DE COMPLÉTION
              </h2>

              {/* Recipient */}
              <div className="mb-10">
                <p className="text-on-surface-variant italic mb-3 text-sm">Décerné à</p>
                <h3 className="text-3xl md:text-4xl font-black text-on-surface leading-none border-b-2 border-primary/20 pb-4 inline-block px-6">
                  {userName}
                </h3>
              </div>

              {/* Course */}
              <div className="max-w-lg mb-10">
                <p className="text-on-surface-variant mb-3 text-sm leading-relaxed">Pour avoir complété avec succès le parcours :</p>
                <p className="text-xl font-bold text-secondary">{domain}</p>
                <p className="text-sm text-on-surface-variant mt-1">{course.title}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 w-full max-w-lg mb-12 pt-6 border-t border-outline-variant/30">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">Score obtenu</span>
                  <span className="text-2xl font-bold text-tertiary">{course.test_score}/100</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">Date</span>
                  <span className="text-sm font-bold text-on-surface">{completedDate}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">ID Certificat</span>
                  <span className="font-mono text-[10px] font-semibold text-on-surface break-all">{course.certificate_id}</span>
                </div>
              </div>

              {/* Signature */}
              <div className="flex flex-col items-center">
                <div className="w-40 h-10 border-b border-on-surface-variant/30 mb-2 flex items-center justify-center">
                  <span className="font-serif italic text-xl text-on-surface-variant/60">GSN Executive</span>
                </div>
                <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Global Skills Network</p>
              </div>

              {/* Seal */}
              <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[100px]">verified_user</span>
              </div>
            </div>
          </div>

          {/* Action buttons — hidden on print */}
          <div className="no-print mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">download</span>
              Télécharger en PDF
            </button>
            <Link
              href="/score"
              className="w-full sm:w-auto px-8 py-4 bg-surface-container-lowest text-primary border-2 border-primary/20 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-primary/5 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">account_circle</span>
              Mon Skill Passport
            </Link>
          </div>

          {/* Share section — hidden on print */}
          <div className="no-print mt-6">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Partager ma certification</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[#0A66C2] text-white rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span className="text-[11px] font-bold">LinkedIn</span>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Je viens d'obtenir ma certification ${domain} sur GSN Global Skills Network ! Score : ${course.test_score}% 🎓 #GSN #Formation #Afrique\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[#25D366] text-white rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                <span className="text-[11px] font-bold">WhatsApp</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Je viens d'obtenir ma certification ${domain} sur GSN Global Skills Network ! Score : ${course.test_score}% 🎓 #GSN #Formation #Afrique`)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-on-surface text-surface rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span className="text-[11px] font-bold">X (Twitter)</span>
              </a>

              {/* Copy link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex flex-col items-center gap-2 p-4 bg-surface-container-low text-on-surface rounded-2xl hover:bg-surface-container active:scale-95 transition-all border border-outline-variant/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">{copied ? "check_circle" : "link"}</span>
                <span className="text-[11px] font-bold">{copied ? "Copié !" : "Copier lien"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom nav — hidden on print */}
        <nav className="no-print fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
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
    </>
  );
}
