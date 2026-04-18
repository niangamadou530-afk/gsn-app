"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/prep/dashboard",   icon: "home",         label: "Accueil"   },
  { href: "/prep/generer",     icon: "auto_awesome", label: "Générer"   },
  { href: "/prep/programme",   icon: "menu_book",    label: "Programme" },
  { href: "/prep/progression", icon: "trending_up",  label: "Progrès"   },
  { href: "/prep/classement",  icon: "leaderboard",  label: "Classement"},
];

export default function PrepLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav  = pathname === "/prep" || pathname === "/prep/onboarding";

  return (
    <div className="prep-dark min-h-screen flex flex-col" style={{ backgroundColor: "#0A0A0F" }}>
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
          style={{ backgroundColor: "rgba(10,10,15,0.92)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
            {NAV_ITEMS.map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-95">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      color: active ? "#00C9A7" : "#5A5A70",
                    }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: active ? "#00C9A7" : "#5A5A70" }}>
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
