"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrepError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Prep module error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center mb-4 shadow-sm">
        <span className="material-symbols-outlined text-[32px]">warning</span>
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
        Une interruption est survenue
      </h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        La page n&apos;a pas pu se charger correctement. Vous pouvez réessayer immédiatement ou retourner au tableau de bord.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#005bbf] text-white font-bold text-sm shadow-md hover:bg-[#004493] active:scale-95 transition-all"
        >
          Réessayer le chargement
        </button>
        <Link
          href="/prep"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm shadow-xs hover:bg-slate-50 transition-all"
        >
          Retour à l&apos;accueil PREP
        </Link>
      </div>
    </div>
  );
}
