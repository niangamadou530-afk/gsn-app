"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MjsNavbar from "@/app/mjs/beneficiaire/MjsNavbar";

type SkillPassport = {
  id: string;
  delivre_le: string;
  parcours_id: string;
  parcours: {
    titre: string;
    niveau: string | null;
    duree_semaines: number | null;
    secteur: {
      nom: string;
      slug: string;
      icone: string | null;
    } | null;
  } | null;
};

const SECTOR_ICONS: Record<string, string> = {
  numerique: "code",
  agriculture: "eco",
  btp: "construction",
  commerce: "shopping_cart",
  tourisme: "flight"
};

const SKILL_COLORS = ["#005bbf", "#2b5bb5", "#9c27b0", "#ff9800", "#4caf50"];

export default function MjsScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [passports, setPassports] = useState<SkillPassport[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/mjs/beneficiaire/connexion");
        return;
      }

      // Fetch Skill Passports with parcours and sectors
      const { data: passportsData } = await supabase
        .from("mjs_skill_passports")
        .select(`
          id,
          delivre_le,
          parcours_id,
          mjs_parcours (
            titre,
            niveau,
            duree_semaines,
            mjs_secteurs (
              nom,
              slug,
              icone
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs");

      if (passportsData) {
        const mapped = (passportsData as any[]).map((p) => ({
          id: p.id,
          delivre_le: p.delivre_le,
          parcours_id: p.parcours_id,
          parcours: p.mjs_parcours
            ? {
                titre: p.mjs_parcours.titre,
                niveau: p.mjs_parcours.niveau,
                duree_semaines: p.mjs_parcours.duree_semaines,
                secteur: p.mjs_parcours.mjs_secteurs
                  ? {
                      nom: p.mjs_parcours.mjs_secteurs.nom,
                      slug: p.mjs_parcours.mjs_secteurs.slug,
                      icone: p.mjs_parcours.mjs_secteurs.icone
                    }
                  : null
              }
            : null
        }));

        setPassports(mapped);
        setScore(Math.min(100, mapped.length * 20));
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const eligible = score >= 40;
  const circumference = 2 * Math.PI * 88; // SVG Ring circumference
  const strokeOffset = circumference * (1 - Math.min(1, score / 100));

  const getLevelLabel = (scoreValue: number) => {
    if (scoreValue >= 80) return "Expert PNACIJ";
    if (scoreValue >= 60) return "Professionnel Qualifié";
    if (scoreValue >= 40) return "Technicien Confirmé";
    if (scoreValue >= 20) return "Bénéficiaire Actif";
    return "Apprenant Motivé";
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-primary">GSN Score</span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#7b5500] bg-[#ffdeac] px-2.5 py-1 rounded-full">
          Skill Passport
        </span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        {/* Animated Score Circle */}
        <section className="flex flex-col items-center justify-center text-center space-y-4 py-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
              <circle
                className="text-surface-container-highest"
                cx="96"
                cy="96"
                r="88"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
              />
              <circle
                className="text-primary transition-all duration-1000"
                cx="96"
                cy="96"
                r="88"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-extrabold tracking-tighter text-on-surface">
                {score}
                <span className="text-xl text-on-surface-variant font-medium">/100</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">
                Score Global MJS
              </span>
            </div>
          </div>

          <div className="inline-flex items-center px-4 py-2 bg-tertiary-fixed rounded-full gap-2 shadow-sm">
            <span
              className="material-symbols-outlined text-sm text-on-tertiary-fixed"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            <span className="text-xs font-bold text-on-tertiary-fixed">{getLevelLabel(score)}</span>
          </div>
        </section>

        {/* Micro-credit Quick Status Link */}
        <section className="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/20 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-on-surface">Éligibilité Micro-crédit</h3>
            <p className="text-xs text-on-surface-variant">
              {eligible
                ? "Vous remplissez tous les critères requis."
                : "Terminez encore des formations pour atteindre 40 pts."}
            </p>
          </div>
          <button
            onClick={() => router.push("/mjs/pay")}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
              eligible ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            Vérifier
          </button>
        </section>

        {/* Skill Passports Listing */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-on-surface">Passeports de Compétences ({passports.length})</h2>

          {passports.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">
                workspace_premium
              </span>
              <p className="text-on-surface-variant text-sm mb-4">Aucun passeport de compétences n'a été délivré.</p>
              <button
                onClick={() => router.push("/mjs/beneficiaire/parcours")}
                className="py-3 px-5 bg-primary text-on-primary font-bold rounded-xl text-sm shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                Rejoindre une formation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {passports.map((passport, idx) => {
                const color = SKILL_COLORS[idx % SKILL_COLORS.length];
                const slug = passport.parcours?.secteur?.slug || "default";
                const icon = SECTOR_ICONS[slug] || "workspace_premium";

                return (
                  <button
                    key={passport.id}
                    onClick={() => router.push(`/mjs/beneficiaire/skill-passport/${passport.parcours_id}`)}
                    className="text-left bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer w-full"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        </div>
                        <span className="text-2xl font-black" style={{ color }}>
                          100%
                        </span>
                      </div>
 
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-on-surface leading-tight">
                          {passport.parcours?.titre || "Parcours"}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          {passport.parcours?.secteur?.nom || "Secteur"}
                        </p>
                      </div>
                    </div>
 
                    <div className="space-y-3 pt-3 border-t border-outline-variant/10 w-full">
                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {new Date(passport.delivre_le).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        {passport.parcours?.duree_semaines && (
                          <span>{passport.parcours.duree_semaines} semaines</span>
                        )}
                      </div>
                      <p className="font-mono text-[9px] text-outline break-all uppercase">ID : {passport.id}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <MjsNavbar />
    </main>
  );
}
