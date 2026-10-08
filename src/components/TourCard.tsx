"use client";

import { useMemo } from "react";
import { PrepTourStep, TourPlacement } from "@/lib/prep-config";

interface TourCardProps {
  step: PrepTourStep;
  currentStepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}

export function TourCard({
  step,
  currentStepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
  isLastStep,
}: TourCardProps) {
  // Calcul du positionnement dynamique de la bulle
  const style = useMemo(() => {
    if (!targetRect || typeof window === "undefined") {
      return null; // Positionnement centré
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(380, vw - 32);
    const cardEstHeight = 220; // estimation haute pour le placement
    const gap = 14;

    // Sur très petit écran mobile (largeur < 520px), ancrage flottant en bas ou en haut sécurisé
    if (vw < 520) {
      const isTargetInTopHalf = targetRect.top + targetRect.height / 2 < vh / 2;
      if (isTargetInTopHalf) {
        // Cible en haut -> bulle calée en dessous avec marge
        const topPos = Math.min(vh - cardEstHeight - 16, Math.max(76, targetRect.bottom + gap));
        return {
          top: `${topPos}px`,
          left: "16px",
          right: "16px",
          maxWidth: "calc(100vw - 32px)",
        };
      } else {
        // Cible en bas -> bulle calée au dessus
        const topPos = Math.max(76, targetRect.top - cardEstHeight - gap);
        return {
          top: `${topPos}px`,
          left: "16px",
          right: "16px",
          maxWidth: "calc(100vw - 32px)",
        };
      }
    }

    // Écrans moyens et larges : calcul selon placement ("haut", "bas", "gauche", "droite", "auto")
    let placement: TourPlacement = step.placement || "auto";
    if (placement === "auto") {
      // Si plus de place en bas, bas ; sinon haut
      const spaceBelow = vh - targetRect.bottom;
      const spaceAbove = targetRect.top;
      placement = spaceBelow >= cardEstHeight + gap ? "bas" : spaceAbove >= cardEstHeight + gap ? "haut" : "bas";
    }

    let top = 0;
    let left = 0;

    if (placement === "haut") {
      top = targetRect.top - cardEstHeight - gap;
      left = targetRect.left + (targetRect.width - cardWidth) / 2;
    } else if (placement === "bas") {
      top = targetRect.bottom + gap;
      left = targetRect.left + (targetRect.width - cardWidth) / 2;
    } else if (placement === "gauche") {
      top = targetRect.top + (targetRect.height - cardEstHeight) / 2;
      left = targetRect.left - cardWidth - gap;
    } else if (placement === "droite") {
      top = targetRect.top + (targetRect.height - cardEstHeight) / 2;
      left = targetRect.right + gap;
    }

    // Clamp horizontal pour éviter de déborder du viewport
    left = Math.max(16, Math.min(vw - cardWidth - 16, left));
    // Clamp vertical avec marge pour le header fixe (72px) et bas d'écran (24px)
    top = Math.max(72, Math.min(vh - cardEstHeight - 24, top));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  }, [targetRect, step.placement]);

  const cardContent = (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/90 text-slate-900 space-y-3 relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Barre de progression discrète en haut */}
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-[#FF6B00] font-bold text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
          Étape {currentStepIndex + 1} sur {totalSteps}
        </span>

        <button
          type="button"
          onClick={onSkip}
          className="text-slate-400 hover:text-slate-600 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
          title="Passer la visite guidée"
        >
          Passer
        </button>
      </div>

      {/* Titre & Texte */}
      <div className="space-y-1.5">
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
          {step.titre}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {step.texte}
        </p>
      </div>

      {/* Boutons d'actions */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
        <div>
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={onPrev}
              className="px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Précédent</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              PREP Visite
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 min-h-[40px] rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>{isLastStep ? "Terminer" : "Suivant"}</span>
          {!isLastStep && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  // Si pas de cible (carte centrée)
  if (!style) {
    return (
      <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="w-full max-w-md">
          {cardContent}
        </div>
      </div>
    );
  }

  // Si cible présente (carte ancrée)
  return (
    <div
      style={style}
      className="fixed z-[9995] transition-all duration-200"
    >
      {cardContent}
    </div>
  );
}
