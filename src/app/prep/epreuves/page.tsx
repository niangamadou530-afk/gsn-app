"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DocType = "tous" | "epreuve" | "corrige";
type Groupe  = "tous" | "1er" | "2eme" | "remplacement";

interface Epreuve {
  id: string;
  annee: number;
  serie: string;
  matiere: string;
  type: "epreuve" | "corrige";
  url_storage: string | null;
  url_originale: string;
  nom_fichier: string | null;
}

const ANNEES = [2025, 2024, 2023];

function detectGroupe(e: Epreuve): "1er" | "2eme" | "remplacement" {
  if (/2eGr/i.test(e.matiere)) return "2eme";
  if (/\/uploads\/\d{4}\/(09|10|11|12)\//.test(e.url_originale)) return "remplacement";
  return "1er";
}

export default function EpreuvesPage() {
  const router = useRouter();

  const [all, setAll]           = useState<Epreuve[]>([]);
  const [loading, setLoading]   = useState(true);
  const [annee, setAnnee]       = useState<number>(2025);
  const [docType, setDocType]   = useState<DocType>("tous");
  const [groupe, setGroupe]     = useState<Groupe>("tous");
  const [selected, setSelected] = useState<Epreuve | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSelected(null);
      const { data, error } = await supabase
        .from("epreuves_bac")
        .select("id, annee, serie, matiere, type, url_storage, url_originale, nom_fichier")
        .eq("annee", annee)
        .order("matiere");
      if (!error) setAll((data ?? []) as Epreuve[]);
      setLoading(false);
    })();
  }, [annee]);

  const filtered = useMemo(() => all.filter(e => {
    if (docType !== "tous" && e.type !== docType) return false;
    if (groupe !== "tous" && detectGroupe(e) !== groupe) return false;
    return true;
  }), [all, docType, groupe]);

  const pdfUrl = (e: Epreuve) => e.url_storage ?? e.url_originale;

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => selected ? setSelected(null) : router.push("/prep/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold text-on-surface">
          {selected ? selected.matiere : "Épreuves & Corrigés BAC"}
        </h1>
      </header>

      {/* Viewer PDF */}
      {selected && (
        <div className="flex flex-col flex-1">
          <div className="px-4 py-2 flex items-center gap-2 bg-surface-container-lowest border-b border-outline-variant/20">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selected.type === "corrige" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {selected.type === "corrige" ? "Corrigé" : "Épreuve"}
            </span>
            <span className="text-sm text-on-surface-variant">{selected.serie} · {selected.annee}</span>
            <a href={pdfUrl(selected)} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary font-semibold">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Ouvrir
            </a>
          </div>
          <iframe
            src={pdfUrl(selected)}
            className="flex-1 w-full"
            style={{ minHeight: "calc(100vh - 120px)", border: "none" }}
            title={selected.nom_fichier ?? "PDF"}
          />
        </div>
      )}

      {/* Liste */}
      {!selected && (
        <div className="flex-1 px-4 py-4 space-y-4">

          {/* Filtres année */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ANNEES.map(a => (
              <button key={a} onClick={() => setAnnee(a)}
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

          {/* Filtres groupe */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { k: "tous",         label: "Tous" },
              { k: "1er",          label: "1er groupe" },
              { k: "2eme",         label: "2ème groupe" },
              { k: "remplacement", label: "Session de remplacement" },
            ] as { k: Groupe; label: string }[]).map(({ k, label }) => (
              <button key={k} onClick={() => setGroupe(k)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${groupe === k ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {label}
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
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              <p className="font-bold text-on-surface mt-2">Aucun document trouvé</p>
              <p className="text-sm text-on-surface-variant mt-1">Essaie d'autres filtres.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant">{filtered.length} document{filtered.length > 1 ? "s" : ""}</p>
              {filtered.map(e => (
                <button key={e.id} onClick={() => setSelected(e)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest shadow-sm text-left active:scale-[0.98] transition-transform">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${e.type === "corrige" ? "bg-green-100" : "bg-blue-100"}`}>
                    <span className={`material-symbols-outlined text-[20px] ${e.type === "corrige" ? "text-green-600" : "text-blue-600"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {e.type === "corrige" ? "check_circle" : "description"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{e.matiere}</p>
                    <p className="text-xs text-on-surface-variant">{e.serie} · {e.type === "corrige" ? "Corrigé" : "Épreuve"}</p>
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
