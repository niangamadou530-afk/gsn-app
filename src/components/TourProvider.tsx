"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PREP_TOUR_STEPS, PrepTourStep } from "@/lib/prep-config";
import { TourOverlay } from "./TourOverlay";
import { TourCard } from "./TourCard";
import { supabase } from "@/lib/supabase";
import { isPreviewEnvironment } from "@/lib/previewAuth";

// Machine d'états déduite
export type TourEngineState = "idle" | "navigating" | "locating" | "ready" | "fallback";

interface TourContextType {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  engineState: TourEngineState;
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
  const [internalState, setInternalState] = useState<TourEngineState>("idle");
  const [userId, setUserId] = useState<string | null>(null);
  const [userMetadataDone, setUserMetadataDone] = useState(false);

  // Diagnostic mode (?tourdebug=1 ou localStorage.prep_tour_debug === "1")
  const [debugMode, setDebugMode] = useState(false);
  const [debugStartTime, setDebugStartTime] = useState(Date.now());
  const [targetFoundDebug, setTargetFoundDebug] = useState(false);

  // Verrouillage de transition pour bloquer les doubles clics rapides sur "Suivant"
  const isTransitioningRef = useRef(false);

  const activeStep: PrepTourStep | undefined = PREP_TOUR_STEPS[currentStepIndex];
  const totalSteps = PREP_TOUR_STEPS.length;

  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const locatingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // 1. Initialisation & détection du mode diagnostic
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Détection ?tourdebug=1
    const params = new URLSearchParams(window.location.search);
    if (params.get("tourdebug") === "1") {
      try {
        localStorage.setItem("prep_tour_debug", "1");
        params.delete("tourdebug");
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
        window.history.replaceState({}, "", cleanUrl);
      } catch {}
    }

    try {
      if (localStorage.getItem("prep_tour_debug") === "1") {
        setDebugMode(true);
      }
    } catch {}
  }, []);

  // 2. Détection de l'utilisateur pour la persistance
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

  // 3. Nettoyage sécurisé des observateurs et minuteurs
  const cleanupObserversAndTimers = useCallback(() => {
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }
    if (locatingTimeoutRef.current) {
      clearTimeout(locatingTimeoutRef.current);
      locatingTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // 4. Fermer les panneaux ouverts lors de la visite
  const closeOpenedElements = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("prep-tour:close-settings"));
      window.dispatchEvent(new CustomEvent("prep-tour:close-coach-drawer"));
    }
  }, []);

  // 5. Démarrer la visite
  const startTour = useCallback(() => {
    cleanupObserversAndTimers();
    closeOpenedElements();
    setDebugStartTime(Date.now());
    setCurrentStepIndex(0);
    setIsActive(true);
    isTransitioningRef.current = false;

    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
      sessionStorage.setItem(SESSION_STEP_KEY, "0");
    } catch {}

    const firstStep = PREP_TOUR_STEPS[0];
    if (firstStep && pathname !== firstStep.route) {
      router.push(firstStep.route);
    }
  }, [cleanupObserversAndTimers, closeOpenedElements, pathname, router]);

  // 6. Quitter / Passer la visite (sécurité absolue : fonctionne dans tous les états)
  const skipTour = useCallback(async () => {
    cleanupObserversAndTimers();
    closeOpenedElements();
    setIsActive(false);
    setTargetRect(null);
    setInternalState("idle");
    isTransitioningRef.current = false;

    try {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      sessionStorage.removeItem(SESSION_STEP_KEY);
      sessionStorage.setItem(SESSION_DONE_KEY, "true");
      if (userId) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "true");
      }
    } catch {}

    try {
      if (userId && userId !== "preview_student") {
        await supabase.auth.updateUser({
          data: { prep_tutorial_done: true },
        });
      }
    } catch {}
  }, [cleanupObserversAndTimers, closeOpenedElements, userId]);

  // 7. Raccourci clavier Échap : quitte immédiatement la visite
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTour();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, skipTour]);

  // 8. Écoute de l'événement global de relance depuis les Paramètres
  useEffect(() => {
    const handleStartEvent = () => {
      startTour();
    };
    window.addEventListener("prep-tour:start", handleStartEvent);
    return () => {
      window.removeEventListener("prep-tour:start", handleStartEvent);
    };
  }, [startTour]);

  // 9. Déclenchement automatique selon les règles
  useEffect(() => {
    if (!userId || isActive) return;

    const normalized = pathname?.replace(/\/+$/, "") || "/prep";
    const isExcluded =
      normalized === "/prep" ||
      normalized === "/prep/onboarding" ||
      normalized === "/login" ||
      normalized === "/signup" ||
      normalized === "/privacy" ||
      normalized === "/terms";

    if (isExcluded) return;

    const isPreview = isPreviewEnvironment();
    if (!studentProfile && !isPreview) return;
    if (normalized === "/prep/parent" && !studentProfile) return;

    let hasCompleted = false;
    try {
      hasCompleted =
        localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === "true" ||
        sessionStorage.getItem(SESSION_DONE_KEY) === "true";
    } catch {}

    if (userMetadataDone) {
      hasCompleted = true;
    }

    if (!hasCompleted && (normalized === "/prep/dashboard" || studentProfile)) {
      startTour();
    }
  }, [userId, pathname, studentProfile, isActive, startTour, userMetadataDone]);

  // 10. Navigation étape suivante avec anti-rebond (une seule transition par clic)
  const nextStep = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 450);

    if (currentStepIndex >= totalSteps - 1) {
      skipTour();
      return;
    }

    const prev = PREP_TOUR_STEPS[currentStepIndex];
    if (prev?.apres && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(prev.apres));
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    try {
      sessionStorage.setItem(SESSION_STEP_KEY, String(nextIndex));
    } catch {}

    const nextStepConfig = PREP_TOUR_STEPS[nextIndex];
    if (nextStepConfig && pathname !== nextStepConfig.route) {
      router.push(nextStepConfig.route);
    }
  }, [currentStepIndex, totalSteps, skipTour, pathname, router]);

  // 11. Navigation étape précédente
  const prevStep = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 450);

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
      router.push(prevStepConfig.route);
    }
  }, [currentStepIndex, pathname, router]);

  // 12. MACHINE D'ÉTATS DÉDUITE ET RECHERCHE PAR MUTATIONOBSERVER (PHASE 1)
  useEffect(() => {
    if (!isActive || !activeStep) {
      setInternalState("idle");
      return;
    }

    cleanupObserversAndTimers();

    // RÈGLE CRITIQUE : Si le chemin courant diffère de la route de l'étape -> navigating
    if (pathname !== activeStep.route) {
      setInternalState("navigating");
      setTargetRect(null);
      setTargetFoundDebug(false);
      return;
    }

    // Nous sommes arrivés sur la bonne page !
    // Émettre l'événement "avant" si nécessaire (ouvrir tiroir ou menu)
    if (activeStep.avant && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(activeStep.avant));
    }

    // Étape centrée sans cible (ex: Étape 1 accueil ou Étape 13 fin)
    if (!activeStep.cible) {
      setInternalState("ready");
      setTargetRect(null);
      setTargetFoundDebug(true);
      return;
    }

    // Recherche de la cible avec état 'locating'
    setInternalState("locating");
    setTargetFoundDebug(false);

    const tryFindAndFocus = (): boolean => {
      const el = findTargetElement(activeStep.cible!);
      if (el) {
        const rect = el.getBoundingClientRect();
        // S'assurer que l'élément est rendu avec une géométrie valide
        if (rect.width > 0 && rect.height > 0) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          } catch {}
          setTargetRect(el.getBoundingClientRect());
          setInternalState("ready");
          setTargetFoundDebug(true);
          cleanupObserversAndTimers();
          return true;
        }
      }
      return false;
    };

    // 1ère tentative immédiate
    if (tryFindAndFocus()) return;

    // MutationObserver pour détecter l'apparition asynchrone des composants (React Suspense, données)
    const observer = new MutationObserver(() => {
      if (tryFindAndFocus()) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    mutationObserverRef.current = observer;

    // Sécurité 1 : limite de 2,5 secondes d'observation
    locatingTimeoutRef.current = setTimeout(() => {
      if (!tryFindAndFocus()) {
        cleanupObserversAndTimers();
        setTargetRect(null);
        setInternalState("fallback"); // Affiche la carte centrée sans jamais bloquer
      }
    }, 2500);

    // Sécurité 2 : au bout de 3 secondes max absolu, disparition complète du voile de chargement
    fallbackTimeoutRef.current = setTimeout(() => {
      setInternalState((prev) => (prev === "locating" || prev === "navigating" ? "fallback" : prev));
    }, 3000);

    return () => {
      cleanupObserversAndTimers();
    };
  }, [isActive, currentStepIndex, pathname, activeStep, cleanupObserversAndTimers]);

  // 13. Recalcul continu de la position de la cible (défilement et redimensionnement)
  useEffect(() => {
    if (!isActive || !activeStep?.cible || internalState !== "ready") return;

    const handleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = findTargetElement(activeStep.cible!);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        }
      });
    };

    window.addEventListener("resize", handleUpdate, { passive: true });
    window.addEventListener("scroll", handleUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, activeStep, internalState]);

  // Déduire si le voile de chargement doit être actif
  const isScreenLoading = internalState === "navigating" || internalState === "locating";

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        totalSteps,
        engineState: internalState,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}

      {/* Rendu visuel de la visite quand active */}
      {isActive && activeStep && (
        <>
          <TourOverlay
            targetRect={targetRect}
            isLoading={isScreenLoading}
            status={internalState}
            onSkip={skipTour}
          />
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
            status={internalState}
          />

          {/* Mode diagnostic masqué (?tourdebug=1 ou localStorage.prep_tour_debug === "1") */}
          {debugMode && (
            <div
              aria-live="polite"
              className="fixed bottom-3 left-3 z-[9999] pointer-events-none px-3 py-1.5 rounded-xl bg-slate-950/90 text-white font-mono text-[11px] border border-white/20 shadow-xl flex items-center gap-2 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Étape {currentStepIndex + 1}/{totalSteps} · {pathname} · {internalState} · Cible :{" "}
                {targetFoundDebug ? "oui" : "non"} · {Date.now() - debugStartTime} ms
              </span>
            </div>
          )}
        </>
      )}
    </TourContext.Provider>
  );
}
