"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/prep/dashboard",   icon: "home",         label: "Accueil"    },
  { href: "/prep/resumeur",    icon: "auto_stories", label: "Résumeur"   },
  { href: "/prep/flashcards",  icon: "style",        label: "Flashcards" },
  { href: "/prep/simulateur",  icon: "quiz",         label: "Examen"     },
  { href: "/prep/progression", icon: "trending_up",  label: "Progrès"    },
];

export default function PrepLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {children}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur border-t border-outline-variant/20 flex justify-around items-center px-2 pb-6 pt-3">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== "/prep/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center active:scale-90 transition-transform"
              style={{ color: active ? "#FF6B00" : undefined }}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`material-symbols-outlined ${active ? "" : "text-outline"}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium mt-0.5 ${active ? "" : "text-outline"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
