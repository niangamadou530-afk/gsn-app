"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getMatiereData } from "@/data/programmes";
import { t } from "@/lib/i18n";
import { EXAM_CONFIG } from "@/lib/prep-config";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice } from "@/components/SlowConnectionNotice";

const BAC_DATE  = EXAM_CONFIG.BAC.targetDate;
const BFEM_DATE = EXAM_CONFIG.BFEM.targetDate;

function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

type Message = { role: "user" | "assistant"; content: string };
type Profile = { prenom: string | null; exam_type: string; serie: string | null; ecole: string | null };

const SUGGESTIONS = [
  "Comment bien réviser pour décrocher une mention ?",
  "Explique-moi la méthode de la dissertation",
  "Donne-moi un exercice type examen avec son corrigé",
  "Quelles sont les erreurs fréquentes à éviter ?",
];

export default function CoachPage() {
  const router = useRouter();
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [quizStats, setQuizStats] = useState<Record<string, number>>({});
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [authToken, setAuthToken] = useState("");
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [lastUserMsg, setLastUserMsg]   = useState("");
  const [isPreview, setIsPreview]       = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount]     = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

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
              const p = { prenom: "Amadou (Démo)", exam_type: "BAC", serie: "S2", ecole: "Lycée Pilote de l'Avenir (Fictif)" };
              setProfile(p);
              setQuizStats({ "Mathématiques": 78, "Sciences Physiques": 85, "SVT": 72 });
              const days = daysUntil(BAC_DATE);
              setMessages([{
                role: "assistant",
                content: `Bonjour Amadou ! Je suis ton coach personnel pour préparer le BAC (J-${days}).\n\nPose-moi une question sur le programme du Baccalauréat sénégalais ou choisis une suggestion ci-dessous pour démarrer !`,
              }]);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }

        const [{ data: stu }, { data: results }] = await Promise.all([
          supabase.from("prep_students").select("prenom, exam_type, serie, ecole").eq("user_id", user.id).maybeSingle(),
          supabase.from("quiz_results").select("matiere, score, total").eq("user_id", user.id),
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
          const { data: { session } } = await supabase.auth.getSession();
          setAuthToken(session?.access_token ?? "");
          setLoading(false);

          const prenom = p?.prenom ?? t("prep.coach.defaultName");
          const exam   = p?.exam_type ?? "BAC";
          const days   = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
          const greeting = [
            t("prep.coach.greetingLine1", { prenom }),
            t("prep.coach.greetingLine2", { days, exam }),
            t("prep.coach.greetingLine3"),
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
          const p = { prenom: "Amadou (Démo)", exam_type: "BAC", serie: "S2", ecole: "Lycée Pilote de l'Avenir (Fictif)" };
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
  }, [router, retryCount]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const timer = setTimeout(() => setRetrySeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds]);

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
      for (const mat of matieresList) {
        const keywords = mat.toLowerCase().split(/[\s-]+/).filter(k => k.length > 3);
        if (keywords.some(k => msgLower.includes(k))) {
          const data = getMatiereData(exam, serie || "", mat);
          const chapitres = (data?.chapitres ?? []).filter(c => c !== "Autre");
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
Tu es motivant, bienveillant, précis. Réponses courtes (3-5 phrases max). Tout en français.
IMPORTANT : Tu réponds toujours en texte simple sans aucun formatage markdown. Pas d'astérisques, pas de dièses, pas d'underscores, pas de backticks. Uniquement du texte brut avec des retours à la ligne simples.${programmeContext}`;

      const nettoyer = (t: string) => t
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`{1,3}[^`]*`{1,3}/g, "")
        .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
        .trim();

      let detectedMatiere = "";
      let detectedChapitre = "";
      for (const mat of matieresList) {
        const keywords = mat.toLowerCase().split(/[\s-]+/).filter(k => k.length > 3);
        if (keywords.some(k => msgLower.includes(k))) {
          detectedMatiere = mat;
          const data = getMatiereData(exam, serie || "", mat);
          for (const ch of data?.chapitres ?? []) {
            if (ch !== "Autre" && msgLower.includes(ch.toLowerCase().slice(0, 10))) {
              detectedChapitre = ch;
              break;
            }
          }
          break;
        }
      }

      const res = await fetch("/api/prep-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({
          systemPrompt,
          message: userMsg,
          history: messages.slice(-6),
          matiere: detectedMatiere,
          chapitre: detectedChapitre,
          examen: exam,
          serie: serie || "",
        }),
      });
      if (res.status === 503) {
        const d = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: d.error ?? t("prep.coach.rateLimited") }]);
        setRetrySeconds(5);
        return;
      }

      const data = await res.json();
      const rawMsg = res.ok ? (data.message ?? t("prep.coach.noResponseFallback")) : (data.error ?? t("prep.coach.limitReached"));
      setMessages(prev => [...prev, { role: "assistant", content: nettoyer(rawMsg) }]);
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

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
      {isPreview && <PreviewBanner />}
      {/* Coach Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/prep/dashboard")}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
            title="Retour au tableau de bord"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#005bbf] to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base leading-tight">Coach IA PREP</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Disponible 24/7
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Conseils personnalisés · Objectif {exam} {profile?.serie ? `(${profile.serie})` : ""} · J-{days}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const prenom = profile?.prenom ?? t("prep.coach.defaultName");
            const greeting = [
              t("prep.coach.greetingLine1", { prenom }),
              t("prep.coach.greetingLine2", { days, exam }),
              t("prep.coach.greetingLine3"),
            ].join("\n\n");
            setMessages([{ role: "assistant", content: greeting }]);
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
          title="Réinitialiser la discussion"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          <span>Effacer</span>
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto bg-white/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#005bbf] to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                  <span className="material-symbols-outlined text-[17px]">smart_toy</span>
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-[#005bbf] text-white shadow-xs rounded-tr-xs font-medium"
                    : "bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-xs"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#005bbf] to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
              <span className="material-symbols-outlined text-[17px]">smart_toy</span>
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

      {/* Suggestion Chips */}
      {messages.length <= 2 && !sending && (
        <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-hide shrink-0">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(s)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-[#005bbf] transition-all whitespace-nowrap shadow-xs active:scale-95 shrink-0"
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      {/* Retry banner if throttled */}
      {lastUserMsg && !sending && (
        <div className="pt-2 shrink-0">
          <button
            onClick={retryMessage}
            disabled={retrySeconds > 0}
            className="w-full py-2.5 rounded-xl font-bold text-xs border border-orange-200 bg-orange-50 text-[#FF6B00] hover:bg-orange-100 transition-all disabled:opacity-50"
          >
            {retrySeconds > 0 ? t("prep.coach.retryIn", { seconds: retrySeconds }) : t("prep.coach.retry")}
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="pt-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs focus-within:border-[#005bbf] focus-within:ring-2 focus-within:ring-blue-100 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("prep.coach.inputPlaceholder")}
            disabled={sending}
            className="flex-1 px-3 py-2 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-xs active:scale-95 shrink-0"
            title="Envoyer"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
