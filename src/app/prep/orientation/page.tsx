"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("examType", examType);
      fd.append("serie", serie);
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

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">Orientation</h1>
        <p className="text-on-surface-variant text-sm">Upload ton relevé de notes pour des recommandations personnalisées</p>
      </header>

      <div className="px-6 space-y-4">

        {!result && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={analyzing}
              className="w-full h-40 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-60">
              {analyzing ? (
                <>
                  <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                  <p className="text-sm text-on-surface-variant">Analyse en cours…</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  <p className="font-bold text-on-surface">Upload ton relevé de notes</p>
                  <p className="text-sm text-on-surface-variant">Photo ou PDF · IA Vision</p>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) analyze(f); }} />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-on-surface text-sm mb-1">Comment ça marche ?</p>
              <ol className="space-y-1 text-sm text-on-surface-variant">
                <li>1. Prends une photo de ton bulletin de notes</li>
                <li>2. L'IA analyse tes résultats ({examType}{serie ? " " + serie : ""})</li>
                <li>3. Tu reçois des recommandations d'orientation au Sénégal</li>
              </ol>
            </div>
          </>
        )}

        {result && (
          <>
            {/* Moyenne */}
            <div className="rounded-2xl p-5 text-white text-center" style={{ backgroundColor: result.moyenne >= 14 ? "#22c55e" : result.moyenne >= 10 ? "#f97316" : "#ef4444" }}>
              <p className="text-5xl font-black">{result.moyenne.toFixed(2)}/20</p>
              <p className="text-lg font-semibold opacity-90 mt-1">{result.mention}</p>
              {result.orientation_principale && (
                <p className="text-sm opacity-80 mt-1">{result.orientation_principale}</p>
              )}
            </div>

            {/* Notes extraites */}
            {result.notes_extraites && Object.keys(result.notes_extraites).length > 0 && (
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
                <p className="font-bold text-on-surface text-sm mb-3">Notes extraites</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.notes_extraites).map(([m, n]) => (
                    <div key={m} className="flex items-center justify-between bg-surface-container rounded-lg px-3 py-2">
                      <span className="text-xs text-on-surface truncate">{m}</span>
                      <span className={`text-xs font-black ${n >= 10 ? "text-green-700" : "text-red-700"}`}>{n}/20</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            {result.message_personnalise && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <p className="text-blue-800 text-sm leading-relaxed">{result.message_personnalise}</p>
              </div>
            )}

            {/* Établissements */}
            {result.etablissements_recommandes?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Établissements recommandés</p>
                <div className="space-y-3">
                  {result.etablissements_recommandes.map((e, i) => (
                    <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-on-surface">{e.nom}</p>
                        {e.lien_gsn && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">GSN Learn</span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant">{e.type} · {e.filiere}</p>
                      <p className="text-sm text-on-surface">{e.pourquoi}</p>
                      <p className="text-xs text-on-surface-variant">{e.conditions_acces}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GSN Learn */}
            {result.parcours_gsn_learn?.length > 0 && (
              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4">
                <p className="font-bold text-on-surface text-sm mb-2">Parcours GSN Learn recommandés</p>
                <div className="flex flex-wrap gap-2">
                  {result.parcours_gsn_learn.map(p => (
                    <span key={p} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">{p}</span>
                  ))}
                </div>
                <Link href="/learn" className="mt-3 block text-center text-sm font-bold text-primary underline">
                  Voir GSN Learn →
                </Link>
              </div>
            )}

            <button onClick={() => { setResult(null); setFileName(""); }}
              className="w-full py-4 font-black text-white rounded-2xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#FF6B00" }}>
              Analyser un autre relevé
            </button>
          </>
        )}

      </div>
    </main>
  );
}
