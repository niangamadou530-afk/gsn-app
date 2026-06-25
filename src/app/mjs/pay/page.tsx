"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MjsNavbar from "@/app/mjs/beneficiaire/MjsNavbar";

type Transaction = {
  id: string;
  titre: string;
  montant: number;
  created_at: string;
};

const CREDIT_THRESHOLD = 40; // 40 points = 2 certifications

export default function MjsPayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/mjs/beneficiaire/connexion");
        return;
      }
      setUserId(user.id);

      // Fetch passports to calculate score (20 points per certification)
      const { data: passports } = await supabase
        .from("mjs_skill_passports")
        .select("id")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs");

      const nbCertifs = passports ? passports.length : 0;
      setScore(nbCertifs * 20);

      // Fetch transactions
      const { data: txsData } = await supabase
        .from("mjs_transactions")
        .select("id, titre, montant, created_at")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .order("created_at", { ascending: false });

      const safeTxs = (txsData ?? []) as Transaction[];
      setTransactions(safeTxs);
      setBalance(safeTxs.reduce((sum, tx) => sum + (tx.montant ?? 0), 0));

      setLoading(false);
    }
    load();
  }, [router]);

  const handleRequestCredit = async () => {
    if (!userId || score < CREDIT_THRESHOLD) return;

    // Check if micro-credit has already been requested (prevent duplicates)
    const hasCredit = transactions.some((t) => t.titre.includes("Micro-crédit"));
    if (hasCredit) {
      alert("Votre demande de micro-crédit a déjà été accordée.");
      return;
    }

    setSubmittingCredit(true);
    try {
      const { data: newTx, error } = await supabase
        .from("mjs_transactions")
        .insert({
          tenant_id: "mjs",
          user_id: userId,
          titre: "Micro-crédit PNACIJ accordé",
          montant: 250000
        })
        .select();

      if (error) {
        console.error("Error requesting credit:", error);
        alert("Une erreur est survenue lors de la demande.");
      } else {
        alert("Félicitations ! Votre demande de micro-crédit de 250 000 FCFA a été acceptée et versée sur votre portefeuille.");
        if (newTx && newTx[0]) {
          const updatedTxs = [newTx[0] as Transaction, ...transactions];
          setTransactions(updatedTxs);
          setBalance(updatedTxs.reduce((sum, tx) => sum + tx.montant, 0));
        }
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setSubmittingCredit(false);
    }
  };

  const eligible = score >= CREDIT_THRESHOLD;
  const progressPct = Math.min(100, Math.round((score / CREDIT_THRESHOLD) * 100));

  const hasRequestedCredit = transactions.some((t) => t.titre.includes("Micro-crédit"));

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-32">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <span className="text-xl font-bold tracking-tight text-primary">GSN Pay</span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#00853f] bg-emerald-500/10 px-2.5 py-1 rounded-full">
          Portefeuille MJS
        </span>
      </header>

      <div className="pt-24 px-6 max-w-2xl mx-auto space-y-6">
        {/* Wallet Balance Hero Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#004493] p-8 shadow-lg shadow-primary/25 text-center text-white">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Solde du Portefeuille</span>
            <h1 className="text-4.5xl font-black tracking-tight mb-6">
              {balance.toLocaleString("fr-FR")} FCFA
            </h1>
            <p className="text-xs text-white/80 max-w-xs leading-relaxed">
              Ce solde représente les allocations versées par le Ministère et les financements accordés.
            </p>
          </div>
        </section>

        {/* Micro-credit Application Eligibility Section */}
        <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Financement de Projet PNACIJ</h2>
              <p className="text-xs text-on-surface-variant">Micro-crédit jeune entrepreneur</p>
            </div>
            {hasRequestedCredit ? (
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-[11px] font-bold">Accordé</span>
              </div>
            ) : eligible ? (
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span className="text-[11px] font-bold">Éligible</span>
              </div>
            ) : (
              <div className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-xl">
                <span className="text-[11px] font-bold">Verrouillé</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-on-surface-variant">Seuil d'éligibilité (Certifications)</span>
              <span className="text-primary">{Math.min(score, CREDIT_THRESHOLD)} / {CREDIT_THRESHOLD} pts</span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {hasRequestedCredit ? (
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-xs text-emerald-800 leading-relaxed">
              Votre financement de **250 000 FCFA** a été versé. Utilisez-le pour acquérir des outils professionnels ou démarrer votre activité dans les secteurs cibles.
            </div>
          ) : eligible ? (
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-primary/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Crédit Disponible</p>
                <p className="text-lg font-extrabold text-primary">250 000 FCFA</p>
              </div>
              <button
                onClick={handleRequestCredit}
                disabled={submittingCredit}
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
              >
                {submittingCredit ? "Versement..." : "Demander le micro-crédit"}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low rounded-2xl text-xs text-on-surface-variant leading-relaxed">
              Il vous reste <strong className="text-primary">{(CREDIT_THRESHOLD - score) / 20} parcours certifié(s)</strong> à valider pour débloquer le financement d'amorçage de **250 000 FCFA**.
            </div>
          )}
        </section>

        {/* History Transactions List */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface">Historique des transactions</h2>
          {transactions.length === 0 ? (
            <div className="bg-surface-container-lowest p-10 text-center rounded-3xl border border-outline-variant/20 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl mb-3 block">receipt_long</span>
              Aucun versement enregistré sur ce compte.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isCredit = tx.montant > 0;
                return (
                  <div
                    key={tx.id}
                    className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 flex items-center justify-between hover:bg-surface-container-low transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center ${
                          isCredit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        <span className="material-symbols-outlined">
                          {isCredit ? "call_received" : "call_made"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{tx.titre}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-extrabold text-sm ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                        {isCredit ? "+" : ""}{tx.montant.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <MjsNavbar />
    </main>
  );
}
