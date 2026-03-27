"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Skill = { domain: string; title?: string; score: number; date: string; cert_id: string; weeks?: number };

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  // Parse YYYY-MM-DD safely (avoid UTC timezone shift)
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${d} ${months[m - 1]} ${y}`;
}

const CREDIT_THRESHOLD = 50;

export default function ScorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData.session) { router.replace("/login"); return; }

    const { data } = await supabase
      .from("users")
      .select("score, skills")
      .eq("id", sessionData.session.user.id)
      .single();

    setScore(data?.score ?? 0);
    setSkills(Array.isArray(data?.skills) ? data.skills : []);
    setLoading(false);
  }

  const eligible = score >= CREDIT_THRESHOLD;
  const pointsNeeded = CREDIT_THRESHOLD - score;

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-6">Score &amp; Skill Passport</h1>

        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : (
          <>
            {/* ── Score card ── */}
            <div className="bg-white rounded-xl p-6 shadow border border-blue-100 flex items-center gap-5 mb-4">
              <div className="h-20 w-20 rounded-full bg-[#1a73e8] text-white flex flex-col items-center justify-center shrink-0 shadow-lg">
                <span className="text-xs font-semibold opacity-80">Score</span>
                <span className="text-2xl font-black">{score}</span>
              </div>
              <div>
                <p className="font-bold text-lg text-gray-800">Ton score GSN</p>
                <p className="text-sm text-gray-500">+5 points par certificat obtenu</p>
              </div>
            </div>

            {/* ── Micro-crédit eligibility ── */}
            <div className={`rounded-xl p-5 mb-6 shadow border ${eligible ? "bg-green-50 border-green-200" : "bg-white border-blue-100"}`}>
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${eligible ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {eligible ? "✓" : "🔒"}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-[#1a73e8]">Éligibilité Micro-Crédit GSN</h2>
                  {eligible ? (
                    <>
                      <p className="text-sm text-green-700 font-semibold mt-0.5">Tu es éligible au micro-crédit GSN !</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Avec {score} points et {skills.length} certification{skills.length > 1 ? "s" : ""}, tu peux accéder à un financement pour tes projets professionnels.
                      </p>
                      <Link href="/wallet" className="inline-block mt-3 text-sm font-semibold text-green-700 underline hover:no-underline">
                        Voir mes options de financement →
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mt-0.5">Pas encore éligible au micro-crédit</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{score} pts</span>
                          <span>{CREDIT_THRESHOLD} pts requis</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#1a73e8] h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (score / CREDIT_THRESHOLD) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          Encore <strong>{pointsNeeded} points</strong> à obtenir · {Math.ceil(pointsNeeded / 5)} certificat{pointsNeeded > 5 ? "s" : ""} à valider
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Skill Passport ── */}
            <div className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden">
              <div className="p-5 border-b border-blue-50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg text-[#1a73e8]">Skill Passport</h2>
                  <p className="text-sm text-gray-500">{skills.length} compétence{skills.length !== 1 ? "s" : ""} certifiée{skills.length !== 1 ? "s" : ""} · Visible par les employeurs</p>
                </div>
                <Link href="/learn/onboarding" className="text-sm text-[#1a73e8] font-semibold hover:underline">
                  + Obtenir une certif
                </Link>
              </div>

              {skills.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-gray-400 mb-4">Aucune compétence certifiée pour le moment.</p>
                  <Link href="/learn/onboarding" className="inline-block rounded-lg bg-[#1a73e8] text-white px-5 py-2.5 font-semibold text-sm hover:opacity-90">
                    Commencer un parcours
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {skills.map((skill, i) => (
                    <li key={i} className="p-4 flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex flex-col items-center justify-center shrink-0">
                        <span className="font-black text-lg leading-none">{skill.score}%</span>
                        <span className="text-xs opacity-60">score</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{skill.domain}</p>
                        {skill.title && skill.title !== skill.domain && (
                          <p className="text-xs text-gray-500 truncate">{skill.title}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          <span className="text-xs text-gray-400">📅 {formatDate(skill.date)}</span>
                          {skill.weeks && <span className="text-xs text-gray-400">⏱ {skill.weeks} semaine{skill.weeks > 1 ? "s" : ""}</span>}
                        </div>
                        <p className="font-mono text-xs text-gray-400 mt-1">{skill.cert_id}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold rounded-full px-3 py-1 shrink-0">
                        🏆 Certifié
                      </span>
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
