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

const STORAGE_KEY_PREFIX = "prep_tutorial_done_";
const SESSION_STEP_KEY = "prep_tour_step_index";
const SESSION_ACTIVE_KEY = "prep_tour_is_active";
const SESSION_DONE_KEY = "prep_tutorial_done_session";

function findTargetElement(cible: string): HTMLElement | null {
  if (!cible) return null;

  // Replis intelligents selon la cible pour une détection infaillible mobile & desktop
  if (cible === "settings-menu-panel") {
    const panel = document.querySelector<HTMLElement>('[data-tour="settings-menu-panel"]');
    if (panel && panel.getBoundingClientRect().width > 0) return panel;
    const btn = document.querySelector<HTMLElement>('[data-tour="header-settings-btn"]');
    if (btn && btn.getBoundingClientRect().width > 0) return btn;
  }

  if (cible === "coach-drawer-panel") {
    const panel = document.querySelector<HTMLElement>('[data-tour="coach-drawer-panel"]');
    if (panel && panel.getBoundingClientRect().width > 0) return panel;
    const btn = document.querySelector<HTMLElement>('[data-tour="coach-drawer-btn"]');
    if (btn && btn.getBoundingClientRect().width > 0) return btn;
  }

  if (cible === "epreuves-filters") {
    const filters = document.querySelector<HTMLElement>('[data-tour="epreuves-filters"]');
    if (filters && filters.getBoundingClientRect().width > 0) return filters;
    const search = document.querySelector<HTMLElement>('[data-tour="epreuves-search"]');
    if (search && search.getBoundingClientRect().width > 0) return search;
  }

  if (cible === "generer-options") {
    const opts = document.querySelector<HTMLElement>('[data-tour="generer-options"]');
    if (opts && opts.getBoundingClientRect().width > 0) return opts;
    const quiz = document.querySelector<HTMLElement>('[data-tour="generer-quiz"]');
    if (quiz && quiz.getBoundingClientRect().width > 0) return quiz;
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
  const [userMetadataDone, setUserMetadataDone] = useState(false);

  const activeStep: PrepTourStep | undefined = PREP_TOUR_STEPS[currentStepIndex];
  const totalSteps = PREP_TOUR_STEPS.length;

  const animationFrameRef = useRef<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Détection de l'utilisateur pour la persistance locale et métadonnées
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user) {
          setUserId(user.id);
          if (user.user_metadata?.prep_tutorial_done === true) {
            setUserMetadataDone(true);
          }
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

  // 4. Lancer la visite guidée (ne modifie pas le drapeau de complétion)
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

  // 5. Terminer / Quitter la visite (enregistre prep_tutorial_done dans métadonnées et localStorage)
  const skipTour = useCallback(async () => {
    clearTimers();
    closeOpenedElements();
    setIsActive(false);
    setTargetRect(null);

    try {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(SESSION_STEP_KEY);
      sessionStorage.setItem(SESSION_DONE_KEY, "true");
      if (userId) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "true");
      }
    } catch {}

    // Enregistrement du drapeau dans les métadonnées Supabase si compte connecté
    try {
      if (userId && userId !== "preview_student") {
        await supabase.auth.updateUser({
          data: { prep_tutorial_done: true },
        });
      }
    } catch (err) {
      console.warn("Could not save tour completion in metadata:", err);
    }
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

  // 7. Déclenchement automatique selon les règles strictes de la Section 3
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

    // Règle 3.a : Exclure /prep/parent pour un parent sans compte et tout compte sans profil élève
    const isPreview = isPreviewEnvironment();
    if (!studentProfile && !isPreview) return;
    if (normalized === "/prep/parent" && !studentProfile) return;

    // Règle 3.b : Vérifier si la visite a déjà été effectuée
    let hasCompleted = false;
    try {
      hasCompleted =
        localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === "true" ||
        sessionStorage.getItem(SESSION_DONE_KEY) === "true";
    } catch {}

    if (userMetadataDone) {
      hasCompleted = true;
    }

    // Déclenchement automatique une seule fois sur le tableau de bord
    if (!hasCompleted && (normalized === "/prep/dashboard" || studentProfile)) {
      startTour();
    }
  }, [userId, pathname, studentProfile, isActive, startTour, userMetadataDone]);

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
    const startSearchingTimer = setTimeout(() => {
      setIsLoading(true);
    }, 0);

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
      clearTimeout(startSearchingTimer);
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
              studentFirstName={studentProfile?.prenom}
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
