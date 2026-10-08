export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#005bbf] flex items-center justify-center mx-auto text-2xl font-bold">
          404
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">
          Page introuvable
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          La page demandée n&apos;existe pas ou a été déplacée.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <a
            href="/prep"
            className="flex-1 py-3 px-4 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-sm shadow-xs transition-colors block text-center active:scale-95"
          >
            Accueil PREP
          </a>
          <a
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors block text-center active:scale-95 border border-slate-200"
          >
            Accueil GSN
          </a>
        </div>
      </div>
    </div>
  );
}
