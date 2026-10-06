"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminAuthPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium">Vérification en cours…</p>
      </div>
    </main>
  );
}
