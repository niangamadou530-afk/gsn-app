"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres, getInfoMatiere } from "@/data/programmes";
import { getCompetences } from "@/data/competences";
import { t } from "@/lib/i18n";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { sounds } from "@/lib/soundEffects";
import { SoundToggle } from "@/components/SoundToggle";
import { compressImageClient } from "@/lib/imageCompress";
import { VideoCard, VideoCardSkeleton, sortVideosByStudentSerie } from "@/components/VideoCard";

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
  | "resume_result"
  | "mes_flashcards"
  | "mes_quiz"
  | "mes_resumes";

interface SavedFlashcard { id: string; matiere: string; chapitre: string | null; recto: string; verso: string; maitrisee: boolean; }
interface SavedQuizResult { id: string; matiere: string; chapitre: string | null; score: number; total: number; mode: string; created_at: string; }
interface SavedResume { id: string; matiere: string | null; chapitre: string | null; contenu: string; created_at: string; }

interface Flashcard { recto: string; verso: string; maitrisee?: boolean; }
interface QcmQuestion {
  id: number; question: string;
  choices: string[]; correct_answer: string;
  explanation: string; difficulty: string;
}
interface RedactionQuestion { id: number; question: string; }
interface YoutubeVideo { videoId: string; title: string; thumbnail: string; }

/* ─── Component ─────────────────────────────────────────── */

function GenererPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Profile
  const [examType, setExamType] = useState("");
  const [serie, setSerie]       = useState("");
  const [prenom, setPrenom]     = useState("");
  const [userId, setUserId]     = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("");

  // Mode A
  const [fileA, setFileA]                         = useState<File | null>(null);
  const [filePreview, setFilePreview]             = useState("");
  const [fileCompressedB64, setFileCompressedB64] = useState("");
  const [compressedInfo, setCompressedInfo]       = useState("");
  const [textDirectA, setTextDirectA]             = useState("");
  const [inputModeA, setInputModeA]               = useState<"file" | "text">("file");
  const [matiereA, setMatiereA]                   = useState("");

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
  const [videosLoading, setVideosLoading] = useState(false);

  const [phase, setPhase]     = useState<Phase>("home");
  const [error, setError]     = useState("");
  const [mode, setMode]       = useState<"A" | "B" | null>(null);
  const [flashSaved, setFlashSaved]   = useState(false);
  const [resumeSaved, setResumeSaved] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sections sauvegardées
  const [savedFlashcards, setSavedFlashcards] = useState<SavedFlashcard[]>([]);
  const [savedQuiz,       setSavedQuiz]       = useState<SavedQuizResult[]>([]);
  const [savedResumes,    setSavedResumes]    = useState<SavedResume[]>([]);
  const [libLoading, setLibLoading]           = useState(false);
  const [libDeck, setLibDeck]                 = useState<SavedFlashcard[]>([]);
  const [libDeckTitle, setLibDeckTitle]       = useState("");
  const [libCardIdx, setLibCardIdx]           = useState(0);
  const [libCardFlipped, setLibCardFlipped]   = useState(false);
  const [expandedResume, setExpandedResume]   = useState<string | null>(null);

  async function loadLibrary(section: "mes_flashcards" | "mes_quiz" | "mes_resumes") {
    if (!userId) return;
    setLibLoading(true);
    if (section === "mes_flashcards") {
      const { data } = await supabase.from("flashcards").select("id, matiere, chapitre, recto, verso, maitrisee").eq("user_id", userId).order("created_at", { ascending: false });
      setSavedFlashcards((data ?? []) as SavedFlashcard[]);
    } else if (section === "mes_quiz") {
      const { data } = await supabase.from("quiz_results").select("id, matiere, chapitre, score, total, mode, created_at").eq("user_id", userId).order("created_at", { ascending: false });
      setSavedQuiz((data ?? []) as SavedQuizResult[]);
    } else {
      const { data } = await supabase.from("prep_resumes").select("id, matiere, chapitre, contenu, created_at").eq("user_id", userId).order("created_at", { ascending: false });
      setSavedResumes((data ?? []) as SavedResume[]);
    }
    setLibLoading(false);
    setPhase(section);
  }

  async function toggleFlashMaitrisee(id: string, current: boolean) {
    if (!userId) return;
    await supabase.from("flashcards").update({ maitrisee: !current }).eq("id", id).eq("user_id", userId);
    setSavedFlashcards(prev => prev.map(f => f.id === id ? { ...f, maitrisee: !current } : f));
  }

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = setTimeout(() => setRetrySeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds]);

  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        if (isPreviewEnvironment()) {
          setIsPreview(true);
          setExamType("BAC");
          setSerie("S2");
          setPrenom("Amadou (Démo)");
          setUserId("preview-user");
          const pMat  = searchParams.get("matiere");
          const pChap = searchParams.get("chapitre");
          const pType = searchParams.get("type");
          const pView = searchParams.get("view");
          if (pView === "mes_flashcards" || pView === "mes_quiz" || pView === "mes_resumes") {
            loadLibrary(pView);
          } else if (pType === "quiz" || pType === "flashcards" || pType === "resume") {
            setGenType(pType as GenType);
            setMode("B");
            setPhase("setup_b");
            if (pMat) {
              setMatiereB(pMat);
              if (pChap) setChapitreB(pChap);
            }
          } else if (pMat) {
            setMatiereB(pMat);
            if (pChap) setChapitreB(pChap);
            setMode("B");
            setPhase("setup_b");
          }
          return;
        }
        router.push("/login");
        return;
      }
      setUserId(user.id);
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAuthToken(session?.access_token ?? "");
      });
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

          // Pre-fill from programme page or quiz/flashcards deep-link
          const pMat  = searchParams.get("matiere");
          const pChap = searchParams.get("chapitre");
          const pType = searchParams.get("type");
          const pView = searchParams.get("view");
          if (pView === "mes_flashcards" || pView === "mes_quiz" || pView === "mes_resumes") {
            loadLibrary(pView);
          } else if (pType === "quiz" || pType === "flashcards" || pType === "resume") {
            setGenType(pType as GenType);
            setMode("B");
            setPhase("setup_b");
            if (pMat) {
              setMatiereB(pMat);
              if (pChap) setChapitreB(pChap);
            }
          } else if (pMat) {
            setMatiereB(pMat);
            if (pChap) setChapitreB(pChap);
            setMode("B");
            setPhase("setup_b");
          }
        });
    }).catch(() => {
      if (isPreviewEnvironment()) {
        setIsPreview(true);
        setExamType("BAC");
        setSerie("S2");
        setPrenom("Amadou (Démo)");
      }
    });
  }, [router, searchParams]);

  function loadSampleQuiz() {
    setGenType("quiz");
    setMatiereB("Mathématiques");
    setQcmQuestions([
      {
        id: 1,
        question: "Soit f(x) = ln(x) / x définie sur ]0, +∞[. Quelle est la limite de f(x) quand x tend vers +∞ ?",
        choices: ["0", "+∞", "1", "-∞"],
        correct_answer: "0",
        explanation: "D'après les croissances comparées au programme officiel du Baccalauréat, lim (ln x / x) = 0 quand x -> +∞.",
        difficulty: "Moyen",
      },
      {
        id: 2,
        question: "Dans le plan complexe, quel est le module du nombre complexe z = 1 + i√3 ?",
        choices: ["2", "4", "√2", "1"],
        correct_answer: "2",
        explanation: "|z| = √(1² + (√3)²) = √(1 + 3) = √4 = 2.",
        difficulty: "Facile",
      },
      {
        id: 3,
        question: "Quelle est la dérivée de la fonction g(x) = e^(2x + 1) ?",
        choices: ["2 e^(2x + 1)", "e^(2x + 1)", "2x e^(2x + 1)", "(2x + 1) e^(2x)"],
        correct_answer: "2 e^(2x + 1)",
        explanation: "Formule de dérivation d'une exponentielle composée : (e^u)' = u' * e^u.",
        difficulty: "Facile",
      }
    ]);
    setQcmAnswers({});
    setQcmCurrent(0);
    setQcmShowAnswer(false);
    setQcmScore(0);
    setPhase("quiz_qcm");
  }

  function loadSampleFlashcards() {
    setGenType("flashcards");
    setMatiereB("Sciences Physiques");
    setFlashcards([
      { recto: "Quelle est l'expression de l'énergie cinétique d'un solide en translation ?", verso: "Ec = (1/2) * m * v² (avec m en kg, v en m/s et Ec en Joules)." },
      { recto: "Énoncer la 2ème loi de Newton (Théorème du centre d'inertie).", verso: "Dans un référentiel galiléen, la somme vectorielle des forces extérieures est égale au produit de la masse par l'accélération : Σ F_ext = m * a_G." },
      { recto: "Quelle est la relation entre le pH et la concentration en ions oxonium [H3O+] ?", verso: "pH = -log([H3O+]) avec [H3O+] en mol/L." }
    ]);
    setCurrentCard(0);
    setFlipped(false);
    setPhase("flashcards_result");
  }

  function loadSampleResume() {
    setGenType("resume");
    setMatiereB("Philosophie");
    setResume({
      titre: "Fiche de Révision : La Conscience et l'Inconscient (BAC)",
      introduction: "Notion du programme officiel : la conscience suffit-elle à définir l'homme et l'ensemble de son activité psychique ?",
      points_cles: [
        "Le Cogito cartésien : 'Je pense donc je suis' (René Descartes pose la conscience comme fondement indubitable de l'existence).",
        "La critique marxiste et nietzschéenne : Les déterminismes sociaux et corporels qui échappent à la pleine conscience.",
        "L'hypothèse freudienne de l'inconscient : Les trois instances psychiques (Ça, Moi, Surmoi) et la résistance."
      ],
      formules_ou_citations: [
        "« Le moi n'est pas maître dans sa propre maison. » — Sigmund Freud",
        "« L'homme est condamné à être libre. » — Jean-Paul Sartre"
      ],
      conseil_epreuve: "Pour la dissertation au Bac, veillez à toujours problématiser la tension entre liberté du sujet conscient et déterminismes inconscients."
    });
    setPhase("resume_result");
  }

  /* ── Helpers ── */
  function matieres(): string[] { return getMatieres(examType, serie); }
  function chapitres(m: string): string[] { return getChapitres(examType, serie, m); }

  function activeMat(): string { return mode === "A" ? matiereA : matiereB; }
  function activeChapitre(): string {
    if (mode === "A") return "";
    return chapitreB === "Autre" || chapitreB === "" ? themeLibre : chapitreB;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileA(f);
    setError("");
    if (f.type.startsWith("image/")) {
      const res = await compressImageClient(f);
      setFilePreview(res.previewUrl);
      setFileCompressedB64(res.base64);
      const origKb = Math.round(res.originalSizeBytes / 1024);
      const compKb = Math.round(res.compressedSizeBytes / 1024);
      setCompressedInfo(`Photo optimisée : ${compKb} Ko (au lieu de ${origKb} Ko) pour un envoi fluide`);
    } else {
      setFilePreview("");
      setFileCompressedB64("");
      setCompressedInfo("");
    }
  }

  function handleRemoveFileA() {
    setFileA(null);
    setFilePreview("");
    setFileCompressedB64("");
    setCompressedInfo("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function fetchVideos(matiere: string, chapitre: string) {
    setVideosLoading(true);
    try {
      const res = await fetch("/api/prep-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matiere, chapitre, examType }),
      });
      if (!res.ok) {
        setVideosLoading(false);
        return;
      }
      const data = await res.json();
      setVideos(data.videos ?? []);
    } catch { /* silent */ } finally {
      setVideosLoading(false);
    }
  }

  /* ── Generate ── */
  async function generate() {
    setPhase("generating");
    setError("");
    setFlashSaved(false);
    const mat = activeMat();
    const chap = activeChapitre();

    try {
      let body: Record<string, unknown>;

      if (mode === "A") {
        if (inputModeA === "text" && textDirectA.trim()) {
          body = {
            mode: "document",
            type: genType,
            quizMode,
            matiere: mat,
            text: textDirectA.trim(),
            examType,
            serie,
          };
        } else if (fileA) {
          if (fileA.type.startsWith("image/")) {
            let b64 = fileCompressedB64;
            if (!b64) {
              const comp = await compressImageClient(fileA);
              b64 = comp.base64;
            }
            body = {
              mode: "document",
              type: genType,
              quizMode,
              matiere: mat,
              fileBase64: b64,
              fileType: "image/jpeg",
              fileName: fileA.name,
              examType,
              serie,
            };
          } else {
            const ab = await fileA.arrayBuffer();
            const b64 = Buffer.from(ab).toString("base64");
            body = {
              mode: "document",
              type: genType,
              quizMode,
              matiere: mat,
              fileBase64: b64,
              fileType: fileA.type,
              fileName: fileA.name,
              examType,
              serie,
            };
          }
        } else {
          setError("Veuillez sélectionner un fichier ou coller le texte de votre cours.");
          setPhase("setup_a");
          return;
        }
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
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(body),
      });

      if (res.status === 503 || res.status === 429) {
        setError("Beaucoup d'élèves révisent en ce moment ! Patiente quelques secondes et réessaie.");
        setRetrySeconds(5);
        setPhase(mode === "A" ? "setup_a" : "setup_b");
        return;
      }

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        const safeMsg = typeof e.error === "string" && !e.error.includes("Groq") && !e.error.includes("502") && !e.error.includes("JSON")
          ? e.error
          : "Oups ! La génération a rencontré un petit contretemps. Réessaie dans un instant.";
        throw new Error(safeMsg);
      }

      const data = await res.json();

      sounds.playGenerationComplete();

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
        const texte = (data.texte as string) ?? "";
        setResume({ texte });
        await saveResume(texte, mat, chap);
        await fetchVideos(mat, chap);
        setPhase("resume_result");
      }
    } catch (err: unknown) {
      console.error("[prep/generer error]", err);
      const msg = err instanceof Error && err.message
        ? err.message
        : "Oups ! Nous n'avons pas pu générer ton contenu pour le moment. Ne t'inquiète pas, ta session et tes crédits sont préservés !";
      setError(msg);
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
    setFlashSaved(true);
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

  async function saveResume(texte: string, mat: string, chap: string) {
    if (!texte || !userId) {
      setError(t("prep.generer.error.saveResumeBlocked", { texte: String(!!texte), userId: String(!!userId) }));
      return;
    }
    const { error } = await supabase.from("prep_resumes").insert({
      user_id: userId, matiere: mat, chapitre: chap, contenu: texte,
    });
    if (error) {
      console.warn("prep_resumes save warning:", error.message);
      setError("Ton résumé est prêt ! La sauvegarde automatique a rencontré un léger contretemps.");
    } else setResumeSaved(true);
  }

  /* ── QCM logic ── */
  function handleQcmAnswer(choice: string) {
    const q = qcmQuestions[qcmCurrent];
    const correct = choice === q.correct_answer;
    if (correct) {
      sounds.playCorrect();
      setQcmScore(s => s + 1);
    } else {
      sounds.playWrong();
    }
    setQcmAnswers(prev => ({ ...prev, [qcmCurrent]: choice }));
    setQcmShowAnswer(true);
  }

  function qcmNext() {
    if (qcmCurrent + 1 >= qcmQuestions.length) {
      sounds.playQuizFinish();
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
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
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
      sounds.playQuizFinish();
      await saveQuizResult(score, total);
      setPhase("quiz_result");
    } catch {
      setError(t("prep.generer.error.evaluation"));
    } finally {
      setRedactionEvaluating(false);
    }
  }

  /* ── Flashcard mastery ── */
  function toggleMaitrised(idx: number) {
    const nextMastered = !flashcards[idx]?.maitrisee;
    if (nextMastered) {
      sounds.playMastery();
    } else {
      sounds.playReview();
    }
    setFlashcards(prev => prev.map((c, i) => i === idx ? { ...c, maitrisee: nextMastered } : c));
  }

  /* ── WhatsApp share ── */
  function shareWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  /* ── Render ── */
  const genLabel = genType === "flashcards" ? t("prep.generer.genLabel.flashcards") : genType === "quiz" ? t("prep.generer.genLabel.quiz") : t("prep.generer.genLabel.resume");

  // ── HOME ──
  if (phase === "home") return (
    <main className="w-full min-h-screen text-slate-900">
      <header className="px-6 pt-8 pb-4">
        {isPreview && <PreviewBanner />}
        <h1 className="text-2xl font-extrabold">{t("prep.generer.home.title")}</h1>
        <p className="text-slate-500 text-sm mt-1">{t("prep.generer.home.subtitle")}</p>
      </header>
      <div className="px-6 space-y-4 pb-8">
        {isPreview && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#005bbf] block">
              Tests rapides de l&apos;interface (Mode Démo)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={loadSampleQuiz}
                className="px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-[#005bbf] hover:bg-blue-50 text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                <span>Démo Joueur Quiz</span>
              </button>
              <button
                type="button"
                onClick={loadSampleFlashcards}
                className="px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-[#005bbf] hover:bg-blue-50 text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">style</span>
                <span>Démo Flashcards</span>
              </button>
              <button
                type="button"
                onClick={loadSampleResume}
                className="px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-[#005bbf] hover:bg-blue-50 text-left flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                <span>Démo Fiche Résumé</span>
              </button>
            </div>
          </div>
        )}
        <p className="font-bold text-slate-900">{t("prep.generer.home.howToWork")}</p>
        <button
          onClick={() => { setMode("A"); setPhase("setup_a"); }}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-white border border-slate-200/80 shadow-xs shadow-sm hover:border-[#005bbf]/30 active:scale-[0.98] transition-all text-left">
          <span className="material-symbols-outlined text-[36px] text-[#005bbf] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
          <div>
            <p className="font-extrabold text-slate-900 text-lg">{t("prep.generer.home.optionA.title")}</p>
            <p className="text-sm text-slate-500 mt-0.5">{t("prep.generer.home.optionA.desc")}</p>
          </div>
        </button>
        <button
          onClick={() => { setMode("B"); setPhase("setup_b"); }}
          className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-transparent bg-white border border-slate-200/80 shadow-xs shadow-sm hover:border-[#005bbf]/30 active:scale-[0.98] transition-all text-left">
          <span className="material-symbols-outlined text-[36px] text-[#005bbf] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <div>
            <p className="font-extrabold text-slate-900 text-lg">{t("prep.generer.home.optionB.title")}</p>
            <p className="text-sm text-slate-500 mt-0.5">{t("prep.generer.home.optionB.desc")}</p>
          </div>
        </button>

        {/* Bibliothèque */}
        <div className="pt-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t("prep.generer.home.savedContent")}</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "mes_flashcards", icon: "style",        label: t("prep.generer.home.myFlashcards"), color: "#6366f1" },
              { key: "mes_quiz",       icon: "quiz",          label: t("prep.generer.home.myQuiz"),       color: "#10b981" },
              { key: "mes_resumes",    icon: "auto_stories",  label: t("prep.generer.home.myResumes"),    color: "#f59e0b" },
            ] as const).map(s => (
              <button key={s.key}
                onClick={() => loadLibrary(s.key)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs shadow-sm active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[28px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <span className="text-[11px] font-semibold text-slate-900 text-center leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );

  // ── SETUP A ──
  if (phase === "setup_a") {
    const isSetupAValid =
      !!matiereA &&
      ((inputModeA === "file" && !!fileA) ||
        (inputModeA === "text" && textDirectA.trim().length >= 25)) &&
      retrySeconds === 0;

    return (
      <main className="w-full min-h-screen text-slate-900">
        <PageHeader title={t("prep.generer.setupA.headerTitle")} onBack={() => setPhase("home")} />
        <div className="px-6 py-4 space-y-5">

          {/* Onglets Type de saisie (Fichier vs Texte collé) */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 gap-1">
            <button
              type="button"
              onClick={() => { setInputModeA("file"); setError(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                inputModeA === "file" ? "bg-white text-slate-900 shadow-xs shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
              <span>Photo ou PDF</span>
            </button>
            <button
              type="button"
              onClick={() => { setInputModeA("text"); setError(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                inputModeA === "text" ? "bg-white text-slate-900 shadow-xs shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Coller du texte</span>
            </button>
          </div>

          {/* Saisie par Fichier / Photo */}
          {inputModeA === "file" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-slate-900">{t("prep.generer.setupA.step1")}</p>
                <span className="text-[11px] text-slate-500 font-medium">Image (JPEG, PNG) ou PDF</span>
              </div>

              {/* Boîte de conseils pour la photo */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950">
                <span className="material-symbols-outlined text-[18px] text-[#005bbf] shrink-0 mt-0.5">lightbulb</span>
                <div className="space-y-0.5">
                  <p className="font-bold">Conseils pour une analyse précise :</p>
                  <p className="text-blue-900 leading-relaxed">
                    Photo bien cadrée, nette et lisible, bien éclairée à plat sans ombre ni reflet. Pour un PDF, privilégie 1 à 2 pages de cours ciblées. <strong>Évite de photographier ton nom ou tes informations personnelles.</strong>
                  </p>
                </div>
              </div>

              {fileA ? (
                <div className="p-4 bg-white rounded-2xl border-2 border-[#005bbf]/30 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {filePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={filePreview} alt="Aperçu" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[32px]">picture_as_pdf</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{fileA.name}</p>
                        <p className="text-xs text-slate-500">
                          {fileA.type.startsWith("image/") ? "Photo de cours" : "Document PDF"}
                        </p>
                        {compressedInfo && (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{compressedInfo}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">sync</span>
                      <span>Changer / Reprendre</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFileA}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 rounded-2xl border-2 border-dashed border-[#005bbf]/40 bg-blue-50/40 flex flex-col items-center justify-center gap-2 hover:bg-blue-50/70 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[36px] text-[#005bbf]">add_photo_alternate</span>
                  <p className="text-sm font-semibold text-slate-800">{t("prep.generer.setupA.uploadHint")}</p>
                  <p className="text-xs text-slate-500">Clique pour choisir une photo ou un document PDF</p>
                  <p className="text-[11px] text-slate-400 font-medium">Évite de photographier ton nom ou tes informations personnelles</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            /* Saisie de texte collé directement */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-slate-900">Colle le contenu de ton cours</p>
                <span className={`text-[11px] font-semibold ${textDirectA.length > 6000 ? "text-amber-600 font-bold" : "text-slate-500"}`}>
                  {textDirectA.length.toLocaleString("fr-FR")} / 6 000 car. conseillés
                </span>
              </div>
              <textarea
                rows={6}
                value={textDirectA}
                onChange={(e) => { setTextDirectA(e.target.value); setError(""); }}
                placeholder="Colle ici le texte de ton cours, tes notes ou l'énoncé d'un chapitre (1 à 2 pages conseillées)..."
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#005bbf] focus:ring-1 focus:ring-[#005bbf]/20 outline-none leading-relaxed"
              />
              {textDirectA.length > 6000 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">warning</span>
                  <p>
                    Ce texte dépasse 6 000 caractères. Deux options s&apos;offrent à toi sans consommer de crédit : <strong>choisir une partie précise</strong> (un seul chapitre) ou <strong>découper ton cours</strong> en plusieurs fiches distinctes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matière */}
          <div>
            <p className="font-bold text-sm mb-2">{t("prep.generer.setupA.matiereLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {(matieres().length > 0 ? matieres() : ["Mathématiques", "Français", "SVT", "Anglais", "Histoire", "Philosophie"]).map(m => (
                <button
                  key={m}
                  onClick={() => setMatiereA(m)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                    matiereA === m ? "border-[#005bbf] bg-blue-50 text-[#005bbf]" : "border-slate-200 text-slate-500"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <GenTypeSelector genType={genType} setGenType={setGenType} quizMode={quizMode} setQuizMode={setQuizMode} />

          <FriendlyErrorBanner
            error={error}
            onRetry={generate}
            disabled={!isSetupAValid}
          />

          <button
            disabled={!isSetupAValid}
            onClick={generate}
            className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#FF6B00" }}
          >
            {retrySeconds > 0 ? t("prep.generer.generateButtonRetry", { seconds: retrySeconds }) : t("prep.generer.generateButton", { genLabel })}
          </button>
        </div>
      </main>
    );
  }

  // ── SETUP B ──
  if (phase === "setup_b") {
    const chaps = matiereB ? chapitres(matiereB) : [];
    const showFree = chapitreB === "Autre" || chaps.length <= 1;
    return (
      <main className="w-full min-h-screen text-slate-900">
        <PageHeader title={t("prep.generer.setupB.headerTitle")} onBack={() => setPhase("home")} />
        <div className="px-6 py-4 space-y-5">

          {/* Matière */}
          <div>
            <p className="font-bold text-sm mb-2">{t("prep.generer.setupB.matiereLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {matieres().map(m => (
                <button key={m}
                  onClick={() => { setMatiereB(m); setChapitreB(""); setThemeLibre(""); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${matiereB === m ? "border-[#005bbf] bg-blue-50 text-[#005bbf]" : "border-slate-200 text-slate-500"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Info matière — BFEM uniquement (BAC : hidden: true) */}
          {matiereB && (() => {
            const info = getInfoMatiere(examType, serie, matiereB);
            if (!info || info.hidden) return null;
            const nbChapitres = info.chapitres.filter(c => c !== "Autre").length;
            return (
              <div className="flex gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-[#005bbf]/20 text-sm">
                <div className="flex-1 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">{t("prep.generer.setupB.coefficient")}</p>
                  <p className="font-black text-[#005bbf] text-lg">{info.coefficient}</p>
                </div>
                <div className="w-px bg-blue-100" />
                <div className="flex-1 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">{t("prep.generer.setupB.duration")}</p>
                  <p className="font-black text-[#005bbf] text-lg">{info.duree_epreuve}</p>
                </div>
                <div className="w-px bg-blue-100" />
                <div className="flex-1 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">{t("prep.generer.setupB.chapters")}</p>
                  <p className="font-black text-[#005bbf] text-lg">{nbChapitres}</p>
                </div>
              </div>
            );
          })()}

          {/* Chapitre */}
          {matiereB && chaps.length > 1 && (
            <div>
              <p className="font-bold text-sm mb-2">{t("prep.generer.setupB.chapterLabel")} <span className="font-normal text-slate-500">{t("prep.generer.optionalSuffix")}</span></p>
              <select
                value={chapitreB}
                onChange={e => setChapitreB(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white border border-slate-200/80 shadow-xs text-slate-900 focus:outline-none focus:border-[#005bbf]">
                <option value="">{t("prep.generer.setupB.allChapters")}</option>
                {chaps.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Compétences exigibles */}
          {matiereB && chapitreB && chapitreB !== "Autre" && (() => {
            const comps = getCompetences(examType, serie, chapitreB);
            if (comps.length === 0) return null;
            return (
              <div className="rounded-2xl border border-[#005bbf]/20 bg-blue-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50">
                  <span className="text-base">📋</span>
                  <p className="font-bold text-[#005bbf] text-xs">{t("prep.generer.setupB.evaluatedAt", { examType })}</p>
                </div>
                <ul className="px-4 py-3 space-y-1.5">
                  {comps.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-900">
                      <span className="text-[#005bbf] font-black flex-shrink-0 text-xs mt-0.5">{i + 1}.</span>
                      <span className="leading-relaxed">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Thème libre */}
          {(showFree || chaps.length <= 1) && (
            <div>
              <p className="font-bold text-sm mb-2">{t("prep.generer.setupB.themeLabel")} <span className="font-normal text-slate-500">{t("prep.generer.optionalSuffix")}</span></p>
              <input
                value={themeLibre}
                onChange={e => setThemeLibre(e.target.value)}
                placeholder={t("prep.generer.setupB.themePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white border border-slate-200/80 shadow-xs text-slate-900 focus:outline-none focus:border-[#005bbf]"
              />
            </div>
          )}

          <GenTypeSelector genType={genType} setGenType={setGenType} quizMode={quizMode} setQuizMode={setQuizMode} />

          <FriendlyErrorBanner
            error={error}
            onRetry={generate}
            disabled={!matiereB || retrySeconds > 0}
          />

          <button
            disabled={!matiereB || retrySeconds > 0}
            onClick={generate}
            className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#FF6B00" }}>
            {retrySeconds > 0 ? t("prep.generer.generateButtonRetry", { seconds: retrySeconds }) : t("prep.generer.generateButton", { genLabel })}
          </button>
        </div>
      </main>
    );
  }

  // ── GENERATING ──
  if (phase === "generating") return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <div className="text-center">
        <p className="font-black text-xl text-slate-900">{t("prep.generer.generating.title")}</p>
        <p className="text-slate-500 text-sm mt-1">{t("prep.generer.generating.subtitle", { genLabel: genLabel.toLowerCase() })}</p>
      </div>
    </div>
  );

  // ── FLASHCARDS RESULT ──
  if (phase === "flashcards_result") {
    const card = flashcards[currentCard];
    const mastered = flashcards.filter(c => c.maitrisee).length;
    return (
      <main className="w-full min-h-screen text-slate-900 flex flex-col bg-[#f8fafc]">
        <PageHeader
          title={t("prep.generer.flashcardsResult.headerTitle", { matiere: activeMat() })}
          onBack={() => setPhase("home")}
          action={<SoundToggle />}
        />
        <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">

          {/* Confirmation sauvegarde */}
          {flashSaved && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 shadow-2xs">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="text-emerald-800 font-bold text-xs sm:text-sm">{t("prep.generer.flashcardsResult.saved")}</p>
            </div>
          )}

          {/* Progress bar and counter */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-600">
              <span className="uppercase tracking-wider">Carte {currentCard + 1} sur {flashcards.length}</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">check</span>
                {t("prep.generer.flashcardsResult.masteredCount", { count: mastered })}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(mastered / flashcards.length) * 100}%`, backgroundColor: "#10b981" }}
              />
            </div>
          </div>

          {/* Flashcard 3D Feel */}
          <div
            onClick={() => {
              sounds.playCardFlip();
              setFlipped(f => !f);
            }}
            className={`rounded-3xl shadow-lg p-6 sm:p-8 min-h-[240px] sm:min-h-[260px] flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-300 active:scale-[0.98] border border-white/20 select-none ${
              flipped ? "bg-slate-900 text-white" : "bg-gradient-to-br from-[#FF6B00] to-[#e05e00] text-white"
            }`}
          >
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs">
                {flipped ? "Verso · Réponse" : "Recto · Question"}
              </span>
              <span className="material-symbols-outlined text-white/70 text-[20px]">
                {flipped ? "visibility" : "touch_app"}
              </span>
            </div>

            <div className="my-auto py-4">
              {flipped ? (
                <div className="text-white text-base sm:text-lg font-bold leading-relaxed max-w-md mx-auto">
                  <VersoContent verso={card.verso} />
                </div>
              ) : (
                <p className="text-white font-extrabold text-lg sm:text-xl leading-relaxed max-w-md mx-auto">
                  {card.recto}
                </p>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <span className="material-symbols-outlined text-[15px]">sync</span>
              <span>{t("prep.generer.card.tapToFlip")}</span>
            </div>
          </div>

          {/* Actions & Mastery Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => toggleMaitrised(currentCard)}
              className={`min-h-[48px] py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                card.maitrisee
                  ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-2xs"
                  : "bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {card.maitrisee ? "check_circle" : "check"}
              </span>
              <span>{card.maitrisee ? t("prep.generer.card.mastered") : t("prep.generer.card.markMastered")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playCardFlip();
                setCurrentCard(i => (i + 1) % flashcards.length);
                setFlipped(false);
              }}
              className="min-h-[48px] py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm bg-[#005bbf] hover:bg-[#004ba0] text-white shadow-md shadow-blue-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
            >
              <span>{t("prep.generer.card.next")}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playCardFlip();
                setCurrentCard(i => Math.max(0, i - 1));
                setFlipped(false);
              }}
              disabled={currentCard === 0}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-30 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.97] transition-all"
            >
              ← {t("prep.generer.card.previous")}
            </button>

            <button
              type="button"
              onClick={generate}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs border border-[#005bbf] text-[#005bbf] bg-blue-50/50 hover:bg-blue-100/60 active:scale-[0.97] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Régénérer</span>
            </button>
          </div>

          {/* WhatsApp sharing */}
          <button
            type="button"
            onClick={() => shareWhatsApp(t("prep.generer.share.flashcards", { matiere: activeMat(), count: flashcards.length, examType }))}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm text-white bg-[#25D366] hover:bg-[#20ba59] shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-all"
          >
            <span className="text-lg">📱</span>
            <span>{t("prep.generer.shareWhatsApp")}</span>
          </button>
        </div>

        <VideoSection
          videos={videos}
          videoPlaying={videoPlaying}
          setVideoPlaying={setVideoPlaying}
          matiereOrChapitre={activeMat()}
          studentSerie={serie}
          loading={videosLoading}
        />
      </main>
    );
  }

  // ── QUIZ QCM ──
  if (phase === "quiz_qcm") {
    const q = qcmQuestions[qcmCurrent];
    if (!q) return null;
    const selected = qcmAnswers[qcmCurrent];
    const letters = ["A", "B", "C", "D", "E", "F"];

    return (
      <main className="w-full min-h-screen text-slate-900 flex flex-col bg-[#f8fafc]">
        <PageHeader
          title={t("prep.generer.quizQcm.headerTitle", { matiere: activeMat() })}
          onBack={() => setPhase("home")}
          action={<SoundToggle />}
        />
        <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
          {/* Header Stats */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Question {qcmCurrent + 1} sur {qcmQuestions.length}
              </span>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Score : {qcmScore} / {qcmCurrent + (qcmShowAnswer ? 1 : 0)}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((qcmCurrent + 1) / qcmQuestions.length) * 100}%`, backgroundColor: "#FF6B00" }}
              />
            </div>
          </div>

          {/* Question Prompt Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <p className="font-extrabold text-slate-900 text-base sm:text-lg leading-relaxed">
              {q.question}
            </p>
          </div>

          {/* Multiple Choices */}
          <div className="space-y-3">
            {q.choices.map((choice, idx) => {
              const letter = letters[idx] ?? String(idx + 1);
              let cardStyle = "border-slate-200 bg-white hover:border-[#005bbf]/60 hover:bg-slate-50 text-slate-900 shadow-2xs";

              if (qcmShowAnswer) {
                if (choice === q.correct_answer) {
                  cardStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20";
                } else if (choice === selected) {
                  cardStyle = "border-rose-400 bg-rose-50 text-rose-900";
                } else {
                  cardStyle = "border-slate-200 bg-slate-50/60 opacity-60 text-slate-700";
                }
              } else if (choice === selected) {
                cardStyle = "border-[#005bbf] bg-blue-50/70 text-[#005bbf]";
              }

              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => !qcmShowAnswer && handleQcmAnswer(choice)}
                  disabled={qcmShowAnswer}
                  className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all flex items-start gap-3.5 min-h-[52px] ${cardStyle}`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                    qcmShowAnswer && choice === q.correct_answer
                      ? "bg-emerald-600 text-white"
                      : qcmShowAnswer && choice === selected
                      ? "bg-rose-500 text-white"
                      : choice === selected
                      ? "bg-[#005bbf] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1 leading-relaxed">{choice}</span>
                  {qcmShowAnswer && choice === q.correct_answer && (
                    <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                  {qcmShowAnswer && choice === selected && choice !== q.correct_answer && (
                    <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      cancel
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {qcmShowAnswer && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>{t("prep.generer.quizQcm.explanationLabel")}</span>
              </div>
              <p className="text-blue-950 text-xs sm:text-sm leading-relaxed font-medium">
                {q.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {qcmShowAnswer && (
            <button
              type="button"
              onClick={qcmNext}
              className="w-full min-h-[50px] py-4 font-black text-white rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              style={{ backgroundColor: "#FF6B00" }}
            >
              <span>{qcmCurrent + 1 >= qcmQuestions.length ? t("prep.generer.quizQcm.seeResult") : t("prep.generer.quizQcm.nextQuestion")}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          )}
        </div>
      </main>
    );
  }

  // ── QUIZ RÉDACTION ──
  if (phase === "quiz_redaction") return (
    <main className="w-full min-h-screen text-slate-900 flex flex-col">
      <PageHeader title={t("prep.generer.quizRedaction.headerTitle", { matiere: activeMat() })} onBack={() => setPhase("home")} />
      <div className="flex-1 px-6 py-4 space-y-5">
        <p className="text-slate-500 text-sm">{t("prep.generer.quizRedaction.instructions")}</p>
        {redactionQs.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <p className="font-bold text-slate-900">Q{i + 1}. {q.question}</p>
            <textarea
              value={redactionAnswers[i] ?? ""}
              onChange={e => setRedactionAnswers(prev => ({ ...prev, [i]: e.target.value }))}
              placeholder={t("prep.generer.quizRedaction.answerPlaceholder")}
              className="w-full min-h-[150px] px-4 py-3 rounded-xl border-2 border-slate-200 bg-white border border-slate-200/80 shadow-xs text-slate-900 focus:outline-none focus:border-[#005bbf] resize-y"
            />
          </div>
        ))}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={evaluateRedaction}
          disabled={redactionEvaluating || redactionQs.some((_, i) => !redactionAnswers[i]?.trim())}
          className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: "#FF6B00" }}>
          {redactionEvaluating ? t("prep.generer.quizRedaction.evaluating") : t("prep.generer.quizRedaction.submit")}
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
      <main className="w-full min-h-screen text-slate-900 flex flex-col bg-[#f8fafc]">
        <PageHeader
          title={t("prep.generer.quizResult.headerTitle", { matiere: activeMat() })}
          onBack={() => setPhase("home")}
          action={<SoundToggle />}
        />
        <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
          <div
            className="rounded-3xl p-6 sm:p-8 text-center text-white shadow-lg space-y-2 relative overflow-hidden"
            style={{ backgroundColor: pct >= 60 ? "#16a34a" : pct >= 40 ? "#ea580c" : "#dc2626" }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-white">
              <span className="material-symbols-outlined text-[16px]">military_tech</span>
              <span>{pct >= 60 ? "Très bon travail !" : pct >= 40 ? "Encourageant !" : "À réviser !"}</span>
            </div>
            <p className="text-5xl sm:text-6xl font-black tracking-tight">{finalScore}/{total}</p>
            <p className="text-base sm:text-lg font-bold opacity-90">{pct}% de réussite · {activeMat()}</p>
          </div>

          {isRedaction && redactionFeedback.length > 0 && (
            <div className="space-y-3">
              {redactionFeedback.map((f, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-slate-900 text-sm">Question {i + 1}</p>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#005bbf]">
                      {f.score}/10
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-1">{f.feedback}</p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => shareWhatsApp(t("prep.generer.share.quiz", { score: finalScore, total, matiere: activeMat(), examType }))}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm text-white bg-[#25D366] hover:bg-[#20ba59] shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-all"
          >
            <span className="text-lg">📱</span>
            <span>{t("prep.generer.shareWhatsApp")}</span>
          </button>

          <button
            type="button"
            onClick={() => setPhase("home")}
            className="w-full min-h-[50px] py-4 font-black text-white rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            style={{ backgroundColor: "#FF6B00" }}
          >
            <span>{t("prep.generer.newGeneration")}</span>
            <span className="material-symbols-outlined text-[18px]">replay</span>
          </button>
        </div>

        <VideoSection
          videos={videos}
          videoPlaying={videoPlaying}
          setVideoPlaying={setVideoPlaying}
          matiereOrChapitre={activeMat()}
          studentSerie={serie}
          loading={videosLoading}
        />
      </main>
    );
  }

  // ── RESUME RESULT ──
  if (phase === "resume_result" && resume) {
    const texte = (resume as { texte?: string }).texte ?? "";
    return (
      <main className="w-full min-h-screen text-slate-900 flex flex-col bg-[#f8fafc]">
        <PageHeader
          title={t("prep.generer.resumeResult.headerTitle", { matiere: activeMat() })}
          onBack={() => setPhase("home")}
          action={<SoundToggle />}
        />
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
          {resumeSaved && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="text-xs sm:text-sm font-bold text-emerald-800">{t("prep.generer.resumeResult.saved")}</p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200">
              <p className="text-xs sm:text-sm font-semibold text-rose-700">{error}</p>
            </div>
          )}

          <ResumeDisplay texte={texte} matiere={activeMat()} />

          <button
            type="button"
            onClick={() => shareWhatsApp(t("prep.generer.share.resume", { matiere: activeMat(), examType }))}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm text-white bg-[#25D366] hover:bg-[#20ba59] shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-all"
          >
            <span className="text-lg">📱</span>
            <span>{t("prep.generer.shareWhatsApp")}</span>
          </button>

          <button
            type="button"
            onClick={() => setPhase("home")}
            className="w-full min-h-[50px] py-4 font-black text-white rounded-2xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            style={{ backgroundColor: "#FF6B00" }}
          >
            <span>{t("prep.generer.newGeneration")}</span>
            <span className="material-symbols-outlined text-[18px]">replay</span>
          </button>
        </div>

        <VideoSection
          videos={videos}
          videoPlaying={videoPlaying}
          setVideoPlaying={setVideoPlaying}
          matiereOrChapitre={activeMat()}
          studentSerie={serie}
          loading={videosLoading}
        />
      </main>
    );
  }

  // ── MES FLASHCARDS ──
  if (phase === "mes_flashcards") {
    // Deck actif — affichage une carte à la fois (même design que génération)
    if (libDeck.length > 0) {
      const card = libDeck[libCardIdx];
      const mastered = libDeck.filter(c => c.maitrisee).length;
      return (
        <main className="w-full min-h-screen text-slate-900 flex flex-col">
          <PageHeader title={libDeckTitle} onBack={() => { setLibDeck([]); setLibCardIdx(0); setLibCardFlipped(false); }} />
          <div className="flex-1 px-6 py-4 space-y-4">

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{libCardIdx + 1} / {libDeck.length}</span>
              <span className="text-green-600 font-semibold">{t("prep.generer.flashcardsResult.masteredCount", { count: mastered })}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${(mastered / libDeck.length) * 100}%` }} />
            </div>

            {/* Même carte flip que la génération */}
            <div
              onClick={() => setLibCardFlipped(f => !f)}
              className="rounded-2xl shadow-lg p-6 min-h-48 flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ backgroundColor: libCardFlipped ? "#1e293b" : "#FF6B00" }}>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{libCardFlipped ? t("prep.generer.card.answer") : t("prep.generer.card.question")}</p>
              {libCardFlipped ? <VersoContent verso={card.verso} /> : (
                <p className="text-white font-bold text-lg text-center leading-relaxed">{card.recto}</p>
              )}
              <p className="text-xs text-white/50 mt-2">{t("prep.generer.card.tapToFlip")}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { toggleFlashMaitrisee(card.id, card.maitrisee); }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] ${card.maitrisee ? "bg-green-100 text-green-700 border-2 border-green-300" : "bg-slate-100 text-slate-500 border-2 border-slate-200"}`}>
                {card.maitrisee ? t("prep.generer.card.mastered") : t("prep.generer.card.markMastered")}
              </button>
              <button
                onClick={() => { setLibCardIdx(i => (i + 1) % libDeck.length); setLibCardFlipped(false); }}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-900 border-2 border-slate-200 active:scale-[0.97] transition-all">
                {t("prep.generer.card.next")}
              </button>
            </div>

            <button
              onClick={() => { setLibCardIdx(i => Math.max(0, i - 1)); setLibCardFlipped(false); }}
              disabled={libCardIdx === 0}
              className="w-full py-2.5 rounded-xl text-sm text-slate-500 disabled:opacity-30 bg-slate-100 active:scale-[0.97]">
              {t("prep.generer.card.previous")}
            </button>
          </div>
        </main>
      );
    }

    // Vue liste des groupes
    const grouped: Record<string, SavedFlashcard[]> = {};
    for (const f of savedFlashcards) {
      const key = `${f.matiere}${f.chapitre ? " · " + f.chapitre : ""}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    }
    return (
      <main className="w-full min-h-screen text-slate-900 pb-8">
        <PageHeader title={t("prep.generer.home.myFlashcards")} onBack={() => setPhase("home")} />
        {libLoading ? <LibLoader /> : (
          <div className="px-4 py-4 space-y-3">
            {Object.keys(grouped).length === 0 ? (
              <EmptyLib icon="style" msg={t("prep.generer.library.emptyFlashcards.msg")} sub={t("prep.generer.library.emptyFlashcards.sub")} />
            ) : Object.entries(grouped).map(([group, cards]) => {
              const done = cards.filter(c => c.maitrisee).length;
              return (
                <button
                  key={group}
                  onClick={() => { setLibDeck(cards); setLibDeckTitle(group); setLibCardIdx(0); setLibCardFlipped(false); }}
                  className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200/80 shadow-xs rounded-2xl shadow-sm text-left active:scale-[0.98] transition-transform">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FF6B0020" }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: "#FF6B00", fontVariationSettings: "'FILL' 1" }}>style</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{group}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t("prep.generer.library.deckStats", { count: cards.length, done })}</p>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-green-500" style={{ width: `${cards.length > 0 ? (done / cards.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-500 text-[20px]">chevron_right</span>
                </button>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // ── MES QUIZ ──
  if (phase === "mes_quiz") {
    return (
      <main className="w-full min-h-screen text-slate-900 pb-8">
        <PageHeader title={t("prep.generer.home.myQuiz")} onBack={() => setPhase("home")} />
        {libLoading ? <LibLoader /> : (
          <div className="px-4 py-4 space-y-3">
            {savedQuiz.length === 0 ? (
              <EmptyLib icon="quiz" msg={t("prep.generer.library.emptyQuiz.msg")} sub={t("prep.generer.library.emptyQuiz.sub")} />
            ) : savedQuiz.map(q => {
              const pct = Math.round((q.score / q.total) * 100);
              return (
                <div key={q.id} className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 ${pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-orange-400" : "bg-red-500"}`}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{q.matiere}{q.chapitre ? " · " + q.chapitre : ""}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {q.score}/{q.total} · {q.mode === "redaction" ? t("prep.generer.mode.redaction") : t("prep.generer.mode.qcm")} · {new Date(q.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // ── MES RÉSUMÉS ──
  if (phase === "mes_resumes") {
    return (
      <main className="w-full min-h-screen text-slate-900 pb-8">
        <PageHeader title={t("prep.generer.home.myResumes")} onBack={() => setPhase("home")} />
        {libLoading ? <LibLoader /> : (
          <div className="px-4 py-4 space-y-3">
            {savedResumes.length === 0 ? (
              <EmptyLib icon="auto_stories" msg={t("prep.generer.library.emptyResumes.msg")} sub={t("prep.generer.library.emptyResumes.sub")} />
            ) : savedResumes.map(r => {
              const isOpen = expandedResume === r.id;
              return (
                <div key={r.id} className="bg-white border border-slate-200/80 shadow-xs rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedResume(isOpen ? null : r.id)}
                    className="w-full flex items-center gap-3 p-4 text-left">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-amber-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{r.matiere ?? t("prep.generer.library.resumeFallback")}</p>
                      <p className="text-xs text-slate-500">
                        {r.matiere}{r.chapitre ? " · " + r.chapitre : ""} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>expand_more</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200/15 p-4">
                      <ResumeDisplay texte={r.contenu} matiere={r.matiere ?? ""} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  return null;
}

/* ─── Sub-components ───────────────────────────────────── */

/* Affiche le verso d'une flashcard : si ||| présent, sépare EN (gras) et FR (italique sous) */
function VersoContent({ verso }: { verso: string }) {
  if (verso.includes("|||")) {
    const [en, fr] = verso.split("|||").map(s => s.trim());
    return (
      <div className="text-center space-y-2">
        <p className="text-white font-bold text-lg leading-relaxed">{en}</p>
        <p className="text-white/70 text-sm italic leading-relaxed">{fr}</p>
      </div>
    );
  }
  return <p className="text-white font-bold text-lg text-center leading-relaxed">{verso}</p>;
}

function LibLoader() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );
}

function EmptyLib({ icon, msg, sub }: { icon: string; msg: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-8 text-center shadow-sm">
      <span className="material-symbols-outlined text-[40px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <p className="font-bold text-slate-900 mt-2">{msg}</p>
      <p className="text-sm text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

/* ── Resume rich formatting ─────────────────────────────── */

type SectionMeta = { icon: string; borderColor: string; bgColor: string; titleColor: string; bulletColor: string };

const SECTION_META: Record<string, SectionMeta> = {
  "introduction":   { icon: "info",      borderColor: "#64748b", bgColor: "#f8fafc", titleColor: "#334155", bulletColor: "#64748b" },
  "notions":        { icon: "lightbulb", borderColor: "#2563eb", bgColor: "#eff6ff", titleColor: "#1d4ed8", bulletColor: "#3b82f6" },
  "définitions":    { icon: "book_2",    borderColor: "#ea580c", bgColor: "#fff7ed", titleColor: "#c2410c", bulletColor: "#f97316" },
  "formules":       { icon: "functions", borderColor: "#7c3aed", bgColor: "#f5f3ff", titleColor: "#6d28d9", bulletColor: "#8b5cf6" },
  "exemples":       { icon: "science",   borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  "examens":        { icon: "star",      borderColor: "#dc2626", bgColor: "#fef2f2", titleColor: "#b91c1c", bulletColor: "#ef4444" },
  "points":         { icon: "checklist", borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  "default":        { icon: "article",   borderColor: "#4f46e5", bgColor: "#eef2ff", titleColor: "#4338ca", bulletColor: "#6366f1" },
};

function getSectionMeta(title: string): SectionMeta {
  const lower = title.toLowerCase();
  for (const key of Object.keys(SECTION_META)) {
    if (key !== "default" && lower.includes(key)) return SECTION_META[key];
  }
  return SECTION_META["default"];
}

/* ── Métadonnées par section ID (nouveau format HTML) ─────── */

const SECTION_ID_META: Record<string, SectionMeta> = {
  // Sciences
  "notions":     { icon: "lightbulb",   borderColor: "#2563eb", bgColor: "#eff6ff", titleColor: "#1d4ed8", bulletColor: "#3b82f6" },
  "formules":    { icon: "functions",   borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  "definitions": { icon: "book_2",      borderColor: "#ea580c", bgColor: "#fff7ed", titleColor: "#c2410c", bulletColor: "#f97316" },
  "methodes":    { icon: "calculate",   borderColor: "#7c3aed", bgColor: "#f5f3ff", titleColor: "#6d28d9", bulletColor: "#8b5cf6" },
  // Littéraire
  "idees":       { icon: "lightbulb",   borderColor: "#2563eb", bgColor: "#eff6ff", titleColor: "#1d4ed8", bulletColor: "#3b82f6" },
  "auteurs":     { icon: "person",      borderColor: "#ea580c", bgColor: "#fff7ed", titleColor: "#c2410c", bulletColor: "#f97316" },
  "concepts":    { icon: "school",      borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  // Histoire-Géo
  "evenements":  { icon: "event",       borderColor: "#2563eb", bgColor: "#eff6ff", titleColor: "#1d4ed8", bulletColor: "#3b82f6" },
  "acteurs":     { icon: "group",       borderColor: "#ea580c", bgColor: "#fff7ed", titleColor: "#c2410c", bulletColor: "#f97316" },
  "causes":      { icon: "analytics",   borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  // Anglais
  "vocabulaire": { icon: "translate",   borderColor: "#2563eb", bgColor: "#eff6ff", titleColor: "#1d4ed8", bulletColor: "#3b82f6" },
  "grammaire":   { icon: "spellcheck",  borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  "exemples":    { icon: "science",     borderColor: "#ea580c", bgColor: "#fff7ed", titleColor: "#c2410c", bulletColor: "#f97316" },
  "expressions": { icon: "chat",        borderColor: "#7c3aed", bgColor: "#f5f3ff", titleColor: "#6d28d9", bulletColor: "#8b5cf6" },
  // Économie
  "mecanismes":  { icon: "trending_up", borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
  "donnees":     { icon: "bar_chart",   borderColor: "#ea580c", bgColor: "#fff7ed", titleColor: "#c2410c", bulletColor: "#f97316" },
  "analyses":    { icon: "analytics",   borderColor: "#7c3aed", bgColor: "#f5f3ff", titleColor: "#6d28d9", bulletColor: "#8b5cf6" },
  // Partagé
  "examen":      { icon: "star",        borderColor: "#dc2626", bgColor: "#fef2f2", titleColor: "#b91c1c", bulletColor: "#ef4444" },
  "points-cles": { icon: "checklist",   borderColor: "#059669", bgColor: "#f0fdf4", titleColor: "#047857", bulletColor: "#10b981" },
};

// "contexte" a deux couleurs selon la matière : violet (Littéraire) ou marron (Histoire-Géo)
const CONTEXTE_LIT:    SectionMeta = { icon: "info",  borderColor: "#7c3aed", bgColor: "#f5f3ff", titleColor: "#6d28d9", bulletColor: "#8b5cf6" };
const CONTEXTE_HISTGEO: SectionMeta = { icon: "place", borderColor: "#92400e", bgColor: "#fffbeb", titleColor: "#78350f", bulletColor: "#b45309" };

function getSectionIdMeta(id: string, matiere: string): SectionMeta {
  if (id === "contexte") {
    return ["Histoire", "Géographie"].some(m => matiere.includes(m)) ? CONTEXTE_HISTGEO : CONTEXTE_LIT;
  }
  return SECTION_ID_META[id] ?? SECTION_META["default"];
}

function parseHtmlSections(texte: string): Array<{ id: string; title: string; content: string }> | null {
  if (!texte.includes("<section")) return null;
  const sections: Array<{ id: string; title: string; content: string }> = [];
  const re = /<section[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/section>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texte)) !== null) {
    const id = m[1];
    const inner = m[2];
    const h2 = inner.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const title = h2 ? h2[1].replace(/<[^>]*>/g, "") : id;
    const content = inner.replace(/<h2[^>]*>[\s\S]*?<\/h2>/i, "").trim();
    if (content || title) sections.push({ id, title, content });
  }
  return sections.length > 0 ? sections : null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatSectionContent(raw: string, meta: SectionMeta): string {
  const isFormulas = meta.icon === "functions";
  const isDefinitions = meta.icon === "book_2";
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    const isBullet = /^[-*+•]\s/.test(line) || /^\d+\.\s/.test(line);
    let text = line.replace(/^[-*+•]\s/, "").replace(/^\d+\.\s/, "");

    let html = escapeHtml(text);

    // **bold** and *italic*
    html = html.replace(/\*\*(.*?)\*\*/g, `<strong style="font-weight:700;color:inherit">$1</strong>`);
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // ==underline== → souligné coloré
    html = html.replace(/==(.*?)==/g,
      `<u style="text-decoration-color:${meta.borderColor};text-underline-offset:3px;font-weight:600">$1</u>`);

    // `code`
    html = html.replace(/`(.*?)`/g,
      `<code style="background:#fef9c3;color:#7c3aed;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.82em;font-weight:600">$1</code>`);

    // Dans une section définitions : "Terme : définition" → terme souligné+gras
    if (isDefinitions && /^[^:]+:/.test(text)) {
      html = html.replace(/^([^:]+:)/, `<strong style="font-weight:700;text-decoration:underline;text-decoration-color:${meta.borderColor};text-underline-offset:3px">$1</strong>`);
    }

    if (isBullet) {
      if (!inList) { out.push(`<ul style="padding:0;margin:6px 0;list-style:none">`); inList = true; }
      out.push(`<li style="display:flex;align-items:flex-start;gap:8px;margin:5px 0;font-size:0.875rem;line-height:1.65">` +
        `<span style="color:${meta.bulletColor};font-weight:900;font-size:1rem;flex-shrink:0;margin-top:0px">•</span>` +
        `<span>${html}</span></li>`);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }

      // Formule : toute ligne avec opérateur OU dans section formules
      const isFormuleLine = isFormulas || /[=×÷∑∫√²³±≤≥≠∝]/.test(text) || /\d+[+\-*/]\d+/.test(text);
      if (isFormuleLine && text.length > 3) {
        out.push(`<p style="background:#fef9c3;border-left:4px solid ${meta.borderColor};border-radius:0 8px 8px 0;` +
          `padding:8px 12px;font-weight:700;font-family:monospace;font-size:0.875rem;margin:6px 0;color:#1e1b4b">${html}</p>`);
      } else {
        out.push(`<p style="margin:5px 0;font-size:0.875rem;line-height:1.7;color:#1e293b">${html}</p>`);
      }
    }
  }
  if (inList) out.push("</ul>");
  return out.join("");
}

function SectionCard({ meta, title, html }: { meta: SectionMeta; title: string; html: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm"
      style={{ borderLeft: `5px solid ${meta.borderColor}`, backgroundColor: meta.bgColor }}>
      {title && (
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-2"
          style={{ borderBottom: `1px solid ${meta.borderColor}20` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${meta.borderColor}18` }}>
            <span className="material-symbols-outlined text-[16px]"
              style={{ color: meta.borderColor, fontVariationSettings: "'FILL' 1" }}>
              {meta.icon}
            </span>
          </div>
          <p className="font-black text-base leading-tight" style={{ color: meta.titleColor }}>{title}</p>
        </div>
      )}
      <div className="px-4 pb-4 pt-3" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function ResumeDisplay({ texte, matiere = "" }: { texte: string; matiere?: string }) {
  // ── Format HTML sections (nouveau) ──────────────────────
  const htmlSections = parseHtmlSections(texte);
  if (htmlSections) {
    return (
      <div className="space-y-3">
        {htmlSections.map((s, i) => {
          const meta = getSectionIdMeta(s.id, matiere);
          return (
            <SectionCard
              key={i}
              meta={meta}
              title={s.title}
              html={formatSectionContent(s.content, meta)}
            />
          );
        })}
      </div>
    );
  }

  // ── Format markdown ## (ancien — fallback pour anciens résumés) ──
  const rawSections = texte.split(/\n(?=## )/);
  const sections: Array<{ title: string; content: string }> = [];
  for (const raw of rawSections) {
    const nl = raw.indexOf("\n");
    if (raw.startsWith("## ") && nl !== -1) {
      sections.push({ title: raw.slice(3, nl).trim(), content: raw.slice(nl + 1).trim() });
    } else {
      const content = raw.replace(/^#{1,6}\s?/gm, "").trim();
      if (content) sections.push({ title: "", content });
    }
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#334155" }}>
        {texte.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\*/g, "")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <SectionCard
          key={i}
          meta={s.title ? getSectionMeta(s.title) : SECTION_META["default"]}
          title={s.title}
          html={formatSectionContent(s.content, s.title ? getSectionMeta(s.title) : SECTION_META["default"])}
        />
      ))}
    </div>
  );
}

function PageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95 shrink-0">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="font-extrabold text-slate-900 truncate text-base sm:text-lg">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

function FriendlyErrorBanner({
  error,
  onRetry,
  disabled,
}: {
  error: string;
  onRetry: () => void;
  disabled?: boolean;
}) {
  if (!error) return null;
  return (
    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-3 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="text-xl select-none">💛</span>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm text-amber-950">Génération en pause</p>
          <p className="text-xs sm:text-sm text-amber-800 mt-0.5 leading-relaxed">{error}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="w-full py-2.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs sm:text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        <span>Réessayer</span>
      </button>
    </div>
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
      <p className="font-bold text-sm">{t("prep.generer.typeSelector.title")}</p>
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: "flashcards", icon: "style",       label: t("prep.generer.genLabel.flashcards") },
          { key: "quiz",       icon: "quiz",         label: t("prep.generer.genLabel.quiz")       },
          { key: "resume",     icon: "auto_stories", label: t("prep.generer.genLabel.resume")     },
        ] as const).map(opt => (
          <button key={opt.key}
            onClick={() => setGenType(opt.key)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${genType === opt.key ? "border-[#005bbf] bg-blue-50/50" : "border-slate-200"}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ color: genType === opt.key ? "#FF6B00" : undefined, fontVariationSettings: genType === opt.key ? "'FILL' 1" : "'FILL' 0" }}>
              {opt.icon}
            </span>
            <span className={`text-xs font-bold ${genType === opt.key ? "text-[#005bbf]" : "text-slate-500"}`}>{opt.label}</span>
          </button>
        ))}
      </div>
      {genType === "quiz" && (
        <div className="flex gap-2">
          {([
            { key: "qcm",        label: t("prep.generer.mode.qcm") },
            { key: "redaction",  label: t("prep.generer.mode.redaction") },
          ] as const).map(m => (
            <button key={m.key}
              onClick={() => setQuizMode(m.key)}
              className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${quizMode === m.key ? "border-[#005bbf] bg-blue-50/50 text-[#005bbf]" : "border-slate-200 text-slate-500"}`}>
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
    <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[#005bbf] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p className="font-bold text-slate-900 text-sm">{title}</p>
      </div>
      {children}
    </div>
  );
}

function VideoSection({
  videos,
  videoPlaying,
  setVideoPlaying,
  matiereOrChapitre,
  studentSerie,
  loading = false,
}: {
  videos: YoutubeVideo[];
  videoPlaying: string | null;
  setVideoPlaying: (id: string | null) => void;
  matiereOrChapitre?: string;
  studentSerie?: string | null;
  loading?: boolean;
}) {
  if (!loading && videos.length === 0) return null;

  const sortedVideos = sortVideosByStudentSerie(videos, studentSerie);

  return (
    <section className="px-4 sm:px-6 pb-6 space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#FF6B00]">smart_display</span>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            {t("prep.generer.videos.title")}
          </h2>
        </div>
        {videos.length > 0 && !loading && (
          <span className="text-xs text-slate-400 font-semibold">
            {videos.length} recommandation{videos.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {videoPlaying ? (
        <div className="relative rounded-[24px] overflow-hidden shadow-xl border border-slate-200 bg-black aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoPlaying}?autoplay=1&rel=0`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Lecteur vidéo YouTube"
          />
          <button
            type="button"
            onClick={() => setVideoPlaying(null)}
            className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg transition-colors z-20"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>Fermer le lecteur</span>
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <VideoCardSkeleton />
          <VideoCardSkeleton />
          <VideoCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVideos.map(v => (
            <VideoCard
              key={v.videoId}
              video={v}
              matiereOrChapitre={matiereOrChapitre}
              onPlay={id => setVideoPlaying(id)}
              isPlaying={videoPlaying === v.videoId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function GenererPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      </div>
    }>
      <GenererPageInner />
    </Suspense>
  );
}
