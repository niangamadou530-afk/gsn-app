"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Flashcard = {
  id: number;
  recto: string;
  verso: string;
  explication: string;
  difficulte: "facile" | "moyen" | "difficile";
  chapitre: string;
};

const SUBJECTS = [
  "Maths", "Français", "Physique-Chimie", "Sciences Naturelles",
  "Histoire-Géographie", "Philosophie", "Anglais", "Comptabilité",
];
const CHAPTERS: Record<string, string[]> = {
  "Maths":             ["Suites numériques", "Dérivées", "Intégrales", "Probabilités", "Géométrie espace", "Nombres complexes"],
  "Français":          ["Dissertation", "Commentaire composé", "Résumé", "Sembène Ousmane", "Cheikh Hamidou Kane"],
  "Physique-Chimie":   ["Circuits RC/RL", "Mécanique Newton", "Optique", "Ondes", "Réactions chimiques"],
  "Sciences Naturelles": ["Génétique", "Immunologie", "Écologie", "Nutrition", "Évolution"],
  "Histoire-Géographie": ["Décolonisation", "Guerre froide", "Mondialisation", "Géographie Afrique"],
  "Philosophie":       ["Liberté", "Conscience", "L'État", "La morale", "La vérité"],
  "Anglais":           ["Compréhension écrite", "Expression écrite", "Grammaire"],
  "Comptabilité":      ["Bilan", "Compte de résultat", "Amortissements", "TVA"],
};

const REVIEW_KEY = "gsn_prep_flashcard_review";

function getReviewData(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || "{}"); } catch { return {}; }
}
function setReviewDate(id: string, days: number) {
  const data = getReviewData();
  const date = new Date();
  date.setDate(date.getDate() + days);
  data[id] = date.toISOString();
  localStorage.setItem(REVIEW_KEY, JSON.stringify(data));
}

type Phase = "setup" | "loading" | "study" | "done";

function FlashcardsInner() {
  const searchParams = useSearchParams();
  const preChapter = searchParams.get("chapter") ?? "";
  const preSubject = searchParams.get("subject") ?? "";

  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState(preSubject);
  const [chapter, setChapter] = useState(preChapter);
  const [customChapter, setCustomChapter] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<number>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (preSubject) setSubject(preSubject);
    if (preChapter) { setChapter(preChapter); setCustomChapter(preChapter); }
  }, [preSubject, preChapter]);

  const availableChapters = CHAPTERS[subject] ?? [];
  const finalChapter = chapter === "__custom__" ? customChapter : chapter;

  async function generateCards() {
    if (!finalChapter) return;
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/prep-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter: finalChapter, subject, examType: "BAC", count: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!Array.isArray(data.flashcards)) throw new Error("Structure invalide");
      setCards(data.flashcards);
      setCurrent(0);
      setIsFlipped(false);
      setKnownIds(new Set());
      setReviewIds(new Set());
      setPhase("study");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
      setPhase("setup");
    }
  }

  function handleKnown() {
    const card = cards[current];
    setKnownIds(prev => new Set([...prev, card.id]));
    setReviewDate(`${subject}_${card.id}`, 3);
    advance();
  }

  function handleReview() {
    const card = cards[current];
    setReviewIds(prev => new Set([...prev, card.id]));
    setReviewDate(`${subject}_${card.id}`, 1);
    advance();
  }

  function advance() {
    setIsFlipped(false);
    if (current < cards.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setPhase("done");
    }
  }

  const card = cards[current];
  const progress = cards.length > 0 ? ((current) / cards.length) * 100 : 0;

  /* ── SETUP ── */
  if (phase === "setup") return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <p className="font-bold text-on-surface">Flashcards</p>
          <p className="text-xs text-on-surface-variant">Mémorise par répétition espacée</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
          <span className="text-4xl block mb-2">🃏</span>
          <h1 className="text-xl font-extrabold">Flashcards interactives</h1>
          <p className="text-white/80 text-sm mt-1">L&apos;IA génère des cartes pour ton chapitre. Mémorise et planifie tes révisions.</p>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-sm text-on-surface">Matière</p>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => { setSubject(s); setChapter(""); }}
                className={`p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${subject === s ? "border-purple-500 bg-purple-50 text-purple-700" : "border-transparent bg-surface-container-lowest shadow-sm text-on-surface"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {subject && (
          <div className="space-y-2">
            <p className="font-bold text-sm text-on-surface">Chapitre</p>
            <div className="space-y-1.5">
              {availableChapters.map(ch => (
                <button key={ch} onClick={() => setChapter(ch)}
                  className={`w-full p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${chapter === ch ? "border-purple-500 bg-purple-50 text-purple-700" : "border-transparent bg-surface-container-lowest shadow-sm text-on-surface"}`}>
                  {ch}
                </button>
              ))}
              <button onClick={() => setChapter("__custom__")}
                className={`w-full p-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${chapter === "__custom__" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-dashed border-outline-variant/40 text-on-surface-variant"}`}>
                + Saisir un autre chapitre…
              </button>
            </div>
            {chapter === "__custom__" && (
              <input
                type="text"
                value={customChapter}
                onChange={e => setCustomChapter(e.target.value)}
                placeholder="Ex: Thermodynamique, Poésie africaine…"
                className="w-full p-4 rounded-xl border-2 border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:border-purple-500 focus:outline-none text-sm" />
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button onClick={generateCards} disabled={!finalChapter}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
          <span className="material-symbols-outlined">auto_awesome</span>
          Générer mes flashcards
        </button>
      </div>
    </main>
  );

  /* ── LOADING ── */
  if (phase === "loading") return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-4 p-6">
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
      <p className="font-bold text-on-surface">Génération des flashcards…</p>
      <p className="text-on-surface-variant text-sm">{finalChapter} — {subject}</p>
    </div>
  );

  /* ── STUDY ── */
  if (phase === "study" && card) return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      {/* Progress */}
      <div className="sticky top-0 z-30 bg-surface border-b border-outline-variant/20">
        <div className="h-1.5" style={{ background: `linear-gradient(to right, #7C3AED ${progress}%, #e0e0e0 0%)` }} />
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-on-surface">{current + 1} / {cards.length}</span>
          <div className="flex gap-3 text-xs font-semibold">
            <span className="text-green-600">✓ {knownIds.size}</span>
            <span className="text-amber-600">↻ {reviewIds.size}</span>
          </div>
          <span className="text-xs text-on-surface-variant">{card.chapitre}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-5">
        {/* Difficulty badge */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.difficulte === "facile" ? "bg-green-100 text-green-700" : card.difficulte === "moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {card.difficulte}
          </span>
          <span className="text-xs text-on-surface-variant">{isFlipped ? "Réponse" : "Question"} — Appuie sur la carte</span>
        </div>

        {/* Flip card */}
        <div
          onClick={() => setIsFlipped(f => !f)}
          className="cursor-pointer select-none rounded-3xl shadow-lg min-h-52 flex flex-col items-center justify-center p-8 text-center transition-all active:scale-[0.98]"
          style={{ background: isFlipped ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "white", border: isFlipped ? "none" : "2px solid rgba(0,0,0,0.06)" }}>
          <p className={`text-lg font-bold leading-snug ${isFlipped ? "text-white" : "text-on-surface"}`}>
            {isFlipped ? card.verso : card.recto}
          </p>
          {isFlipped && card.explication && (
            <p className="text-white/80 text-sm mt-4 leading-relaxed">{card.explication}</p>
          )}
          {!isFlipped && (
            <p className="text-outline text-xs mt-4">👆 Appuie pour révéler</p>
          )}
        </div>

        {/* Action buttons (only after flip) */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleReview}
              className="py-4 rounded-2xl border-2 border-amber-300 bg-amber-50 font-bold text-amber-700 text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">replay</span>
              À revoir<br /><span className="text-[10px] font-normal">Demain</span>
            </button>
            <button onClick={handleKnown}
              className="py-4 rounded-2xl bg-green-500 font-bold text-white text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-green-500/20">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Je savais !<br /><span className="text-[10px] font-normal">Revoir dans 3 jours</span>
            </button>
          </div>
        )}

        {!isFlipped && (
          <button onClick={() => setIsFlipped(true)}
            className="w-full py-4 rounded-2xl font-black text-white text-sm active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            Révéler la réponse
          </button>
        )}
      </div>
    </main>
  );

  /* ── DONE ── */
  if (phase === "done") return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      <div className="max-w-xl mx-auto px-6 py-12 space-y-6 flex flex-col items-center text-center">
        <span className="text-6xl">🎉</span>
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface">Session terminée !</h2>
          <p className="text-on-surface-variant text-sm mt-1">{finalChapter} — {cards.length} cartes</p>
        </div>

        {/* Score */}
        <div className="w-full rounded-2xl p-5 shadow-sm bg-surface-container-lowest space-y-3">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-3xl font-black text-green-600">{knownIds.size}</p>
              <p className="text-xs text-on-surface-variant font-medium">Je savais ✓</p>
              <p className="text-[10px] text-green-600">Revoir dans 3j</p>
            </div>
            <div className="w-px bg-outline-variant/20" />
            <div>
              <p className="text-3xl font-black text-amber-600">{reviewIds.size}</p>
              <p className="text-xs text-on-surface-variant font-medium">À revoir ↻</p>
              <p className="text-[10px] text-amber-600">Revoir demain</p>
            </div>
            <div className="w-px bg-outline-variant/20" />
            <div>
              <p className="text-3xl font-black text-primary">{Math.round((knownIds.size / cards.length) * 100)}%</p>
              <p className="text-xs text-on-surface-variant font-medium">Score</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button onClick={() => { setCurrent(0); setIsFlipped(false); setKnownIds(new Set()); setReviewIds(new Set()); setPhase("study"); }}
            className="flex-1 py-3 border-2 border-outline-variant/30 rounded-xl font-bold text-on-surface text-sm">
            Recommencer
          </button>
          <button onClick={() => setPhase("setup")}
            className="flex-1 py-3 rounded-xl font-black text-white text-sm"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            Nouveau chapitre
          </button>
        </div>
        <Link href="/prep/dashboard" className="text-primary text-sm font-bold hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );

  return null;
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
      </div>
    }>
      <FlashcardsInner />
    </Suspense>
  );
}
