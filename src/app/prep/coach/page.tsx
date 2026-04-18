"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres } from "@/data/programmes";

const A  = "#00C9A7";
const C  = "#111118";
const B  = "rgba(255,255,255,0.07)";
const T2 = "#A0A0B0";

const BAC_DATE  = "2026-06-30";
const BFEM_DATE = "2026-07-15";

function daysUntil(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }

type Message = { role: "user" | "assistant"; content: string };
type Profile = { prenom: string | null; exam_type: string; serie: string | null; ecole: string | null };

const SUGGESTIONS = [
  "Quelles matières prioriser ?",
  "Donne-moi un planning de révision",
  "Astuces pour le jour J",
  "Comment mémoriser plus vite ?",
];

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
      for (const [m, sc] of Object.entries(byMat))
        stats[m] = Math.round(sc.reduce((a, b) => a + b, 0) / sc.length);
      setQuizStats(stats);
      setLoading(false);

      const prenom = p?.prenom ?? "Élève";
      const exam   = p?.exam_type ?? "BAC";
      const days   = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
      setMessages([{
        role: "assistant",
        content: `Salut ${prenom} ! Je suis ton Coach IA GSN PREP 🎯\n\nJ-${days} avant le ${exam}. Je connais tes résultats et je suis là pour cibler tes révisions.\n\nComment puis-je t'aider ?`,
      }]);
    }
    load();
  }, [router]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || sending) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);
    try {
      const exam  = profile?.exam_type ?? "BAC";
      const serie = profile?.serie ?? "";
      const days  = daysUntil(exam === "BFEM" ? BFEM_DATE : BAC_DATE);
      const statsStr = Object.entries(quizStats).length > 0
        ? Object.entries(quizStats).map(([m, s]) => `${m}: ${s}%`).join(", ")
        : "Aucun quiz réalisé";

      const matieresList = getMatieres(exam, serie || undefined);
      let programmeContext = "";
      const msgLower = userMsg.toLowerCase();
      for (const mat of matieresList) {
        const keywords = mat.toLowerCase().split(/[\s-]+/).filter(k => k.length > 3);
        if (keywords.some(k => msgLower.includes(k))) {
          const chaps = getChapitres(exam, serie || "", mat).filter(c => c !== "Autre");
          if (chaps.length > 0)
            programmeContext = `\n\nPROGRAMME ${mat.toUpperCase()} :\n${chaps.map(c => `• ${c}`).join("\n")}`;
          break;
        }
      }

      const systemPrompt = `Tu es le Coach IA de ${profile?.prenom ?? "l'élève"}, préparant le ${exam}${serie ? " série " + serie : ""} au Sénégal.
J-${days} avant le ${exam}. Scores : ${statsStr}.
Tu parles toujours par le prénom. Conseils basés sur les vraies données. Motivant, précis, bienveillant.
Réponses courtes (3-5 phrases max). Tout en français.${programmeContext}`;

      const res  = await fetch("/api/prep-coach", {
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: A, borderTopColor: "transparent" }} />
    </div>
  );

  const showSuggestions = messages.length <= 1 && !sending;

  return (
    <main className="h-screen flex flex-col" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${B}`, backgroundColor: "rgba(10,10,15,0.95)" }}>
        <button onClick={() => router.push("/prep/dashboard")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-95"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <span className="material-symbols-outlined text-white text-[20px]">arrow_back</span>
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: "rgba(0,201,167,0.12)", border: "1px solid rgba(0,201,167,0.2)" }}>
          🤖
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-sm">Coach IA</p>
          <p className="text-xs font-medium" style={{ color: T2 }}>Personnel · GSN PREP</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: "rgba(0,201,167,0.08)", border: "1px solid rgba(0,201,167,0.15)" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: A }} />
          <span className="text-[10px] font-semibold" style={{ color: A }}>En ligne</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-0.5"
                style={{ backgroundColor: "rgba(0,201,167,0.12)", border: "1px solid rgba(0,201,167,0.2)" }}>🤖</div>
            )}
            <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={m.role === "user"
                ? { backgroundColor: A, color: "#003328", borderBottomRightRadius: 4 }
                : { backgroundColor: C, color: "white", border: `1px solid ${B}`, borderBottomLeftRadius: 4 }}>
              {m.content}
            </div>
          </div>
        ))}

        {/* Suggestions */}
        {showSuggestions && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-center mb-2" style={{ color: "#5A5A70" }}>Questions suggérées</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs font-medium px-3 py-2 rounded-full active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: C, border: `1px solid ${B}`, color: T2 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {sending && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: "rgba(0,201,167,0.12)", border: "1px solid rgba(0,201,167,0.2)" }}>🤖</div>
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: A, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 pb-6 flex items-end gap-3"
        style={{ borderTop: `1px solid ${B}`, backgroundColor: "rgba(10,10,15,0.95)" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Pose ta question au Coach..."
          rows={1}
          className="flex-1 px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none"
          style={{
            backgroundColor: C, color: "white",
            border: `1px solid ${B}`, maxHeight: 100,
          }}
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-30"
          style={{ backgroundColor: A }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#003328" }}>send</span>
        </button>
      </div>
    </main>
  );
}
