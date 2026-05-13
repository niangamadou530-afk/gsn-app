"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DocType = "tous" | "epreuve" | "corrige";
type Groupe  = "tous" | "1er" | "2eme" | "technique";

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
const TECH_RE = /\b(STEG|STIDD|F[0-9]|T[0-9])\b/i;

function detectGroupe(e: Epreuve): "1er" | "2eme" | "technique" {
  if (TECH_RE.test(e.serie)) return "technique";
  if (/2eGr/i.test(e.matiere)) return "2eme";
  return "1er";
}

function baseMatiere(m: string) {
  return m.replace(/\s*2eGr\s*$/i, "").trim();
}

export default function EpreuvesPage() {
  const router = useRouter();

  const [all, setAll]         = useState<Epreuve[]>([]);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee]     = useState<number>(2025);
  const [docType, setDocType] = useState<DocType>("tous");
  const [matiere, setMatiere] = useState("Toutes");
  const [serie, setSerie]     = useState("Toutes");
  const [groupe, setGroupe]   = useState<Groupe>("tous");
  const [selected, setSelected] = useState<Epreuve | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSelected(null);
      setMatiere("Toutes");
      setSerie("Toutes");
      const { data, error } = await supabase
        .from("epreuves_bac")
        .select("id, annee, serie, matiere, type, url_storage, url_originale, nom_fichier")
        .eq("annee", annee)
        .order("matiere");
      if (!error) setAll((data ?? []) as Epreuve[]);
      setLoading(false);
    })();
  }, [annee]);

  const matieres = useMemo(() => {
    const s = new Set(all.map(e => baseMatiere(e.matiere)));
    return ["Toutes", ...Array.from(s).sort()];
  }, [all]);

  const series = useMemo(() => {
    const s = new Set(all.map(e => e.serie));
    return ["Toutes", ...Array.from(s).sort()];
  }, [all]);

  const filtered = useMemo(() => all.filter(e => {
    if (docType !== "tous" && e.type !== docType) return false;
    if (matiere !== "Toutes" && baseMatiere(e.matiere) !== matiere) return false;
    if (serie !== "Toutes" && e.serie !== serie) return false;
    if (groupe !== "tous" && detectGroupe(e) !== groupe) return false;
    return true;
  }), [all, docType, matiere, serie, groupe]);

  const pdfUrl = (e: Epreuve) => e.url_storage ?? e.url_originale;

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => selected ? setSelected(null) : router.push("/prep/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold text-on-surface">
          {selected ? selected.matiere : "Épreuves & Corrigés BAC"}
        </h1>
        {selected && (
          <a
            href={pdfUrl(selected)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs font-bold text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Télécharger
          </a>
        )}
      </header>

      {/* PDF Viewer */}
      {selected && (
        <div className="flex flex-col flex-1">
          <div className="px-4 py-2 flex items-center gap-2 bg-surface-container-lowest border-b border-outline-variant/20">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selected.type === "corrige" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {selected.type === "corrige" ? "Corrigé" : "Épreuve"}
            </span>
            <span className="text-sm text-on-surface-variant">{selected.serie} · {selected.annee}</span>
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
        <div className="flex-1 px-4 py-4 space-y-3">

          {/* BFEM */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
            <span className="material-symbols-outlined text-amber-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-amber-900">Épreuves BFEM</p>
              <p className="text-xs text-amber-700">Disponibles sur sunudaara.com</p>
            </div>
            <button
              onClick={() => window.open("https://sunudaara.com", "_blank")}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white"
            >
              Ouvrir
            </button>
          </div>

          {/* Année */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {ANNEES.map(a => (
              <button key={a} onClick={() => setAnnee(a)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all ${annee === a ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {a}
              </button>
            ))}
          </div>

          {/* Type */}
          <div className="flex gap-2">
            {(["tous", "epreuve", "corrige"] as DocType[]).map(t => (
              <button key={t} onClick={() => setDocType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${docType === t ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {t === "tous" ? "Tout" : t === "epreuve" ? "Épreuves" : "Corrigés"}
              </button>
            ))}
          </div>

          {/* Groupe */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { k: "tous",      label: "Tous les groupes" },
              { k: "1er",       label: "1er groupe" },
              { k: "2eme",      label: "2ème groupe" },
              { k: "technique", label: "BAC technique" },
            ] as { k: Groupe; label: string }[]).map(({ k, label }) => (
              <button key={k} onClick={() => setGroupe(k)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${groupe === k ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Matière */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {matieres.map(m => (
              <button key={m} onClick={() => setMatiere(m)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${matiere === m ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Série */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {series.map(s => (
              <button key={s} onClick={() => setSerie(s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${serie === s ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {s}
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
                <div key={e.id} className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${e.type === "corrige" ? "bg-green-100" : "bg-blue-100"}`}>
                      <span className={`material-symbols-outlined text-[20px] ${e.type === "corrige" ? "text-green-600" : "text-blue-600"}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {e.type === "corrige" ? "check_circle" : "description"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${e.type === "corrige" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {e.type === "corrige" ? "Corrigé" : "Épreuve"}
                        </span>
                        <p className="font-bold text-on-surface text-sm truncate">{baseMatiere(e.matiere)}</p>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{e.serie} · {e.annee}</p>
                    </div>
                  </div>
                  <div className="flex border-t border-outline-variant/10">
                    <button
                      onClick={() => setSelected(e)}
                      className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-primary active:bg-primary/5"
                    >
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      Ouvrir le PDF
                    </button>
                    <div className="w-px bg-outline-variant/10" />
                    <a
                      href={pdfUrl(e)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface-variant active:bg-surface-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Télécharger
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
