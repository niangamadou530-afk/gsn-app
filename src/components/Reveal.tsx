"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PREP_MOTION } from "@/lib/prep-config";

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

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
  withUnderline?: boolean; // Trace un soulignement orange de gauche à droite
  underlineClassName?: string;
}

/**
 * Composant d'apparition au défilement (Scroll Reveal) enrichi
 * - Lit ses réglages (distanceY, initialScale, durationMs, staggerMs, easing) dans PREP_MOTION
 * - Rendu SSR et avant montage : toujours visible (opacity: 1, scale: 1, transform: none)
 * - Après montage : seuls les éléments sous la ligne de flottaison passent à masqué
 * - Une seule fois par élément
 * - will-change: transform, opacity appliqué uniquement pendant la transition, puis retiré ("auto")
 * - Jamais de filter ni blur, uniquement transform et opacity
 * - Détection immédiate des éléments dépassés lors d'un saut ou défilement rapide
 * - Option withUnderline : soulignement orange avec transform: scaleX, origine à gauche
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  withUnderline = false,
  underlineClassName = "h-[3px] bg-[#FF6B00] rounded-full mt-2.5",
}: RevealProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentEl = elementRef.current;
    if (!currentEl) return;

    const rect = currentEl.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Déjà visible ou au-dessus de la ligne de flottaison
    if (rect.top < windowHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    if (rect.bottom <= 0) {
      setIsVisible(true);
      return;
    }

    // Élément réellement sous la ligne de flottaison
    setIsVisible(false);

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const triggerReveal = () => {
      setIsVisible(true);
      setIsAnimating(true);
      // Retirer will-change après la fin de la transition
      const totalTime = PREP_MOTION.durationMs + Math.max(delay, 0) + 100;
      setTimeout(() => {
        setIsAnimating(false);
      }, totalTime);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < windowHeight) {
            triggerReveal();
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 50px 0px",
      }
    );

    observer.observe(currentEl);

    const handleScrollCheck = () => {
      if (!elementRef.current) return;
      const r = elementRef.current.getBoundingClientRect();
      if (r.top < windowHeight + 60) {
        triggerReveal();
        observer.disconnect();
        window.removeEventListener("scroll", handleScrollCheck);
      }
    };
    window.addEventListener("scroll", handleScrollCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollCheck);
    };
  }, [delay]);

  // SSR ou avant hydratation
  if (!isMounted) {
    return (
      <div ref={elementRef} className={className}>
        {children}
        {withUnderline && (
          <div
            className={`w-16 origin-left ${underlineClassName}`}
            style={{ transform: "scaleX(1)" }}
          />
        )}
      </div>
    );
  }

  // Calcul selon PREP_MOTION
  const distY = PREP_MOTION.distanceY;
  const initialScale = PREP_MOTION.initialScale;
  const duration = PREP_MOTION.durationMs;
  const easing = PREP_MOTION.easing;

  const verticalOffset = direction === "down" ? -distY : direction === "none" ? 0 : distY;

  let opacityVal = isVisible ? 1 : 0;
  let transformVal = "none";
  let transitionVal = "none";

  if (reducedMotion) {
    transformVal = "none";
    opacityVal = isVisible ? 1 : 0;
    transitionVal = "opacity 200ms ease-out";
  } else {
    transformVal = isVisible
      ? "translateY(0) scale(1)"
      : `translateY(${verticalOffset}px) scale(${initialScale})`;
    const appliedDelay = isVisible ? Math.max(delay, 0) : 0;
    transitionVal = `opacity ${duration}ms ${easing} ${appliedDelay}ms, transform ${duration}ms ${easing} ${appliedDelay}ms`;
  }

  // Animation du soulignement si demandé
  const underlineScaleX = isVisible ? 1 : 0;
  const underlineTransition = reducedMotion
    ? "none"
    : `transform ${duration + 100}ms ${easing} ${Math.max(delay, 0) + 100}ms`;

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: opacityVal,
        transform: transformVal,
        transition: transitionVal,
        willChange: isAnimating ? "transform, opacity" : "auto",
      }}
    >
      {children}
      {withUnderline && (
        <div
          className={`w-16 origin-left ${underlineClassName}`}
          style={{
            transform: `scaleX(${underlineScaleX})`,
            transition: underlineTransition,
            willChange: isAnimating ? "transform" : "auto",
          }}
        />
      )}
    </div>
  );
}
