"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Skill = { domain: string; score: number; date: string; cert_id: string };

export default function ScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) { router.replace("/login"); return; }

    const { data } = await supabase
      .from("users")
      .select("score, skills")
      .eq("id", sessionData.session.user.id)
      .single();

    setScore(data?.score ?? 0);
    setSkills(Array.isArray(data?.skills) ? data.skills : []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-6">Score & Skill Passport</h1>

        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : (
          <>
            {/* Score card */}
            <div className="bg-white rounded-xl p-6 shadow border border-blue-100 flex items-center gap-5 mb-6">
              <div className="h-20 w-20 rounded-full bg-[#1a73e8] text-white flex flex-col items-center justify-center shrink-0 shadow-lg">
                <span className="text-xs font-semibold opacity-80">Score</span>
                <span className="text-2xl font-black">{score}</span>
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">Ton score GSN</p>
                <p className="text-sm text-gray-500 mt-0.5">+20 points par certificat obtenu</p>
              </div>
            </div>

            {/* Skill Passport */}
            <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
              <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg text-[#1a73e8]">Skill Passport</h2>
                  <p className="text-sm text-gray-500">{skills.length} compétence{skills.length !== 1 ? "s" : ""} certifiée{skills.length !== 1 ? "s" : ""}</p>
                </div>
                <Link
                  href="/learn/onboarding"
                  className="text-sm text-[#1a73e8] font-semibold hover:underline"
                >
                  + Obtenir une certif
                </Link>
              </div>

              {skills.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 mb-4">Aucune compétence certifiée pour le moment.</p>
                  <Link
                    href="/learn/onboarding"
                    className="inline-block rounded-lg bg-[#1a73e8] text-white px-5 py-2.5 font-semibold text-sm hover:opacity-90"
                  >
                    Commencer un parcours
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {skills.map((skill, i) => (
                    <li key={i} className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center font-black text-lg shrink-0">
                        {skill.score}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{skill.domain}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(skill.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold rounded-full px-3 py-1">
                          🏆 Certifié
                        </span>
                        <p className="text-xs text-gray-400 font-mono mt-1">{skill.cert_id}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
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
