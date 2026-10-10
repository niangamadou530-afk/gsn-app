"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";

type Epreuve = {
  id: string;
  annee: number;
  matiere: string;
  examen: string;
  serie?: string | null;
  type: string;
  url_storage?: string | null;
  url_originale?: string | null;
  nom_fichier?: string | null;
  contenu_html?: string | null;
};

type ViewingDoc =
  | { type: "pdf"; url: string; title: string }
  | { type: "text"; html: string; title: string };

function matiereIcon(m: string) {
  if (m.includes("Math")) return "calculate";
  if (m.includes("Français") || m.includes("Philo")) return "menu_book";
  if (m.includes("Physique") || m.includes("Sciences")) return "science";
  if (m.includes("Histoire")) return "public";
  if (m.includes("Anglais") || m.includes("Arabe") || m.includes("Espagnol")) return "translate";
  if (m.includes("Compt") || m.includes("Gestion")) return "finance_chip";
  return "description";
}

export default function BibliothequePage() {
  const [epreuves, setEpreuves] = useState<Epreuve[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExam, setFilterExam] = useState("Tous");
  const [filterSerie, setFilterSerie] = useState("Toutes");
  const [filterMatiere, setFilterMatiere] = useState("Toutes");
  const [filterAnnee, setFilterAnnee] = useState("Toutes");
  const [filterType, setFilterType] = useState<"tous" | "epreuve" | "corrige">("tous");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Modal Viewer (PDF ou Texte intégral)
  const [viewingDoc, setViewingDoc] = useState<ViewingDoc | null>(null);
  const [textCopied, setTextCopied] = useState(false);

  useEffect(() => {
    async function loadEpreuves() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("epreuves_bac")
          .select("id, annee, serie, matiere, type, examen, url_storage, url_originale, nom_fichier, contenu_html")
          .order("annee", { ascending: false })
          .order("matiere", { ascending: true });

        if (!error && data && data.length > 0) {
          setEpreuves(data as Epreuve[]);
        }
      } catch (err) {
        console.error("Erreur de chargement des annales :", err);
      } finally {
        setLoading(false);
      }
    }
    loadEpreuves();
  }, []);

  // Extraire dynamiquement les listes de filtres depuis les données réelles
  const exams = useMemo(() => {
    const set = new Set(epreuves.map(e => (e.examen || "BAC").toUpperCase()));
    return ["Tous", ...Array.from(set).sort()];
  }, [epreuves]);

  const annees = useMemo(() => {
    const set = new Set(
      epreuves
        .map(e => Number(e.annee))
        .filter(y => !isNaN(y) && y > 2000)
    );
    return ["Toutes", ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [epreuves]);

  const series = useMemo(() => {
    const pool = filterExam === "Tous"
      ? epreuves
      : epreuves.filter(e => (e.examen || "BAC").toUpperCase() === filterExam.toUpperCase());
    const set = new Set(
      pool
        .map(e => (e.serie || "").trim())
        .filter(s => Boolean(s) && s !== "Général")
    );
    return ["Toutes", ...Array.from(set).sort()];
  }, [epreuves, filterExam]);

  const matieres = useMemo(() => {
    const pool = filterExam === "Tous"
      ? epreuves
      : epreuves.filter(e => (e.examen || "BAC").toUpperCase() === filterExam.toUpperCase());
    const set = new Set(
      pool
        .map(e => (e.matiere || "").replace(/\s*2eGr\s*$/i, "").trim())
        .filter(Boolean)
    );
    return ["Toutes", ...Array.from(set).sort()];
  }, [epreuves, filterExam]);

  // Filtrage
  const filtered = useMemo(() => {
    return epreuves.filter(e => {
      const eExam = (e.examen || "BAC").toUpperCase();
      if (filterExam !== "Tous" && eExam !== filterExam.toUpperCase()) return false;
      if (filterAnnee !== "Toutes" && String(e.annee) !== filterAnnee) return false;
      if (filterSerie !== "Toutes" && (e.serie || "").trim().toUpperCase() !== filterSerie.toUpperCase()) return false;
      if (filterType !== "tous" && e.type !== filterType) return false;

      const normMat = (e.matiere || "").replace(/\s*2eGr\s*$/i, "").trim().toLowerCase();
      if (filterMatiere !== "Toutes" && normMat !== filterMatiere.toLowerCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchMat = (e.matiere || "").toLowerCase().includes(q);
        const matchSer = (e.serie || "").toLowerCase().includes(q);
        const matchNom = (e.nom_fichier || "").toLowerCase().includes(q);
        const matchAnnee = String(e.annee).includes(q);
        if (!matchMat && !matchSer && !matchNom && !matchAnnee) return false;
      }

      return true;
    });
  }, [epreuves, filterExam, filterAnnee, filterSerie, filterType, filterMatiere, searchQuery]);

  function handleOpenDoc(e: Epreuve) {
    const title = `${e.matiere} (${(e.examen || "BAC").toUpperCase()}${e.serie ? ` ${e.serie}` : ""} ${e.annee})`;

    // Cas 1 : Document avec fichier PDF hébergé
    if (e.url_storage) {
      setViewingDoc({
        type: "pdf",
        url: `/api/prep-pdf-proxy?id=${e.id}`,
        title,
      });
      return;
    }

    // Cas 2 : Document BFEM avec texte/HTML extrait
    if (e.contenu_html && e.contenu_html.trim().length > 0) {
      setViewingDoc({
        type: "text",
        html: e.contenu_html,
        title,
      });
      setTextCopied(false);
      return;
    }

    // Cas 3 : Source originale externe
    if (e.url_originale) {
      window.open(e.url_originale, "_blank", "noopener,noreferrer");
      return;
    }

    // Fallback : PDF proxy direct par identifiant
    setViewingDoc({
      type: "pdf",
      url: `/api/prep-pdf-proxy?id=${e.id}`,
      title,
    });
  }

  function handleCopyText(html: string) {
    try {
      const tempEl = document.createElement("div");
      tempEl.innerHTML = html;
      const text = tempEl.innerText || tempEl.textContent || "";
      navigator.clipboard.writeText(text);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    } catch {
      // Ignorer
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">folder_special</span>
            <span>Archives officielles du Baccalauréat & BFEM sénégalais</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.bibliotheque.headerTitle")}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Consultez les sujets d&apos;examen et corrigés officiels de la base nationale via notre proxy sécurisé haute vitesse.
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#005bbf] text-[20px] shrink-0 mt-0.5">verified</span>
        <p className="text-xs text-slate-700 leading-relaxed">
          Documents officiels vérifiés conformes aux barèmes de l&apos;<strong>Office du Baccalauréat</strong> et de la <strong>DEXCO</strong> du Ministère de l&apos;Éducation Nationale du Sénégal. Téléchargements optimisés et mis en cache (proxy interne).
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-400 text-[20px] pl-2">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher par matière, série, épreuve, mot-clé (ex: SVT, Maths S2, 2025)..."
          className="w-full text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-slate-400 hover:text-slate-600 pr-2"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Bars */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Exams */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Examen :</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {exams.map(f => (
              <button
                key={f}
                onClick={() => { setFilterExam(f); setFilterSerie("Toutes"); }}
                className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                  filterExam === f
                    ? "bg-[#005bbf] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Type d'épreuve (Sujet vs Corrigé) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nature du document :</label>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(["tous", "epreuve", "corrige"] as const).map(tType => (
              <button
                key={tType}
                onClick={() => setFilterType(tType)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  filterType === tType
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tType === "tous" ? "Tous les documents" : tType === "epreuve" ? "Épreuves uniquement" : "Corrigés officiels"}
              </button>
            ))}
          </div>
        </div>

        {/* Series */}
        {series.length > 2 && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Série :</label>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {series.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSerie(s)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    filterSerie === s
                      ? "bg-blue-100 text-[#005bbf] border border-blue-300"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sessions / Years */}
        {annees.length > 1 && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Session :</label>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {annees.map(a => (
                <button
                  key={a}
                  onClick={() => setFilterAnnee(a)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    filterAnnee === a
                      ? "bg-[#FF6B00] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disciplines / Matières */}
        {matieres.length > 2 && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Discipline :</label>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {matieres.map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMatiere(m)}
                  className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    filterMatiere === m
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          {loading ? (
            "Chargement des épreuves en cours..."
          ) : (
            `${filtered.length} document${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`
          )}
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List of Real Documents */}
      {!loading && (
        <div className="space-y-3">
          {filtered.map(e => {
            const hasPdf = Boolean(e.url_storage);
            const hasText = Boolean(e.contenu_html && e.contenu_html.trim().length > 0);
            const isCorrige = e.type === "corrige";
            const examLabel = (e.examen || "BAC").toUpperCase();
            const proxyUrl = `/api/prep-pdf-proxy?id=${e.id}`;

            return (
              <div key={e.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden transition-all">
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {hasPdf ? matiereIcon(e.matiere) : hasText ? "article" : "description"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: examLabel === "BAC" ? "#005bbf" : "#FF6B00" }}
                      >
                        {examLabel}{e.serie ? ` · ${e.serie}` : ""}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{e.annee}</span>

                      {/* Format Badge */}
                      {hasPdf ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#005bbf] border border-blue-200">
                          PDF Officiel
                        </span>
                      ) : hasText ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Texte Intégral
                        </span>
                      ) : null}

                      {/* Corrigé vs Épreuve */}
                      {isCorrige ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Corrigé officiel
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Épreuve écrite
                        </span>
                      )}
                    </div>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{e.matiere}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {e.nom_fichier || (hasText ? "Sujet officiel numérisé" : `Session ${e.annee}`)}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {/* Bouton Consulter : ouvre soit le PDF soit le texte sans erreur */}
                    <button
                      onClick={() => handleOpenDoc(e)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005bbf] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {hasPdf ? "visibility" : hasText ? "menu_book" : "open_in_new"}
                      </span>
                      <span>{hasPdf ? "Consulter" : hasText ? "Lire le texte" : "Ouvrir"}</span>
                    </button>

                    {/* Bouton Nouvel Onglet PDF uniquement si un vrai PDF existe */}
                    {hasPdf && (
                      <a
                        href={proxyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center"
                        title="Ouvrir le PDF dans un nouvel onglet"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    )}

                    <button
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      {expanded === e.id ? "Fermer" : "Quiz IA"}
                    </button>
                  </div>
                </div>

                {/* Expansion panel for training */}
                {expanded === e.id && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-xs space-y-2.5">
                      <p className="font-extrabold text-slate-900">
                        S&apos;entraîner sur le sujet de {e.matiere} ({examLabel}{e.serie ? ` ${e.serie}` : ""} {e.annee})
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        Génère une session d&apos;entraînement QCM corrigée basée sur les notions et compétences de cette épreuve officielle.
                      </p>
                      <Link
                        href={`/prep/generer?matiere=${encodeURIComponent(e.matiere)}&type=quiz&examType=${encodeURIComponent(examLabel)}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005bbf] hover:underline"
                      >
                        <span className="material-symbols-outlined text-[15px]">quiz</span>
                        <span>Lancer un quiz IA sur cette matière</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-2">
          <span className="material-symbols-outlined text-[44px] text-slate-300 block mx-auto">search_off</span>
          <p className="font-extrabold text-slate-900 text-sm">Aucune épreuve trouvée</p>
          <p className="text-xs text-slate-500">Essayez d&apos;élargir vos filtres d&apos;année ou de discipline.</p>
        </div>
      )}

      {/* Modal Document Viewer : PDF ou Texte Intégral */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col p-2 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-blue-400 text-[20px]">
                  {viewingDoc.type === "pdf" ? "picture_as_pdf" : "article"}
                </span>
                <span className="font-bold text-xs sm:text-sm truncate">{viewingDoc.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {viewingDoc.type === "pdf" ? (
                  <a
                    href={viewingDoc.url}
                    download
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span className="hidden sm:inline">Télécharger</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleCopyText(viewingDoc.html)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {textCopied ? "check" : "content_copy"}
                    </span>
                    <span>{textCopied ? "Copié !" : "Copier le texte"}</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {viewingDoc.type === "pdf" ? (
              <div className="flex-1 bg-slate-100 relative">
                <iframe
                  src={viewingDoc.url}
                  className="w-full h-full border-0"
                  title={viewingDoc.title}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white selection:bg-[#005bbf]/15 selection:text-[#005bbf]">
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">info</span>
                    <span>Sujet d&apos;examen retranscrit au format texte intégral (Source externe).</span>
                  </div>
                  <div
                    className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 font-sans"
                    dangerouslySetInnerHTML={{ __html: viewingDoc.html }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
