"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  async function checkSessionAndLoad() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      router.replace("/login");
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("score")
      .eq("id", sessionData.session.user.id)
      .single();

    setScore(data?.score ?? 0);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-4">Score</h1>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow border border-blue-100 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xl font-bold">
              {score}
            </div>
            <p className="text-gray-700">Ton score GSN actuel.</p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 shadow-[0_-4px_20px_rgba(26,115,232,0.08)]">
        <div className="max-w-4xl mx-auto grid grid-cols-5 text-sm">
          <Link href="/dashboard" className="py-3 text-center text-gray-600">Accueil</Link>
          <Link href="/learn" className="py-3 text-center text-gray-600">Apprendre</Link>
          <Link href="/missions" className="py-3 text-center text-gray-600">Missions</Link>
          <Link href="/wallet" className="py-3 text-center text-gray-600">Wallet</Link>
          <Link href="/score" className="py-3 text-center text-[#1a73e8] font-semibold">Score</Link>
        </div>
      </nav>
    </main>
  );
}
