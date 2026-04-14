"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LEARN_PATHS_BY_SERIE: Record<string, string[]> = {
  L1: ["Marketing Digital", "Design Graphique", "Entrepreneuriat"],
  L2: ["Marketing Digital", "Design Graphique", "Entrepreneuriat"],
  S1: ["Développement Web", "Maintenance Informatique", "Finance & Comptabilité"],
  S2: ["Développement Web", "Maintenance Informatique", "Entrepreneuriat"],
  S3: ["Maintenance Informatique", "Développement Web", "Entrepreneuriat"],
  S4: ["Entrepreneuriat", "Marketing Digital", "Finance & Comptabilité"],
  G:  ["Finance & Comptabilité", "Marketing Digital", "Entrepreneuriat"],
  BFEM: ["Développement Web", "Marketing Digital", "Design Graphique"],
};

type Etablissement = {
  nom: string;
  type: string;
  filiere: string;
  pourquoi: string;
  conditions_acces: string;
  lien_gsn: boolean;
};

type OrientationResult = {
  moyenne: number;
  mention: string;
  orientation_principale: string;
  notes_extraites?: Record<string, number>;
  etablissements_recommandes: Etablissement[];
  parcours_gsn_learn: string[];
  message_personnalise: string;
};

export default function OrientationPage() {
  const router = useRouter();
  const [examType, setExamType] = useState("");
  const [serie, setSerie] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<OrientationResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: stu } = await supabase.from("prep_students")
        .select("exam_type, serie").eq("user_id", user.id).limit(1);
      if (stu?.[0]) {
        setExamType(stu[0].exam_type ?? "BAC");
        setSerie(stu[0].serie ?? "");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setAnalysisError("");
    setResult(null);
    setAnalyzing(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("examType", examType);
      fd.append("serie", serie);

      const res = await fetch("/api/prep-orientation", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
    } finally {
      setAnalyzing(false);
    }
  }

  const serieKey = serie || (examType === "BFEM" ? "BFEM" : "S1");
  const defaultLearnPaths = LEARN_PATHS_BY_SERIE[serieKey] ?? LEARN_PATHS_BY_SERIE["BFEM"];

  function mentionColor(mention: string) {
    if (mention?.includes("Excellent") || mention?.includes("Très")) return "text-green-700 bg-green-100";
    if (mention?.includes("Bien")) return "text-blue-700 bg-blue-100";
    if (mention?.includes("Assez")) return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  }

  if (loading) return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </main>
  );

  const learnPaths = result?.parcours_gsn_learn?.length ? result.parcours_gsn_learn : defaultLearnPaths;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
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
          <h1 className="text-xl font-extrabold">Ton avenir après le {examType || "BAC"}</h1>
          <p className="text-white/80 text-sm">Upload ton relevé de notes — l&apos;IA analyse et recommande les meilleures universités sénégalaises.</p>
        </div>

        {/* Upload section */}
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[28px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>upload_file</span>
            <div>
              <p className="font-bold text-on-surface">Télécharge ton relevé de notes</p>
              <p className="text-xs text-on-surface-variant mt-0.5">PDF ou image (JPG/PNG) · Groq IA analyse tes résultats</p>
            </div>
          </div>

          {analyzing ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent", borderWidth: 3 }} />
              <p className="text-sm font-bold text-on-surface">Analyse en cours…</p>
              <p className="text-xs text-on-surface-variant">L&apos;IA lit ton relevé et recherche les meilleures orientations</p>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-3 w-full py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${fileName ? "border-green-400 bg-green-50" : "border-outline-variant/40 hover:border-primary"}`}>
              <span className="material-symbols-outlined text-[36px]" style={{ color: fileName ? "#22c55e" : "#FF6B00", fontVariationSettings: "'FILL' 1" }}>
                {fileName ? "check_circle" : "cloud_upload"}
              </span>
              <div className="text-center">
                {fileName ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">{fileName}</p>
                    <p className="text-xs text-green-600">Fichier sélectionné · Cliquer pour changer</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-on-surface text-sm">Choisir mon relevé</p>
                    <p className="text-xs text-on-surface-variant">PDF, JPG ou PNG</p>
                  </>
                )}
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={handleFileUpload} />
            </label>
          )}

          {analysisError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl">{analysisError}</p>
          )}
        </section>

        {/* AI Results */}
        {result && (
          <>
            {/* Moyenne + mention */}
            <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Moyenne générale</p>
                  <p className="text-3xl font-black text-on-surface">{result.moyenne}<span className="text-lg text-on-surface-variant">/20</span></p>
                </div>
                <span className={`text-sm font-black px-3 py-1.5 rounded-full ${mentionColor(result.mention)}`}>{result.mention}</span>
              </div>
              {result.notes_extraites && Object.keys(result.notes_extraites).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/20">
                  {Object.entries(result.notes_extraites).map(([subj, note]) => (
                    <span key={subj} className="text-[11px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant font-medium">
                      {subj}: <strong>{note}/20</strong>
                    </span>
                  ))}
                </div>
              )}
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-xs text-on-surface leading-relaxed">{result.message_personnalise}</p>
              </div>
            </section>

            {/* Établissements */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Établissements recommandés 🇸🇳</h2>
              {result.etablissements_recommandes?.map((etab, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-on-surface text-sm">{etab.nom}</p>
                      <p className="text-[11px] text-on-surface-variant">{etab.type} · {etab.filiere}</p>
                    </div>
                    {etab.lien_gsn && (
                      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#FF6B00" }}>GSN</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{etab.pourquoi}</p>
                  <p className="text-[11px] text-outline font-medium">📋 {etab.conditions_acces}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {/* GSN Learn — always visible */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-on-surface">Parcours GSN Learn recommandés</h2>
          <p className="text-sm text-on-surface-variant">
            {result ? "Selon ton profil analysé :" : `Selon ta série ${serie || "BAC"} :`}
          </p>
          {learnPaths.map((path, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{path}</p>
                  <p className="text-[11px] text-on-surface-variant">Formation certifiante · 4-6 mois</p>
                </div>
              </div>
              <Link href={`/learn/onboarding?domain=${encodeURIComponent(path)}`}
                className="text-xs font-bold text-primary hover:underline shrink-0">
                Commencer →
              </Link>
            </div>
          ))}

          <Link href="/learn/onboarding"
            className="block w-full py-4 text-center font-black text-white rounded-2xl shadow-lg"
            style={{ backgroundColor: "#1a73e8" }}>
            Voir toutes les formations GSN Learn →
          </Link>
        </section>

      </div>
    </main>
  );
}
