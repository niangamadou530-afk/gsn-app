"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice } from "@/components/SlowConnectionNotice";

type Etablissement = {
  nom: string; type: string; filiere: string;
  pourquoi: string; conditions_acces: string; lien_gsn: boolean;
};
type OrientationResult = {
  moyenne: number; mention: string;
  orientation_principale: string;
  notes_extraites?: Record<string, number>;
  etablissements_recommandes: Etablissement[];
  parcours_gsn_learn: string[];
  message_personnalise: string;
};

export default function OrientationPage() {
  const router = useRouter();
  const [examType, setExamType] = useState("");
  const [serie, setSerie]       = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult]     = useState<OrientationResult | null>(null);
  const [error, setError]       = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading]   = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    setIsSlowConnection(false);

    const slowTimer = setTimeout(() => {
      if (mounted && loading) {
        setIsSlowConnection(true);
      }
    }, 8000);

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isPreviewEnvironment()) {
            if (mounted) {
              setExamType("BAC");
              setSerie("S2");
              setIsPreview(true);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }

        const { data } = await supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).maybeSingle();
        if (mounted) {
          if (data) {
            setExamType(data.exam_type ?? "BAC");
            setSerie(data.serie ?? "");
          } else if (isPreviewEnvironment()) {
            setExamType("BAC");
            setSerie("S2");
            setIsPreview(true);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          if (isPreviewEnvironment()) {
            setExamType("BAC");
            setSerie("S2");
            setIsPreview(true);
          }
          setLoading(false);
        }
      }
    }
    load();

    return () => {
      mounted = false;
      clearTimeout(slowTimer);
    };
  }, [router, retryCount]);

  async function analyze(file: File) {
    setAnalyzing(true);
    setError("");
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("examType", examType);
      fd.append("serie", serie);
      const res = await fetch("/api/prep-orientation", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? t("prep.orientation.error.server")); }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("prep.orientation.error.unknown"));
    } finally {
      setAnalyzing(false);
    }
  }

  if (isSlowConnection && loading) return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <SlowConnectionNotice
        onRetry={() => {
          setIsSlowConnection(false);
          setLoading(true);
          setRetryCount(c => c + 1);
        }}
      />
    </div>
  );

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="text-xs font-bold text-slate-500">Chargement de votre profil d&apos;orientation...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {isPreview && <PreviewBanner />}
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">explore</span>
            <span>Orientation post-{examType === "BFEM" ? "BFEM" : "BAC"} & Campus Sénégal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.orientation.title")}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {examType === "BFEM"
              ? t("prep.orientation.subtitle.bfem")
              : t("prep.orientation.subtitle.bac")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!result && (
          <>
            {/* Upload Area */}
            <div data-tour="orientation-upload-zone" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs text-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={analyzing}
                className="w-full py-12 px-6 rounded-2xl border-2 border-dashed border-blue-200 hover:border-[#005bbf] bg-blue-50/40 hover:bg-blue-50/70 flex flex-col items-center justify-center gap-3 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-1" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                    <p className="text-sm font-extrabold text-slate-900">{t("prep.orientation.analyzing")}</p>
                    <p className="text-xs text-slate-500">Extraction des notes et analyse des filières Campus Sénégal...</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#005bbf] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[32px]">upload_file</span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-base">
                      {examType === "BFEM" ? t("prep.orientation.uploadButton.bfem") : t("prep.orientation.uploadButton.bac")}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {t("prep.orientation.uploadHint")} (Photo ou scan PDF)
                    </p>
                  </>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) analyze(f);
                }}
              />
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}
            </div>

            {/* How it works info */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005bbf] text-[18px]">info</span>
                <span>{t("prep.orientation.howItWorks")}</span>
              </h2>
              <ol className="space-y-2 text-xs sm:text-sm text-slate-600 list-decimal list-inside leading-relaxed">
                <li>{examType === "BFEM" ? t("prep.orientation.step1.bfem") : t("prep.orientation.step1.bac")}</li>
                <li>{t("prep.orientation.step2", { examInfo: `${examType}${serie ? " " + serie : ""}` })}</li>
                <li>{examType === "BFEM" ? t("prep.orientation.step3.bfem") : t("prep.orientation.step3.bac")}</li>
              </ol>
            </div>
          </>
        )}

        {result && (
          <div className="space-y-6">
            {/* Average & Verdict Card */}
            <div className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                    Moyenne extraite du bulletin
                  </span>
                  <p className="text-5xl sm:text-6xl font-black tracking-tight mt-2">
                    {result.moyenne.toFixed(2)}<span className="text-2xl font-bold opacity-80">/20</span>
                  </p>
                  <p className="text-lg font-bold text-blue-100 mt-1">{result.mention}</p>
                </div>
                {result.orientation_principale && (
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 max-w-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                      Orientation majeure recommandée
                    </span>
                    <p className="text-sm font-extrabold text-white mt-1">
                      {result.orientation_principale}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted grades */}
            {result.notes_extraites && Object.keys(result.notes_extraites).length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <h2 className="font-extrabold text-slate-900 text-sm">
                  {t("prep.orientation.extractedGrades")}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(result.notes_extraites).map(([m, n]) => (
                    <div key={m} className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
                      <span className="text-xs font-bold text-slate-700 truncate pr-2">{m}</span>
                      <span className={`text-xs font-black shrink-0 ${n >= 10 ? "text-emerald-700" : "text-rose-600"}`}>
                        {n}/20
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personalized Advice */}
            {result.message_personnalise && (
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#005bbf] text-[20px]">smart_toy</span>
                  <h3 className="font-extrabold text-[#005bbf] text-sm">Analyse pédagogique du Coach</h3>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                  {result.message_personnalise}
                </p>
              </div>
            )}

            {/* Recommended Higher Education Establishments */}
            {result.etablissements_recommandes?.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 px-1">
                  {t("prep.orientation.recommendedInstitutions")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {result.etablissements_recommandes.map((e, i) => (
                    <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-extrabold text-slate-900 text-sm">{e.nom}</p>
                        {e.lien_gsn && (
                          <span className="text-[10px] font-black bg-blue-50 text-[#005bbf] border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                            GSN Learn
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-500">{e.type} · {e.filiere}</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{e.pourquoi}</p>
                      <p className="text-[11px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg">
                        Critères : {e.conditions_acces}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GSN Learn Skill Tracks */}
            {result.parcours_gsn_learn?.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">{t("prep.orientation.recommendedPaths")}</h3>
                <div className="flex flex-wrap gap-2">
                  {result.parcours_gsn_learn.map((p) => (
                    <span key={p} className="text-xs font-bold bg-blue-50 text-[#005bbf] border border-blue-200 px-3 py-1.5 rounded-xl">
                      {p}
                    </span>
                  ))}
                </div>
                <Link
                  href="/learn"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#005bbf] hover:underline"
                >
                  <span>{t("prep.orientation.viewGsnLearn")}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setFileName(""); }}
              className="w-full py-4 font-black text-white rounded-2xl active:scale-[0.98] transition-transform shadow-xs"
              style={{ backgroundColor: "#FF6B00" }}
            >
              {examType === "BFEM" ? t("prep.orientation.analyzeAnother.bfem") : t("prep.orientation.analyzeAnother.bac")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
