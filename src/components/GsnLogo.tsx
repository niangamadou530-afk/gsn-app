"use client";

import React, { useState } from "react";
import Image from "next/image";

export interface GsnLogoProps {
  variant?: "icon-only" | "full";
  size?: number; // taille de l'icône en pixels
  className?: string;
  withShadow?: boolean;
}

/**
 * Composant réutilisable pour le logo officiel de GSN (Global Skills Network)
 * - variante 'icon-only' : icône officielle seule (défaut ~40px)
 * - variante 'full' : icône officielle + texte "Global Skills Network"
 * - Repli automatique WebP -> PNG -> Carré dégradé SVG
 */
export function GsnLogo({
  variant = "icon-only",
  size = 40,
  className = "",
  withShadow = true,
}: GsnLogoProps) {
  const [usePng, setUsePng] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const imgSrc = usePng ? "/brand/gsn-icon.png" : "/brand/gsn-icon.webp";

  const iconElement = (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${
        withShadow ? "drop-shadow-sm" : ""
      }`}
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
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{ transform: "scaleX(1)" }}
        />
      ) : (
        <div
          className="w-full h-full rounded-xl bg-gradient-to-tr from-[#005bbf] to-[#1a73e8] flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20"
        >
          GSN
        </div>
      )}
    </div>
  );

  if (variant === "icon-only") {
    return <div className={`inline-flex items-center ${className}`}>{iconElement}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {iconElement}
      <div className="flex flex-col leading-tight">
        <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
          Global Skills Network
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#005bbf]">
          Plateforme Nationale
        </span>
      </div>
    </div>
  );
}
