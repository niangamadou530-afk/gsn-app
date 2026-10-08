"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TutorialModalProps {
  studentProfile?: {
    exam_type?: string | null;
    serie?: string | null;
    prenom?: string | null;
  } | null;
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: "Bienvenue sur GSN PREP",
    desc: "Ton espace de révision complet pour réussir le BFEM ou le BAC au Sénégal avec mention.",
    icon: (
      <svg className="w-8 h-8 text-[#005bbf]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    points: [
      "Programme sénégalais officiel adapté à ta série.",
      "Comptes à rebours officiels jusqu'aux épreuves.",
      "Accès rapide et fluide même avec une connexion modeste.",
    ],
  },
  {
    step: 2,
    title: "Annales & Corrigés officiels",
    desc: "Plus de 600 épreuves passées du BAC et du BFEM avec corrections complètes étape par étape.",
    icon: (
      <svg className="w-8 h-8 text-[#005bbf]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    points: [
      "Recherche simple par matière, série et année.",
      "Barèmes détaillés pour comprendre les exigences des jurys.",
      "Visualisation immédiate sans téléchargement obligatoire.",
    ],
  },
  {
    step: 3,
    title: "Entraînement Quiz & Flashcards",
    desc: "Valide tes acquis chaque jour avec des quiz ciblés et mémorise tes formules clés.",
    icon: (
      <svg className="w-8 h-8 text-[#FF6B00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    points: [
      "Quiz de 5 à 10 questions corrigés en temps réel.",
      "Cartes mémoires pour retenir définitions et théorèmes.",
      "Reprise des erreurs pour consolider les points faibles.",
    ],
  },
  {
    step: 4,
    title: "Coach IA personnalisé",
    desc: "Un tuteur disponible pour clarifier un cours, débloquer un calcul ou expliquer une méthode.",
    icon: (
      <svg className="w-8 h-8 text-[#005bbf]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    points: [
      "Explications basées sur le programme sénégalais.",
      "Méthodologie de dissertation, commentaire ou démonstration.",
      "Conseils personnalisés selon tes résultats de quiz.",
    ],
  },
  {
    step: 5,
    title: "Fichiers & Téléchargements",
    desc: "Génère des fiches de révision, plannings et exercices avec corrections masquées.",
    icon: (
      <svg className="w-8 h-8 text-[#005bbf]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    points: [
      "Documents clairs au format Markdown.",
      "Exports au format Word (.doc) et impression PDF à la demande.",
      "Historique de tes fiches sauvegardé dans ton compte.",
    ],
  },
  {
    step: 6,
    title: "Suivi des révisions & Progression",
    desc: "Visualise tes efforts réguliers et identifie les matières prioritaires.",
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    points: [
      "Statistiques par matière pour équilibrer ton travail.",
      "Niveaux de révision pour mesurer ta régularité.",
      "Classement amical optionnel entre candidats.",
    ],
  },
  {
    step: 7,
    title: "Confidentialité & Espace Parents",
    desc: "Ce que tes parents voient vs ton espace strictement privé.",
    icon: (
      <svg className="w-8 h-8 text-[#005bbf]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    points: [
      "Depuis l'Espace Parents, tes parents voient uniquement tes notes moyennes et tes jours d'activité.",
      "Ils ne voient JAMAIS tes conversations ni tes fichiers avec le Coach IA.",
      "Ne partage jamais ton mot de passe : celui qui l'a peut ouvrir ton compte.",
      "Tu peux renouveler ton code parent à tout moment.",
    ],
  },
];

export function TutorialModal({ studentProfile }: TutorialModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkFirstLogin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const storageKey = `prep_tutorial_completed_v1_${user.id}`;
        const completed = localStorage.getItem(storageKey);

        // Si non complété et que l'élève a un profil existant
        if (!completed && studentProfile) {
          setIsOpen(true);
        }
      } catch {
        // Ignorer
      }
    }

    checkFirstLogin();

    // Écoute de l'événement global pour revoir le didacticiel
    const handleReopen = () => {
      setCurrentStep(1);
      setIsOpen(true);
    };

    window.addEventListener("prep-open-tutorial", handleReopen);
    return () => {
      window.removeEventListener("prep-open-tutorial", handleReopen);
    };
  }, [studentProfile]);

  const handleFinish = () => {
    if (userId) {
      localStorage.setItem(`prep_tutorial_completed_v1_${userId}`, "true");
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const current = TUTORIAL_STEPS[currentStep - 1];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header avec compteur et bouton passer */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#005bbf]">
              Didacticiel
            </span>
            <span className="text-xs font-bold text-slate-500">
              Étape {currentStep} sur {TUTORIAL_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors px-2 py-1"
          >
            Passer
          </button>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-[#005bbf] h-full transition-all duration-300"
            style={{ width: `${(currentStep / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Contenu de l'étape */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
              {current.icon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {current.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {current.desc}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            {current.points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug">
                <svg className="w-4 h-4 text-[#005bbf] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Boutons de navigation */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Précédent
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="py-2.5 px-6 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>{currentStep === TUTORIAL_STEPS.length ? "C'est parti !" : "Suivant"}</span>
            {currentStep < TUTORIAL_STEPS.length && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
