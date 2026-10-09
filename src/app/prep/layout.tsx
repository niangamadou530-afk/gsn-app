"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { SettingsMenu } from "@/components/SettingsMenu";
import { GsnLogo } from "@/components/GsnLogo";
import { TourProvider } from "@/components/TourProvider";

interface StudentInfo {
  prenom: string | null;
  exam_type: string;
  serie: string | null;
}

const NAV_ITEMS = [
  { href: "/prep/dashboard", icon: "home", label: "Accueil" },
  { href: "/prep/epreuves", icon: "menu_book", label: "Annales" },
  { href: "/prep/generer", icon: "auto_awesome", label: "Réviser" },
  { href: "/prep/coach", icon: "smart_toy", label: "Coach IA" },
  { href: "/prep/progression", icon: "trending_up", label: "Progrès" },
];

export default function PrepLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);

  // Routes where the authenticated dashboard navigation is hidden
  const normalizedPath = pathname?.replace(/\/+$/, "") || "/prep";
  const isPublicLanding = normalizedPath === "/prep" || normalizedPath === "/prep/onboarding";

  useEffect(() => {
    if (isPublicLanding) return;

    let isMounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && !isPublicLanding) return;

        if (user) {
          const { data } = await supabase
            .from("prep_students")
            .select("prenom, exam_type, serie")
            .eq("user_id", user.id)
            .maybeSingle();

          if (isMounted && data) {
            setStudent(data);
          }
        }
      } catch (err) {
        console.error("PrepLayout load error:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pathname, isPublicLanding]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const annalesHref = student?.exam_type === "BFEM" ? "/prep/bfem" : "/prep/epreuves";

  return (
    <TourProvider studentProfile={student}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-[#FF6B00]/15 selection:text-[#FF6B00]">
      {/* Top Navbar for authenticated PREP app (Desktop & Tablet) */}
      {!isPublicLanding && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Brand Zone */}
            <div className="flex items-center gap-3">
              <Link href="/prep/dashboard" className="flex items-center gap-2 group">
                <div className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <GsnLogo size={46} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">PREP</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#FF6B00]">
                    {student?.exam_type ?? "2027"}
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop & Tablet Navigation Links (adaptatifs pour éviter tout débordement à 768px) */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5 shrink-0">
              <Link
                href="/prep/dashboard"
                className={`px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all shrink-0 ${
                  pathname === "/prep/dashboard"
                    ? "bg-slate-100 text-[#005bbf]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="md:inline lg:hidden">Accueil</span>
                <span className="hidden lg:inline">Tableau de bord</span>
              </Link>
              <Link
                href={annalesHref}
                className={`px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all shrink-0 ${
                  pathname.startsWith("/prep/epreuves") || pathname.startsWith("/prep/bfem")
                    ? "bg-slate-100 text-[#005bbf]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="md:inline lg:hidden">Annales</span>
                <span className="hidden lg:inline">Annales & Corrigés</span>
              </Link>
              <Link
                href="/prep/generer"
                className={`px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all shrink-0 ${
                  pathname.startsWith("/prep/generer") || pathname.startsWith("/prep/quiz") || pathname.startsWith("/prep/flashcards")
                    ? "bg-slate-100 text-[#005bbf]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span className="md:inline lg:hidden">Réviser</span>
                <span className="hidden lg:inline">Entraînement IA</span>
              </Link>
              <Link
                href="/prep/coach"
                className={`px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all shrink-0 ${
                  pathname.startsWith("/prep/coach")
                    ? "bg-slate-100 text-[#005bbf]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Coach IA
              </Link>
              <Link
                href="/prep/classement"
                className={`px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all shrink-0 ${
                  pathname.startsWith("/prep/classement")
                    ? "bg-slate-100 text-[#005bbf]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Classement
              </Link>
              <Link
                href="/prep/orientation"
                className={`px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all shrink-0 ${
                  pathname.startsWith("/prep/orientation")
                    ? "bg-slate-100 text-[#005bbf]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Orientation
              </Link>
            </nav>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/prep/parent"
                className="inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Espace Parents"
              >
                <span className="material-symbols-outlined text-[17px]">family_restroom</span>
                <span className="hidden sm:inline">Parents</span>
              </Link>

              {/* Settings Menu Component (Profile, Sound, Legal, Support, Sign out) */}
              <SettingsMenu student={student} onSignOut={handleSignOut} />
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isPublicLanding ? "pb-24 md:pb-12" : ""}`}>
        {children}
      </main>

      {/* Mobile Bottom Tab Bar (Navigation Anchor) */}
      {!isPublicLanding && (
        <nav
          aria-label="Navigation mobile"
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
        >
          <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/prep/dashboard"
                  ? pathname === "/prep/dashboard"
                  : pathname.startsWith(item.href) ||
                    (item.href === "/prep/epreuves" && pathname.startsWith("/prep/bfem"));

              const targetHref = item.href === "/prep/epreuves" ? annalesHref : item.href;

              return (
                <Link
                  key={item.label}
                  href={targetHref}
                  className="flex flex-col items-center justify-center min-h-[48px] py-1 transition-transform active:scale-95"
                >
                  <div
                    className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      active ? "bg-orange-50 text-[#FF6B00]" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    {active && (
                      <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-tight mt-0.5 ${
                      active ? "text-[#FF6B00]" : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      </div>
    </TourProvider>
  );
}
