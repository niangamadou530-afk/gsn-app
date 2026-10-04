"use client";

import Link from "next/link";
import { isPreviewEnvironment, PREVIEW_BANNER_TEXT } from "@/lib/previewAuth";

export function PreviewBanner() {
  if (!isPreviewEnvironment()) return null;

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold shadow-xs">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">visibility</span>
        <span>{PREVIEW_BANNER_TEXT}</span>
      </div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-[#005bbf] hover:underline shrink-0"
      >
        <span>Se connecter avec un compte</span>
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
      </Link>
    </div>
  );
}
