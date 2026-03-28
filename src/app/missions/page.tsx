"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mission = {
  id: string | number;
  title: string;
  description: string;
  reward: number;
};

const FILTERS = ["Pour toi", "Courtes", "Longues", "Freelance", "Emplois"];
const SCORE_THRESHOLD = 40;

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [activeFilter, setActiveFilter] = useState("Pour toi");

  useEffect(() => { checkSessionAndLoad(); }, []);

  async function checkSessionAndLoad() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) { router.replace("/login"); return; }

    setUserId(sessionData.session.user.id);
    const uid = sessionData.session.user.id;

    const { data: profileData } = await supabase
      .from("users").select("score").eq("id", uid).single();
    if (profileData) setUserScore(profileData.score ?? 0);

    const { data, error } = await supabase
      .from("missions").select("id, title, description, reward").order("id", { ascending: false });
    if (error) setErrorMessage(error.message);
    else setMissions((data ?? []) as Mission[]);
    setLoading(false);
  }

  function getMatchPercentage(reward: number) {
    const scoreFactor = Math.min(40, Math.max(0, userScore * 0.8));
    const rewardFactor = Math.min(35, Math.max(0, reward * 0.2));
    return Math.min(99, Math.round(25 + scoreFactor + rewardFactor));
  }

  async function handleApply(missionId: string | number) {
    if (!userId) return;
    const { error } = await supabase.from("applications").insert({ user_id: userId, mission_id: missionId });
    if (error) { setErrorMessage(error.message); return; }
    alert("Candidature envoyée avec succès !");
  }

  const isUnlocked = userScore >= SCORE_THRESHOLD;

  const displayedMissions = (() => {
    if (activeFilter === "Pour toi") return missions.filter(m => userScore > 50 ? m.reward > 100 : m.reward <= 100);
    if (activeFilter === "Courtes") return missions.filter(m => m.reward <= 50);
    if (activeFilter === "Longues") return missions.filter(m => m.reward > 100);
    return missions;
  })();

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/images/gsn-logo-transparent.png" alt="GSN" style={{width:"140px", height:"auto", background:"transparent", mixBlendMode:"multiply"}} />
        </div>
        <Link href="/score" className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">stars</span>
        </Link>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-background mb-2">Missions</h1>
          <p className="text-on-surface-variant text-sm">Trouvez des opportunités qui matchent vos talents.</p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 -mx-6 px-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeFilter === f
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="relative">
            {/* Mission cards */}
            <div className={`space-y-4 ${!isUnlocked ? "filter blur-sm select-none pointer-events-none opacity-40" : ""}`}>
              {(isUnlocked ? displayedMissions : missions.slice(0, 2)).map((mission) => {
                const match = getMatchPercentage(mission.reward);
                return (
                  <div key={mission.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">business</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-base leading-tight text-on-background">{mission.title}</h3>
                          <p className="text-on-surface-variant text-sm mt-0.5">{mission.description}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${match >= 90 ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        {match}% Match
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10">
                      <span className="text-primary font-bold text-lg">{mission.reward.toLocaleString("fr-FR")} pts</span>
                      <button
                        onClick={() => handleApply(mission.id)}
                        className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                      >
                        Postuler
                      </button>
                    </div>
                  </div>
                );
              })}

              {isUnlocked && displayedMissions.length === 0 && (
                <div className="text-center py-10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-3 block">search_off</span>
                  Aucune mission pour ce filtre.
                </div>
              )}
            </div>

            {/* Lock overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center px-6 z-10">
                <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl shadow-blue-900/10 text-center max-w-xs border border-white/40">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-on-surface">Missions verrouillées</h2>
                  <p className="text-on-surface-variant text-sm mb-6">
                    Atteignez un score de <span className="text-primary font-bold">{SCORE_THRESHOLD} points</span> pour accéder aux missions.
                    <br/><span className="font-semibold text-on-surface">Score actuel : {userScore} pts</span>
                  </p>
                  <Link
                    href="/learn/onboarding"
                    className="block w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all text-center"
                  >
                    Améliorer mon score
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMessage && <p className="text-error text-sm mt-4">{errorMessage}</p>}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/learn" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">school</span>
          <span className="text-[10px] font-medium mt-0.5">Apprendre</span>
        </Link>
        <Link href="/missions" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
          <span className="text-[10px] font-medium mt-0.5">Missions</span>
        </Link>
        <Link href="/wallet" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-medium mt-0.5">Wallet</span>
        </Link>
        <Link href="/score" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">stars</span>
          <span className="text-[10px] font-medium mt-0.5">Score</span>
        </Link>
      </nav>
    </main>
  );
}
