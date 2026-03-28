"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string | number;
  amount: number;
  created_at: string;
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return `Aujourd'hui, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return `Hier, ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => { loadWalletData(); }, []);

  async function loadWalletData() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { router.replace("/login"); return; }

    const uid = userData.user.id;

    // Load transactions + score in parallel
    const [txRes, profileRes] = await Promise.all([
      supabase.from("transactions").select("id, amount, created_at")
        .eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("users").select("score").eq("id", uid).single(),
    ]);

    if (txRes.error) { setErrorMessage(txRes.error.message); }
    else {
      const txs = (txRes.data ?? []) as Transaction[];
      setTransactions(txs);
      setBalance(txs.reduce((sum, tx) => sum + (tx.amount ?? 0), 0));
    }
    if (profileRes.data) setScore(profileRes.data.score ?? 0);
    setLoading(false);
  }

  const monthlyTotal = transactions
    .filter(tx => new Date(tx.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, tx) => sum + Math.max(0, tx.amount), 0);

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">

      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-sm shadow-blue-900/5 flex justify-between items-center px-6 py-4">
        <img src="/images/gsn-logo.jpg" alt="GSN" style={{width:"140px", height:"auto", background:"transparent", mixBlendMode:"multiply"}} />
        <Link href="/score" className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </Link>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-8">

        {/* Hero wallet card */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container p-8 shadow-lg shadow-primary/20">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary-fixed/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-on-primary/80 text-sm font-medium tracking-wider uppercase mb-2">Solde Total</span>
            <h1 className="text-4xl font-extrabold text-on-primary tracking-tight mb-8">
              {balance.toLocaleString("fr-FR")} pts
            </h1>
            <div className="flex gap-4 w-full">
              <button className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95">
                <span className="material-symbols-outlined">add_circle</span>
                Ajouter
              </button>
              <button className="flex-1 bg-surface-container-lowest text-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95">
                <span className="material-symbols-outlined">payments</span>
                Retirer
              </button>
            </div>
          </div>
        </section>

        {/* Micro-credit section */}
        <section className="bg-surface-container-low p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-tertiary-fixed rounded-xl text-tertiary">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface">Micro-crédit</h3>
                {score >= 50 ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-xs font-bold text-emerald-600">Éligible</span>
                  </div>
                ) : (
                  <span className="text-xs text-on-surface-variant">{score}/50 pts requis</span>
                )}
              </div>
            </div>
            <button className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all ${score >= 50 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
              {score >= 50 ? "Demander" : "Verrouillé"}
            </button>
          </div>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Boostez votre activité avec nos solutions de financement basées sur votre score GSN.
          </p>
        </section>

        {/* Stats bento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-primary space-y-1.5">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Revenus mensuel</p>
            <p className="text-xl font-extrabold text-on-surface">{monthlyTotal.toLocaleString("fr-FR")} pts</p>
            <div className="flex items-center text-emerald-600 text-xs font-bold gap-0.5">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              Ce mois
            </div>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border-l-4 border-tertiary space-y-1.5">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Score GSN</p>
            <p className="text-xl font-extrabold text-on-surface">{score} pts</p>
            <div className="flex items-center text-tertiary text-xs font-bold">
              {score >= 50 ? "Niveau Expert" : "En progression"}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Historique</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3 block">receipt_long</span>
              Aucune transaction pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-[0_4px_24px_rgba(25,28,35,0.04)] hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCredit ? "bg-emerald-50 text-emerald-600" : "bg-surface-container-high text-on-surface-variant"}`}>
                        <span className="material-symbols-outlined">{isCredit ? "call_received" : "call_made"}</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{isCredit ? "Mission terminée" : "Dépense"}</p>
                        <p className="text-xs text-on-surface-variant font-medium">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isCredit ? "text-emerald-600" : "text-on-surface"}`}>
                        {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")} pts
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        {isCredit ? "Crédit" : "Débit"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {errorMessage && <p className="text-error text-sm">{errorMessage}</p>}
        </section>
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
        <Link href="/missions" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[10px] font-medium mt-0.5">Missions</span>
        </Link>
        <Link href="/wallet" className="flex flex-col items-center text-primary relative after:content-[''] after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full active:scale-90 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
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
