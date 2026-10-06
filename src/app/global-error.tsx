"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#005bbf] flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Une interruption est survenue
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            L&apos;application a rencontré un incident passager. Cliquez ci-dessous pour relancer la session.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3 px-4 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-sm shadow-xs transition-colors"
            >
              Recharger l&apos;application
            </button>
            <a
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors block"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
