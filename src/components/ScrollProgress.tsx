"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerReducedMotion() {
  return false;
}

/**
 * Composant ScrollProgress
 * Fine barre orange (3 px) en haut de page, sous l'en-tête (sticky à top: 4rem / 64px)
 * Défilement passif optimisé via requestAnimationFrame sans re-render React à chaque frame
 * Masqué si prefers-reduced-motion est activé
 */
export function ScrollProgress({ className = "" }: { className?: string } = {}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );

  useEffect(() => {
    if (reducedMotion) return;

    const barEl = document.getElementById("prep-scroll-progress-bar");
    if (!barEl) return;

    let ticking = false;

    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const ratio = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;

      if (barEl) {
        barEl.style.transform = `scaleX(${ratio})`;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={
        className ||
        "sticky top-16 z-40 w-full h-[3px] bg-transparent pointer-events-none overflow-hidden"
      }
    >
      <div
        id="prep-scroll-progress-bar"
        className="w-full h-full bg-[#FF6B00] origin-left will-change-transform"
        style={{
          transform: "scaleX(0)",
          transition: "transform 60ms linear",
        }}
      />
    </div>
  );
}
