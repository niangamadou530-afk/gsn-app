"use client";

import React, { useState } from "react";

export interface GsnLogoProps {
  size?: number; // taille de l'icône en pixels
  className?: string;
  withShadow?: boolean;
}

/**
 * Composant officiel pour le logo de GSN (Global Skills Network) - Partie K7
 * - Affiche UNIQUEMENT l'icône officielle (aucun texte, aucun slogan)
 * - Dimensions réservées, ratio carré strict (object-contain)
 * - Nette sur écrans haute densité (WebP / PNG)
 * - Repli élégant si le fichier venait à manquer
 */
export function GsnLogo({
  size = 44,
  className = "",
  withShadow = true,
}: GsnLogoProps) {
  const [usePng, setUsePng] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const imgSrc = usePng ? "/brand/gsn-icon.png" : "/brand/gsn-icon.webp";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        withShadow ? "drop-shadow-sm" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {!loadError ? (
        <img
          src={imgSrc}
          alt="GSN"
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          onError={() => {
            if (!usePng) setUsePng(true);
            else setLoadError(true);
          }}
          className="w-full h-full object-contain pointer-events-none select-none transition-transform"
          style={{ transform: "scaleX(1)" }}
        />
      ) : (
        <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-[#005bbf] to-[#1a73e8] flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
          GSN
        </div>
      )}
    </div>
  );
}
