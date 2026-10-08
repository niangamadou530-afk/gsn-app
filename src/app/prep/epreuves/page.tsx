"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";

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

function detectGroupe(e: Epreuve): "1er" | "2eme" | "remplacement" {
  if (/2eGr/i.test(e.matiere)) return "2eme";
  if (/\/uploads\/\d{4}\/(09|10|11|12)\//.test(e.url_originale)) return "remplacement";
  return "1er";
}

function getMatiereIcon(matiere: string): { icon: string; bg: string; text: string } {
  const m = matiere.toLowerCase();
  if (m.includes("math")) return { icon: "calculate", bg: "bg-blue-50 border-blue-100", text: "text-[#005bbf]" };
  if (m.includes("physiq") || m.includes("chim")) return { icon: "science", bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-600" };
  if (m.includes("svt") || m.includes("biol") || m.includes("scienc")) return { icon: "biotech", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-600" };
  if (m.includes("philo")) return { icon: "psychology", bg: "bg-purple-50 border-purple-100", text: "text-purple-600" };
  if (m.includes("franc") || m.includes("litt")) return { icon: "menu_book", bg: "bg-amber-50 border-amber-100", text: "text-amber-700" };
  if (m.includes("hist") || m.includes("geo")) return { icon: "public", bg: "bg-teal-50 border-teal-100", text: "text-teal-700" };
  if (m.includes("anglais") || m.includes("esp") || m.includes("arab") || m.includes("lang")) return { icon: "translate", bg: "bg-rose-50 border-rose-100", text: "text-rose-600" };
  if (m.includes("gest") || m.includes("eco") || m.includes("compt")) return { icon: "finance_chip", bg: "bg-orange-50 border-orange-100", text: "text-[#FF6B00]" };
  return { icon: "description", bg: "bg-slate-100 border-slate-200", text: "text-slate-700" };
}

export default function EpreuvesPage() {
  const router = useRouter();

  const [all, setAll]           = useState<Epreuve[]>([]);
  const [loading, setLoading]   = useState(true);
  const [annees, setAnnees]     = useState<number[]>([2026, 2025, 2024, 2023]);
  const [annee, setAnnee]       = useState<number>(2026);
  const [docType, setDocType]   = useState<DocType>("tous");
  const [groupe, setGroupe]     = useState<Groupe>("tous");
  const [matiere, setMatiere]   = useState("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Epreuve | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);

  // Charger dynamiquement les années disponibles depuis la table epreuves_bac
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("epreuves_bac")
        .select("annee")
        .eq("examen", "BAC");
      if (!error && data && data.length > 0) {
        const unique = Array.from(new Set(data.map((d: { annee: number }) => Number(d.annee)).filter((y: number) => !isNaN(y) && y > 2000)))
          .sort((a, b) => b - a);
        if (unique.length > 0) {
          setAnnees(unique);
          setAnnee(unique[0]);
        }
      }
    })();
  }, []);

  // Guard: redirect BFEM students to their dedicated page
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: stu } = await supabase
        .from("prep_students")
        .select("exam_type")
        .eq("user_id", user.id)
        .maybeSingle();
      if (stu?.exam_type === "BFEM") { router.replace("/prep/bfem"); }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSelected(null);
      setMatiere("Toutes");
      const { data, error } = await supabase
        .from("epreuves_bac")
        .select("id, annee, serie, matiere, type, url_storage, url_originale, nom_fichier")
        .eq("annee", annee)
        .eq("examen", "BAC")
        .order("matiere");
      if (!error) setAll((data ?? []) as Epreuve[]);
      setLoading(false);
    })();
  }, [annee]);

  const matieres = useMemo(() => {
    const s = new Set(all.map(e => e.matiere.replace(/\s*2eGr\s*$/i, "").trim()));
    return ["Toutes", ...Array.from(s).sort()];
  }, [all]);

  const filtered = useMemo(() => all.filter(e => {
    if (docType !== "tous" && e.type !== docType) return false;
    if (groupe !== "tous" && detectGroupe(e) !== groupe) return false;
    if (matiere !== "Toutes" && e.matiere.replace(/\s*2eGr\s*$/i, "").trim() !== matiere) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchMatiere = e.matiere.toLowerCase().includes(q);
      const matchSerie = (e.serie || "").toLowerCase().includes(q);
      const matchFile = (e.nom_fichier || "").toLowerCase().includes(q);
      if (!matchMatiere && !matchSerie && !matchFile) return false;
    }
    return true;
  }), [all, docType, groupe, matiere, searchQuery]);

  const pdfUrl = (e: Epreuve) => e.url_storage ?? e.url_originale;
  const pdfProxyUrl = (e: Epreuve) => e.id ? `/api/prep-pdf-proxy?id=${e.id}` : pdfUrl(e);

  return (
    <div className="w-full">
      {/* PDF Viewer Mode */}
      {selected ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Breadcrumb / Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
                title="Retour à la liste"
                aria-label="Retour à la liste"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
                    selected.type === "corrige" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-[#005bbf] border border-blue-200"
                  }`}>
                    {selected.type === "corrige" ? t("prep.epreuves.badgeCorrige") : t("prep.epreuves.badgeEpreuve")}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Série {selected.serie} · {selected.annee}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 truncate max-w-md">
                  {selected.matiere}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <a
                href={pdfProxyUrl(selected)}
                download={selected.nom_fichier || `${selected.matiere}_${selected.annee}.pdf`}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-all active:scale-95 border border-slate-200"
                title="Télécharger pour réviser hors-ligne"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">Télécharger (PDF)</span>
              </a>
              <a
                href={pdfProxyUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Plein écran</span>
              </a>
            </div>
          </div>

          {/* Embedded Viewer Container with Instant Loading State */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden relative">
            {pdfLoading && (
              <div className="absolute inset-0 z-10 bg-slate-50/95 flex flex-col items-center justify-center p-6 space-y-3">
                <div className="w-9 h-9 border-3 border-blue-200 border-t-[#005bbf] rounded-full animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                    Chargement rapide du document...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Optimisé pour réseaux mobiles (mise en cache 7 jours)
                  </p>
                </div>
              </div>
            )}
            <iframe
              src={pdfProxyUrl(selected)}
              onLoad={() => setPdfLoading(false)}
              className="w-full bg-slate-50"
              style={{ height: "calc(100vh - 220px)", minHeight: "560px", border: "none" }}
              title={selected.nom_fichier ?? selected.matiere}
            />
          </div>
        </div>
      ) : (
        /* Document Directory & Filters */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#005bbf] text-xs font-bold mb-3">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Sujets & corrigés certifiés de l&apos;Office du Baccalauréat</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Annales Officielles du <span className="text-[#005bbf]">BAC</span>
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Consulte les épreuves réelles des sessions {annees.length > 1 ? `${annees[annees.length - 1]} à ${annees[0]}` : annees[0]} avec leurs corrigés détaillés pour toutes les séries (S1, S2, L1, L2, STEG, T).
              </p>
            </div>

            {/* Quick Search */}
            <div className="mt-5 max-w-md relative z-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Rechercher une matière, une série (ex: S2, SVT)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#005bbf]/20 focus:border-[#005bbf] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Year Selector & Document Type */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              {/* Year Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Session :</span>
                {annees.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnnee(a)}
                    className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all active:scale-95 ${
                      annee === a
                        ? "bg-[#005bbf] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Segmented Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                {(["tous", "epreuve", "corrige"] as DocType[]).map((dt) => (
                  <button
                    key={dt}
                    onClick={() => setDocType(dt)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      docType === dt
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {dt === "tous"
                      ? t("prep.epreuves.filterAll")
                      : dt === "epreuve"
                      ? t("prep.epreuves.filterEpreuves")
                      : t("prep.epreuves.filterCorriges")}
                  </button>
                ))}
              </div>
            </div>

            {/* Examination Groups */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Groupe :</span>
              {([
                { k: "tous",         labelKey: "prep.epreuves.groupAll" },
                { k: "1er",          labelKey: "prep.epreuves.groupFirst" },
                { k: "2eme",         labelKey: "prep.epreuves.groupSecond" },
                { k: "remplacement", labelKey: "prep.epreuves.groupReplacement" },
              ] as { k: Groupe; labelKey: string }[]).map(({ k, labelKey }) => (
                <button
                  key={k}
                  onClick={() => setGroupe(k)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 ${
                    groupe === k
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {/* Subject Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Matière :</span>
              {matieres.map((m) => (
                <button
                  key={m}
                  onClick={() => setMatiere(m)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                    matiere === m
                      ? "bg-[#FF6B00] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div
                className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3"
                style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }}
              />
              <p className="text-xs font-bold text-slate-500">Chargement des annales officielles {annee}...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">find_in_page</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">{t("prep.epreuves.emptyTitle")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("prep.epreuves.emptySubtitle")} Essayez de changer les filtres ou l&apos;année sélectionnée.
              </p>
              <button
                onClick={() => { setDocType("tous"); setGroupe("tous"); setMatiere("Toutes"); setSearchQuery(""); }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-600">
                  {t(filtered.length > 1 ? "prep.epreuves.documentCountPlural" : "prep.epreuves.documentCountSingular", { count: filtered.length })} pour la session {annee}
                </p>
                <span className="text-[11px] font-semibold text-slate-500">Cliquez pour ouvrir le sujet</span>
              </div>

              {/* Grid of Subject Cards (3 colonnes sur grand écran pour un équilibre parfait) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map((e) => {
                  const style = getMatiereIcon(e.matiere);
                  const isCorrige = e.type === "corrige";
                  return (
                    <button
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="group bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-blue-300 rounded-2xl p-4 text-left shadow-xs hover:shadow-md transition-all flex items-start gap-3.5 active:scale-[0.99]"
                    >
                      {/* Subject Icon Tile */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${style.bg} ${style.text} group-hover:scale-105 transition-transform`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {style.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isCorrige
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-[#005bbf] border border-blue-200"
                          }`}>
                            {isCorrige ? t("prep.epreuves.badgeCorrige") : t("prep.epreuves.badgeEpreuve")}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            Série {e.serie} · {e.annee}
                          </span>
                        </div>

                        <p className="font-extrabold text-slate-900 text-sm truncate group-hover:text-[#005bbf] transition-colors">
                          {e.matiere}
                        </p>

                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">picture_as_pdf</span>
                          <span>Format PDF officiel</span>
                        </p>
                      </div>

                      {/* Trailing Arrow */}
                      <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-blue-50 text-slate-500 group-hover:text-[#005bbf] flex items-center justify-center shrink-0 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
