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
        <div className="pt-2">
          <a
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-sm shadow-xs transition-colors block text-center"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
