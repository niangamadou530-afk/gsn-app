"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";

type DocType = "tous" | "epreuve" | "corrige";

interface BfemDoc {
  id: string;
  annee: number;
  matiere: string;
  type: "epreuve" | "corrige";
  contenu_html: string | null;
  url_originale: string;
}

declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (nodes?: HTMLElement[]) => Promise<void>;
      startup?: { promise: Promise<void> };
    };
  }
}

function useMathJax() {
  const ready = useRef(false);

  useEffect(() => {
    window.MathJax = {
      typesetPromise: window.MathJax?.typesetPromise ?? (() => Promise.resolve()),
    } as typeof window.MathJax;

    (window as any).MathJax = {
      tex: {
        inlineMath: [["$", "$"]],
        displayMath: [["$$", "$$"]],
        processEscapes: true,
      },
      options: {
        skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
      },
      startup: { typeset: false },
    };

    if (!document.getElementById("mathjax-cdn")) {
      const s = document.createElement("script");
      s.id  = "mathjax-cdn";
      s.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
      s.async = true;
      s.onload = () => { ready.current = true; };
      document.head.appendChild(s);
    } else {
      ready.current = true;
    }
  }, []);

  function typeset(el: HTMLElement) {
    const attempt = (tries = 0) => {
      const mj = (window as any).MathJax;
      if (mj?.typesetPromise) {
        mj.typesetPromise([el]).catch(() => {});
      } else if (tries < 20) {
        setTimeout(() => attempt(tries + 1), 150);
      }
    };
    attempt();
  }

  return typeset;
}

function getBfemMatiereIcon(matiere: string): { icon: string; bg: string; text: string } {
  const m = matiere.toLowerCase();
  if (m.includes("math")) return { icon: "calculate", bg: "bg-blue-50 border-blue-100", text: "text-[#005bbf]" };
  if (m.includes("physiq") || m.includes("chim")) return { icon: "science", bg: "bg-indigo-50 border-indigo-100", text: "text-indigo-600" };
  if (m.includes("svt") || m.includes("scienc")) return { icon: "biotech", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-600" };
  if (m.includes("franc") || m.includes("dict") || m.includes("text")) return { icon: "menu_book", bg: "bg-amber-50 border-amber-100", text: "text-amber-700" };
  if (m.includes("hist") || m.includes("geo")) return { icon: "public", bg: "bg-teal-50 border-teal-100", text: "text-teal-700" };
  if (m.includes("anglais") || m.includes("esp") || m.includes("arab") || m.includes("lang")) return { icon: "translate", bg: "bg-rose-50 border-rose-100", text: "text-rose-600" };
  return { icon: "assignment", bg: "bg-slate-100 border-slate-200", text: "text-slate-700" };
}

export default function BfemPage() {
  const router    = useRouter();
  const typeset   = useMathJax();
  const contentRef = useRef<HTMLDivElement>(null);

  const [all, setAll]           = useState<BfemDoc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [annee, setAnnee]       = useState<number | null>(null);
  const [annees, setAnnees]     = useState<number[]>([]);
  const [docType, setDocType]   = useState<DocType>("tous");
  const [matiere, setMatiere]   = useState("Toutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<BfemDoc | null>(null);

  useEffect(() => {
    async function init() {
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

  // Trigger MathJax after content renders
  useEffect(() => {
    if (selected?.contenu_html && contentRef.current) {
      typeset(contentRef.current);
    }
  }, [selected, typeset]);

  const matieres = useMemo(() => {
    const s = new Set(all.filter(d => annee === null || d.annee === annee).map(d => d.matiere));
    return ["Toutes", ...Array.from(s).sort()];
  }, [all, annee]);

  const filtered = useMemo(() => all.filter(d => {
    if (annee !== null && d.annee !== annee) return false;
    if (docType !== "tous" && d.type !== docType) return false;
    if (matiere !== "Toutes" && d.matiere !== matiere) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchMatiere = d.matiere.toLowerCase().includes(q);
      if (!matchMatiere) return false;
    }
    return true;
  }), [all, annee, docType, matiere, searchQuery]);

  return (
    <div className="w-full">
      {/* HTML / MathJax Viewer Mode */}
      {selected ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Breadcrumb / Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
                title="Retour à la liste"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
                    selected.type === "corrige" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-[#005bbf] border border-blue-200"
                  }`}>
                    {selected.type === "corrige" ? t("prep.bfem.badgeCorrige") : t("prep.bfem.badgeEpreuve")}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    BFEM Session {selected.annee}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 truncate max-w-md">
                  {selected.matiere}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <a
                href={selected.url_originale}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
              >
                <span>{t("prep.bfem.sourceLink")}</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>
          </div>

          {/* HTML Render Container */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs">
            {selected.contenu_html ? (
              <div
                ref={contentRef}
                className="prose prose-slate max-w-none bfem-content overflow-x-auto text-slate-800 leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: selected.contenu_html }}
              />
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">description</span>
                </div>
                <p className="font-extrabold text-slate-900 text-base">{t("prep.bfem.contentUnavailable")}</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Le contenu numérique direct n&apos;est pas disponible, mais vous pouvez consulter la Source externe.
                </p>
                <a
                  href={selected.url_originale}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#005bbf] text-white font-bold text-xs shadow-xs hover:bg-[#004899] transition-all"
                >
                  <span>Consulter la Source externe</span>
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Document Directory & Filters */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#005bbf] text-xs font-bold mb-3">
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Collège · Brevet de Fin d&apos;Études Moyennes (BFEM)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Annales Officielles du <span className="text-[#005bbf]">BFEM</span>
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Révise les sujets réels et corrigés du BFEM sénégalais en Mathématiques, Français, PC, SVT, Anglais, Arabe et Histoire-Géographie.
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
                  placeholder="Rechercher une matière du BFEM (ex: Maths, Dictée)..."
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
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">Session :</span>
                {annees.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAnnee(a); setMatiere("Toutes"); }}
                    className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all active:scale-95 shrink-0 ${
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
                      ? t("prep.bfem.filterAll")
                      : dt === "epreuve"
                      ? t("prep.bfem.filterEpreuves")
                      : t("prep.bfem.filterCorriges")}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
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
              <p className="text-xs font-bold text-slate-500">Chargement des épreuves du BFEM...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">find_in_page</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">{t("prep.bfem.emptyTitle")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("prep.bfem.emptySubtitle")} Essayez de changer l&apos;année ou le filtre de matière.
              </p>
              <button
                onClick={() => { setDocType("tous"); setMatiere("Toutes"); setSearchQuery(""); }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-600">
                  {t(filtered.length > 1 ? "prep.bfem.documentCountPlural" : "prep.bfem.documentCountSingular", { count: filtered.length })} disponibles
                </p>
                <span className="text-[11px] font-semibold text-slate-500">Cliquez pour lire le sujet</span>
              </div>

              {/* Grid of BFEM Subject Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filtered.map((d) => {
                  const style = getBfemMatiereIcon(d.matiere);
                  const isCorrige = d.type === "corrige";
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelected(d)}
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
                            {isCorrige ? t("prep.bfem.badgeCorrige") : t("prep.bfem.badgeEpreuve")}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            BFEM · {d.annee}
                          </span>
                        </div>

                        <p className="font-extrabold text-slate-900 text-sm truncate group-hover:text-[#005bbf] transition-colors">
                          {d.matiere}
                        </p>

                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">menu_book</span>
                          <span>Sujet officiel numérisé</span>
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
