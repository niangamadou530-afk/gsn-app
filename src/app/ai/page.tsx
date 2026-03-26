"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function AiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("Utilisateur");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", data.user.id)
      .single();

    setFullName(profile?.name ?? "Utilisateur");
    setMessages([
      {
        id: 1,
        role: "assistant",
        text: "Bonjour, je suis GSN AI. Comment puis-je t'aider aujourd'hui ?",
      },
    ]);
    setLoading(false);
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: trimmed,
    };

    setSending(true);
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const result = await response.json();
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text:
          response.ok && result?.reply
            ? result.reply
            : result?.error || "Erreur lors de la génération de la réponse.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Impossible de contacter le serveur AI.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-2">GSN AI</h1>
        <p className="text-gray-600 mb-4">Bonjour {fullName}</p>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <section className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
            <div className="p-4 border-b border-blue-100 bg-[#f7fbff]">
              <h2 className="text-lg font-semibold text-[#1a73e8]">Chat GSN AI</h2>
            </div>

            <div className="h-[420px] overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      item.role === "user"
                        ? "bg-[#1a73e8] text-white rounded-br-md"
                        : "bg-[#eef5ff] text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-blue-100 flex items-center gap-2 bg-[#f7fbff]"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ecris ton message..."
                className="flex-1 rounded-lg border border-blue-200 px-4 py-2 outline-none focus:border-[#1a73e8]"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-[#1a73e8] text-white px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-70"
              >
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </form>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 shadow-[0_-4px_20px_rgba(26,115,232,0.08)]">
        <div className="max-w-4xl mx-auto grid grid-cols-5 text-sm">
          <Link href="/dashboard" className="py-3 text-center text-gray-600">
            Accueil
          </Link>
          <Link href="/learn" className="py-3 text-center text-gray-600">
            Apprendre
          </Link>
          <Link href="/missions" className="py-3 text-center text-gray-600">
            Missions
          </Link>
          <Link href="/wallet" className="py-3 text-center text-gray-600">
            Wallet
          </Link>
          <Link href="/score" className="py-3 text-center text-gray-600">
            Score
          </Link>
        </div>
      </nav>
    </main>
  );
}
