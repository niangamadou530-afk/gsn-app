"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getExamCountdown, loadStoredCustomExamDate, CustomExamDateRecord } from "@/lib/prep-config";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice, DashboardSkeleton } from "@/components/SlowConnectionNotice";
import { ExamDateModal } from "@/components/ExamDateModal";

type Student = {
  prenom: string | null;
  exam_type: string;
  serie: string | null;
  ecole: string | null;
};

// Coefficients prioritaires par série pour guider l'élève
const SERIE_HIGHLIGHTS: Record<string, { label: string; subjects: string[] }> = {
  S2: { label: "Sciences Expérimentales", subjects: ["SVT (Coeff 6)", "Sciences Physiques (Coeff 6)", "Mathématiques (Coeff 5)"] },
  S1: { label: "Mathématiques & Sciences Physiques", subjects: ["Mathématiques (Coeff 8)", "Sciences Physiques (Coeff 7)", "SVT (Coeff 2)"] },
  L2: { label: "Langues & Sciences Humaines", subjects: ["Philosophie (Coeff 5)", "Français (Coeff 5)", "Histoire-Géo (Coeff 4)"] },
  L1: { label: "Langues & Littérature", subjects: ["Français (Coeff 6)", "Philosophie (Coeff 5)", "LV1/LV2 (Coeff 4)"] },
  STEG: { label: "Sciences & Tech. de Gestion", subjects: ["Comptabilité / Gestion", "Économie Générale", "Mathématiques"] },
  BFEM: { label: "Enseignement Moyen", subjects: ["Français (Coeff 3)", "Mathématiques (Coeff 3)", "PC & SVT (Coeff 2)"] },
};

export default function PrepDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [flashCount, setFlashCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Custom exam date state (localStorage)
  const [customExamRecord, setCustomExamRecord] = useState<CustomExamDateRecord | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    const stored = loadStoredCustomExamDate();
    if (stored) {
      setCustomExamRecord(stored);
    }
  }, []);

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbCategorie, setFbCategorie] = useState<string | null>(null);
  const [fbMessage, setFbMessage] = useState("");
  const [fbSent, setFbSent] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  async function submitFeedback() {
    if (!fbMessage.trim() || !userId) return;
    setFbLoading(true);
    try {
      await supabase.from("prep_feedback").insert({
        user_id: userId,
        categorie: fbCategorie,
        message: fbMessage.trim(),
      });
      setFbSent(true);
    } catch (e) {
      console.error("Feedback error:", e);
    } finally {
      setFbLoading(false);
    }
  }

  function closeFeedback() {
    setShowFeedback(false);
    setFbCategorie(null);
    setFbMessage("");
    setFbSent(false);
  }

  const [isPreview, setIsPreview] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setIsSlowConnection(false);

    // 8-second slow connection safety timer
    const slowTimer = setTimeout(() => {
      if (mounted && loading) {
        setIsSlowConnection(true);
      }
    }, 8000);

    async function load() {
      try {
        const authPromise = supabase.auth.getUser();
        const previewTimeout = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 1200)
        );
        const authResult = isPreviewEnvironment()
          ? await Promise.race([authPromise, previewTimeout])
          : await authPromise;
        const user = authResult.data?.user;

        if (!user) {
          if (isPreviewEnvironment()) {
            if (mounted) {
              setStudent({
                prenom: "Amadou (Démo)",
                exam_type: "BAC",
                serie: "S2",
                ecole: "Lycée Pilote de l'Avenir (Fictif)",
              });
              setQuizScore(82);
              setFlashCount(34);
              setIsPreview(true);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: stu } = await supabase
          .from("prep_students")
          .select("prenom, exam_type, serie, ecole")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!stu) {
          if (isPreviewEnvironment()) {
            if (mounted) {
              setStudent({
                prenom: "Amadou (Démo)",
                exam_type: "BAC",
                serie: "S2",
                ecole: "Lycée Pilote de l'Avenir (Fictif)",
              });
              setQuizScore(82);
              setFlashCount(34);
              setIsPreview(true);
              setLoading(false);
            }
            return;
          }
          router.push("/prep/onboarding");
          setLoading(false);
          return;
        }
        if (mounted) {
          setStudent(stu);

          // Dernier score quiz
          const { data: quizData } = await supabase
            .from("quiz_results")
            .select("score, total")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (quizData && quizData.total > 0) {
            setQuizScore(Math.round((quizData.score / quizData.total) * 100));
          }

          // Flashcards maîtrisées
          const { count } = await supabase
            .from("flashcards")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("maitrisee", true);

          setFlashCount(count ?? 0);
        }
      } catch (err) {
        console.error("Error loading student dashboard:", err);
        if (isPreviewEnvironment() && mounted) {
          setStudent({
            prenom: "Amadou (Démo)",
            exam_type: "BAC",
            serie: "S2",
            ecole: "Lycée Pilote de l'Avenir (Fictif)",
          });
          setIsPreview(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
      clearTimeout(slowTimer);
    };
  }, [router, retryCount]);

  if (isSlowConnection && loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <SlowConnectionNotice
          onRetry={() => {
            setIsSlowConnection(false);
            setLoading(true);
            setRetryCount(c => c + 1);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  const examType = student?.exam_type ?? "BAC";
  const effectiveTargetDate = customExamRecord ? customExamRecord.date : null;
  const countdown = getExamCountdown(examType, effectiveTargetDate);
  const displayDateText = customExamRecord ? customExamRecord.displayDateFr : countdown.displayDate;
  const prenom = student?.prenom ?? "Élève";
  const serie = customExamRecord?.seriesCode || student?.serie || "";
  const highlights = SERIE_HIGHLIGHTS[serie] ?? (examType === "BFEM" ? SERIE_HIGHLIGHTS.BFEM : null);
  const annalesHref = examType === "BFEM" ? "/prep/bfem" : "/prep/epreuves";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {isPreview && <PreviewBanner />}
      {/* Top Banner / Student Greeting Header */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-[#FF6B00]">
              {countdown.label}
            </span>
            {serie && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#005bbf]">
                Série {serie}
              </span>
            )}
            {student?.ecole && (
              <span className="text-xs text-slate-400 font-medium">· {student.ecole}</span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bonjour, <span className="text-[#005bbf]">{prenom}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Objectif session 2027 : révise méthodiquement chaque jour pour décrocher la mention.
          </p>
        </div>

        {/* Countdown Box with Change Date Button */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-[260px] shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                {customExamRecord?.label || (examType === "BFEM" ? "BFEM 2027" : "BAC 2027")}
              </p>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{displayDateText}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                J-{countdown.days}
              </span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">jours restants</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDateModal(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            title="Modifier la série ou entrer une date personnalisée"
          >
            <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
            <span>Modifier ma date d&apos;examen</span>
          </button>
        </div>
      </section>

      {/* Primary Action Card: AI Revision Session */}
      <section>
        <Link
          href="/prep/generer"
          className="group block relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg active:scale-[0.99] transition-all"
          style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF8500 100%)" }}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold backdrop-blur-md">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Entraînement Recommandé</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Lancer ma séance de révision du jour
              </h2>
              <p className="text-sm sm:text-base text-orange-100 leading-relaxed">
                Génère instantanément un quiz chronométré, des flashcards ou un résumé sur les chapitres clés de ta série.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-md group-hover:bg-slate-50 transition-colors">
              <span>Commencer</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </Link>
      </section>

      {/* Quick Metrics & Progression */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dernier Quiz</span>
            <span className="material-symbols-outlined text-indigo-500 text-[20px]">quiz</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {quizScore !== null ? `${quizScore}%` : "—"}
          </p>
          <p className="text-[11px] text-slate-400">Score d&apos;évaluation</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Flashcards</span>
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">style</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {flashCount}
          </p>
          <p className="text-[11px] text-slate-400">Notions maîtrisées</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Session</span>
            <span className="material-symbols-outlined text-[#FF6B00] text-[20px]">event_available</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            2027
          </p>
          <p className="text-[11px] text-slate-400">{examType} Sénégal</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Progression</span>
            <span className="material-symbols-outlined text-blue-500 text-[20px]">trending_up</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            Actif
          </p>
          <p className="text-[11px] text-slate-400">Programme en cours</p>
        </div>
      </section>

      {/* Main Tools Bento Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Outils essentiels de révision</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Coach IA */}
          <Link
            href="/prep/coach"
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#005bbf] transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005bbf] flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[26px]">smart_toy</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">Coach IA Personnel</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pose toutes tes questions sur les cours, demande des explications détaillées ou de la méthodologie d&apos;examen.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-[#005bbf]">
              <span>Ouvrir le chat</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </Link>

          {/* Card 2: Annales & Corrigés */}
          <Link
            href={annalesHref}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#FF6B00] transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[26px]">menu_book</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">Annales Officielles</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Consulte les sujets 2023, 2024 et 2025 avec corrigés types conformes aux barèmes sénégalais.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-[#FF6B00]">
              <span>Explorer les épreuves</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </Link>

          {/* Card 3: Simulateur de Moyenne */}
          <Link
            href="/prep/simulateur"
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-emerald-500 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[26px]">calculate</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">Simulateur de Notes</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Estime tes chances d&apos;admission directe au 1er groupe avec les coefficients réels du Ministère.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <span>Calculer ma moyenne</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Serie Priority Subjects Banner */}
      {highlights && (
        <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Matières prioritaires pour {serie ? `la Série ${serie}` : "ton examen"}
            </span>
            <p className="text-sm font-extrabold text-slate-900">{highlights.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlights.subjects.map((sub) => (
              <span
                key={sub}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
              >
                {sub}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Secondary Resources & Tools */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/prep/orientation"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">explore</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Orientation Post-Bac</p>
            <p className="text-[11px] text-slate-500">Filières, bourses, débouchés</p>
          </div>
        </Link>

        <Link
          href="/prep/soft-skills"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">self_improvement</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Gestion du Stress</p>
            <p className="text-[11px] text-slate-500">Pomodoro, sommeil, confiance</p>
          </div>
        </Link>

        <Link
          href="/prep/classement"
          className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">leaderboard</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Classement National</p>
            <p className="text-[11px] text-slate-500">Compare-toi aux autres élèves</p>
          </div>
        </Link>
      </section>

      {/* Action Strip: Feedback & WhatsApp */}
      <section className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
          <span>Donner un avis / Signaler un problème</span>
        </button>

        <a
          href="https://wa.me/221781246504?text=Bonjour%20GSN%20Prep%2C%20j%27ai%20besoin%20d%27aide"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          <span>Besoin d&apos;assistance ? Contacte l&apos;équipe GSN sur WhatsApp</span>
        </a>
      </section>

      {/* Feedback Modal */}
      {showFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={closeFeedback}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {fbSent ? (
              <div className="flex flex-col items-center py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
                  ✓
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">Merci pour ton retour !</h3>
                <p className="text-xs text-slate-500">
                  Ton avis nous aide à améliorer continuellement GSN PREP pour tous les élèves du Sénégal.
                </p>
                <button
                  onClick={closeFeedback}
                  className="mt-3 px-6 py-2.5 rounded-xl font-bold text-white text-xs bg-[#FF6B00]"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Donner ton avis</h3>
                  <button
                    onClick={closeFeedback}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  {(["Suggestion", "Bug", "Question"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFbCategorie(fbCategorie === cat ? null : cat)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        fbCategorie === cat
                          ? "border-[#005bbf] bg-blue-50 text-[#005bbf]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <textarea
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder="Écris ton message ici..."
                  rows={4}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#005bbf] resize-none"
                />

                <button
                  onClick={submitFeedback}
                  disabled={!fbMessage.trim() || fbLoading}
                  className="w-full py-3.5 font-extrabold text-white rounded-xl text-sm disabled:opacity-40 active:scale-[0.98] transition-all bg-[#FF6B00]"
                >
                  {fbLoading ? "Envoi en cours..." : "Envoyer mon avis"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal de modification de date d'examen */}
      <ExamDateModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        currentExamType={examType === "BFEM" ? "BFEM" : "BAC"}
        currentSerie={student?.serie || undefined}
        onDateUpdated={(rec) => setCustomExamRecord(rec)}
      />
    </div>
  );
}
