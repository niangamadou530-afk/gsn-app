"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getMatiereData } from "@/data/programmes";
import { t } from "@/lib/i18n";
import { EXAM_CONFIG } from "@/lib/prep-config";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice } from "@/components/SlowConnectionNotice";
import { CoachConversationDrawer, ConversationSummary } from "@/components/CoachConversationDrawer";
import { CoachFileSheet, CoachFile } from "@/components/CoachFileSheet";
import { CoachFilesModal } from "@/components/CoachFilesModal";
import { CoachFileCard } from "@/components/CoachFileCard";

const BAC_DATE  = EXAM_CONFIG.BAC.targetDate;
const BFEM_DATE = EXAM_CONFIG.BFEM.targetDate;

function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

type ExtendedMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  file?: CoachFile | null;
};

type Profile = { prenom: string | null; exam_type: string; serie: string | null; ecole: string | null };

const SUGGESTIONS = [
  "Comment bien réviser pour décrocher une mention ?",
  "Explique-moi la méthode de la dissertation",
  "Donne-moi un exercice type examen avec son corrigé",
  "Fais-moi une fiche de révision de cours",
];

export default function CoachPage() {
  const router = useRouter();
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [quizStats, setQuizStats] = useState<Record<string, number>>({});
  const [messages, setMessages]   = useState<ExtendedMessage[]>([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [authToken, setAuthToken] = useState("");
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [lastUserMsg, setLastUserMsg]   = useState("");
  const [isPreview, setIsPreview]       = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount]     = useState(0);

  // Conversations & Tiroir (Partie K)
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("Coach IA");
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);

  // Fichiers (Partie K)
  const [conversationFiles, setConversationFiles] = useState<CoachFile[]>([]);
  const [allFiles, setAllFiles] = useState<CoachFile[]>([]);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [filesModalMode, setFilesModalMode] = useState<"conversation" | "all">("conversation");
  const [selectedFile, setSelectedFile] = useState<CoachFile | null>(null);
  const [fileSheetOpen, setFileSheetOpen] = useState(false);

  // Choix rapides suggérés
  const [showSubjectChoices, setShowSubjectChoices] = useState(false);
  const [pendingChoiceAction, setPendingChoiceAction] = useState<"exercice" | "fiche">("exercice");

  const bottomRef = useRef<HTMLDivElement>(null);

  // Chargement des conversations de l'élève
  const fetchConversations = useCallback(async (token: string) => {
    if (!token) return;
    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const res = await fetch("/api/prep/coach/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.historyUnavailable) {
          setHistoryUnavailable(true);
        }
      } else {
        setConversationsError("Impossible de charger l'historique.");
      }
    } catch {
      setConversationsError("Erreur réseau lors du chargement des conversations.");
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Chargement de tous les fichiers de l'élève
  const fetchAllFiles = useCallback(async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/prep/coach/files", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllFiles(data.files || []);
      }
    } catch {
      // Ignorer silencieusement
    }
  }, []);

  // Chargement initial du profil et de la session
  useEffect(() => {
    let mounted = true;
    setIsSlowConnection(false);

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
              setIsPreview(true);
              const p = { prenom: "Amadou (Démo)", exam_type: "BAC", serie: "S2", ecole: "Lycée Pilote de l'Avenir" };
              setProfile(p);
              setQuizStats({ "Mathématiques": 78, "Sciences Physiques": 85, "SVT": 72 });
              const days = daysUntil(BAC_DATE);
              setMessages([{
                role: "assistant",
                content: `Bonjour Amadou ! Je suis ton coach personnel pour préparer le BAC (J-${days}).\n\nPose-moi une question sur le programme du Baccalauréat sénégalais ou demande un exercice ou une fiche de révision pour démarrer !`,
              }]);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }

        const [{ data: stu }, { data: results }, { data: { session } }] = await Promise.all([
          supabase.from("prep_students").select("prenom, exam_type, serie, ecole").eq("user_id", user.id).maybeSingle(),
          supabase.from("quiz_results").select("matiere, score, total").eq("user_id", user.id),
          supabase.auth.getSession(),
        ]);

        const p = stu as Profile | null;
        if (mounted) {
          setProfile(p);
          const byMat: Record<string, number[]> = {};
          for (const r of results ?? []) {
            if (!byMat[r.matiere]) byMat[r.matiere] = [];
            byMat[r.matiere].push(Math.round((r.score / r.total) * 100));
          }
          const stats: Record<string, number> = {};
          for (const [m, sc] of Object.entries(byMat)) {
            stats[m] = Math.round(sc.reduce((a, b) => a + b, 0) / sc.length);
          }
          setQuizStats(stats);

          const tok = session?.access_token ?? "";
          setAuthToken(tok);
          setLoading(false);

          if (tok) {
            await fetchConversations(tok);
            await fetchAllFiles(tok);
          }

          const prenom = p?.prenom ?? t("prep.coach.defaultName");
          const exam   = p?.exam_type ?? "BAC";
          const days   = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
          const greeting = [
            t("prep.coach.greetingLine1", { prenom }),
            t("prep.coach.greetingLine2", { days, exam }),
            "Tu peux me poser une question de cours, me demander un exercice type examen ou une fiche de révision au format Markdown.",
          ].join("\n\n");

          setMessages([{
            role: "assistant",
            content: greeting,
          }]);
        }
      } catch (err) {
        console.error(err);
        if (isPreviewEnvironment() && mounted) {
          setIsPreview(true);
          const p = { prenom: "Amadou (Démo)", exam_type: "BAC", serie: "S2", ecole: "Lycée Pilote de l'Avenir" };
          setProfile(p);
          setLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      clearTimeout(slowTimer);
    };
  }, [router, retryCount, fetchConversations, fetchAllFiles]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = setTimeout(() => setRetrySeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds]);

  // Sélectionner et charger une conversation existante
  const handleSelectConversation = async (convId: string) => {
    if (!authToken || convId === activeConversationId) return;
    setActiveConversationId(convId);
    const targetConv = conversations.find(c => c.id === convId);
    if (targetConv) setActiveTitle(targetConv.title);

    try {
      const res = await fetch(`/api/prep/coach/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const convMsgs: ExtendedMessage[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));

        // Associer les fichiers aux messages correspondants
        const files: CoachFile[] = data.files || [];
        setConversationFiles(files);

        if (files.length > 0 && convMsgs.length > 0) {
          // Lier le premier fichier au dernier message assistant pour l'affichage visuel
          const lastAssistant = [...convMsgs].reverse().find(m => m.role === "assistant");
          if (lastAssistant) {
            lastAssistant.file = files[0];
          }
        }

        setMessages(convMsgs.length > 0 ? convMsgs : [{
          role: "assistant",
          content: "Reprenons cette discussion ! Que souhaites-tu travailler ?",
        }]);
      }
    } catch {
      // Ignorer silencieusement
    }
  };

  // Créer une nouvelle conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setActiveTitle("Nouvelle discussion");
    setConversationFiles([]);
    setShowSubjectChoices(false);

    const prenom = profile?.prenom ?? t("prep.coach.defaultName");
    const exam   = profile?.exam_type ?? "BAC";
    const days   = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
    const greeting = [
      t("prep.coach.greetingLine1", { prenom }),
      t("prep.coach.greetingLine2", { days, exam }),
      "Nouvelle discussion lancée ! Pose ta question ou demande un exercice ou une fiche.",
    ].join("\n\n");

    setMessages([{ role: "assistant", content: greeting }]);
  };

  // Renommer une conversation
  const handleRenameConversation = async (convId: string, newTitle: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/prep/coach/conversations/${convId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => (c.id === convId ? { ...c, title: newTitle } : c))
        );
        if (convId === activeConversationId) {
          setActiveTitle(newTitle);
        }
      }
    } catch {
      // Ignorer
    }
  };

  // Supprimer une conversation
  const handleDeleteConversation = async (convId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/prep/coach/conversations/${convId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (convId === activeConversationId) {
          handleNewConversation();
        }
      }
    } catch {
      // Ignorer
    }
  };

  // Supprimer toutes les conversations
  const handleDeleteAllConversations = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/prep/coach/conversations", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setConversations([]);
        setConversationFiles([]);
        setAllFiles([]);
        handleNewConversation();
      }
    } catch {
      // Ignorer
    }
  };

  // Supprimer un fichier
  const handleDeleteFile = async (fileId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/prep/coach/files?id=${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setAllFiles(prev => prev.filter(f => f.id !== fileId));
        setConversationFiles(prev => prev.filter(f => f.id !== fileId));
        setMessages(prev =>
          prev.map(m => (m.file?.id === fileId ? { ...m, file: null } : m))
        );
      }
    } catch {
      // Ignorer
    }
  };

  const openFileInSheet = (f: CoachFile) => {
    setSelectedFile(f);
    setFileSheetOpen(true);
  };

  async function retryMessage() {
    if (!lastUserMsg || retrySeconds > 0 || sending) return;
    setSending(true);
    await doSend(lastUserMsg);
  }

  async function sendMessage(textToSend?: string) {
    const raw = textToSend ?? input;
    if (!raw.trim() || sending) return;
    const userMsg = raw.trim();
    setInput("");
    setLastUserMsg(userMsg);
    setShowSubjectChoices(false);

    // ── Détection export immédiat sans appel IA (Règle 4.a) ──
    const isExportRequest = /(donne|mets|export|télécharge|telecharge|envoie|partage|format).*?(pdf|word|docx?|markdown|\.md)/i.test(userMsg);
    const availableFile = conversationFiles[0] || [...messages].reverse().find(m => m.file)?.file;

    if (isExportRequest && availableFile) {
      setMessages(prev => [
        ...prev,
        { role: "user", content: userMsg },
        {
          role: "assistant",
          content: `Voici les options de téléchargement pour ton document « ${availableFile.title} » :`,
          file: availableFile,
        },
      ]);
      return;
    }

    // ── Détection demande d'exercice ou de fiche sans matière précise (Règle 2.c) ──
    const exam  = profile?.exam_type ?? "BAC";
    const serie = profile?.serie ?? "";
    const matieresList = getMatieres(exam, serie || undefined);
    const msgLower = userMsg.toLowerCase();
    const hasMatiereInMsg = matieresList.some(mat =>
      mat.toLowerCase().split(/[\s-]+/).filter(k => k.length > 3).some(k => msgLower.includes(k))
    );

    const isGenericExerciseRequest = /\b(exercice|exercices|problème)\b/i.test(msgLower) && !hasMatiereInMsg;
    const isGenericFicheRequest    = /\b(fiche|fiches|résumé de cours|synthèse)\b/i.test(msgLower) && !hasMatiereInMsg;

    if ((isGenericExerciseRequest || isGenericFicheRequest) && matieresList.length > 0) {
      setPendingChoiceAction(isGenericExerciseRequest ? "exercice" : "fiche");
      setShowSubjectChoices(true);
      setMessages(prev => [
        ...prev,
        { role: "user", content: userMsg },
        {
          role: "assistant",
          content: `Excellente initiative ! Pour quelle matière souhaites-tu cet ${isGenericExerciseRequest ? "exercice" : "cette fiche"} (${exam}${serie ? ` ${serie}` : ""}) ?`,
        },
      ]);
      return;
    }

    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);
    await doSend(userMsg);
  }

  async function doSend(userMsg: string) {
    try {
      const exam  = profile?.exam_type ?? "BAC";
      const serie = profile?.serie ?? "";
      const days  = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
      const statsStr = Object.entries(quizStats).length > 0
        ? Object.entries(quizStats).map(([m, s]) => `${m}: ${s}%`).join(", ")
        : "Aucun quiz réalisé encore";

      const matieresList = getMatieres(exam, serie || undefined);
      let programmeContext = "";
      const msgLower = userMsg.toLowerCase();
      let detectedMatiere = "";
      let detectedChapitre = "";

      for (const mat of matieresList) {
        const keywords = mat.toLowerCase().split(/[\s-]+/).filter(k => k.length > 3);
        if (keywords.some(k => msgLower.includes(k))) {
          detectedMatiere = mat;
          const data = getMatiereData(exam, serie || "", mat);
          const chapitres = (data?.chapitres ?? []).filter(c => c !== "Autre");
          for (const ch of chapitres) {
            if (msgLower.includes(ch.toLowerCase().slice(0, 10))) {
              detectedChapitre = ch;
              break;
            }
          }
          if (chapitres.length > 0 || data?.coefficient) {
            const parts = [`\n\nPROGRAMME OFFICIEL ${mat.toUpperCase()} (${exam}${serie ? " " + serie : ""}) :`];
            if (data?.coefficient) parts.push(`Coefficient : ${data.coefficient} | Durée : ${data.duree_epreuve}`);
            if (chapitres.length > 0) parts.push(`Chapitres : ${chapitres.map(c => `• ${c}`).join(", ")}`);
            programmeContext = parts.join("\n");
          }
          break;
        }
      }

      const systemPrompt = `Tu es le Coach IA personnel de ${profile?.prenom ?? "l'élève"}, préparant le ${exam}${serie ? " série " + serie : ""} au Sénégal.
J-${days} avant le ${exam}. Scores par matière : ${statsStr}.
Tu parles toujours par le prénom. Tu donnes des conseils basés sur les vraies données.
Tu es motivant, bienveillant, pédagogique.
Pour les questions simples, fais des réponses claires en français (3-5 phrases).
Évite les formules compliquées non expliquées. Utilise des symboles lisibles (x², √, ∑).${programmeContext}`;

      const res = await fetch("/api/prep-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          systemPrompt,
          message: userMsg,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          matiere: detectedMatiere,
          chapitre: detectedChapitre,
          examen: exam,
          serie: serie || "",
          conversationId: activeConversationId || undefined,
        }),
      });

      if (res.status === 503) {
        const d = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: d.error ?? t("prep.coach.rateLimited") }]);
        setRetrySeconds(5);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.error ?? t("prep.coach.limitReached") }]);
        return;
      }

      const assistantMsg = data.message || "Voici ma réponse.";
      const returnedFile: CoachFile | null = data.file || null;

      if (data.historyUnavailable) {
        setHistoryUnavailable(true);
      }

      // Si une nouvelle conversation a été créée côté serveur, mettre à jour l'ID actif et recharger la liste
      if (data.conversationId && data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
        if (authToken) {
          fetchConversations(authToken);
        }
      }

      if (returnedFile) {
        setConversationFiles(prev => [returnedFile, ...prev]);
        setAllFiles(prev => [returnedFile, ...prev]);
      }

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: assistantMsg,
          file: returnedFile,
        },
      ]);
      setLastUserMsg("");
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: t("prep.coach.connectionError") }]);
    } finally {
      setSending(false);
    }
  }

  if (isSlowConnection && loading) return (
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

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="text-xs font-bold text-slate-500">Connexion avec votre Coach IA...</p>
    </div>
  );

  const exam = profile?.exam_type ?? "BAC";
  const days = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
  const matieresList = getMatieres(exam, profile?.serie || undefined);
  const annalesHref = exam === "BFEM" ? "/prep/bfem" : "/prep/epreuves";

  return (
    <div className="max-w-6xl mx-auto w-full px-2 sm:px-4 py-2 sm:py-3 flex gap-3 h-[calc(100dvh-125px)] md:h-[calc(100vh-135px)] min-h-[480px] md:min-h-[580px]">
      {isPreview && <PreviewBanner />}

      {/* ── COLONNE LATÉRALE / TIROIR CONVERSATIONS (PARTIE K) ── */}
      <CoachConversationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onDeleteAllConversations={handleDeleteAllConversations}
        onOpenAllFiles={() => {
          setFilesModalMode("all");
          setFilesModalOpen(true);
        }}
        loading={conversationsLoading}
        error={conversationsError}
        onRetry={() => authToken && fetchConversations(authToken)}
        annalesHref={annalesHref}
      />

      {/* ── ZONE DE DISCUSSION CENTRALE ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        
        {/* Header Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center justify-between gap-2.5 mb-2.5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Bouton ouvrir tiroir sur Mobile */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0"
              title="Menu des discussions"
              aria-label="Menu des discussions"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Avatar Coach */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#005bbf] to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                  {activeConversationId ? activeTitle : "Coach IA PREP"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  24/7
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                Objectif {exam} {profile?.serie ? `(${profile.serie})` : ""} · J-{days}
                {historyUnavailable && (
                  <span className="text-amber-600 font-semibold ml-2">
                    · Historique indisponible pour le moment
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bouton Dossier : Fichiers de la discussion en cours */}
            <button
              type="button"
              onClick={() => {
                setFilesModalMode("conversation");
                setFilesModalOpen(true);
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Fichiers de la conversation"
              aria-label="Fichiers de la conversation"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="hidden sm:inline">Fichiers</span>
            </button>

            {/* Bouton Nouvelle discussion */}
            <button
              type="button"
              onClick={handleNewConversation}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005bbf] font-bold text-xs transition-colors"
              title="Nouvelle discussion"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nouveau</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto bg-white/70 border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#005bbf] to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                )}
                
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-[#005bbf] text-white shadow-xs rounded-tr-xs font-medium"
                        : "bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-xs"
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Carte de fichier Markdown généré (Partie K) */}
                  {m.file && (
                    <div className="pt-1">
                      <CoachFileCard
                        file={m.file}
                        onOpenFile={openFileInSheet}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Indicateur de saisie / génération */}
          {sending && (
            <div className="flex items-start gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#005bbf] to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs rounded-tl-xs flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#005bbf] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#005bbf] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#005bbf] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Choix cliquables de matières si demande générique d'exercice ou fiche (Règle 2.c) */}
        {showSubjectChoices && (
          <div className="pt-2 px-1 shrink-0">
            <p className="text-[11px] font-bold text-slate-500 mb-1.5">
              Choisis la matière souhaitée :
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {matieresList.slice(0, 7).map((mat) => (
                <button
                  key={mat}
                  type="button"
                  onClick={() => sendMessage(`${pendingChoiceAction === "exercice" ? "Exercice de" : "Fiche de révision de"} ${mat}`)}
                  className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#005bbf] font-bold text-xs whitespace-nowrap shadow-2xs transition-colors"
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion Chips au début */}
        {messages.length <= 2 && !sending && !showSubjectChoices && (
          <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide shrink-0">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(s)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-[#005bbf] transition-all whitespace-nowrap shadow-xs active:scale-95 shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Retry banner if throttled */}
        {lastUserMsg && !sending && (
          <div className="pt-1.5 shrink-0">
            <button
              onClick={retryMessage}
              disabled={retrySeconds > 0}
              className="w-full py-2.5 rounded-xl font-bold text-xs border border-orange-200 bg-orange-50 text-[#FF6B00] hover:bg-orange-100 transition-all disabled:opacity-50"
            >
              {retrySeconds > 0 ? t("prep.coach.retryIn", { seconds: retrySeconds }) : t("prep.coach.retry")}
            </button>
          </div>
        )}

        {/* Input Form & Mentions de confidentialité */}
        <div className="pt-2 shrink-0 space-y-1.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-1.5 sm:p-2 shadow-xs focus-within:border-[#005bbf] focus-within:ring-2 focus-within:ring-blue-100 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose une question ou demande un exercice..."
              disabled={sending}
              className="flex-1 px-3 py-2 bg-transparent text-slate-900 placeholder:text-slate-400 text-base sm:text-sm focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-xs active:scale-95 shrink-0"
              title="Envoyer"
              aria-label="Envoyer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>

          {/* Mentions permanentes de confidentialité et sécurité (Règle 2.g & 6.b) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-1 text-[11px] text-slate-500 gap-1">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#005bbf] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Privé : tes parents ne peuvent pas voir tes conversations ni tes fichiers.</span>
            </div>
            <span className="text-slate-400">Évite d&apos;écrire ton nom ou des informations personnelles.</span>
          </div>
        </div>

      </div>

      {/* ── MODALE LISTE DES FICHIERS (PARTIE K) ── */}
      <CoachFilesModal
        isOpen={filesModalOpen}
        onClose={() => setFilesModalOpen(false)}
        title={filesModalMode === "all" ? "Mes fichiers générés" : "Fichiers de la conversation"}
        files={filesModalMode === "all" ? allFiles : conversationFiles}
        onOpenFile={openFileInSheet}
        onDeleteFile={filesModalMode === "all" ? handleDeleteFile : undefined}
        isAllFilesMode={filesModalMode === "all"}
      />

      {/* ── FEUILLE D'AFFICHAGE DU FICHIER EN MARKDOWN (PARTIE K) ── */}
      <CoachFileSheet
        file={selectedFile}
        isOpen={fileSheetOpen}
        onClose={() => {
          setFileSheetOpen(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
}
