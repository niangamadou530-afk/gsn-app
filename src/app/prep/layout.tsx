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
    <div className="min-h-screen bg-surface flex flex-col">
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur border-t border-outline-variant/20">
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-95">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      color: active ? "#FF6B00" : "var(--color-on-surface-variant)",
                    }}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-on-surface-variant"}`}>
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
