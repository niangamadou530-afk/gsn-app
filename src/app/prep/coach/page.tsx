"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

      const systemPrompt = `Tu es le Coach IA personnel de ${profile?.prenom ?? "l'élève"}, préparant le ${exam}${serie ? " série " + serie : ""} au Sénégal.
J-${days} avant le ${exam}. Scores par matière : ${statsStr}.
Tu parles toujours par le prénom. Tu donnes des conseils basés sur les vraies données.
Tu es motivant, bienveillant, précis. Réponses courtes (3-5 phrases max). Tout en français.`;

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

  return (
    <main className="h-screen bg-surface text-on-surface flex flex-col">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/prep/dashboard")} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
          🤖
        </div>
        <div>
          <p className="font-bold text-on-surface text-sm">Coach IA</p>
          <p className="text-xs text-on-surface-variant">Personnel · GSN PREP</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-surface-container-lowest text-on-surface shadow-sm rounded-bl-sm"
              }`}
              style={m.role === "user" ? { backgroundColor: "#FF6B00" } : {}}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-surface-container-lowest rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-outline-variant/20 px-4 py-3 pb-6 flex items-end gap-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Pose ta question au Coach..."
          rows={1}
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary resize-none text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-95 flex-shrink-0"
          style={{ backgroundColor: "#FF6B00" }}>
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </main>
  );
}
