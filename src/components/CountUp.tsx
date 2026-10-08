"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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

const emptySubscribe = () => () => {};

interface CountUpProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // ms, défaut 900ms
  className?: string;
  minWidth?: string; // ex: "3.5ch" ou "4ch"
}

/**
 * Composant CountUp
 * Compte de 0 à la valeur finale en 900ms, une seule fois quand le chiffre entre dans le viewport
 * Avec tabular-nums et largeur minimale pour éviter tout saut de mise en page
 * SSR et prefers-reduced-motion affichent directement la valeur finale
 */
export function CountUp({
  end,
  prefix = "",
  suffix = "",
  duration = 900,
  className = "",
  minWidth = "auto",
}: CountUpProps) {
  const hasMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const [currentValue, setCurrentValue] = useState(end);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const startTime = performance.now();
      const startVal = 0;
      setCurrentValue(startVal);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing doux cubic out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (end - startVal) * easeOut);
        setCurrentValue(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCurrentValue(end);
        }
      };

      requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver === "undefined") {
      setCurrentValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startAnimation();
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [end, duration, reducedMotion]);

  // SSR ou prefers-reduced-motion
  if (!hasMounted || reducedMotion) {
    return (
      <span
        ref={containerRef}
        className={`tabular-nums inline-block ${className}`}
        style={{ minWidth }}
      >
        {prefix}
        {end}
        {suffix}
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={`tabular-nums inline-block ${className}`}
      style={{ minWidth }}
    >
      {prefix}
      {currentValue}
      {suffix}
    </span>
  );
}
