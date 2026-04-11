"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LYCEES_DAKAR = ["Lycée Cheikh Anta Diop", "Lycée Limamoulaye", "Lycée Seydou Nourou Tall", "Lycée John F. Kennedy", "Lycée de Pikine"];
const LYCEES_AUTRES = ["Lycée de ta ville", "Lycée régional", "Lycée technique proche"];

const SERIES_RECOMMANDEES: Record<string, { serie: string; desc: string; careers: string[] }[]> = {
  S1: [{ serie: "S1", desc: "Maths-Physique", careers: ["Ingénierie", "Physique", "Informatique"] }],
  S2: [{ serie: "S2", desc: "Maths-Sciences Nat", careers: ["Médecine", "Biologie", "Agronomie"] }],
  L:  [{ serie: "L",  desc: "Lettres", careers: ["Droit", "Journalisme", "Enseignement"] }],
  G:  [{ serie: "G",  desc: "Gestion", careers: ["Comptabilité", "Finance", "Commerce"] }],
};

const LEARN_PATHS: Record<string, string[]> = {
  S1: ["Développement Web", "Maintenance Informatique", "Finance"],
  S2: ["Agriculture tech", "Développement Web", "Marketing Digital"],
  L:  ["Marketing Digital", "Design GFX", "Finance"],
  G:  ["Finance", "Marketing Digital", "Comptabilité"],
  BFEM: ["Marketing Digital", "Développement Web", "Design GFX"],
};

export default function OrientationPage() {
  const router = useRouter();
  const [examType, setExamType] = useState("");
  const [serie, setSerie] = useState("");
  const [levels, setLevels] = useState<Record<string, { level: string; score: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: stu } = await supabase.from("prep_students")
        .select("exam_type, serie, level_per_subject").eq("user_id", user.id).limit(1);
      if (stu?.[0]) {
        setExamType(stu[0].exam_type ?? "");
        setSerie(stu[0].serie ?? "");
        setLevels((stu[0].level_per_subject as typeof levels) ?? {});
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const isBFEM = examType === "BFEM";
  const serieKey = serie || (isBFEM ? "BFEM" : "S1");
  const learnPaths = LEARN_PATHS[serieKey] ?? LEARN_PATHS["BFEM"];
  const lycees = LYCEES_DAKAR;
  const seriesReco = SERIES_RECOMMANDEES[serie] ?? [];

  const mathScore = levels["Maths"]?.score ?? 0;
  const sciScore = (levels["Sciences Naturelles"]?.score ?? levels["Physique-Chimie"]?.score ?? 0);
  const autoSerie = mathScore >= 60 && sciScore >= 60 ? "S1/S2"
    : mathScore >= 60 ? "S1"
    : sciScore >= 60 ? "S2"
    : "L ou G selon tes préférences";

  if (loading) return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </main>
  );

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Orientation après l&apos;examen</p>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">

        {/* Hero */}
        <div className="rounded-2xl p-6 text-white space-y-2" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <span className="material-symbols-outlined text-[40px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          <h1 className="text-xl font-extrabold">Ton avenir après le {examType}</h1>
          <p className="text-white/80 text-sm">Découvre les meilleures options selon ton profil et tes résultats.</p>
        </div>

        {/* BFEM → Lycée recommendation */}
        {isBFEM && (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Série recommandée pour le lycée</h2>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <div>
                    <p className="font-bold text-on-surface">Analyse IA de ton profil</p>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Avec ton niveau en Maths ({mathScore}%) et Sciences ({sciScore}%),<br />
                      la série <strong className="text-primary">{autoSerie}</strong> serait idéale pour toi.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Lycées recommandés</h2>
              {lycees.map((l, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                  <p className="text-sm font-semibold text-on-surface">{l}</p>
                </div>
              ))}
              {LYCEES_AUTRES.map((l, i) => (
                <div key={i} className="flex items-center gap-3 bg-surface-container-lowest rounded-xl p-3 shadow-sm opacity-70">
                  <span className="material-symbols-outlined text-outline text-[18px]">school</span>
                  <p className="text-sm text-on-surface-variant">{l}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {/* BAC → GSN Learn */}
        {!isBFEM && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <p className="font-extrabold text-on-surface">Tu as ton BAC !</p>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Félicitations ! Tu as travaillé dur pour atteindre ce niveau. Il est maintenant temps de te lancer dans une formation professionnelle avec <strong>GSN Learn</strong>.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Parcours GSN Learn recommandés</h2>
              <p className="text-sm text-on-surface-variant">Selon ta série {serie} et tes points forts :</p>
              {learnPaths.map((path, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                    </div>
                    <p className="font-bold text-on-surface text-sm">{path}</p>
                  </div>
                  <Link href={`/learn/onboarding?domain=${encodeURIComponent(path)}`}
                    className="text-xs font-bold text-primary hover:underline">
                    Commencer →
                  </Link>
                </div>
              ))}
            </section>

            <Link href="/learn/onboarding"
              className="block w-full py-4 text-center font-black text-white rounded-2xl shadow-lg"
              style={{ backgroundColor: "#1a73e8" }}>
              Commencer ma formation sur GSN Learn →
            </Link>
          </>
        )}

        {/* Débouchés selon série */}
        {seriesReco.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Débouchés de la série {serie}</h2>
            {seriesReco.map((s, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
                <p className="font-bold text-on-surface">{s.serie} — {s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.careers.map((c, j) => (
                    <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

      </div>
    </main>
  );
}
