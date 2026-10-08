"use client";

import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "fonctionnement",
    question: "Comment fonctionne GSN PREP ?",
    answer:
      "GSN PREP est une plateforme d'entraînement et d'accompagnement scolaire conçue pour les programmes officiels sénégalais du BAC (séries S1, S2, S3, L', L1, L2, G, STEG) et du BFEM. Elle propose des annales corrigées, des quiz d'entraînement conformes aux épreuves nationales, des fiches de synthèse et des outils méthodologiques.",
  },
  {
    id: "acces-gratuit",
    question: "L'accès à la plateforme est-il payant ?",
    answer:
      "L'accès aux outils d'entraînement, aux quiz thématiques, aux épreuves et aux corrigés est totalement accessible aux collégiens et lycéens du Sénégal pour favoriser l'égalité des chances.",
  },
  {
    id: "espace-parents",
    question: "Comment fonctionne l'Espace Parents ?",
    answer:
      "L'élève génère un code sécurisé depuis son espace pour le transmettre à son parent. Ce dernier peut alors suivre la régularité des révisions, les matières travaillées et les progrès généraux, dans le respect de l'autonomie et de la confidentialité de l'élève.",
  },
  {
    id: "methode-revision",
    question: "Quelle méthode adopter pour bien préparer son examen ?",
    answer:
      "Nous conseillons de s'entraîner régulièrement en réalisant 1 à 2 quiz quotidiens, de reprendre les corrections pas à pas, de mémoriser les formules et définitions grâce aux fiches de révision et de s'auto-évaluer sur les sujets des années précédentes.",
  },
  {
    id: "assistance",
    question: "Comment contacter l'équipe en cas de besoin ?",
    answer:
      "Tu peux contacter notre équipe pédagogique et technique directement par WhatsApp ou par email grâce aux liens présents dans le menu Paramètres et en bas de page.",
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("fonctionnement");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
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
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between text-left p-4 sm:p-5 gap-4"
                >
                  <span className="text-sm font-bold text-slate-900">
                    {item.question}
                  </span>
                  <span
                    className={`text-xs font-black text-slate-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                    <p className="pt-3">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
