"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
}

/**
 * Composant d'apparition douce au défilement (Scroll Reveal)
 * - Rendu SSR et avant montage : toujours visible (opacity: 1, aucun masquage)
 * - Après montage : seuls les éléments situés sous la ligne de flottaison passent à l'état masqué
 * - Styles 100% en ligne pour opacity, transform et transition (garantie zéro purge CSS)
 * - Déplacement vertical uniquement de 14px (12 à 16px)
 * - Durée maximale de 380ms (<= 400ms)
 * - Décalage échelonné (delay) pour les cartes d'une même grille
 * - Si prefers-reduced-motion est actif : aucun déplacement (transform none), simple fondu d'opacité de 200ms
 * - IntersectionObserver avec seuil bas (0.05) et détection immédiate des éléments dépassés
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: RevealProps) {
  // isMounted passe à true au montage client uniquement
  const [isMounted, setIsMounted] = useState(false);
  // Par défaut visible pour SSR et avant hydratation
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mql.matches;
    setReducedMotion(prefersReduced);

    const currentEl = elementRef.current;
    if (!currentEl) return;

    // Détermination de la position par rapport au viewport
    const rect = currentEl.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Si l'élément est déjà visible dans l'écran ou déjà dépassé (au-dessus du pli) :
    // il reste visible sans transition masquée
    if (rect.top < windowHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    if (rect.bottom <= 0) {
      // Déjà dépassé plus haut (cas de défilement rapide ou saut)
      setIsVisible(true);
      return;
    }

    // L'élément est réellement sous la ligne de flottaison : on l'initialise à masqué
    setIsVisible(false);

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Si l'élément entre dans l'écran ou a déjà été dépassé
          if (entry.isIntersecting || entry.boundingClientRect.top < windowHeight) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 40px 0px",
      }
    );

    observer.observe(currentEl);

    // Écouteur de secours pour défilement rapide / saut d'ancre
    const handleScrollCheck = () => {
      if (!elementRef.current) return;
      const r = elementRef.current.getBoundingClientRect();
      if (r.top < windowHeight + 50) {
        setIsVisible(true);
        observer.disconnect();
        window.removeEventListener("scroll", handleScrollCheck);
      }
    };
    window.addEventListener("scroll", handleScrollCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollCheck);
    };
  }, []);

  // Pendant le SSR ou avant le premier rendu effectif : contenu 100% visible
  if (!isMounted) {
    return (
      <div ref={elementRef} className={className}>
        {children}
      </div>
    );
  }

  // Calcul des styles en ligne purs
  const verticalOffset = direction === "down" ? -14 : direction === "none" ? 0 : 14;

  let opacityVal = isVisible ? 1 : 0;
  let transformVal = "none";
  let transitionVal = "none";

  if (reducedMotion) {
    // Mode réduit : simple fondu d'opacité de 200ms, AUCUN déplacement
    transformVal = "none";
    opacityVal = isVisible ? 1 : 0;
    transitionVal = "opacity 200ms ease-out";
  } else {
    // Mode standard : déplacement vertical de 14px et opacité, durée <= 400ms (360ms)
    transformVal = isVisible ? "translateY(0)" : `translateY(${verticalOffset}px)`;
    const appliedDelay = isVisible ? Math.min(Math.max(delay, 0), 250) : 0;
    transitionVal = `opacity 360ms cubic-bezier(0.16, 1, 0.3, 1) ${appliedDelay}ms, transform 360ms cubic-bezier(0.16, 1, 0.3, 1) ${appliedDelay}ms`;
  }

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: opacityVal,
        transform: transformVal,
        transition: transitionVal,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
