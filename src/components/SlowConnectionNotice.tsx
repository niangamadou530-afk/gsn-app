"use client";

interface SlowConnectionNoticeProps {
  onRetry: () => void;
  title?: string;
  description?: string;
}

export function SlowConnectionNotice({
  onRetry,
  title = "Connexion lente",
  description = "Le réseau met du temps à répondre. Vérifie ta connexion internet ou réessaie dans un instant."
}: SlowConnectionNoticeProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
        <span className="material-symbols-outlined text-[32px]">wifi_off</span>
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#005bbf] hover:bg-[#004ba0] text-white text-sm font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        <span>Réessayer</span>
      </button>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-6 w-32 bg-slate-200 rounded-full" />
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-48 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-24 w-52 bg-slate-100 rounded-2xl" />
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="h-5 w-24 bg-slate-200 rounded-md" />
          <div className="h-10 w-32 bg-slate-100 rounded-lg" />
          <div className="h-3 w-full bg-slate-100 rounded-full" />
        </div>
        <div className="h-44 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="h-5 w-24 bg-slate-200 rounded-md" />
          <div className="h-10 w-32 bg-slate-100 rounded-lg" />
          <div className="h-3 w-full bg-slate-100 rounded-full" />
        </div>
        <div className="h-44 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="h-5 w-24 bg-slate-200 rounded-md" />
          <div className="h-10 w-32 bg-slate-100 rounded-lg" />
          <div className="h-3 w-full bg-slate-100 rounded-full" />
        </div>
      </div>

      {/* Programme & highlights Skeleton */}
      <div className="h-64 bg-white rounded-3xl border border-slate-200/80 p-6" />
    </div>
  );
}
