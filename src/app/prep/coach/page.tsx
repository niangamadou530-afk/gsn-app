"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres } from "@/data/programmes";

const BAC_DATE  = "2026-06-30";
const BFEM_DATE = "2026-07-15";

function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

type Message = { role: "user" | "assistant"; content: string };
type Profile = { prenom: string | null; exam_type: string; serie: string | null; ecole: string | null };

export default function CoachPage() {
  const router = useRouter();
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [quizStats, setQuizStats] = useState<Record<string, number>>({});
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: stu }, { data: results }] = await Promise.all([
        supabase.from("prep_students").select("prenom, exam_type, serie, ecole").eq("user_id", user.id).maybeSingle(),
        supabase.from("quiz_results").select("matiere, score, total").eq("user_id", user.id),
      ]);

      const p = stu as Profile | null;
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
      setLoading(false);

      const prenom = p?.prenom ?? "Élève";
      const exam   = p?.exam_type ?? "BAC";
      const days   = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
      setMessages([{
        role: "assistant",
        content: `Salut ${prenom} ! Je suis ton Coach IA GSN PREP 🎯\n\nIl te reste J-${days} avant le ${exam}. Je connais tes résultats et je suis là pour t'aider à cibler tes révisions.\n\nComment puis-je t'aider aujourd'hui ?`,
      }]);
    }
    load();
  }, [router]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      const exam  = profile?.exam_type ?? "BAC";
      const serie = profile?.serie ?? "";
      const days  = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
      const statsStr = Object.entries(quizStats).length > 0
        ? Object.entries(quizStats).map(([m, s]) => `${m}: ${s}%`).join(", ")
        : "Aucun quiz réalisé encore";

      // Détection de matière dans le message pour injecter le programme officiel
      const matieresList = getMatieres(exam, serie || undefined);
      let programmeContext = "";
      const msgLower = userMsg.toLowerCase();
      for (const mat of matieresList) {
        const keywords = mat.toLowerCase().split(/[\s-]+/).filter(k => k.length > 3);
        if (keywords.some(k => msgLower.includes(k))) {
          const chapitres = getChapitres(exam, serie || "", mat).filter(c => c !== "Autre");
          if (chapitres.length > 0) {
            programmeContext = `\n\nPROGRAMME OFFICIEL ${mat.toUpperCase()} (${exam}${serie ? " " + serie : ""}) :\n${chapitres.map(c => `• ${c}`).join("\n")}`;
          }
          break;
        }
      }

      const systemPrompt = `Tu es le Coach IA personnel de ${profile?.prenom ?? "l'élève"}, préparant le ${exam}${serie ? " série " + serie : ""} au Sénégal.
J-${days} avant le ${exam}. Scores par matière : ${statsStr}.
Tu parles toujours par le prénom. Tu donnes des conseils basés sur les vraies données.
Tu es motivant, bienveillant, précis. Réponses courtes (3-5 phrases max). Tout en français.${programmeContext}`;

      const res = await fetch("/api/prep-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, message: userMsg, history: messages.slice(-6) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message ?? "Désolé, je n'ai pas pu répondre." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion, réessaie." }]);
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );

  const suggestions = [
    "Quelles matières dois-je réviser en priorité ?",
    "Donne-moi un planning de révision",
    "Comment améliorer mon score en Maths ?",
    "Quelles sont les astuces pour le jour J ?",
  ];

  const showSuggestions = messages.length <= 1 && !sending;

  return (
    <main className="h-screen bg-surface text-on-surface flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0" style={{ background: "linear-gradient(135deg, #6d28d9, #4c1d95)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.push("/prep/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 active:bg-white/25">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-white/20"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
            🤖
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Coach IA</p>
            <p className="text-xs text-white/60">Personnel · GSN PREP</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">En ligne</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-0.5"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>🤖</div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                m.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-surface-container-lowest text-on-surface rounded-bl-sm border border-outline-variant/10"
              }`}
              style={m.role === "user" ? { background: "linear-gradient(135deg,#FF6B00,#FF9500)" } : {}}>
              {m.content}
            </div>
          </div>
        ))}

        {/* Suggestions */}
        {showSuggestions && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-on-surface-variant text-center">Questions suggérées</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); }}
                  className="text-xs font-medium px-3 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface active:scale-[0.97] transition-transform text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {sending && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>🤖</div>
            <div className="bg-surface-container-lowest rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-outline-variant/10">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: "#8b5cf6", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-outline-variant/20 px-4 py-3 pb-6 flex items-end gap-3 bg-surface">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Pose ta question au Coach..."
          rows={1}
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary resize-none text-sm"
          style={{ maxHeight: 100 }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-95 flex-shrink-0 shadow-md"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF9500)" }}>
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </main>
  );
}
