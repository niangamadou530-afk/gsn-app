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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [fullName, setFullName] = useState("Utilisateur");
  const [score, setScore] = useState(0);
  const [recommendedMissions, setRecommendedMissions] = useState<Mission[]>([]);

  useEffect(() => {
    checkSessionAndLoad();
  }, []);

  async function checkSessionAndLoad() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const userId = userData.user.id;
    const { data, error } = await supabase
      .from("users")
      .select("name, score")
      .eq("id", userId)
      .single();

    if (error) {
      setErrorMessage(
        "Connexion réussie, mais impossible de charger le profil utilisateur."
      );
    } else {
      setFullName(data?.name ?? "Utilisateur");
      setScore(data?.score ?? 0);
    }

    const currentScore = data?.score ?? 0;
    let missionsQuery = supabase
      .from("missions")
      .select("id, title, description, reward")
      .order("reward", { ascending: false });

    if (currentScore > 50) {
      missionsQuery = missionsQuery.gt("reward", 100);
    } else {
      missionsQuery = missionsQuery.lte("reward", 100);
    }

    const { data: missionsData, error: missionsError } = await missionsQuery.limit(3);

    if (missionsError) {
      setErrorMessage("Impossible de charger les missions recommandées.");
    } else {
      setRecommendedMissions((missionsData ?? []) as Mission[]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-gray-500">Tableau de bord GSN</p>
            <h1 className="text-2xl font-bold text-[#1a73e8]">
              Bonjour {fullName}
            </h1>
          </div>
          <div className="h-20 w-20 rounded-full bg-[#1a73e8] text-white flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-xs">Score</div>
              <div className="text-xl font-bold">{score}</div>
            </div>
          </div>
        </header>

        {loading ? <p>Chargement...</p> : null}
        {errorMessage ? <p className="text-red-600 mb-4">{errorMessage}</p> : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow border border-blue-100">
            <h2 className="text-lg font-semibold text-[#1a73e8]">GSN Learn</h2>
            <p className="text-sm text-gray-600 mt-1">
              Progresse avec les contenus pédagogiques.
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow border border-blue-100">
            <h2 className="text-lg font-semibold text-[#1a73e8]">GSN Work</h2>
            <p className="text-sm text-gray-600 mt-1">
              Trouve des missions et développe ton expérience.
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow border border-blue-100">
            <h2 className="text-lg font-semibold text-[#1a73e8]">GSN Pay</h2>
            <p className="text-sm text-gray-600 mt-1">
              Suis tes gains et tes paiements en temps réel.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#1a73e8] mb-3">Recommended for you</h2>
          {recommendedMissions.length === 0 ? (
            <div className="bg-white rounded-xl p-5 shadow border border-blue-100">
              <p className="text-gray-600">Aucune mission recommandée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedMissions.map((mission) => (
                <article
                  key={mission.id}
                  className="bg-white rounded-xl p-5 shadow border border-blue-100"
                >
                  <h3 className="font-semibold text-[#1a73e8]">{mission.title}</h3>
                  <p className="text-gray-700 text-sm mt-1">{mission.description}</p>
                  <p className="font-medium mt-2">{mission.reward} points</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 shadow-[0_-4px_20px_rgba(26,115,232,0.08)]">
        <div className="max-w-4xl mx-auto grid grid-cols-5 text-sm">
          <Link href="/dashboard" className="py-3 text-center text-[#1a73e8] font-semibold">
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
