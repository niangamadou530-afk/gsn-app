"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MATIERES_BY_SERIE, getProgramme } from "@/data/programmes";

type DBFlashcard = {
  id: string;
  matiere: string;
  chapitre: string;
  recto: string;
  verso: string;
  maitrisee: boolean;
  created_at: string;
};

type GeneratedCard = {
  id: number;
  recto: string;
  verso: string;
  explication: string;
  difficulte: "facile" | "moyen" | "difficile";
};

type Phase = "home" | "setup_matiere" | "setup_chapitre" | "generating" | "review" | "history";

const BAC_DATE = "2026-06-30";
function daysUntilBAC() {
  return Math.max(0, Math.ceil((new Date(BAC_DATE).getTime() - Date.now()) / 86400000));
}

export default function FlashcardsPage() {
  const router = useRouter();

  // User
  const [userId, setUserId] = useState<string | null>(null);
  const [serie, setSerie] = useState("S1");

  // Selection
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedChapitre, setSelectedChapitre] = useState("");

  // Generated cards
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [toReview, setToReview] = useState<Set<number>>(new Set());

  // Saved cards
  const [savedSets, setSavedSets] = useState<{ matiere: string; chapitre: string; count: number; mastered: number }[]>([]);
  const [historyCards, setHistoryCards] = useState<DBFlashcard[]>([]);
  const [historyFlipped, setHistoryFlipped] = useState<Set<string>>(new Set());

  const [phase, setPhase] = useState<Phase>("home");
  const [error, setError] = useState("");

  const dl = daysUntilBAC();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);

      const { data: stu } = await supabase.from("prep_students").select("serie").eq("user_id", user.id).limit(1);
      setSerie(stu?.[0]?.serie ?? "S1");

      await loadSavedSets(user.id);
    }
    load();
  }, [router]);

  async function loadSavedSets(uid: string) {
    const { data } = await supabase
      .from("flashcards")
      .select("matiere, chapitre, maitrisee")
      .eq("user_id", uid);
    if (!data) return;

    // Group by matiere+chapitre
    const groups: Record<string, { count: number; mastered: number }> = {};
    for (const card of data) {
      const key = `${card.matiere}::${card.chapitre}`;
      if (!groups[key]) groups[key] = { count: 0, mastered: 0 };
      groups[key].count++;
      if (card.maitrisee) groups[key].mastered++;
    }
    setSavedSets(
      Object.entries(groups).map(([key, v]) => {
        const [matiere, chapitre] = key.split("::");
        return { matiere, chapitre, ...v };
      })
    );
  }

  async function generateCards() {
    if (!selectedMatiere || !selectedChapitre) return;
    setPhase("generating");
    setError("");

    const prog = getProgramme(selectedMatiere, serie);
    try {
      const res = await fetch("/api/prep-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedMatiere,
          chapter: selectedChapitre,
          serie,
          examType: "BAC",
          count: 10,
          programmeContenu: prog?.contenu?.slice(0, 1500) ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.flashcards?.length) throw new Error(data.error || "Erreur");
      setCards(data.flashcards);
      setCardIdx(0);
      setFlipped(false);
      setMastered(new Set());
      setToReview(new Set());
      setPhase("review");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de génération");
      setPhase("setup_chapitre");
    }
  }

  async function saveCardsToSupabase() {
    if (!userId || !cards.length) return;
    const inserts = cards.map(c => ({
      user_id: userId,
      serie,
      matiere: selectedMatiere,
      chapitre: selectedChapitre,
      recto: c.recto,
      verso: c.verso,
      maitrisee: false,
    }));
    await supabase.from("flashcards").insert(inserts);
    await loadSavedSets(userId);
  }

  function handleMastered() {
    setMastered(prev => new Set([...prev, cardIdx]));
    advanceCard();
  }

  function handleToReview() {
    setToReview(prev => new Set([...prev, cardIdx]));
    advanceCard();
  }

  function advanceCard() {
    setFlipped(false);
    if (cardIdx < cards.length - 1) {
      setCardIdx(i => i + 1);
    } else {
      saveCardsToSupabase();
      setPhase("home");
    }
  }

  async function loadHistory(matiere: string, chapitre: string) {
    if (!userId) return;
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .eq("matiere", matiere)
      .eq("chapitre", chapitre)
      .order("created_at", { ascending: false });
    setHistoryCards((data ?? []) as DBFlashcard[]);
    setHistoryFlipped(new Set());
    setPhase("history");
  }

  async function toggleMaitrised(id: string, current: boolean) {
    await supabase.from("flashcards").update({ maitrisee: !current }).eq("id", id);
    setHistoryCards(prev => prev.map(c => c.id === id ? { ...c, maitrisee: !current } : c));
    if (userId) await loadSavedSets(userId);
  }

  const matieres = MATIERES_BY_SERIE[serie] ?? [];
  const chapitres = selectedMatiere ? (getProgramme(selectedMatiere, serie)?.chapitres ?? []) : [];
  const card = cards[cardIdx];
  const progress = cards.length > 0 ? (cardIdx / cards.length) * 100 : 0;

  /* ── HOME ─────────────────────────────────────────────────── */
  if (phase === "home") return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <p className="font-bold text-on-surface">Flashcards</p>
          <p className="text-xs text-on-surface-variant">BAC dans J-{dl} · 30 juin 2026</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
          <span className="text-4xl block mb-2">🃏</span>
          <h1 className="text-xl font-extrabold">Flashcards par chapitre</h1>
          <p className="text-white/80 text-sm mt-1">
            Choisis une matière et un chapitre du programme officiel. L&apos;IA génère des cartes mémorisables.
          </p>
        </div>

        <button
          onClick={() => { setSelectedMatiere(""); setSelectedChapitre(""); setPhase("setup_matiere"); }}
          className="w-full py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
          <span className="material-symbols-outlined">add</span>
          Créer de nouvelles flashcards
        </button>

        {/* Saved sets */}
        {savedSets.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-on-surface">Mes sets de flashcards</h2>
            <div className="space-y-2">
              {savedSets.map((set, i) => {
                const pct = set.count > 0 ? Math.round((set.mastered / set.count) * 100) : 0;
                return (
                  <button key={i}
                    onClick={() => loadHistory(set.matiere, set.chapitre)}
                    className="w-full flex items-center justify-between gap-3 bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                    <div className="text-left flex-1">
                      <p className="font-bold text-on-surface text-sm">{set.chapitre}</p>
                      <p className="text-xs text-on-surface-variant">{set.matiere} · {set.count} cartes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-purple-600 font-bold">{pct}%</span>
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );

  /* ── SETUP: matière ───────────────────────────────────────── */
  if (phase === "setup_matiere") return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <button onClick={() => setPhase("home")} className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <p className="font-bold text-on-surface">Choisir la matière</p>
      </header>
      <div className="max-w-xl mx-auto px-6 py-6 space-y-3">
        <p className="text-sm text-on-surface-variant">Série {serie}</p>
        {matieres.map(m => (
          <button key={m}
            onClick={() => { setSelectedMatiere(m); setSelectedChapitre(""); setPhase("setup_chapitre"); }}
            className="w-full flex items-center justify-between px-4 py-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
            <p className="font-bold text-on-surface">{m}</p>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        ))}
      </div>
    </main>
  );

  /* ── SETUP: chapitre ──────────────────────────────────────── */
  if (phase === "setup_chapitre") return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <button onClick={() => setPhase("setup_matiere")} className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <p className="font-bold text-on-surface">{selectedMatiere} — choisir le chapitre</p>
      </header>
      <div className="max-w-xl mx-auto px-6 py-6 space-y-2">
        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-3">{error}</p>}
        {chapitres.map(ch => (
          <button key={ch}
            onClick={() => { setSelectedChapitre(ch); setError(""); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium text-sm transition-all ${selectedChapitre === ch ? "border-purple-500 bg-purple-50 text-purple-700" : "border-transparent bg-surface-container-lowest text-on-surface shadow-sm"}`}>
            {ch}
          </button>
        ))}
        <div className="pt-3">
          <button
            onClick={generateCards}
            disabled={!selectedChapitre}
            className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            Générer les flashcards →
          </button>
        </div>
      </div>
    </main>
  );

  /* ── GENERATING ───────────────────────────────────────────── */
  if (phase === "generating") return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "#7C3AED", borderTopColor: "transparent", borderWidth: 3 }} />
      <div className="text-center">
        <p className="font-bold text-on-surface">Génération des flashcards…</p>
        <p className="text-sm text-on-surface-variant mt-1">{selectedMatiere} · {selectedChapitre}</p>
      </div>
    </main>
  );

  /* ── REVIEW ───────────────────────────────────────────────── */
  if (phase === "review" && card) return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      <div className="sticky top-0 z-30 bg-surface border-b border-outline-variant/20">
        <div className="h-1.5" style={{ background: `linear-gradient(to right, #7C3AED ${progress}%, #e0e0e0 0%)` }} />
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-bold">{cardIdx + 1}/{cards.length}</span>
          <div className="text-xs font-semibold text-on-surface-variant">{selectedChapitre}</div>
          <div className="flex gap-3 text-xs font-semibold">
            <span className="text-green-600">✓ {mastered.size}</span>
            <span className="text-amber-600">↻ {toReview.size}</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.difficulte === "facile" ? "bg-green-100 text-green-700" : card.difficulte === "moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {card.difficulte}
          </span>
          <span className="text-xs text-on-surface-variant">{flipped ? "Verso" : "Recto"} · Appuie pour retourner</span>
        </div>

        <div
          onClick={() => setFlipped(f => !f)}
          className="cursor-pointer select-none rounded-3xl shadow-lg min-h-52 flex flex-col items-center justify-center p-8 text-center transition-all active:scale-[0.98]"
          style={{ background: flipped ? "linear-gradient(135deg,#7C3AED,#A855F7)" : "white", border: flipped ? "none" : "2px solid rgba(0,0,0,0.06)" }}>
          <p className={`text-lg font-bold leading-snug ${flipped ? "text-white" : "text-on-surface"}`}>
            {flipped ? card.verso : card.recto}
          </p>
          {flipped && card.explication && (
            <p className="text-white/80 text-sm mt-4 leading-relaxed">{card.explication}</p>
          )}
          {!flipped && <p className="text-outline text-xs mt-4">👆 Appuie pour révéler</p>}
        </div>

        {flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleToReview}
              className="py-4 rounded-2xl border-2 border-amber-300 bg-amber-50 font-bold text-amber-700 text-sm active:scale-[0.98] flex flex-col items-center">
              <span className="material-symbols-outlined text-[20px]">replay</span>
              À revoir
            </button>
            <button onClick={handleMastered}
              className="py-4 rounded-2xl bg-green-500 font-bold text-white text-sm active:scale-[0.98] flex flex-col items-center shadow-md">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Je savais !
            </button>
          </div>
        ) : (
          <button onClick={() => setFlipped(true)}
            className="w-full py-4 rounded-2xl font-black text-white active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}>
            Révéler la réponse
          </button>
        )}
      </div>
    </main>
  );

  /* ── HISTORY ──────────────────────────────────────────────── */
  if (phase === "history") {
    const total = historyCards.length;
    const masteredCount = historyCards.filter(c => c.maitrisee).length;

    return (
      <main className="min-h-screen bg-surface text-on-surface pb-28">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
          <button onClick={() => setPhase("home")} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <p className="font-bold text-on-surface">{historyCards[0]?.chapitre ?? "Flashcards"}</p>
            <p className="text-xs text-on-surface-variant">{historyCards[0]?.matiere} · {masteredCount}/{total} maîtrisées</p>
          </div>
        </header>

        <div className="max-w-xl mx-auto px-6 py-6 space-y-3">
          {/* Progress */}
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${total > 0 ? Math.round(masteredCount / total * 100) : 0}%` }} />
          </div>

          {historyCards.map(c => {
            const isFlipped = historyFlipped.has(c.id);
            return (
              <div key={c.id}
                onClick={() => {
                  setHistoryFlipped(prev => {
                    const n = new Set(prev);
                    n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                    return n;
                  });
                }}
                className="cursor-pointer rounded-2xl shadow-sm overflow-hidden border border-outline-variant/10 select-none">
                <div className={`p-4 transition-colors ${isFlipped ? "bg-purple-600" : "bg-surface-container-lowest"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug flex-1 ${isFlipped ? "text-white" : "text-on-surface"}`}>
                      {isFlipped ? c.verso : c.recto}
                    </p>
                    <button
                      onClick={e => { e.stopPropagation(); toggleMaitrised(c.id, c.maitrisee); }}
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${c.maitrisee ? "bg-green-500 text-white" : "bg-surface-container text-on-surface-variant"}`}>
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: c.maitrisee ? "'FILL' 1" : "'FILL' 0" }}>check</span>
                    </button>
                  </div>
                  {!isFlipped && <p className="text-[10px] text-on-surface-variant mt-1">Appuie pour voir le verso</p>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return null;
}
