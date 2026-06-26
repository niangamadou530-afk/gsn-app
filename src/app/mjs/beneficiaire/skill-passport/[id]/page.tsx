"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NIVEAU_LABEL } from "../../parcours/types";
import MjsNavbar from "../../MjsNavbar";


type PassportData = {
  id: string;
  delivre_le: string;
  parcours: {
    titre: string;
    niveau: string | null;
    mjs_secteurs: { nom: string }[] | null;
  } | null;
  beneficiaire: { prenom: string; nom: string } | null;
};

export default function SkillPassportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const element = document.querySelector(".cert-wrap");
      if (!element) return;

      const [html2canvasModule, jspdfModule] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf")
      ]);

      const html2canvasPro = html2canvasModule.default;
      const jsPDF = jspdfModule.jsPDF;

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
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let position = 0;
      if (imgHeight < pageHeight) {
        position = (pageHeight - imgHeight) / 2;
      }
      
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      pdf.save(`PNACIJ_Skill_Passport_${data?.beneficiaire?.prenom}_${data?.beneficiaire?.nom}.pdf`);
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Une erreur est survenue lors du téléchargement du certificat.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/mjs/beneficiaire/connexion"); return; }

    const [{ data: passport }, { data: ben }] = await Promise.all([
      supabase
        .from("mjs_skill_passports")
        .select("id, delivre_le, mjs_parcours ( titre, niveau, mjs_secteurs ( nom ) )")
        .eq("user_id", user.id)
        .eq("parcours_id", id)
        .eq("tenant_id", "mjs")
        .maybeSingle(),
      supabase
        .from("mjs_beneficiaires")
        .select("prenom, nom")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .maybeSingle(),
    ]);

    if (!passport) {
      router.push(`/mjs/beneficiaire/parcours/${id}`);
      return;
    }

    setData({
      id: passport.id,
      delivre_le: passport.delivre_le,
      parcours: Array.isArray(passport.mjs_parcours)
        ? passport.mjs_parcours[0] ?? null
        : passport.mjs_parcours,
      beneficiaire: ben,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!data) return null;

  const date = new Date(data.delivre_le).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .cert-wrap { box-shadow: none !important; border: none !important; }
        }
        .certificate-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23009639' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>

      <main className="min-h-screen bg-surface text-on-surface flex flex-col">
        {/* Top bar — hidden on print */}
        <header className="no-print fixed top-0 w-full z-50 bg-surface/85 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
          <button
            onClick={() => router.push("/mjs/beneficiaire/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <span className="text-base font-bold text-primary">Mon Skill Passport</span>
          <div className="w-10" />
        </header>

        <div className="flex-grow pt-24 pb-32 px-4 max-w-3xl mx-auto w-full">
          {/* Page title */}
          <div className="no-print mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-2">
              Félicitations, {data.beneficiaire?.prenom} !
            </h1>
            <p className="text-sm text-on-surface-variant">
              Votre compétence a été officiellement certifiée et enregistrée par le Ministère.
            </p>
          </div>

          {/* Certificate Design */}
          <div className="cert-wrap relative bg-surface-container-lowest rounded-2xl shadow-xl shadow-on-surface/5 p-1 overflow-hidden border-t-4 border-[#009639]">
            <div className="absolute inset-0 certificate-pattern opacity-60 pointer-events-none" />
            
            {/* Senegal Flag Top Banner */}
            <div className="h-1.5 w-full flex">
              <div className="w-1/3 h-full bg-[#009639]" />
              <div className="w-1/3 h-full bg-[#FCD116]" />
              <div className="w-1/3 h-full bg-[#E31B23]" />
            </div>

            <div className="relative border-[12px] border-surface-container-high m-4 p-6 md:p-10 flex flex-col items-center text-center">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-[#009639]/40 -m-1" />
              <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-[#009639]/40 -m-1" />
              <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-[#009639]/40 -m-1" />
              <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-[#009639]/40 -m-1" />

              {/* Official Header */}
              <div className="mb-6 flex flex-col items-center">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-1">
                  RÉPUBLIQUE DU SÉNÉGAL
                </span>
                <span className="text-[9px] font-extrabold tracking-widest text-[#009639]/80 uppercase mb-2">
                  MINISTÈRE DE LA JEUNESSE, DES SPORTS ET DE LA CULTURE
                </span>
                <div className="w-8 h-8 relative flex items-center justify-center mb-1">
                  <span className="text-xl text-[#009639]">★</span>
                </div>
                <span className="text-[9px] font-bold text-on-surface-variant tracking-wider uppercase">
                  PROGRAMME NATIONAL D'APPUI A LA CITOYENNETE ET A L'INSERTION DES JEUNES
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-black text-[#009639] mb-8 tracking-tight">
                PASSEPORT DE COMPÉTENCE CERTIFIÉ
              </h2>

              {/* Recipient */}
              <div className="mb-8">
                <p className="text-on-surface-variant italic mb-2 text-xs">Ce document officiel est décerné à</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface leading-none border-b-2 border-[#009639]/20 pb-3 inline-block px-6">
                  {data.beneficiaire?.prenom} {data.beneficiaire?.nom}
                </h3>
              </div>

              {/* Course */}
              <div className="max-w-lg mb-8">
                <p className="text-on-surface-variant mb-2 text-xs leading-relaxed">
                  Pour avoir complété avec succès le parcours de formation et validé l'évaluation finale :
                </p>
                <p className="text-lg font-bold text-primary">
                  {data.parcours?.titre}
                </p>
                <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                  Secteur : {data.parcours?.mjs_secteurs && data.parcours.mjs_secteurs.length > 0
                    ? data.parcours.mjs_secteurs.map(s => s.nom).join(', ')
                    : "Non spécifié"}
                  {data.parcours?.niveau && ` · Niveau : ${NIVEAU_LABEL[data.parcours.niveau] ?? data.parcours.niveau}`}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-10 pt-5 border-t border-outline-variant/30 text-xs">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[9px] font-bold tracking-widest uppercase mb-0.5">Statut</span>
                  <span className="text-sm font-bold text-[#009639] flex items-center justify-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Validé
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[9px] font-bold tracking-widest uppercase mb-0.5">Date d'obtention</span>
                  <span className="text-sm font-bold text-on-surface">{date}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[9px] font-bold tracking-widest uppercase mb-0.5">Numéro unique</span>
                  <span className="font-mono text-[9px] font-semibold text-on-surface break-all uppercase">
                    {data.id ? data.id.substring(0, 8) + "..." : "—"}
                  </span>
                </div>
              </div>

              {/* Signature block */}
              <div className="flex justify-between items-end w-full max-w-md mt-4">
                <div className="flex flex-col items-start">
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-8">
                    Le Secrétaire PNACIJ
                  </p>
                  <div className="w-24 h-0.5 border-b border-on-surface-variant/30 mb-1" />
                  <span className="text-[8px] text-on-surface-variant italic">Signature autorisée</span>
                </div>

                {/* Star Emblem Seal */}
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#FCD116] flex items-center justify-center p-1 opacity-80 rotate-12 shrink-0">
                  <div className="w-full h-full bg-[#FCD116]/10 rounded-full flex flex-col items-center justify-center">
                    <span className="text-[6px] font-extrabold text-[#FCD116] uppercase tracking-tighter leading-none">PNACIJ</span>
                    <span className="text-xs text-[#009639] leading-none">★</span>
                    <span className="text-[5px] font-bold text-[#E31B23] uppercase tracking-tighter leading-none">MJS</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-8">
                    Le Secrétaire Général MJS
                  </p>
                  <div className="w-24 h-0.5 border-b border-on-surface-variant/30 mb-1" />
                  <span className="text-[8px] text-on-surface-variant italic">Cachet officiel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons — hidden on print */}
          <div className="no-print mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="w-full sm:w-auto px-6 py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/15 hover:opacity-90 active:scale-95 transition-all text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #009639, #007a2e)', color: '#ffffff' }}
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              {downloading ? "Génération PDF..." : "Télécharger le certificat (PDF)"}
            </button>
            <button
              onClick={() => router.push(`/mjs/beneficiaire/parcours/${id}`)}
              className="w-full sm:w-auto px-6 py-3.5 bg-surface-container-lowest text-primary border-2 border-primary/20 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">school</span>
              Retour au parcours
            </button>
          </div>

          {/* Share section — hidden on print */}
          <div className="no-print mt-8">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              Partager ma certification PNACIJ
            </p>
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
                href={`https://wa.me/?text=${encodeURIComponent(`Je viens d'obtenir mon Skill Passport en ${data.parcours?.titre} certifié par le Ministère MJS / PNACIJ ! 🎓 #PNACIJ #Sénégal #Formation\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[#25D366] text-white rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                <span className="text-[11px] font-bold">WhatsApp</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Je viens d'obtenir mon Skill Passport en ${data.parcours?.titre} certifié par le Ministère MJS / PNACIJ ! 🎓 #PNACIJ #Sénégal #Formation`)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-on-surface text-surface rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span className="text-[11px] font-bold">X (Twitter)</span>
              </a>

              {/* Copy Link */}
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 bg-surface-container-low text-on-surface rounded-2xl hover:bg-surface-container active:scale-95 transition-all border border-outline-variant/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">{copied ? "check_circle" : "link"}</span>
                <span className="text-[11px] font-bold">{copied ? "Copié !" : "Copier lien"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom floating nav — hidden on print */}
        <MjsNavbar />
      </main>

    </>
  );
}
