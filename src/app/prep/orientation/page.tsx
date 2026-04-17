"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Etablissement = { nom: string; type: string; filiere: string; pourquoi: string; conditions_acces: string; lien_gsn: boolean };
type OrientationResult = {
  moyenne: number; mention: string;
  orientation_principale: string;
  notes_extraites?: Record<string, number>;
  etablissements_recommandes: Etablissement[];
  parcours_gsn_learn: string[];
  message_personnalise: string;
};

const SECTION_TYPES: { key: keyof OrientationResult; label: string; icon: string; border: string; bg: string; titleColor: string }[] = [
  { key: "message_personnalise", label: "Message personnalisé", icon: "person", border: "#3b82f6", bg: "#eff6ff", titleColor: "#1d4ed8" },
];

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
    setAnalyzing(true);
    setError("");
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
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );

  const isBFEM = examType === "BFEM";
  const docLabel = isBFEM ? "bulletin général annuel" : "relevé de notes ou BAC";

  const mentionColor = result
    ? result.moyenne >= 14 ? { grad: "linear-gradient(135deg,#22c55e,#16a34a)", ring: "#bbf7d0" }
      : result.moyenne >= 10 ? { grad: "linear-gradient(135deg,#f97316,#ea580c)", ring: "#fed7aa" }
      : { grad: "linear-gradient(135deg,#ef4444,#dc2626)", ring: "#fecaca" }
    : null;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">

      {/* Header */}
      <div className="px-6 pt-8 pb-5 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)" }}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #FF6B00, transparent)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg,#FF6B00,#FF9500)" }}>🎯</div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Orientation</h1>
            <p className="text-white/50 text-xs font-medium">{isBFEM ? "Lycées recommandés" : "Universités & Grandes écoles"}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 space-y-4">

        {!result && (
          <>
            {/* Zone upload */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={analyzing}
              className="w-full rounded-2xl border-2 border-dashed active:scale-[0.98] transition-transform disabled:opacity-60 overflow-hidden"
              style={{ borderColor: "#FF6B00", backgroundColor: "#fff7ed" }}>
              {analyzing ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                  <p className="text-sm font-semibold text-on-surface-variant">Analyse IA en cours…</p>
                  <p className="text-xs text-on-surface-variant/60">Cela peut prendre 10-20 secondes</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF6B00,#FF9500)" }}>
                    <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-on-surface text-base">Upload ton {docLabel}</p>
                    <p className="text-sm text-on-surface-variant mt-0.5">Photo · PDF · IA Vision</p>
                  </div>
                  <p className="text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full">Touche pour choisir un fichier</p>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) analyze(f); }} />

            {error && (
              <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
                <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Comment ça marche */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ borderLeft: "4px solid #3b82f6", backgroundColor: "#eff6ff" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100">
                <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <p className="font-extrabold text-sm text-blue-700">Comment ça marche ?</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {[
                  `Prends une photo de ton ${docLabel}`,
                  `L'IA analyse tes résultats (${examType}${serie ? " " + serie : ""})`,
                  `Tu reçois des recommandations ${isBFEM ? "de lycée (séries L et S)" : "personnalisées au Sénégal"}`,
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "#3b82f6" }}>
                      <span className="text-white font-black text-xs">{i + 1}</span>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {result && mentionColor && (
          <>
            {/* Moyenne */}
            <div className="rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-lg" style={{ background: mentionColor.grad }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white, transparent)" }} />
              <p className="text-6xl font-black relative z-10">{result.moyenne.toFixed(2)}<span className="text-2xl">/20</span></p>
              <p className="text-xl font-bold opacity-90 mt-1 relative z-10">{result.mention}</p>
              {result.orientation_principale && (
                <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 relative z-10 inline-block">
                  <p className="text-sm font-semibold opacity-95">{result.orientation_principale}</p>
                </div>
              )}
            </div>

            {/* Notes extraites */}
            {result.notes_extraites && Object.keys(result.notes_extraites).length > 0 && (
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ borderLeft: "4px solid #8b5cf6", backgroundColor: "#f5f3ff" }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-100">
                  <span className="material-symbols-outlined text-[18px] text-purple-600" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                  <p className="font-extrabold text-sm text-purple-700">Notes extraites</p>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  {Object.entries(result.notes_extraites).map(([m, n]) => (
                    <div key={m} className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2.5 shadow-sm">
                      <span className="text-xs text-on-surface font-medium truncate">{m}</span>
                      <span className={`text-xs font-black ml-2 ${n >= 10 ? "text-green-700" : "text-red-600"}`}>{n}/20</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message personnalisé */}
            {result.message_personnalise && (
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ borderLeft: "4px solid #3b82f6", backgroundColor: "#eff6ff" }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100">
                  <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  <p className="font-extrabold text-sm text-blue-700">Analyse personnalisée</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-blue-900 leading-relaxed">{result.message_personnalise}</p>
                </div>
              </div>
            )}

            {/* Établissements */}
            {result.etablissements_recommandes?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Établissements recommandés</p>
                <div className="space-y-3">
                  {result.etablissements_recommandes.map((e, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden shadow-sm"
                      style={{ borderLeft: "4px solid #10b981", backgroundColor: "#f0fdf4" }}>
                      <div className="flex items-start gap-2 px-4 py-3 border-b border-green-100">
                        <span className="material-symbols-outlined text-[18px] text-green-600 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-sm text-green-800">{e.nom}</p>
                          <p className="text-xs text-green-700/70 font-medium">{e.type} · {e.filiere}</p>
                        </div>
                        {e.lien_gsn && (
                          <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">GSN Learn</span>
                        )}
                      </div>
                      <div className="px-4 py-3 space-y-1.5">
                        <p className="text-sm text-green-900 leading-relaxed">{e.pourquoi}</p>
                        <p className="text-xs text-green-700/70">{e.conditions_acces}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GSN Learn */}
            {result.parcours_gsn_learn?.length > 0 && (
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ borderLeft: "4px solid #FF6B00", backgroundColor: "#fff7ed" }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-orange-100">
                  <span className="material-symbols-outlined text-[18px] text-[#FF6B00]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  <p className="font-extrabold text-sm text-[#c2410c]">Parcours GSN Learn recommandés</p>
                </div>
                <div className="px-4 py-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {result.parcours_gsn_learn.map(p => (
                      <span key={p} className="text-xs font-bold bg-primary/15 text-primary px-3 py-1.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  <Link href="/learn" className="flex items-center gap-1.5 text-sm font-bold text-primary">
                    Voir GSN Learn <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            <button onClick={() => setResult(null)}
              className="w-full py-4 font-black text-white rounded-2xl active:scale-[0.98] transition-transform shadow-lg"
              style={{ backgroundColor: "#FF6B00" }}>
              {isBFEM ? "Analyser un autre bulletin" : "Analyser un autre relevé"}
            </button>
          </>
        )}

      </div>
    </main>
  );
}
