"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PREP_CONTACT_EMAIL,
  PREP_WHATSAPP_SUPPORT,
  PREP_DAILY_QUOTAS,
} from "@/lib/prep-config";

interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("gratuit");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const faqItems: FaqItem[] = [
    {
      id: "gratuit",
      question: "C'est gratuit ?",
      answer: (
        <p>
          L&apos;inscription est 100% gratuite pendant la phase de lancement.
        </p>
      ),
    },
    {
      id: "examens",
      question: "Pour quels examens ?",
      answer: (
        <p>
          GSN PREP est conçu pour le <strong>BAC</strong> et le <strong>BFEM</strong> au Sénégal.
          Pour le BAC, l&apos;application couvre les séries générales et techniques : S1, S2, S3, S4, S5, L1, L2, L&apos;1, L-AR, STEG, STIDD, T1, T2 et F6.
          Pour le BFEM, elle couvre le collège général et l&apos;option franco-arabe (classe de 3ème).
        </p>
      ),
    },
    {
      id: "annales",
      question: "Que contient la bibliothèque d'épreuves ?",
      answer: (
        <p>
          Elle regroupe plus de 600 épreuves et corrigés d&apos;examens passés du BAC et du BFEM.
          Tu peux consulter les sujets par année et par matière, puis vérifier tes réponses avec les corrections pas à pas.
        </p>
      ),
    },
    {
      id: "coach",
      question: "Comment marche le Coach IA ?",
      answer: (
        <p>
          Le Coach IA t&apos;aide à comprendre ton cours, explique les notions difficiles et produit à ta demande des fiches de révision, méthodes et exercices corrigés au format Markdown (téléchargeables en Word ou imprimables en PDF).
          Il peut parfois se tromper : prends le réflexe de vérifier les points clés avec ton professeur.
          Chaque élève dispose d&apos;un quota de {PREP_DAILY_QUOTAS.coach_count} questions par jour avec le Coach.
        </p>
      ),
    },
    {
      id: "documents",
      question: "Je peux envoyer une photo ou un PDF de mon cours ?",
      answer: (
        <p>
          Oui, tu peux envoyer une photo nette de ton cahier, un document PDF contenant du texte sélectionnable, ou copier-coller directement le texte de ton cours.
          Attention : un PDF scanné comme une simple image ne fonctionne pas bien (envoie plutôt une photo nette).
          Si ton document est trop long, choisis une partie ou un chapitre ciblé, et évite de photographier ton nom ou tes informations personnelles.
        </p>
      ),
    },
    {
      id: "parents",
      question: "Que voient mes parents ?",
      answer: (
        <p>
          Tes parents ont accès à une vue de suivi globale : ton prénom, ton examen et ta série, le nombre de quiz terminés dans la semaine, tes jours d&apos;activité, ta moyenne générale de quiz, tes statistiques par matière et les dates clés officielles de ton examen.
          Depuis l&apos;Espace Parents, ils <strong>ne voient jamais</strong> tes conversations ni tes fichiers générés par le Coach IA.
          Ne partage pas ton mot de passe : celui qui l&apos;a peut ouvrir ton compte.
          C&apos;est toi qui génères ton code d&apos;accès sécurisé depuis ton espace, et tu peux le renouveler à tout moment (l&apos;ancien code cesse alors immédiatement de fonctionner).
        </p>
      ),
    },
    {
      id: "donnees",
      question: "Comment sont utilisées mes données ?",
      answer: (
        <p>
          Tes données servent uniquement à assurer le fonctionnement de ton compte et à suivre ta progression scolaire.
          Pour en savoir plus, consulte notre{" "}
          <Link href="/privacy" className="font-semibold text-[#005bbf] underline hover:text-[#004ba0]">
            politique de confidentialité
          </Link>.
          Tu peux à tout moment supprimer définitivement ton compte et l&apos;ensemble de tes données depuis ton profil élève.
        </p>
      ),
    },
    {
      id: "mot-de-passe",
      question: "J'ai oublié mon mot de passe",
      answer: (
        <p>
          Écris directement à notre support WhatsApp avec ton numéro d&apos;inscription :{" "}
          <a
            href={PREP_WHATSAPP_SUPPORT.getPasswordResetUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#005bbf] underline hover:text-[#004ba0]"
          >
            réinitialiser mon mot de passe sur WhatsApp ({PREP_WHATSAPP_SUPPORT.phoneFormatted})
          </a>.
          L&apos;équipe t&apos;aidera à retrouver l&apos;accès à ton compte.
        </p>
      ),
    },
    {
      id: "telephone",
      question: "Ça marche sur téléphone ?",
      answer: (
        <p>
          Oui, la plateforme fonctionne directement dans le navigateur de ton téléphone portable (Chrome, Safari, etc.) comme sur ordinateur ou tablette, sans aucune installation nécessaire.
        </p>
      ),
    },
    {
      id: "autre-question",
      question: "Une autre question ?",
      answer: (
        <p>
          Notre équipe est à ton écoute par e-mail à{" "}
          <a
            href={`mailto:${PREP_CONTACT_EMAIL}?subject=Question%20GSN%20PREP`}
            className="font-bold text-[#005bbf] underline hover:text-[#004ba0]"
          >
            {PREP_CONTACT_EMAIL}
          </a>{" "}
          ou directement par WhatsApp au{" "}
          <a
            href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl("Bonjour, j'ai une question sur GSN PREP :")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#005bbf] underline hover:text-[#004ba0]"
          >
            {PREP_WHATSAPP_SUPPORT.phoneFormatted}
          </a>.
        </p>
      ),
    },
  ];

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 bg-white border-t border-slate-200/80"
      style={{ scrollMarginTop: "5rem" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#FF6B00] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            Questions fréquentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tout comprendre sur GSN PREP
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Retrouve les réponses aux questions les plus courantes pour préparer le BAC et le BFEM dans les meilleures conditions.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3" role="region" aria-label="Questions fréquentes">
          {faqItems.map((item) => {
            const isOpen = openId === item.id;
            const contentId = `faq-answer-${item.id}`;
            const headerId = `faq-header-${item.id}`;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden"
              >
                <button
                  id={headerId}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="w-full flex items-center justify-between text-left p-4 sm:p-5 gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005bbf]/30"
                >
                  <span className="text-sm font-bold text-slate-900">
                    {item.question}
                  </span>
                  {/* Flèche SVG accessible (jamais de police d'icônes) */}
                  <span
                    aria-hidden="true"
                    className="shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200/80 flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-slate-600"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* Contenu avec transition douce via max-height et opacity */}
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  style={{
                    maxHeight: isOpen ? "400px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out",
                  }}
                  className="px-4 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed"
                >
                  <div className="pb-4 sm:pb-5 pt-1 border-t border-slate-100">
                    <div className="pt-2">{item.answer}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
