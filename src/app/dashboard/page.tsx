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

  const firstName = fullName.split(" ")[0];

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 flex justify-between items-center px-6 py-4">
        <img src="/images/gsn-logo.jpg" alt="GSN" style={{width:"140px", height:"auto", background:"transparent", mixBlendMode:"multiply"}} />
        <div className="flex items-center gap-3">
          <Link href="/score" className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <span className="text-on-primary text-sm font-bold">{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-8">

        {/* Hero greeting */}
        <section className="space-y-3">
          <p className="text-sm text-on-surface-variant font-medium">Tableau de bord</p>
          <h1 className="text-[2.2rem] font-extrabold tracking-tight text-on-background leading-tight">
            Bonjour,<br /><span className="text-primary">{firstName} 👋</span>
          </h1>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-primary font-bold text-sm">{score} pts GSN</span>
          </div>
        </section>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        {errorMessage && <p className="text-error text-sm">{errorMessage}</p>}

        {/* Feature bento */}
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/learn" className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 border-primary space-y-3 hover:shadow-md transition-all active:scale-[0.98]">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">school</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">GSN Learn</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Formations IA</p>
              </div>
            </Link>
            <Link href="/missions" className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 border-secondary space-y-3 hover:shadow-md transition-all active:scale-[0.98]">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[20px]">assignment</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">GSN Work</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Missions & emplois</p>
              </div>
            </Link>
          </div>
          <Link href="/wallet" className="block bg-gradient-to-br from-primary to-primary-container p-5 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-on-primary">GSN Pay</h3>
                <p className="text-xs text-on-primary/80">Suis tes gains et paiements</p>
              </div>
              <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            </div>
          </Link>
        </section>

        {/* Recommended missions */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Pour toi</h2>
            <Link href="/missions" className="text-primary text-xs font-bold hover:underline">Voir tout</Link>
          </div>

          {!loading && recommendedMissions.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant mb-2 block">search_off</span>
              <p className="text-on-surface-variant text-sm">Aucune mission recommandée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedMissions.map((mission) => (
                <div key={mission.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">business</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm leading-tight">{mission.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{mission.description}</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-sm shrink-0">{mission.reward} pts</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Score passport CTA */}
        <Link href="/score" className="flex items-center justify-between bg-surface-container-low rounded-2xl p-5 hover:bg-surface-container transition-colors active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">Skill Passport</p>
              <p className="text-xs text-on-surface-variant">Voir mon score & certifications</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">arrow_forward_ios</span>
        </Link>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/dashboard" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/learn" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">school</span>
          <span className="text-[10px] font-medium mt-0.5">Apprendre</span>
        </Link>
        <Link href="/missions" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
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
