"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PrepTourStep, TourPlacement, PREP_GUIDE_NAME } from "@/lib/prep-config";
import { MascotGuide } from "./MascotGuide";

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
  status?: "idle" | "navigating" | "locating" | "ready" | "fallback";
}

/**
 * Carte / Bulle de la visite guidée : refonte esthétique complète (Phase 2 & 3)
 * - Conçue autour de Prépy (7 poses distinctes et expressives)
 * - Typographie et contrastes de très haute qualité
 * - Lisible à 360px sans défilement horizontal
 * - Ne masque jamais l'élément éclairé
 * - Support complet prefers-reduced-motion
 */
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
  status = "ready",
}: TourCardProps) {
  const router = useRouter();
  const isFirstStep = currentStepIndex === 0;
  const isFallback = status === "fallback";

  // Calcul du prénom pour l'accueil
  const prenom = studentFirstName?.trim() || "élève";

  // Calcul de la pose du robot
  const attitude = useMemo(() => {
    if (isLastStep) return "felicite";
    if (isFirstStep) return "accueil";
    if (isFallback) return "erreur";
    return step.attitude || "montre";
  }, [isLastStep, isFirstStep, isFallback, step.attitude]);

  // Positionnement dynamique ultra-robuste de la bulle
  const style = useMemo(() => {
    if (!targetRect || typeof window === "undefined" || isFirstStep || isLastStep || isFallback) {
      return null; // Affichage centré
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(380, vw - 24);
    const cardEstHeight = 220;
    const gap = 12;

    // Sur petit écran mobile (< 520px), calage automatique au-dessus ou en-dessous
    if (vw < 520) {
      const isTargetInTopHalf = targetRect.top + targetRect.height / 2 < vh / 2;
      if (isTargetInTopHalf) {
        const topPos = Math.min(vh - cardEstHeight - 12, Math.max(76, targetRect.bottom + gap));
        return {
          top: `${topPos}px`,
          left: "12px",
          right: "12px",
          maxWidth: "calc(100vw - 24px)",
        };
      } else {
        const topPos = Math.max(76, targetRect.top - cardEstHeight - gap);
        return {
          top: `${topPos}px`,
          left: "12px",
          right: "12px",
          maxWidth: "calc(100vw - 24px)",
        };
      }
    }

    // Écrans moyens et larges
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

    // Sécurité de bornage pour éviter tout débordement à l'écran
    left = Math.max(12, Math.min(vw - cardWidth - 12, left));
    top = Math.max(72, Math.min(vh - cardEstHeight - 20, top));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
    };
  }, [targetRect, isFirstStep, isLastStep, isFallback, step.placement]);

  // ── 1. ÉCRAN FINAL (Étape 13) : C'est parti ! ──
  if (isLastStep) {
    return (
      <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 text-slate-900 space-y-4 relative overflow-hidden select-none animate-in zoom-in-95 duration-200">
          {/* Bannière festive */}
          <div className="flex flex-col items-center text-center space-y-2 pt-1">
            <MascotGuide attitude="felicite" size="lg" />
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6B00]">
                Félicitations · Tu es prêt !
              </span>
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">
                C&apos;est parti, {prenom} !
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Tu connais maintenant l&apos;essentiel de PREP. Choisis par quoi débuter tes révisions aujourd&apos;hui pour décrocher ta mention !
            </p>
          </div>

          {/* 3 raccourcis d'action vers les fonctionnalités existantes */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onSkip();
                router.push("/prep/generer");
              }}
              className="w-full py-3 px-4 min-h-[46px] rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF6B00] font-black text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-xs"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-sm font-bold">⚡</span>
                <span>Faire un quiz</span>
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                onSkip();
                router.push("/prep/coach");
              }}
              className="w-full py-3 px-4 min-h-[46px] rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#005bbf] font-black text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-xs"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-bold">🎯</span>
                <span>Parler au Coach</span>
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                onSkip();
                router.push("/prep/dashboard");
              }}
              className="w-full py-3 px-4 min-h-[46px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-xs"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-sm font-bold">📊</span>
                <span>Voir mon tableau de bord</span>
              </span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-98"
            >
              Fermer la visite
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. ÉCRAN D'ACCUEIL SPECTACULAIRE (Étape 1) ──
  if (isFirstStep) {
    return (
      <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 text-slate-900 space-y-4 relative overflow-hidden select-none animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <MascotGuide attitude="accueil" size="lg" />
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#005bbf]">
                Guide virtuel · {PREP_GUIDE_NAME}
              </span>
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">
                Bienvenue, {prenom} !
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-xs">
              {step.texte}
            </p>
          </div>

          <div className="pt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={onNext}
              className="w-full min-h-[46px] py-3 rounded-2xl bg-[#005bbf] hover:bg-[#004899] text-white font-black text-sm shadow-lg shadow-blue-600/25 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Commencer la visite</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full min-h-[44px] py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
            >
              Passer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. CARTE STANDARD OU BULLE ANCRÉE (Étapes 2 à 12) ──
  const cardBody = (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 text-slate-900 space-y-3 relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      {/* En-tête : Mascotte, nom du guide et étape */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <MascotGuide attitude={attitude} size="sm" withShadow={false} />
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#005bbf] block truncate">
              Guide virtuel · {PREP_GUIDE_NAME}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Étape {currentStepIndex + 1} sur {totalSteps}
            </span>
          </div>
        </div>

        {/* Bouton passer toujours visible */}
        <button
          type="button"
          onClick={onSkip}
          className="text-slate-400 hover:text-slate-600 font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 min-h-[36px]"
          title="Quitter la visite"
        >
          Passer
        </button>
      </div>

      {/* Titre et texte pédagogique */}
      <div className="space-y-1">
        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
          {step.titre}
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          {isFallback ? (
            <span className="text-amber-700">
              Oups, je ne retrouve pas cet élément directement sur ton écran. On continue ?
            </span>
          ) : (
            step.texte
          )}
        </p>
      </div>

      {/* Barre de progression discrète en bas de carte */}
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#005bbf] to-[#FF6B00] transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Boutons d'action */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Précédent</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 min-h-[40px] rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>Suivant</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Si pas de cible ou mode secours : centré
  if (!style) {
    return (
      <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md">
          {cardBody}
        </div>
      </div>
    );
  }

  // Bulle ancrée à la cible
  return (
    <div
      style={style}
      className="fixed z-[9995] transition-all duration-200 pointer-events-auto"
    >
      {cardBody}
    </div>
  );
}
