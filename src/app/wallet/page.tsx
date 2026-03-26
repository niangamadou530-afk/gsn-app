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

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadWalletData();
  }, []);

  async function loadWalletData() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const safeTransactions = (data ?? []) as Transaction[];
    setTransactions(safeTransactions);

    const total = safeTransactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    setBalance(total);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-4">Wallet</h1>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div className="bg-white rounded-xl p-5 shadow border border-blue-100 mb-4">
              <p className="text-sm text-gray-500">Solde total</p>
              <p className="text-3xl font-bold text-[#1a73e8]">{balance} GSN</p>
            </div>

            {errorMessage ? (
              <p className="text-red-600 mb-4">{errorMessage}</p>
            ) : null}

            <div className="bg-white rounded-xl p-5 shadow border border-blue-100">
              <h2 className="text-lg font-semibold text-[#1a73e8] mb-3">
                Transactions
              </h2>

              {transactions.length === 0 ? (
                <p className="text-gray-600">Aucune transaction trouvée.</p>
              ) : (
                <ul className="space-y-3">
                  {transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-2"
                    >
                      <span className="font-medium">{tx.amount} GSN</span>
                      <span className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString("fr-FR")}
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
          <Link href="/wallet" className="py-3 text-center text-[#1a73e8] font-semibold">Wallet</Link>
          <Link href="/score" className="py-3 text-center text-gray-600">Score</Link>
        </div>
      </nav>
    </main>
  );
}
