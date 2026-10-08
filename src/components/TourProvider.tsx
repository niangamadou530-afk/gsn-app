"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PREP_TOUR_STEPS, PrepTourStep } from "@/lib/prep-config";
import { TourOverlay } from "./TourOverlay";
import { TourCard } from "./TourCard";
import { supabase } from "@/lib/supabase";
import { isPreviewEnvironment } from "@/lib/previewAuth";

interface TourContextType {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return ctx;
}

interface TourProviderProps {
  children: React.ReactNode;
  studentProfile?: {
    exam_type?: string | null;
    serie?: string | null;
    prenom?: string | null;
  } | null;
}

const STORAGE_KEY_PREFIX = "prep_tour_completed_v2_";
const SESSION_STEP_KEY = "prep_tour_step_index";
const SESSION_ACTIVE_KEY = "prep_tour_is_active";

function findTargetElement(cible: string): HTMLElement | null {
  if (!cible) return null;

  // Cas spécial tiroir Coach : sur grand écran le bouton mobile est masqué, on pointe sur le panneau
  if (cible === "coach-drawer-btn") {
    const btn = document.querySelector<HTMLElement>('[data-tour="coach-drawer-btn"]');
    if (btn && btn.getBoundingClientRect().width > 0) return btn;
    const panel = document.querySelector<HTMLElement>('[data-tour="coach-drawer-panel"]');
    if (panel && panel.getBoundingClientRect().width > 0) return panel;
  }

  const el = document.querySelector<HTMLElement>(`[data-tour="${cible}"]`);
  return el ?? null;
}

export function TourProvider({ children, studentProfile }: TourProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isActive, setIsActive] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_ACTIVE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = sessionStorage.getItem(SESSION_STEP_KEY);
      const parsed = stored ? parseInt(stored, 10) : 0;
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const activeStep: PrepTourStep | undefined = PREP_TOUR_STEPS[currentStepIndex];
  const totalSteps = PREP_TOUR_STEPS.length;

  const animationFrameRef = useRef<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Détection de l'utilisateur pour la persistance locale
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user) {
          setUserId(user.id);
        } else if (mounted && isPreviewEnvironment()) {
          setUserId("preview_student");
        }
      } catch {
        if (mounted && isPreviewEnvironment()) {
          setUserId("preview_student");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Nettoyage de tous les timers et frames en cours
  const clearTimers = useCallback(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // 3. Fermer les panneaux ouverts lors de la visite guidée
  const closeOpenedElements = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("prep-tour:close-settings"));
      window.dispatchEvent(new CustomEvent("prep-tour:close-coach-drawer"));
    }
  }, []);

  // 4. Lancer la visite guidée
  const startTour = useCallback(() => {
    clearTimers();
    closeOpenedElements();
    setCurrentStepIndex(0);
    setIsActive(true);
    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
      sessionStorage.setItem(SESSION_STEP_KEY, "0");
    } catch {}

    const firstStep = PREP_TOUR_STEPS[0];
    if (firstStep && pathname !== firstStep.route) {
      setIsLoading(true);
      router.push(firstStep.route);
    }
  }, [clearTimers, closeOpenedElements, pathname, router]);

  // 5. Terminer / Quitter la visite
  const skipTour = useCallback(() => {
    clearTimers();
    closeOpenedElements();
    setIsActive(false);
    setTargetRect(null);

    try {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(SESSION_STEP_KEY);
      if (userId) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "true");
      }
    } catch {}
  }, [clearTimers, closeOpenedElements, userId]);

  // 6. Écoute de l'événement global pour relancer la visite (depuis Paramètres)
  useEffect(() => {
    const handleStartEvent = () => {
      startTour();
    };
    window.addEventListener("prep-tour:start", handleStartEvent);
    return () => {
      window.removeEventListener("prep-tour:start", handleStartEvent);
    };
  }, [startTour]);

  // 7. Déclenchement automatique à la première connexion sur le tableau de bord
  useEffect(() => {
    if (!userId || isActive) return;

    // Ne JAMAIS déclencher sur les pages publiques ou d'authentification
    const normalized = pathname?.replace(/\/+$/, "") || "/prep";
    const isExcluded =
      normalized === "/prep" ||
      normalized === "/prep/onboarding" ||
      normalized === "/login" ||
      normalized === "/signup" ||
      normalized === "/privacy" ||
      normalized === "/terms";

    if (isExcluded) return;

    // Vérifier si la visite a déjà été faite
    let hasCompleted = false;
    try {
      hasCompleted = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === "true";
    } catch {}

    // Déclenchement automatique uniquement sur /prep/dashboard pour un nouvel élève
    if (!hasCompleted && (normalized === "/prep/dashboard" || studentProfile)) {
      startTour();
    }
  }, [userId, pathname, studentProfile, isActive, startTour]);

  // 8. Navigation vers l'étape suivante
  const nextStep = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      skipTour();
      return;
    }

    const prevStep = PREP_TOUR_STEPS[currentStepIndex];
    if (prevStep?.apres && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(prevStep.apres));
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    try {
      sessionStorage.setItem(SESSION_STEP_KEY, String(nextIndex));
    } catch {}

    const nextStepConfig = PREP_TOUR_STEPS[nextIndex];
    if (nextStepConfig && pathname !== nextStepConfig.route) {
      setIsLoading(true);
      router.push(nextStepConfig.route);
    }
  }, [currentStepIndex, totalSteps, skipTour, pathname, router]);

  // 9. Navigation vers l'étape précédente
  const prevStep = useCallback(() => {
    if (currentStepIndex <= 0) return;

    const current = PREP_TOUR_STEPS[currentStepIndex];
    if (current?.apres && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(current.apres));
    }

    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    try {
      sessionStorage.setItem(SESSION_STEP_KEY, String(prevIndex));
    } catch {}

    const prevStepConfig = PREP_TOUR_STEPS[prevIndex];
    if (prevStepConfig && pathname !== prevStepConfig.route) {
      setIsLoading(true);
      router.push(prevStepConfig.route);
    }
  }, [currentStepIndex, pathname, router]);

  // 10. Traitement de l'étape courante (localisation de la cible et synchronisation DOM)
  useEffect(() => {
    if (!isActive || !activeStep) return;

    clearTimers();

    // Si l'étape requiert une autre route et qu'on n'y est pas encore
    if (pathname !== activeStep.route) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        setTargetRect(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Émettre l'événement "avant" si configuré (ex: ouvrir le menu ou tiroir)
    if (activeStep.avant && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(activeStep.avant));
    }

    // Si étape sans cible : affichage centré immédiat
    if (!activeStep.cible) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setTargetRect(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Recherche de l'élément cible avec limite de 2 secondes
    setIsLoading(true);
    const startTime = Date.now();

    const checkTarget = () => {
      const el = findTargetElement(activeStep.cible!);
      if (el) {
        clearTimers();
        // Amener l'élément à l'écran avec marge douce
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        } catch {}

        // Récupération de la position
        setTargetRect(el.getBoundingClientRect());
        setIsLoading(false);
        return true;
      }

      // Si le temps de recherche dépasse 2 secondes, basculer en carte centrée sans bloquer
      if (Date.now() - startTime >= 2000) {
        clearTimers();
        setTargetRect(null);
        setIsLoading(false);
        return true;
      }

      return false;
    };

    // Première vérification immédiate
    if (!checkTarget()) {
      searchIntervalRef.current = setInterval(checkTarget, 80);
    }

    return () => {
      clearTimers();
    };
  }, [isActive, currentStepIndex, pathname, activeStep, clearTimers]);

  // 11. Recalcul dynamique de la position (redimensionnement, défilement)
  const updateRect = useCallback(() => {
    if (!isActive || !activeStep?.cible) return;
    const el = findTargetElement(activeStep.cible);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [isActive, activeStep]);

  useEffect(() => {
    if (!isActive || !activeStep?.cible) return;

    const onScrollOrResize = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(updateRect);
    };

    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive, activeStep, updateRect]);

  const contextValue: TourContextType = {
    isActive,
    currentStepIndex,
    totalSteps,
    startTour,
    nextStep,
    prevStep,
    skipTour,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {/* Rendu du projecteur et de la carte d'explication */}
      {isActive && activeStep && (
        <>
          <TourOverlay
            targetRect={targetRect}
            isLoading={isLoading}
          />
          {!isLoading && (
            <TourCard
              step={activeStep}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              targetRect={targetRect}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTour}
              isLastStep={currentStepIndex === totalSteps - 1}
            />
          )}
        </>
      )}
    </TourContext.Provider>
  );
}
