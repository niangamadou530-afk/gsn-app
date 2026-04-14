"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/prep/dashboard",   icon: "home",        label: "Accueil"   },
  { href: "/prep/quiz",        icon: "psychology",  label: "Quiz IA"   },
  { href: "/prep/simulateur",  icon: "assignment",  label: "Examen"    },
  { href: "/prep/progression", icon: "trending_up", label: "Progrès"   },
  { href: "/prep/orientation", icon: "explore",     label: "Orientation" },
];

export default function PrepLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {children}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur border-t border-outline-variant/20 flex justify-around items-center px-2 pb-6 pt-3">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== "/prep/dashboard" && item.href !== "/prep/quiz" && pathname.startsWith(item.href)) || (item.href === "/prep/quiz" && pathname === "/prep/quiz");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform min-w-[56px]"
              style={{ color: active ? "#FF6B00" : undefined }}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${active ? "" : "text-outline"}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-semibold ${active ? "" : "text-outline"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
