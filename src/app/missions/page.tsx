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

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "recommended">("all");

  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  async function checkSessionAndLoad() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      router.replace("/login");
      return;
    }

    setUserId(sessionData.session.user.id);
    const currentUserId = sessionData.session.user.id;

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("score")
      .eq("id", currentUserId)
      .single();

    if (!profileError) {
      setUserScore(profileData?.score ?? 0);
    }

    const { data, error } = await supabase
      .from("missions")
      .select("id, title, description, reward")
      .order("id", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMissions((data ?? []) as Mission[]);
    }

    setLoading(false);
  }

  const displayedMissions =
    activeFilter === "recommended"
      ? missions.filter((mission) =>
          userScore > 50 ? mission.reward > 100 : mission.reward <= 100
        )
      : missions;

  function getMatchPercentage(reward: number) {
    const scoreFactor = Math.min(40, Math.max(0, userScore * 0.8));
    const rewardFactor = Math.min(35, Math.max(0, reward * 0.2));
    const base = 25;
    return Math.min(99, Math.round(base + scoreFactor + rewardFactor));
  }

  async function handleApply(missionId: string | number) {
    if (!userId) return;

    const { error } = await supabase.from("applications").insert({
      user_id: userId,
      mission_id: missionId,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    alert("Candidature envoyee avec succes.");
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-6">Missions</h1>

        {loading ? <p>Chargement...</p> : null}
        {errorMessage ? <p className="text-red-600 mb-4">{errorMessage}</p> : null}

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`rounded-lg px-4 py-2 font-semibold ${
              activeFilter === "all"
                ? "bg-[#1a73e8] text-white"
                : "bg-white text-[#1a73e8] border border-blue-200"
            }`}
          >
            Toutes
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("recommended")}
            className={`rounded-lg px-4 py-2 font-semibold ${
              activeFilter === "recommended"
                ? "bg-[#1a73e8] text-white"
                : "bg-white text-[#1a73e8] border border-blue-200"
            }`}
          >
            Recommended
          </button>
        </div>

        <section className="space-y-4">
          {displayedMissions.map((mission) => (
            <article
              key={mission.id}
              className="bg-white rounded-xl p-5 shadow border border-blue-100"
            >
              <h2 className="text-lg font-semibold text-[#1a73e8]">{mission.title}</h2>
              <p className="text-gray-700 mt-1">{mission.description}</p>
              <p className="font-medium mt-2">{mission.reward} points</p>
              <p className="text-sm text-[#1a73e8] font-semibold mt-1">
                Match: {getMatchPercentage(mission.reward)}%
              </p>
              <button
                onClick={() => handleApply(mission.id)}
                className="mt-4 rounded-lg bg-[#1a73e8] px-4 py-2 text-white font-semibold hover:opacity-90"
              >
                Postuler
              </button>
            </article>
          ))}
          {!loading && displayedMissions.length === 0 ? (
            <p className="text-gray-600">Aucune mission pour ce filtre.</p>
          ) : null}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 shadow-[0_-4px_20px_rgba(26,115,232,0.08)]">
        <div className="max-w-4xl mx-auto grid grid-cols-5 text-sm">
          <Link href="/dashboard" className="py-3 text-center text-gray-600">
            Accueil
          </Link>
          <Link href="/learn" className="py-3 text-center text-gray-600">
            Apprendre
          </Link>
          <Link href="/missions" className="py-3 text-center text-[#1a73e8] font-semibold">
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
