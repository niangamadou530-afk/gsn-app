"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PrepTourStep, TourPlacement, PREP_GUIDE_NAME } from "@/lib/prep-config";
import { TourGuideAvatar } from "./TourGuideAvatar";

interface TourCardProps {
  step: PrepTourStep;
  currentStepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  studentFirstName?: string | null;
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
  studentFirstName,
  onNext,
  onPrev,
  onSkip,
  isLastStep,
}: TourCardProps) {
  const router = useRouter();
  const isFirstStep = currentStepIndex === 0;

  // Calcul du titre dynamique pour l'étape 1
  const displayTitle = useMemo(() => {
    if (isFirstStep) {
      const prenom = studentFirstName?.trim() || "élève";
      return `Bienvenue, ${prenom}`;
    }
    return step.titre;
  }, [isFirstStep, studentFirstName, step.titre]);

  // Calcul du positionnement dynamique de la bulle
  const style = useMemo(() => {
    if (!targetRect || typeof window === "undefined" || isFirstStep || isLastStep) {
      return null; // Positionnement centré
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(380, vw - 24);
    const cardEstHeight = 230; // estimation haute pour le placement
    const gap = 12;

    // Sur petit écran mobile (< 520px), ancrage flottant en bas ou en haut sans jamais cacher l'élément
    if (vw < 520) {
      const isTargetInTopHalf = targetRect.top + targetRect.height / 2 < vh / 2;
      if (isTargetInTopHalf) {
        // Cible en haut -> bulle calée en dessous
        const topPos = Math.min(vh - cardEstHeight - 12, Math.max(76, targetRect.bottom + gap));
        return {
          top: `${topPos}px`,
          left: "12px",
          right: "12px",
          maxWidth: "calc(100vw - 24px)",
        };
      } else {
        // Cible en bas -> bulle calée au dessus
        const topPos = Math.max(76, targetRect.top - cardEstHeight - gap);
        return {
          top: `${topPos}px`,
          left: "12px",
          right: "12px",
          maxWidth: "calc(100vw - 24px)",
        };
      }
    }

    // Écrans moyens et larges : calcul selon placement ("haut", "bas", "gauche", "droite", "auto")
    let placement: TourPlacement = step.placement || "auto";
    if (placement === "auto") {
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

    // Clamp horizontal pour éviter de déborder du viewport à 360px
    left = Math.max(12, Math.min(vw - cardWidth - 12, left));
    // Clamp vertical avec marge pour le header fixe (72px) et le bas d'écran (20px)
    top = Math.max(72, Math.min(vh - cardEstHeight - 20, top));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  }, [targetRect, isFirstStep, isLastStep, step.placement]);

  // Contenu spécial étape finale (Étape 13)
  if (isLastStep) {
    return (
      <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        {/* Effet de fête CSS (confetti léger) respectant prefers-reduced-motion */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
        >
          <div className="absolute top-10 left-[15%] w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-bounce opacity-80" />
          <div className="absolute top-16 left-[25%] w-3 h-3 rounded-md bg-[#005bbf] animate-pulse opacity-80 rotate-45" />
          <div className="absolute top-12 right-[20%] w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce opacity-80" />
          <div className="absolute top-20 right-[30%] w-3 h-3 rounded-md bg-amber-400 animate-pulse opacity-80 rotate-12" />
          <div className="absolute top-28 left-[45%] w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-60" />
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200/90 text-slate-900 space-y-4 relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3.5">
            <TourGuideAvatar attitude="felicite" size="md" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#005bbf]">
                Guide virtuel · {PREP_GUIDE_NAME}
              </span>
              <h3 className="font-black text-xl text-slate-900 tracking-tight leading-snug">
                {displayTitle}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {step.texte}
          </p>

          {/* 3 boutons vers les fonctions existantes */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onSkip();
                router.push("/prep/generer");
              }}
              className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-[#FF6B00] font-extrabold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Faire un quiz</span>
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                onSkip();
                router.push("/prep/coach");
              }}
              className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-[#005bbf] font-extrabold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Parler au Coach</span>
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                onSkip();
                router.push("/prep/dashboard");
              }}
              className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-extrabold text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Voir mon tableau de bord</span>
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contenu d'étape standard
  const cardContent = (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 text-slate-900 space-y-3 relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      {/* En-tête : Guide virtuel et progression */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <TourGuideAvatar attitude={step.attitude || "montre"} size="sm" />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#005bbf] block truncate">
              Guide virtuel · {PREP_GUIDE_NAME}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Étape {currentStepIndex + 1} sur {totalSteps}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-slate-400 hover:text-slate-600 font-bold text-xs px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          title="Passer la visite guidée"
        >
          Passer
        </button>
      </div>

      {/* Titre & Texte court (< 40 mots) */}
      <div className="space-y-1">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
          {displayTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          {step.texte}
        </p>
      </div>

      {/* Boutons d'actions */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
        <div>
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              className="px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Précédent</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 min-h-[40px] rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>{isFirstStep ? "Commencer" : "Suivant"}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Carte centrée si aucune cible ou étape de bienvenue
  if (!style) {
    return (
      <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        <div className="w-full max-w-md">
          {cardContent}
        </div>
      </div>
    );
  }

  // Bulle ancrée
  return (
    <div
      style={style}
      className="fixed z-[9995] transition-all duration-200 pointer-events-auto"
    >
      {cardContent}
    </div>
  );
}
