"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DOMAINS = [
  {
    id: "dev-web",
    label: "Développement Web & Mobile",
    sub: "React · Next.js · Flutter · APIs REST",
    icon: "code",
    color: "#005bbf",
    weeks: [4, 8, 12],
    objectifs: ["Premier emploi", "Freelance", "Créer ma startup"],
  },
  {
    id: "data",
    label: "Data Science & Intelligence Artificielle",
    sub: "Python · Machine Learning · Analyse de données",
    icon: "psychology",
    color: "#2b5bb5",
    weeks: [4, 8, 12],
    objectifs: ["Premier emploi", "Freelance"],
  },
  {
    id: "cybersec",
    label: "Cybersécurité & Administration Systèmes",
    sub: "Linux · Réseaux · Pen-test · Sécurité réseau",
    icon: "security",
    color: "#7b1fa2",
    weeks: [4, 8, 16],
    objectifs: ["Premier emploi", "Reconversion"],
  },
  {
    id: "ux",
    label: "UX Design & Contenu Digital",
    sub: "Figma · UI/UX · Rédaction web · Accessibilité",
    icon: "palette",
    color: "#e65100",
    weeks: [4, 8],
    objectifs: ["Freelance", "Premier emploi"],
  },
  {
    id: "ecommerce",
    label: "E-commerce & Marketing Digital",
    sub: "Boutique en ligne · SEO · Google Ads · CRM",
    icon: "storefront",
    color: "#2e7d32",
    weeks: [4, 8],
    objectifs: ["Créer ma startup", "Freelance"],
  },
  {
    id: "cloud",
    label: "Cloud Computing & DevOps",
    sub: "AWS · Docker · Kubernetes · CI/CD · Terraform",
    icon: "cloud",
    color: "#00695c",
    weeks: [8, 12, 16],
    objectifs: ["Premier emploi", "Reconversion"],
  },
];

type Enrollment = {
  domaine: string;
  niveau: string;
  objectif: string;
  region: string;
  course_id: string | null;
};

export default function MctnLearnPage() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { data } = await supabase
      .from("pfimn_enrollments")
      .select("domaine, niveau, objectif, region, course_id")
      .eq("user_id", user.id)
      .single();

    setEnrollment(data ?? null);
    setLoading(false);
  }

  async function startCourse(domainId: string, weeks: number) {
    setStarting(domainId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const domain = DOMAINS.find((d) => d.id === domainId)!;
      const niveau = enrollment?.niveau ?? "Débutant";
      const objectif = enrollment?.objectif ?? "Premier emploi";

      // Génération du parcours via l'API IA existante
      const BATCH = 4;
      let allWeeks: any[] = [];

      for (let start = 1; start <= weeks; start += BATCH) {
        const batchSize = Math.min(BATCH, weeks - start + 1);
        const prompt = `Génère un parcours de formation PFIMN (Programme National Formation Insertion Métiers Numérique - Sénégal) pour les semaines ${start} à ${start + batchSize - 1} (${batchSize} semaines).

Profil: domaine="${domain.label}", niveau="${niveau}", objectif="${objectif}", région="${enrollment?.region ?? "Dakar"}"

Contexte: Formation alignée sur le New Deal Technologique du Sénégal (NDT 2025-2034). Contenu pratique et directement applicable au marché sénégalais et africain.

Réponds UNIQUEMENT avec un tableau JSON :
[
  {
    "week": ${start},
    "title": "Titre de la semaine",
    "objective": "Objectif principal",
    "modules": [
      {
        "id": "w${start}m1",
        "title": "Titre du module",
        "description": "Description détaillée en 3 à 4 phrases.",
        "keywords": ["terme YouTube 1", "terme YouTube 2", "terme YouTube 3"],
        "exercises": "Exercice pratique : description concrète.",
        "quiz": {
          "question": "Question de validation ?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0
        }
      }
    ]
  }
]

Règles : exactement ${batchSize} semaines, 3 modules par semaine, index answer (0-3), tout en français.`;

        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt }),
        });
        const data = await res.json();
        const cleaned = data.reply.replace(/```json|```/g, "").trim();
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (!arrMatch) throw new Error("Réponse IA invalide");
        const batch = JSON.parse(arrMatch[0]);
        allWeeks = [...allWeeks, ...batch];
      }

      const { data: inserted, error } = await supabase
        .from("user_courses")
        .insert({
          user_id: user.id,
          title:   `PFIMN · ${domain.label} · ${niveau} · ${weeks} semaines`,
          modules: allWeeks,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Mettre à jour l'enrollment avec le course_id
      await supabase
        .from("pfimn_enrollments")
        .update({ course_id: inserted.id })
        .eq("user_id", user.id);

      router.push(`/learn/${inserted.id}`);
    } catch (err: any) {
      alert("Erreur : " + (err.message ?? "Impossible de démarrer le parcours"));
    } finally {
      setStarting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const enrolledDomain = DOMAINS.find((d) => d.id === enrollment?.domaine);

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/mctn/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <span className="text-base font-bold text-primary">PFIMN · Parcours</span>
        </div>
        <Link href="/mctn/dashboard">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
        </Link>
      </header>

      <div className="pt-20 px-6 max-w-2xl mx-auto space-y-8">

        {/* Domaine inscrit — mis en avant */}
        {enrolledDomain && (
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ton parcours PFIMN</p>
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4"
              style={{ borderLeft: `4px solid ${enrolledDomain.color}` }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${enrolledDomain.color}15`, color: enrolledDomain.color }}>
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {enrolledDomain.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="font-extrabold text-on-surface">{enrolledDomain.label}</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">{enrolledDomain.sub}</p>
                  {enrollment && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{enrollment.niveau}</span>
                      <span className="text-[11px] font-medium bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">{enrollment.objectif}</span>
                      <span className="text-[11px] font-medium bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">{enrollment.region}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Durées disponibles */}
              <div>
                <p className="text-xs font-bold text-on-surface-variant mb-2">Choisir la durée :</p>
                <div className="flex gap-2 flex-wrap">
                  {enrolledDomain.weeks.map((w) => (
                    <button
                      key={w}
                      onClick={() => startCourse(enrolledDomain.id, w)}
                      disabled={!!starting}
                      className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {starting === enrolledDomain.id ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          {w} semaines
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tous les parcours disponibles */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Tous les métiers NDT</h2>
            <span className="text-xs text-on-surface-variant font-medium">6 domaines</span>
          </div>

          <div className="space-y-3">
            {DOMAINS.map((d) => {
              const isEnrolled = enrollment?.domaine === d.id;
              return (
                <div
                  key={d.id}
                  className={`bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-3 ${isEnrolled ? "border-2 border-primary/30" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${d.color}15`, color: d.color }}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-on-surface truncate">{d.label}</h3>
                        {isEnrolled && (
                          <span className="shrink-0 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">TON PARCOURS</span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">{d.sub}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {d.weeks.map((w) => (
                      <button
                        key={w}
                        onClick={() => startCourse(d.id, w)}
                        disabled={!!starting}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition-all active:scale-95 disabled:opacity-50"
                        style={{
                          borderColor: isEnrolled ? d.color : "var(--color-outline-variant)",
                          color: isEnrolled ? d.color : "var(--color-on-surface-variant)",
                        }}
                      >
                        {starting === d.id ? "..." : `${w} sem.`}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Info modalité hybride */}
        <div className="bg-surface-container-low rounded-2xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            <p className="text-sm font-bold text-on-surface">Modalité hybride PFIMN</p>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Sessions présentielles SenaySkills (espaces numériques, hubs tech) + approfondissement digital GSN (IA, exercices, évaluations sur mobile)
            </p>
          </div>
        </div>

      </div>

      {/* Bottom nav PFIMN */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/mctn/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/mctn/learn" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
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
