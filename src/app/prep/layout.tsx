"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/prep/dashboard",   icon: "home",         label: "Accueil"     },
  { href: "/prep/generer",     icon: "auto_awesome",  label: "Générer"     },
  { href: "/prep/programme",   icon: "menu_book",     label: "Programme"   },
  { href: "/prep/progression", icon: "trending_up",   label: "Progrès"     },
  { href: "/prep/classement",  icon: "leaderboard",   label: "Classement"  },
];

export default function PrepLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/prep" || pathname === "/prep/onboarding";

  return (
    <div data-section="prep" className="min-h-screen bg-surface flex flex-col">
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(24px)", borderColor: "rgba(99,102,241,0.12)", boxShadow: "0 -4px 20px rgba(79,70,229,0.06)" }}>
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-95"
                  style={{ background: active ? "rgba(99,102,241,0.08)" : "transparent" }}>
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      color: active ? "#6366F1" : "#9396B8",
                    }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: active ? "#6366F1" : "#9396B8" }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
