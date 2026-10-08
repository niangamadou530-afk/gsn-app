"use client";

interface TourOverlayProps {
  targetRect: DOMRect | null;
  isLoading: boolean;
  padding?: number;
}

export function TourOverlay({
  targetRect,
  isLoading,
  padding = 8,
}: TourOverlayProps) {
  // Coordonnées du trou de projecteur avec marge
  const spotlight = targetRect
    ? {
        x: Math.max(0, targetRect.left - padding),
        y: Math.max(0, targetRect.top - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        rx: 14,
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
            {spotlight && !isLoading && (
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
          fill="rgba(15, 23, 42, 0.76)"
          mask="url(#tour-spotlight-mask)"
        />

        {/* Halo orange discret (#FF6B00) autour de l'élément cible */}
        {spotlight && !isLoading && (
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
            strokeDasharray="6 2"
            style={{
              filter: "drop-shadow(0 0 8px rgba(255, 107, 0, 0.45))",
            }}
          />
        )}
      </svg>

      {/* 2. Indicateur de chargement entre les pages */}
      {isLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-[9992] pointer-events-none space-y-3">
          <div className="w-9 h-9 rounded-full border-3 border-white/20 border-t-[#FF6B00] animate-spin" />
          <p className="text-xs text-white/90 font-bold tracking-wide">
            Chargement de la page...
          </p>
        </div>
      )}
    </div>
  );
}
