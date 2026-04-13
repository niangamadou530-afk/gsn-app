"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SUBJECTS_BY_EXAM: Record<string, Record<string, string[]>> = {
  BAC: {
    S1: ["Maths", "Physique-Chimie", "Sciences Naturelles", "Français", "Philosophie", "Anglais", "Histoire-Géographie"],
    S2: ["Maths", "Sciences Naturelles", "Physique-Chimie", "Français", "Philosophie", "Anglais", "Histoire-Géographie"],
    L:  ["Français", "Philosophie", "Anglais", "Histoire-Géographie", "Maths", "Arabe"],
    G:  ["Comptabilité", "Maths", "Français", "Anglais", "Économie", "Histoire-Géographie"],
  },
  BFEM: {
    default: ["Maths", "Français", "Sciences Physiques", "Sciences Naturelles", "Anglais", "Histoire-Géographie"],
  },
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
  etablissements_recommandes: Etablissement[];
  parcours_gsn_learn: string[];
  message_personnalise: string;
};

export default function OrientationPage() {
  const router = useRouter();
  const [examType, setExamType] = useState("");
  const [serie, setSerie] = useState("");
  const [country, setCountry] = useState("Sénégal");
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<OrientationResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const subjects = (() => {
    const byType = SUBJECTS_BY_EXAM[examType] ?? {};
    return byType[serie] ?? byType["default"] ?? [];
  })();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: stu } = await supabase.from("prep_students")
        .select("exam_type, serie, country").eq("user_id", user.id).limit(1);
      if (stu?.[0]) {
        setExamType(stu[0].exam_type ?? "BAC");
        setSerie(stu[0].serie ?? "S1");
        setCountry(stu[0].country ?? "Sénégal");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function analyzeOrientation() {
    const numericGrades: Record<string, number> = {};
    for (const [subj, val] of Object.entries(grades)) {
      const n = parseFloat(val);
      if (!isNaN(n) && n >= 0 && n <= 20) numericGrades[subj] = n;
    }
    if (Object.keys(numericGrades).length < 3) {
      setAnalysisError("Entre au moins 3 notes pour analyser ton orientation.");
      return;
    }
    setAnalysisError("");
    setAnalyzing(true);
    try {
      const res = await fetch("/api/prep-orientation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, serie, country, grades: numericGrades }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setAnalysisError(e instanceof Error ? e.message : "Erreur lors de l'analyse.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleReleveUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");
      const ext = file.name.split(".").pop();
      const path = `bac-releves/${user.id}_${Date.now()}.${ext}`;
      const { error: storageErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
      if (storageErr) throw storageErr;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      await supabase.from("users").update({
        profile_type: "professionnel",
        bac_releve_url: urlData.publicUrl,
      }).eq("id", user.id);
      setUploadDone(true);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

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
          <h1 className="text-xl font-extrabold">Ton avenir après le {examType}</h1>
          <p className="text-white/80 text-sm">Entre tes notes pour obtenir des recommandations personnalisées.</p>
        </div>

        {/* Grade input form */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-on-surface">Entre tes notes (/20)</h2>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
            {subjects.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Profil non trouvé. Retourne compléter l&apos;onboarding.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {subjects.map(subj => (
                    <div key={subj} className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant">{subj}</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        placeholder="—"
                        value={grades[subj] ?? ""}
                        onChange={e => setGrades(prev => ({ ...prev, [subj]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface text-sm font-bold text-on-surface focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  ))}
                </div>
                {analysisError && (
                  <p className="text-xs text-red-600 font-medium">{analysisError}</p>
                )}
                <button
                  onClick={analyzeOrientation}
                  disabled={analyzing}
                  className="w-full py-3 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: "#FF6B00" }}
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      Analyser avec l&apos;IA
                    </>
                  )}
                </button>
              </>
            )}
          </div>
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
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-xs text-on-surface font-medium leading-relaxed">{result.message_personnalise}</p>
              </div>
            </section>

            {/* Établissements recommandés */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Établissements recommandés</h2>
              {result.etablissements_recommandes?.map((etab, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-on-surface text-sm">{etab.nom}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium">{etab.type} · {etab.filiere}</p>
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

            {/* GSN Learn paths */}
            {result.parcours_gsn_learn?.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-on-surface">Parcours GSN Learn recommandés</h2>
                {result.parcours_gsn_learn.map((path, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                      </div>
                      <p className="font-bold text-on-surface text-sm">{path}</p>
                    </div>
                    <Link href={`/learn/onboarding?domain=${encodeURIComponent(path)}`}
                      className="text-xs font-bold text-primary hover:underline shrink-0">
                      Commencer →
                    </Link>
                  </div>
                ))}
              </section>
            )}

            <Link href="/learn/onboarding"
              className="block w-full py-4 text-center font-black text-white rounded-2xl shadow-lg"
              style={{ backgroundColor: "#1a73e8" }}>
              Commencer ma formation sur GSN Learn →
            </Link>
          </>
        )}

        {/* BAC Relevé upload */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3 border border-outline-variant/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[28px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>upload_file</span>
            <div className="flex-1">
              <p className="font-bold text-on-surface text-sm">Tu as ton relevé de notes ?</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Télécharge ton relevé (PDF ou image) pour débloquer le profil <strong>Professionnel</strong>.
              </p>
            </div>
          </div>

          {uploadDone ? (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="text-sm font-bold">Relevé envoyé avec succès !</p>
            </div>
          ) : (
            <>
              <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all text-sm font-semibold ${uploading ? "opacity-50 pointer-events-none" : "border-outline-variant/40 hover:border-primary text-on-surface-variant hover:text-primary"}`}>
                {uploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                    Choisir mon relevé (PDF / JPG / PNG)
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={handleReleveUpload}
                  disabled={uploading}
                />
              </label>
              {uploadError && (
                <p className="text-xs text-red-600 font-medium">{uploadError}</p>
              )}
            </>
          )}
        </div>

      </div>
    </main>
  );
}
