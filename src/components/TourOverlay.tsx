"use client";

import React, { useState, useEffect } from "react";
import { MascotGuide } from "./MascotGuide";

interface TourOverlayProps {
  targetRect: DOMRect | null;
  isLoading: boolean;
  padding?: number;
  onSkip?: () => void;
  status?: "idle" | "navigating" | "locating" | "ready" | "fallback";
}

/**
 * Voile sombre interactif et projecteur doux (halo orange subtil)
 * RÈGLES CRITIQUES PHASE 1 :
 * - Jamais de voile sans sortie : bouton "Passer" (min 44px) présent en permanence
 * - Masque SVG avec trou arrondi autour de la cible
 * - Si le chargement dépasse 3 secondes, disparition automatique vers la carte
 */
export function TourOverlay({
  targetRect,
  isLoading,
  padding = 8,
  onSkip,
  status = "ready",
}: TourOverlayProps) {
  const [showExitFallback, setShowExitFallback] = useState(false);

  // Sécurité absolue : si le chargement dure plus de 1.8s, forcer l'affichage du bouton d'annulation
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isLoading || status === "navigating" || status === "locating") {
      t = setTimeout(() => {
        setShowExitFallback(true);
      }, 1500);
    } else {
      setShowExitFallback(false);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [isLoading, status]);

  // Coordonnées du projecteur
  const spotlight = targetRect
    ? {
        x: Math.max(0, targetRect.left - padding),
        y: Math.max(0, targetRect.top - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        rx: 16,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-auto">
      {/* 1. Masque SVG pour le trou arrondi dans le fond assombri */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-spotlight-mask" maskUnits="userSpaceOnUse">
            {/* Fond blanc complet (opaque pour le masque) */}
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            {/* Découpe noire arrondie autour de l'élément ciblé */}
            {spotlight && !isLoading && status === "ready" && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={spotlight.rx}
                ry={spotlight.rx}
                fill="#000000"
              />
            )}
          </mask>
        </defs>

        {/* Rectangle sombre couvrant tout l'écran avec le masque appliqué */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />

        {/* Halo orange discret (#FF6B00) autour de l'élément cible */}
        {spotlight && !isLoading && status === "ready" && (
          <rect
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.width}
            height={spotlight.height}
            rx={spotlight.rx}
            ry={spotlight.rx}
            fill="none"
            stroke="#FF6B00"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            className="motion-reduce:stroke-dasharray-none"
            style={{
              filter: "drop-shadow(0 0 10px rgba(255, 107, 0, 0.45))",
            }}
          />
        )}
      </svg>

      {/* 2. Bouton d'échappatoire permanent "Passer" (44px) accessible en tout temps */}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="fixed top-4 right-4 z-[9999] min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white/90 hover:text-white text-xs font-black backdrop-blur-md border border-white/15 shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          title="Quitter la visite guidée (Touche Échap)"
          aria-label="Quitter la visite guidée"
        >
          <span>Passer</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* 3. Indicateur de transition avec Prépy en train de réfléchir */}
      {isLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[9992] pointer-events-none p-4 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-md flex flex-col items-center text-center space-y-3 pointer-events-auto max-w-xs animate-in fade-in zoom-in-95 duration-200">
            <MascotGuide attitude="reflechit" size="sm" withShadow={false} />
            <div className="space-y-1">
              <p className="text-sm text-white font-extrabold tracking-wide">
                Prépy explore la page...
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Arrivée sur la section en cours
              </p>
            </div>
            <div className="w-7 h-7 rounded-full border-3 border-white/15 border-t-[#FF6B00] animate-spin" />

            {/* Bouton de secours si le réseau est lent */}
            {showExitFallback && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="mt-2 text-xs text-orange-400 hover:text-orange-300 font-bold underline underline-offset-4 py-1"
              >
                Passer cette étape
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
