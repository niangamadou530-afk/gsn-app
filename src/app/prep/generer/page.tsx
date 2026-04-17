"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres } from "@/data/programmes";

/* ─── Types ─────────────────────────────────────────────── */

type GenType   = "flashcards" | "quiz" | "resume";
type QuizMode  = "qcm" | "redaction";
type Phase =
  | "home"
  | "setup_a" | "setup_b"
  | "generating"
  | "flashcards_result"
  | "quiz_qcm"
  | "quiz_redaction"
  | "quiz_result"
  | "resume_result";

interface Flashcard { recto: string; verso: string; maitrisee?: boolean; }
interface QcmQuestion {
  id: number; question: string;
  choices: string[]; correct_answer: string;
  explanation: string; difficulty: string;
}
interface RedactionQuestion { id: number; question: string; }
interface YoutubeVideo { videoId: string; title: string; thumbnail: string; }

/* ─── Component ─────────────────────────────────────────── */

export default function GenererPage() {
  const router = useRouter();

  // Profile
  const [examType, setExamType] = useState("");
  const [serie, setSerie]       = useState("");
  const [prenom, setPrenom]     = useState("");
  const [userId, setUserId]     = useState<string | null>(null);

  // Mode A
  const [fileA, setFileA]         = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [matiereA, setMatiereA]   = useState("");

  // Mode B
  const [matiereB, setMatiereB]   = useState("");
  const [chapitreB, setChapitreB] = useState("");
  const [themeLibre, setThemeLibre] = useState("");

  // Common
  const [genType, setGenType]     = useState<GenType>("flashcards");
  const [quizMode, setQuizMode]   = useState<QuizMode>("qcm");

  // Results
  const [flashcards, setFlashcards]   = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped]         = useState(false);
  const [qcmQuestions, setQcmQuestions]   = useState<QcmQuestion[]>([]);
  const [redactionQs, setRedactionQs]     = useState<RedactionQuestion[]>([]);
  const [qcmAnswers, setQcmAnswers]       = useState<Record<number, string>>({});
  const [redactionAnswers, setRedactionAnswers] = useState<Record<number, string>>({});
  const [qcmCurrent, setQcmCurrent]     = useState(0);
  const [qcmShowAnswer, setQcmShowAnswer] = useState(false);
  const [qcmScore, setQcmScore]         = useState(0);
  const [redactionFeedback, setRedactionFeedback] = useState<Array<{ score: number; feedback: string }>>([]);
  const [redactionEvaluating, setRedactionEvaluating] = useState(false);
  const [resume, setResume]             = useState<Record<string, unknown> | null>(null);
  const [videos, setVideos]             = useState<YoutubeVideo[]>([]);
  const [videoPlaying, setVideoPlaying] = useState<string | null>(null);

  const [phase, setPhase]   = useState<Phase>("home");
  const [error, setError]   = useState("");
  const [mode, setMode]     = useState<"A" | "B" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      supabase.from("prep_students")
        .select("exam_type, serie, prenom")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setExamType(data.exam_type ?? "");
            setSerie(data.serie ?? "");
            setPrenom(data.prenom ?? "");
          }
        });
    });
  }, [router]);

  /* ── Helpers ── */
  function matieres(): string[] { return getMatieres(examType, serie); }
  function chapitres(m: string): string[] { return getChapitres(examType, serie, m); }

  function activeMat(): string { return mode === "A" ? matiereA : matiereB; }
  function activeChapitre(): string {
    if (mode === "A") return "";
    return chapitreB === "Autre" || chapitreB === "" ? themeLibre : chapitreB;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileA(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview("");
    }
  }

  async function fetchVideos(matiere: string, chapitre: string) {
    try {
      const res = await fetch("/api/prep-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matiere, chapitre, examType }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setVideos(data.videos ?? []);
    } catch { /* silent */ }
  }

  /* ── Generate ── */
  async function generate() {
    setPhase("generating");
    setError("");
    const mat = activeMat();
    const chap = activeChapitre();

    try {
      let body: Record<string, unknown>;

      if (mode === "A" && fileA) {
        // Convert file to base64
        const ab = await fileA.arrayBuffer();
        const b64 = Buffer.from(ab).toString("base64");
        body = {
          mode: "document",
          type: genType,
          quizMode,
          matiere: mat,
          fileBase64: b64,
          fileType: fileA.type,
          examType,
          serie,
        };
      } else {
        body = {
          mode: "knowledge",
          type: genType,
          quizMode,
          matiere: mat,
          chapitre: chap,
          examType,
          serie,
        };
      }

      const res = await fetch("/api/prep-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error ?? "Erreur serveur");
      }

      const data = await res.json();

      if (genType === "flashcards") {
        const cards: Flashcard[] = (data.flashcards ?? []).map((c: { recto: string; verso: string }) => ({ recto: c.recto, verso: c.verso, maitrisee: false }));
        setFlashcards(cards);
        setCurrentCard(0);
        setFlipped(false);
        await saveFlashcards(cards, mat, chap);
        await fetchVideos(mat, chap);
        setPhase("flashcards_result");
      } else if (genType === "quiz") {
        if (quizMode === "qcm") {
          setQcmQuestions(data.questions ?? []);
          setQcmCurrent(0);
          setQcmAnswers({});
          setQcmShowAnswer(false);
          setQcmScore(0);
          await fetchVideos(mat, chap);
          setPhase("quiz_qcm");
        } else {
          setRedactionQs((data.questions ?? []).map((q: { id: number; question: string }) => ({ id: q.id, question: q.question })));
          setRedactionAnswers({});
          setRedactionFeedback([]);
          await fetchVideos(mat, chap);
          setPhase("quiz_redaction");
        }
      } else {
        setResume(data);
        await saveResume(data, mat, chap);
        await fetchVideos(mat, chap);
        setPhase("resume_result");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setPhase(mode === "A" ? "setup_a" : "setup_b");
    }
  }

  /* ── Save to Supabase ── */
  async function saveFlashcards(cards: Flashcard[], mat: string, chap: string) {
    if (!userId || cards.length === 0) return;
    await supabase.from("flashcards").insert(
      cards.map(c => ({
        user_id: userId, serie, matiere: mat, chapitre: chap,
        recto: c.recto, verso: c.verso, maitrisee: false,
      }))
    );
  }

  async function saveQuizResult(score: number, total: number) {
    if (!userId) return;
    const mat = activeMat();
    const chap = activeChapitre();
    await supabase.from("quiz_results").insert({
      user_id: userId, matiere: mat, chapitre: chap,
      score, total, mode: quizMode,
    });
  }

  async function saveResume(data: Record<string, unknown>, mat: string, chap: string) {
    if (!userId) return;
    await supabase.from("prep_resumes").insert({
      user_id: userId, matiere: mat, chapitre: chap,
      contenu: JSON.stringify(data),
    });
  }

  /* ── QCM logic ── */
  function handleQcmAnswer(choice: string) {
    const q = qcmQuestions[qcmCurrent];
    const correct = choice === q.correct_answer;
    if (correct) setQcmScore(s => s + 1);
    setQcmAnswers(prev => ({ ...prev, [qcmCurrent]: choice }));
    setQcmShowAnswer(true);
  }

  function qcmNext() {
    if (qcmCurrent + 1 >= qcmQuestions.length) {
      saveQuizResult(qcmScore + (qcmAnswers[qcmCurrent] === qcmQuestions[qcmCurrent].correct_answer ? 1 : 0), qcmQuestions.length);
      setPhase("quiz_result");
    } else {
      setQcmCurrent(i => i + 1);
      setQcmShowAnswer(false);
    }
  }

  /* ── Rédaction logic ── */
  async function evaluateRedaction() {
    setRedactionEvaluating(true);
    try {
      const res = await fetch("/api/prep-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate",
          questions: redactionQs,
          answers: redactionAnswers,
          matiere: activeMat(),
          chapitre: activeChapitre(),
          examType,
          serie,
        }),
      });
      const data = await res.json();
      setRedactionFeedback(data.feedback ?? []);
      const total = redactionQs.length;
      const score = Math.round((data.feedback ?? []).reduce((sum: number, f: { score: number }) => sum + f.score, 0) / total * total / 10);
      await saveQuizResult(score, total);
      setPhase("quiz_result");
    } catch {
      setError("Erreur lors de l'évaluation");
    } finally {
      setRedactionEvaluating(false);
    }
  }

  /* ── Flashcard mastery ── */
  function toggleMaitrised(idx: number) {
    setFlashcards(prev => prev.map((c, i) => i === idx ? { ...c, maitrisee: !c.maitrisee } : c));
  }

  /* ── WhatsApp share ── */
  function shareWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  /* ── Render ── */
  const genLabel = genType === "flashcards" ? "Flashcards" : genType === "quiz" ? "Quiz" : "Résumé";

  // ── HOME ──
  if (phase === "home") return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">Générer avec l'IA</h1>
        <p className="text-on-surface-variant text-sm mt-1">Flashcards · Quiz · Résumé</p>
      </header>
      <div className="px-6 space-y-4">
        <p className="font-bold text-on-surface">Comment veux-tu travailler ?</p>
        <button
          onClick={() => { setMode("A"); setPhase("setup_a"); }}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/30 active:scale-[0.98] transition-all text-left">
          <span className="material-symbols-outlined text-[36px] text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
          <div>
            <p className="font-extrabold text-on-surface text-lg">J'ai un document</p>
            <p className="text-sm text-on-surface-variant mt-0.5">Photo de cours, PDF — l'IA génère depuis ton document</p>
          </div>
        </button>
        <button
          onClick={() => { setMode("B"); setPhase("setup_b"); }}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/30 active:scale-[0.98] transition-all text-left">
          <span className="material-symbols-outlined text-[36px] text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <div>
            <p className="font-extrabold text-on-surface text-lg">Je n'ai pas de document</p>
            <p className="text-sm text-on-surface-variant mt-0.5">Choisis ta matière et un thème — l'IA génère depuis le programme officiel</p>
          </div>
        </button>
      </div>
    </main>
  );

  // ── SETUP A ──
  if (phase === "setup_a") return (
    <main className="min-h-screen bg-surface text-on-surface">
      <PageHeader title="Depuis un document" onBack={() => setPhase("home")} />
      <div className="px-6 py-4 space-y-5">

        {/* Upload */}
        <div>
          <p className="font-bold text-sm mb-2">1. Upload ton document</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-36 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            {filePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filePreview} alt="preview" className="h-28 object-contain rounded-xl" />
            ) : fileA ? (
              <>
                <span className="material-symbols-outlined text-[36px] text-primary">description</span>
                <p className="text-sm font-semibold text-primary">{fileA.name}</p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[36px] text-primary">add_photo_alternate</span>
                <p className="text-sm text-on-surface-variant">Photo ou PDF</p>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Matière */}
        <div>
          <p className="font-bold text-sm mb-2">2. Matière</p>
          <div className="flex flex-wrap gap-2">
            {(matieres().length > 0 ? matieres() : ["Mathématiques", "Français", "SVT", "Anglais", "Histoire", "Philosophie"]).map(m => (
              <button key={m}
                onClick={() => setMatiereA(m)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${matiereA === m ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <GenTypeSelector genType={genType} setGenType={setGenType} quizMode={quizMode} setQuizMode={setQuizMode} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          disabled={!fileA || !matiereA}
          onClick={generate}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
          style={{ backgroundColor: "#FF6B00" }}>
          Générer {genLabel}
        </button>
      </div>
    </main>
  );

  // ── SETUP B ──
  if (phase === "setup_b") {
    const chaps = matiereB ? chapitres(matiereB) : [];
    const showFree = chapitreB === "Autre" || chaps.length <= 1;
    return (
      <main className="min-h-screen bg-surface text-on-surface">
        <PageHeader title="Depuis le programme" onBack={() => setPhase("home")} />
        <div className="px-6 py-4 space-y-5">

          {/* Matière */}
          <div>
            <p className="font-bold text-sm mb-2">1. Matière</p>
            <div className="flex flex-wrap gap-2">
              {matieres().map(m => (
                <button key={m}
                  onClick={() => { setMatiereB(m); setChapitreB(""); setThemeLibre(""); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${matiereB === m ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Chapitre */}
          {matiereB && chaps.length > 1 && (
            <div>
              <p className="font-bold text-sm mb-2">2. Chapitre <span className="font-normal text-on-surface-variant">(optionnel)</span></p>
              <select
                value={chapitreB}
                onChange={e => setChapitreB(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary">
                <option value="">— Tous les chapitres —</option>
                {chaps.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Thème libre */}
          {(showFree || chaps.length <= 1) && (
            <div>
              <p className="font-bold text-sm mb-2">Thème <span className="font-normal text-on-surface-variant">(optionnel)</span></p>
              <input
                value={themeLibre}
                onChange={e => setThemeLibre(e.target.value)}
                placeholder="Ex: Les limites, La photosynthèse, La guerre froide..."
                className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <GenTypeSelector genType={genType} setGenType={setGenType} quizMode={quizMode} setQuizMode={setQuizMode} />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            disabled={!matiereB}
            onClick={generate}
            className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#FF6B00" }}>
            Générer {genLabel}
          </button>
        </div>
      </main>
    );
  }

  // ── GENERATING ──
  if (phase === "generating") return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <div className="text-center">
        <p className="font-black text-xl text-on-surface">Génération en cours…</p>
        <p className="text-on-surface-variant text-sm mt-1">L'IA prépare ton {genLabel.toLowerCase()}</p>
      </div>
    </div>
  );

  // ── FLASHCARDS RESULT ──
  if (phase === "flashcards_result") {
    const card = flashcards[currentCard];
    const mastered = flashcards.filter(c => c.maitrisee).length;
    return (
      <main className="min-h-screen bg-surface text-on-surface flex flex-col">
        <PageHeader title={`Flashcards · ${activeMat()}`} onBack={() => setPhase("home")} />
        <div className="flex-1 px-6 py-4 space-y-4">

          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>{currentCard + 1} / {flashcards.length}</span>
            <span className="text-green-600 font-semibold">{mastered} maîtrisées</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${(mastered / flashcards.length) * 100}%` }} />
          </div>

          {/* Card */}
          <div
            onClick={() => setFlipped(f => !f)}
            className="rounded-2xl shadow-lg p-6 min-h-48 flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ backgroundColor: flipped ? "#1e293b" : "#FF6B00" }}>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{flipped ? "Réponse" : "Question"}</p>
            <p className="text-white font-bold text-lg text-center leading-relaxed">
              {flipped ? card.verso : card.recto}
            </p>
            <p className="text-xs text-white/50 mt-2">Toucher pour retourner</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => toggleMaitrised(currentCard)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] ${card.maitrisee ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-surface-container text-on-surface-variant border-2 border-outline-variant"}`}>
              {card.maitrisee ? "✓ Maîtrisée" : "Je maîtrise"}
            </button>
            <button
              onClick={() => { setCurrentCard(i => (i + 1) % flashcards.length); setFlipped(false); }}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-surface-container text-on-surface border-2 border-outline-variant active:scale-[0.97] transition-all">
              ↻ Suivante
            </button>
          </div>

          <button
            onClick={() => setCurrentCard(i => Math.max(0, i - 1))}
            disabled={currentCard === 0}
            className="w-full py-2.5 rounded-xl text-sm text-on-surface-variant disabled:opacity-30 bg-surface-container active:scale-[0.97]">
            ← Précédente
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => shareWhatsApp(`J'ai révisé ${activeMat()} avec ${flashcards.length} flashcards sur GSN Prep ! Prépare ton ${examType} → gsn-app.vercel.app`)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-[#25D366] active:scale-[0.97] transition-transform">
            <span className="text-lg">📱</span> Partager sur WhatsApp
          </button>
        </div>

        <VideoSection videos={videos} videoPlaying={videoPlaying} setVideoPlaying={setVideoPlaying} />
      </main>
    );
  }

  // ── QUIZ QCM ──
  if (phase === "quiz_qcm") {
    const q = qcmQuestions[qcmCurrent];
    if (!q) return null;
    const selected = qcmAnswers[qcmCurrent];
    return (
      <main className="min-h-screen bg-surface text-on-surface flex flex-col">
        <PageHeader title={`Quiz QCM · ${activeMat()}`} onBack={() => setPhase("home")} />
        <div className="flex-1 px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-on-surface-variant">{qcmCurrent + 1} / {qcmQuestions.length}</span>
            <span className="text-sm font-bold text-green-600">Score : {qcmScore}</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${((qcmCurrent + 1) / qcmQuestions.length) * 100}%`, backgroundColor: "#FF6B00" }} />
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <p className="font-bold text-on-surface leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-2.5">
            {q.choices.map(choice => {
              let style = "border-outline-variant bg-surface-container-lowest text-on-surface";
              if (qcmShowAnswer) {
                if (choice === q.correct_answer) style = "border-green-400 bg-green-50 text-green-800";
                else if (choice === selected) style = "border-red-400 bg-red-50 text-red-800";
              } else if (choice === selected) {
                style = "border-primary bg-primary/5 text-primary";
              }
              return (
                <button key={choice}
                  onClick={() => !qcmShowAnswer && handleQcmAnswer(choice)}
                  disabled={qcmShowAnswer}
                  className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all ${style}`}>
                  {choice}
                </button>
              );
            })}
          </div>

          {qcmShowAnswer && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm font-semibold">Explication</p>
              <p className="text-blue-700 text-sm mt-1">{q.explanation}</p>
            </div>
          )}

          {qcmShowAnswer && (
            <button
              onClick={qcmNext}
              className="w-full py-4 font-black text-white rounded-2xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: "#FF6B00" }}>
              {qcmCurrent + 1 >= qcmQuestions.length ? "Voir le résultat" : "Question suivante →"}
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── QUIZ RÉDACTION ──
  if (phase === "quiz_redaction") return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">
      <PageHeader title={`Quiz Rédaction · ${activeMat()}`} onBack={() => setPhase("home")} />
      <div className="flex-1 px-6 py-4 space-y-5">
        <p className="text-on-surface-variant text-sm">Réponds à chaque question, puis soumets pour être évalué par l'IA.</p>
        {redactionQs.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <p className="font-bold text-on-surface">Q{i + 1}. {q.question}</p>
            <textarea
              value={redactionAnswers[i] ?? ""}
              onChange={e => setRedactionAnswers(prev => ({ ...prev, [i]: e.target.value }))}
              placeholder="Écris ta réponse ici..."
              className="w-full min-h-[150px] px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary resize-y"
            />
          </div>
        ))}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={evaluateRedaction}
          disabled={redactionEvaluating || redactionQs.some((_, i) => !redactionAnswers[i]?.trim())}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: "#FF6B00" }}>
          {redactionEvaluating ? "Évaluation en cours…" : "Soumettre et évaluer"}
        </button>
      </div>
    </main>
  );

  // ── QUIZ RESULT ──
  if (phase === "quiz_result") {
    const isRedaction = quizMode === "redaction";
    const total = isRedaction ? redactionQs.length : qcmQuestions.length;
    const finalScore = isRedaction
      ? Math.round(redactionFeedback.reduce((s, f) => s + f.score, 0) / total * 10)
      : qcmScore;
    const pct = Math.round((finalScore / total) * 100);

    return (
      <main className="min-h-screen bg-surface text-on-surface flex flex-col">
        <PageHeader title={`Résultat · ${activeMat()}`} onBack={() => setPhase("home")} />
        <div className="flex-1 px-6 py-4 space-y-4">

          <div className="rounded-2xl p-6 text-center text-white" style={{ backgroundColor: pct >= 60 ? "#22c55e" : pct >= 40 ? "#f97316" : "#ef4444" }}>
            <p className="text-5xl font-black">{finalScore}/{total}</p>
            <p className="text-lg font-semibold opacity-90 mt-1">{pct}% · {activeMat()}</p>
          </div>

          {isRedaction && redactionFeedback.length > 0 && (
            <div className="space-y-3">
              {redactionFeedback.map((f, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
                  <p className="font-bold text-on-surface text-sm">Q{i + 1} · {f.score}/10</p>
                  <p className="text-on-surface-variant text-sm mt-1">{f.feedback}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => shareWhatsApp(`J'ai obtenu ${finalScore}/${total} en ${activeMat()} sur GSN Prep ! Prépare ton ${examType} avec moi → gsn-app.vercel.app`)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-[#25D366] active:scale-[0.97] transition-transform">
            <span className="text-lg">📱</span> Partager sur WhatsApp
          </button>

          <button
            onClick={() => setPhase("home")}
            className="w-full py-4 font-black text-white rounded-2xl active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#FF6B00" }}>
            Nouvelle génération
          </button>
        </div>

        <VideoSection videos={videos} videoPlaying={videoPlaying} setVideoPlaying={setVideoPlaying} />
      </main>
    );
  }

  // ── RESUME RESULT ──
  if (phase === "resume_result" && resume) {
    const r = resume as {
      titre?: string; resume?: string;
      points_cles?: string[]; formules?: string[];
      definitions?: Array<{ terme: string; definition: string }>;
      conseils_exam?: string[];
    };
    return (
      <main className="min-h-screen bg-surface text-on-surface flex flex-col">
        <PageHeader title={`Résumé · ${activeMat()}`} onBack={() => setPhase("home")} />
        <div className="flex-1 px-6 py-4 space-y-4">

          {r.titre && <h2 className="text-xl font-black text-on-surface">{r.titre}</h2>}

          {r.resume && (
            <Section title="Notions essentielles" icon="description">
              <p className="text-on-surface text-sm leading-relaxed">{r.resume}</p>
            </Section>
          )}

          {r.points_cles && r.points_cles.length > 0 && (
            <Section title="Points clés" icon="star">
              <ul className="space-y-1.5">
                {r.points_cles.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="text-primary font-bold mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {r.formules && r.formules.length > 0 && (
            <Section title="Définitions importantes" icon="function">
              <ul className="space-y-1">
                {r.formules.map((f, i) => (
                  <li key={i} className="text-sm font-mono bg-surface-container p-2 rounded-lg text-on-surface">{f}</li>
                ))}
              </ul>
            </Section>
          )}

          {r.definitions && r.definitions.length > 0 && (
            <Section title="Définitions" icon="book">
              <div className="space-y-2">
                {r.definitions.map((d, i) => (
                  <div key={i}>
                    <p className="text-sm font-bold text-on-surface">{d.terme}</p>
                    <p className="text-sm text-on-surface-variant">{d.definition}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {r.conseils_exam && r.conseils_exam.length > 0 && (
            <Section title="Ce qui tombe souvent aux examens" icon="emoji_events">
              <ul className="space-y-1.5">
                {r.conseils_exam.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                    <span className="text-amber-500 font-bold">⚡</span> {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <button
            onClick={() => shareWhatsApp(`Je viens de créer un résumé de ${activeMat()} avec GSN Prep ! Prépare ton ${examType} avec moi → gsn-app.vercel.app`)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-[#25D366] active:scale-[0.97] transition-transform">
            <span className="text-lg">📱</span> Partager sur WhatsApp
          </button>

          <button
            onClick={() => setPhase("home")}
            className="w-full py-4 font-black text-white rounded-2xl active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#FF6B00" }}>
            Nouvelle génération
          </button>
        </div>

        <VideoSection videos={videos} videoPlaying={videoPlaying} setVideoPlaying={setVideoPlaying} />
      </main>
    );
  }

  return null;
}

/* ─── Sub-components ───────────────────────────────────── */

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 className="font-bold text-on-surface truncate">{title}</h1>
    </header>
  );
}

function GenTypeSelector({
  genType, setGenType, quizMode, setQuizMode,
}: {
  genType: GenType; setGenType: (t: GenType) => void;
  quizMode: QuizMode; setQuizMode: (m: QuizMode) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-bold text-sm">Que veux-tu générer ?</p>
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: "flashcards", icon: "style",       label: "Flashcards" },
          { key: "quiz",       icon: "quiz",         label: "Quiz"       },
          { key: "resume",     icon: "auto_stories", label: "Résumé"     },
        ] as const).map(t => (
          <button key={t.key}
            onClick={() => setGenType(t.key)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${genType === t.key ? "border-primary bg-primary/5" : "border-outline-variant"}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ color: genType === t.key ? "#FF6B00" : undefined, fontVariationSettings: genType === t.key ? "'FILL' 1" : "'FILL' 0" }}>
              {t.icon}
            </span>
            <span className={`text-xs font-bold ${genType === t.key ? "text-primary" : "text-on-surface-variant"}`}>{t.label}</span>
          </button>
        ))}
      </div>
      {genType === "quiz" && (
        <div className="flex gap-2">
          {([
            { key: "qcm",        label: "QCM" },
            { key: "redaction",  label: "Rédaction" },
          ] as const).map(m => (
            <button key={m.key}
              onClick={() => setQuizMode(m.key)}
              className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${quizMode === m.key ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-on-surface-variant"}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p className="font-bold text-on-surface text-sm">{title}</p>
      </div>
      {children}
    </div>
  );
}

function VideoSection({
  videos, videoPlaying, setVideoPlaying,
}: {
  videos: YoutubeVideo[];
  videoPlaying: string | null;
  setVideoPlaying: (id: string | null) => void;
}) {
  if (videos.length === 0) return null;
  return (
    <div className="px-6 pb-6 space-y-3">
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Vidéos recommandées</p>
      {videos.map(v => (
        <div key={v.videoId} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
          {videoPlaying === v.videoId ? (
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex gap-3 p-3 items-center">
              <div className="relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden cursor-pointer" onClick={() => setVideoPlaying(v.videoId)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-white text-xl">▶</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface line-clamp-2">{v.title}</p>
                <button
                  onClick={() => setVideoPlaying(v.videoId)}
                  className="mt-1 text-xs font-bold text-primary underline">
                  Regarder
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
