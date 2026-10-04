"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#005bbf] flex items-center justify-center mb-4 shadow-sm">
        <span className="material-symbols-outlined text-[32px]">sync_problem</span>
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
        GSN · Reconnexion en cours
      </h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
        Une erreur inattendue est survenue. Cliquez ci-dessous pour rafraîchir la session.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#005bbf] text-white font-bold text-sm shadow-md hover:bg-[#004493] active:scale-95 transition-all"
        >
          Recharger l&apos;application
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm shadow-xs hover:bg-slate-50 transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
