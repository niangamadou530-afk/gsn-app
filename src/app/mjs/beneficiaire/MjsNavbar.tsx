"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MjsNavbar() {
  const pathname = usePathname() || "";

  const tabs = [
    {
      name: "Accueil",
      href: "/mjs/beneficiaire/dashboard",
      icon: "home",
      activePattern: /^\/mjs\/beneficiaire\/dashboard/
    },
    {
      name: "Apprendre",
      href: "/mjs/beneficiaire/parcours",
      icon: "school",
      activePattern: /^\/mjs\/beneficiaire\/parcours/
    },
    {
      name: "Offres",
      href: "/mjs/work",
      icon: "business_center",
      activePattern: /^\/mjs\/work/
    },
    {
      name: "Finances",
      href: "/mjs/pay",
      icon: "account_balance_wallet",
      activePattern: /^\/mjs\/pay/
    },
    {
      name: "Score",
      href: "/mjs/score",
      icon: "stars",
      activePattern: /^\/mjs\/score/
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav rounded-t-3xl shadow-[0_-4px_24px_rgba(25,28,35,0.06)] flex justify-around items-center px-4 pb-6 pt-3 border-t border-outline-variant/20 print:hidden">
      {tabs.map((tab) => {
        const isActive = tab.activePattern.test(pathname);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex flex-col items-center relative active:scale-95 transition-transform ${
              isActive
                ? "text-primary after:content-[''] after:absolute after:-bottom-1.5 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                : "text-outline hover:text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className="text-[10px] font-semibold mt-0.5">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
