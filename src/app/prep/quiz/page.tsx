"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function QuizRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "quiz");
    router.replace(`/prep/generer?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div
        className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3"
        style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }}
      />
      <p className="text-xs font-bold text-slate-500">Ouverture de l&apos;espace Quiz & Entraînement...</p>
    </div>
  );
}

export default function QuizRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <QuizRedirectInner />
    </Suspense>
  );
}
