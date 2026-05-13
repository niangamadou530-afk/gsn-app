"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DocType = "tous" | "epreuve" | "corrige";

interface BfemDoc {
  id: string;
  annee: number;
  matiere: string;
  type: "epreuve" | "corrige";
  contenu_html: string | null;
  url_originale: string;
}

export default function BfemPage() {
  const router = useRouter();

  const [all, setAll]           = useState<BfemDoc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [annee, setAnnee]       = useState<number | null>(null);
  const [annees, setAnnees]     = useState<number[]>([]);
  const [docType, setDocType]   = useState<DocType>("tous");
  const [matiere, setMatiere]   = useState("Toutes");
  const [selected, setSelected] = useState<BfemDoc | null>(null);

  useEffect(() => {
    async function init() {
      // Guard: only BFEM students
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: stu } = await supabase
        .from("prep_students")
        .select("exam_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!stu || stu.exam_type !== "BFEM") {
        router.replace("/prep/epreuves");
        return;
      }

      // Load all BFEM docs
      const { data, error } = await supabase
        .from("epreuves_bac")
        .select("id, annee, matiere, type, contenu_html, url_originale")
        .eq("examen", "BFEM")
        .order("annee", { ascending: false });

      if (!error && data) {
        const docs = data as BfemDoc[];
        setAll(docs);
        const years = [...new Set(docs.map(d => d.annee))].sort((a, b) => b - a);
        setAnnees(years);
        if (years.length > 0) setAnnee(years[0]);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  const matieres = useMemo(() => {
    const s = new Set(all.filter(d => annee === null || d.annee === annee).map(d => d.matiere));
    return ["Toutes", ...Array.from(s).sort()];
  }, [all, annee]);

  const filtered = useMemo(() => all.filter(d => {
    if (annee !== null && d.annee !== annee) return false;
    if (docType !== "tous" && d.type !== docType) return false;
    if (matiere !== "Toutes" && d.matiere !== matiere) return false;
    return true;
  }), [all, annee, docType, matiere]);

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => selected ? setSelected(null) : router.push("/prep/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold text-on-surface">
          {selected ? selected.matiere : "Épreuves & Corrigés BFEM"}
        </h1>
      </header>

      {/* Viewer HTML */}
      {selected && (
        <div className="flex flex-col flex-1">
          <div className="px-4 py-2 flex items-center gap-2 bg-surface-container-lowest border-b border-outline-variant/20">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selected.type === "corrige" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {selected.type === "corrige" ? "Corrigé" : "Épreuve"}
            </span>
            <span className="text-sm text-on-surface-variant">{selected.annee}</span>
            <a href={selected.url_originale} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary font-semibold">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Source
            </a>
          </div>

          {selected.contenu_html ? (
            <div className="flex-1 px-4 py-6 overflow-auto bfem-content"
              dangerouslySetInnerHTML={{ __html: selected.contenu_html }} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                  description
                </span>
                <p className="font-bold text-on-surface mt-2">Contenu non disponible</p>
                <a href={selected.url_originale} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary font-semibold">
                  Voir sur sunudaara.com
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste */}
      {!selected && (
        <div className="flex-1 px-4 py-4 space-y-4">

          {/* Filtres année */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {annees.map(a => (
              <button key={a} onClick={() => { setAnnee(a); setMatiere("Toutes"); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all ${annee === a ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Filtres type */}
          <div className="flex gap-2">
            {(["tous", "epreuve", "corrige"] as DocType[]).map(t => (
              <button key={t} onClick={() => setDocType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${docType === t ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {t === "tous" ? "Tout" : t === "epreuve" ? "Épreuves" : "Corrigés"}
              </button>
            ))}
          </div>

          {/* Filtres matière */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {matieres.map(m => (
              <button key={m} onClick={() => setMatiere(m)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${matiere === m ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Résultats */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant"
                style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              <p className="font-bold text-on-surface mt-2">Aucun document trouvé</p>
              <p className="text-sm text-on-surface-variant mt-1">Essaie d'autres filtres.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant">{filtered.length} document{filtered.length > 1 ? "s" : ""}</p>
              {filtered.map(d => (
                <button key={d.id} onClick={() => setSelected(d)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest shadow-sm text-left active:scale-[0.98] transition-transform">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.type === "corrige" ? "bg-green-100" : "bg-blue-100"}`}>
                    <span className={`material-symbols-outlined text-[20px] ${d.type === "corrige" ? "text-green-600" : "text-blue-600"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {d.type === "corrige" ? "check_circle" : "description"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{d.matiere}</p>
                    <p className="text-xs text-on-surface-variant">{d.type === "corrige" ? "Corrigé" : "Épreuve"} · {d.annee}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
