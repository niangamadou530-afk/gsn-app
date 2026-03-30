"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  budget_fcfa: number;
  duration_type: string;
  min_gsn_score: number;
  status: string;
  created_at: string;
};

const FILTERS = ["Tous", "Court terme", "Long terme", "Freelance"];

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [applied, setApplied] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) { router.replace("/login"); return; }

    const uid = sessionData.session.user.id;
    setUserId(uid);

    const { data: profile } = await supabase.from("users").select("score").eq("id", uid).single();
    setUserScore(profile?.score ?? 0);

    const { data, error } = await supabase
      .from("employer_missions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) setErrorMessage(error.message);
    else setMissions((data ?? []) as Mission[]);

    const { data: apps } = await supabase
      .from("applications").select("mission_id").eq("user_id", uid);
    setApplied(new Set((apps ?? []).map((a: { mission_id: string }) => a.mission_id)));

    setLoading(false);
  }

  async function handleApply(missionId: string) {
    if (!userId) return;
    const { error } = await supabase.from("applications").insert({ user_id: userId, mission_id: missionId });
    if (error) { setErrorMessage(error.message); return; }
    setApplied(prev => new Set([...prev, missionId]));
  }

  function durationLabel(type: string) {
    if (type === "short") return "Court terme";
    if (type === "long") return "Long terme";
    return "Freelance";
  }

  function durationIcon(type: string) {
    if (type === "short") return "schedule";
    if (type === "long") return "calendar_month";
    return "laptop_mac";
  }

  const displayedMissions = missions.filter(m => {
    if (activeFilter === "Court terme") return m.duration_type === "short";
    if (activeFilter === "Long terme") return m.duration_type === "long";
    if (activeFilter === "Freelance") return m.duration_type === "freelance";
    return true;
  });

  const isUnlocked = userScore >= 40;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold tracking-tight text-primary">GSN</span>
        <Link href="/score" className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">stars</span>
        </Link>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-1">Missions</h1>
          <p className="text-on-surface-variant text-sm">Opportunités publiées par des employeurs GSN.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-6 px-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeFilter === f ? "bg-primary text-on-primary shadow-md shadow-primary/20" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
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
            <div className={`space-y-4 ${!isUnlocked ? "filter blur-sm select-none pointer-events-none opacity-40" : ""}`}>
              {(isUnlocked ? displayedMissions : displayedMissions.slice(0, 2)).map(mission => (
                <div key={mission.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(25,28,35,0.06)]">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{durationIcon(mission.duration_type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-tight text-on-surface">{mission.title}</h3>
                      {mission.domain && <p className="text-on-surface-variant text-sm mt-0.5">{mission.domain}</p>}
                    </div>
                    <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {durationLabel(mission.duration_type)}
                    </span>
                  </div>

                  {/* Description */}
                  {mission.description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{mission.description}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mission.budget_fcfa > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-surface-container-low text-on-surface-variant font-medium px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">payments</span>
                        {mission.budget_fcfa.toLocaleString("fr-FR")} FCFA
                      </span>
                    )}
                    {mission.min_gsn_score > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-surface-container-low text-on-surface-variant font-medium px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Score min. {mission.min_gsn_score}%
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="pt-3 border-t border-outline-variant/10">
                    {applied.has(mission.id) ? (
                      <div className="flex items-center gap-1.5 text-sm text-primary font-semibold">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Candidature envoyée
                      </div>
                    ) : userScore < mission.min_gsn_score ? (
                      <div className="flex items-center gap-1.5 text-sm text-outline font-medium">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Score {mission.min_gsn_score}% requis (vous avez {userScore}%)
                      </div>
                    ) : (
                      <button onClick={() => handleApply(mission.id)}
                        className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
                        Postuler
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isUnlocked && displayedMissions.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-3 block text-outline-variant">search_off</span>
                  <p className="font-medium">Aucune mission active pour ce filtre.</p>
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
                    Atteignez un score de <span className="text-primary font-bold">40%</span> pour accéder aux missions.
                    <br /><span className="font-semibold text-on-surface">Score actuel : {userScore}%</span>
                  </p>
                  <Link href="/learn/onboarding"
                    className="block w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all text-center">
                    Améliorer mon score
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMessage && <p className="text-error text-sm mt-4">{errorMessage}</p>}
      </div>

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
