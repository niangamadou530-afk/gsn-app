"use client";

import React, { useState } from "react";
import { TourGuideAttitude, PREP_GUIDE_NAME, PREP_GUIDE_TRANSPARENT } from "@/lib/prep-config";

export interface MascotGuideProps {
  attitude?: TourGuideAttitude;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  withShadow?: boolean;
  withHalo?: boolean;
  interactive?: boolean;
}

const SIZE_STYLES = {
  xs: { img: "w-10 h-10", box: "w-10 h-10", shadow: "w-8 h-2", px: 40 },
  sm: { img: "w-14 h-14 sm:w-16 sm:h-16", box: "w-14 h-14 sm:w-16 sm:h-16", shadow: "w-12 h-2.5", px: 64 },
  md: { img: "w-20 h-20 sm:w-24 sm:h-24", box: "w-20 h-20 sm:w-24 sm:h-24", shadow: "w-16 h-3", px: 96 },
  lg: { img: "w-28 h-28 sm:w-36 sm:h-36", box: "w-28 h-28 sm:w-36 sm:h-36", shadow: "w-24 h-4", px: 144 },
  xl: { img: "w-36 h-36 sm:w-44 sm:h-44", box: "w-36 h-36 sm:w-44 sm:h-44", shadow: "w-32 h-5", px: 176 },
};

/**
 * Composant réutilisable pour la mascotte Prépy
 * Supporte :
 * - Les 7 poses : idle, accueil, montre, encourage, felicite, reflechit, erreur
 * - Chargement différé, pas d'optimisation Next.js brute, pas d'inversion horizontale
 * - Repli automatique WebP -> PNG -> SVG vectoriel
 * - Ombres douces au sol en CSS et halos animés respectant prefers-reduced-motion
 */
export function MascotGuide({
  attitude = "accueil",
  size = "md",
  className = "",
  withShadow = true,
  withHalo = true,
  interactive = true,
}: MascotGuideProps) {
  const [loadError, setLoadError] = useState(false);
  const [usePngFallback, setUsePngFallback] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  const config = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isTransparent = PREP_GUIDE_TRANSPARENT[attitude] ?? true;

  // Déterminer la source de l'image
  const baseFilename = `guide-${attitude}`;
  const imageSrc = usePngFallback
    ? `/tour/${baseFilename}.png`
    : `/tour/${baseFilename}.webp`;

  const handleImageError = () => {
    if (!usePngFallback) {
      setUsePngFallback(true);
    } else {
      setLoadError(true);
    }
  };

  const handleClick = () => {
    if (!interactive) return;
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 450);
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          handleClick();
        }
      }}
      aria-label={`Prépy, la mascotte de GSN PREP (${attitude})`}
    >
      {/* Halo lumineux d'aura */}
      {withHalo && (
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#FF6B00]/25 via-blue-500/20 to-indigo-500/20 blur-md pointer-events-none transition-all duration-700 motion-reduce:hidden animate-pulse"
        />
      )}

      {/* Conteneur de l'image avec animation de flottement doux */}
      <div
        className={`relative z-10 transition-transform duration-300 ease-out ${
          interactive ? "cursor-pointer active:scale-95" : ""
        } ${isTapped ? "-translate-y-2.5 scale-105" : ""}`}
        style={{
          animation: "prepyFloat 3s ease-in-out infinite",
        }}
      >
        {!loadError ? (
          // Balise img standard requise (pas d'optimisation Next.js selon les consignes)
          <img
            src={imageSrc}
            alt="Prépy, la mascotte de GSN PREP"
            width={config.px}
            height={config.px}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className={`${config.img} object-contain pointer-events-none drop-shadow-md transition-opacity duration-200 ${
              !isTransparent
                ? "rounded-3xl p-1 bg-gradient-to-b from-blue-50 to-orange-50 border-2 border-white shadow-md ring-2 ring-[#005bbf]/20"
                : ""
            }`}
            style={{
              // Empêche absolument tout retournement horizontal
              transform: "scaleX(1)",
            }}
          />
        ) : (
          // Repli vectoriel immédiat si les fichiers d'images venaient à manquer
          <div
            className={`${config.box} rounded-2xl bg-gradient-to-b from-[#005bbf] to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white/60`}
          >
            🤖
          </div>
        )}
      </div>

      {/* Ombre ovale au sol en CSS suivant le flottement */}
      {withShadow && (
        <div
          aria-hidden="true"
          className={`${config.shadow} mx-auto mt-1 rounded-full bg-slate-900/15 blur-[2px] transition-all duration-300 motion-reduce:hidden pointer-events-none`}
          style={{
            animation: "prepyShadow 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Styles d'animation CSS natifs sans dépendance */}
      <style jsx>{`
        @keyframes prepyFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.015);
          }
        }
        @keyframes prepyShadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.25;
          }
          50% {
            transform: scale(0.85);
            opacity: 0.12;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
