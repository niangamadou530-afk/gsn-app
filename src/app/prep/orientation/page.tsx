"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const A  = "#00C9A7";
const C  = "#111118";
const B  = "rgba(255,255,255,0.07)";
const T2 = "#A0A0B0";

type Etablissement = { nom: string; type: string; filiere: string; pourquoi: string; conditions_acces: string; lien_gsn: boolean };
type OrientationResult = {
  moyenne: number; mention: string; orientation_principale: string;
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
  const [loading, setLoading]   = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => {
          if (data) { setExamType(data.exam_type ?? "BAC"); setSerie(data.serie ?? ""); }
          setLoading(false);
        });
    });
  }, [router]);

  async function analyze(file: File) {
    setAnalyzing(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("examType", examType); fd.append("serie", serie);
      const res = await fetch("/api/prep-orientation", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Erreur serveur"); }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: A, borderTopColor: "transparent" }} />
    </div>
  );

  const isBFEM   = examType === "BFEM";
  const docLabel = isBFEM ? "bulletin général annuel" : "relevé de notes ou BAC";

  const mentionBg = result
    ? result.moyenne >= 14 ? "rgba(0,201,167,0.12)"
      : result.moyenne >= 10 ? "rgba(255,184,0,0.12)"
      : "rgba(255,91,121,0.12)"
    : "";
  const mentionColor = result
    ? result.moyenne >= 14 ? A
      : result.moyenne >= 10 ? "#FFB800"
      : "#FF5B79"
    : "";

  return (
    <main className="min-h-screen text-white pb-8" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Header */}
      <div className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Orientation</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: T2 }}>
          {isBFEM ? "Lycées recommandés · BFEM" : "Universités & Grandes écoles · BAC"}
        </p>
      </div>

      <div className="px-6 space-y-4">

        {!result && (
          <>
            {/* Upload zone */}
            <button onClick={() => fileRef.current?.click()} disabled={analyzing}
              className="w-full rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 flex flex-col items-center justify-center gap-4 py-12"
              style={{ backgroundColor: C, border: `2px dashed rgba(0,201,167,0.3)` }}>
              {analyzing ? (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: A, borderTopColor: "transparent" }} />
                  <p className="text-sm font-semibold" style={{ color: T2 }}>Analyse IA en cours…</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,201,167,0.12)", border: "1px solid rgba(0,201,167,0.2)" }}>
                    <span className="material-symbols-outlined text-[28px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white">Upload ton {docLabel}</p>
                    <p className="text-sm mt-0.5" style={{ color: T2 }}>Photo · PDF · IA Vision</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "rgba(0,201,167,0.10)", color: A }}>
                    Touche pour choisir un fichier
                  </span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) analyze(f); }} />

            {error && (
              <div className="flex items-start gap-2 p-4 rounded-xl"
                style={{ backgroundColor: "rgba(255,91,121,0.08)", border: "1px solid rgba(255,91,121,0.2)" }}>
                <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: "#FF5B79", fontVariationSettings: "'FILL' 1" }}>error</span>
                <p className="text-sm" style={{ color: "#FF5B79" }}>{error}</p>
              </div>
            )}

            {/* Comment ça marche */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <p className="font-bold text-white text-sm mb-3">Comment ça marche ?</p>
              <div className="space-y-3">
                {[
                  `Prends une photo de ton ${docLabel}`,
                  `L'IA analyse tes résultats (${examType}${serie ? " " + serie : ""})`,
                  `Tu reçois des recommandations ${isBFEM ? "de lycée" : "personnalisées"}`,
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                      style={{ backgroundColor: "rgba(0,201,167,0.12)", color: A }}>{i + 1}</div>
                    <p className="text-sm" style={{ color: T2 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {result && (
          <>
            {/* Moyenne */}
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: mentionBg, border: `1px solid ${mentionColor}30` }}>
              <p className="text-6xl font-black" style={{ color: mentionColor }}>
                {result.moyenne.toFixed(2)}<span className="text-2xl text-white">/20</span>
              </p>
              <p className="text-lg font-bold mt-1 text-white">{result.mention}</p>
              {result.orientation_principale && (
                <p className="text-sm mt-2" style={{ color: T2 }}>{result.orientation_principale}</p>
              )}
            </div>

            {/* Notes */}
            {result.notes_extraites && Object.keys(result.notes_extraites).length > 0 && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
                <p className="font-bold text-white text-sm mb-3">Notes extraites</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.notes_extraites).map(([m, n]) => (
                    <div key={m} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${B}` }}>
                      <span className="text-xs text-white truncate">{m}</span>
                      <span className="text-xs font-black ml-2" style={{ color: n >= 10 ? A : "#FF5B79" }}>{n}/20</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            {result.message_personnalise && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${A}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>person</span>
                  <p className="font-bold text-white text-sm">Analyse personnalisée</p>
                </div>
                <p className="text-sm" style={{ color: T2 }}>{result.message_personnalise}</p>
              </div>
            )}

            {/* Établissements */}
            {result.etablissements_recommandes?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T2 }}>
                  Établissements recommandés
                </p>
                <div className="space-y-3">
                  {result.etablissements_recommandes.map((e, i) => (
                    <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${A}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm">{e.nom}</p>
                          <p className="text-xs mt-0.5 font-medium" style={{ color: T2 }}>{e.type} · {e.filiere}</p>
                        </div>
                        {e.lien_gsn && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "rgba(0,201,167,0.12)", color: A }}>GSN Learn</span>
                        )}
                      </div>
                      <p className="text-sm mt-2" style={{ color: T2 }}>{e.pourquoi}</p>
                      <p className="text-xs mt-1" style={{ color: "#5A5A70" }}>{e.conditions_acces}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GSN Learn */}
            {result.parcours_gsn_learn?.length > 0 && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}`, borderLeft: `3px solid ${A}` }}>
                <p className="font-bold text-white text-sm mb-3">Parcours GSN Learn recommandés</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.parcours_gsn_learn.map(p => (
                    <span key={p} className="text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "rgba(0,201,167,0.10)", color: A }}>{p}</span>
                  ))}
                </div>
                <Link href="/learn" className="flex items-center gap-1 text-sm font-bold" style={{ color: A }}>
                  Voir GSN Learn <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            )}

            <button onClick={() => setResult(null)}
              className="w-full py-4 font-black rounded-2xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: A, color: "#003328" }}>
              {isBFEM ? "Analyser un autre bulletin" : "Analyser un autre relevé"}
            </button>
          </>
        )}

      </div>
    </main>
  );
}
