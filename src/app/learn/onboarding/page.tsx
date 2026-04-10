"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const DOMAINS = [
  { label: "Marketing Digital", sub: "SEO, Social Media, Ads", icon: "trending_up" },
  { label: "Développement Web", sub: "React, HTML, Backend", icon: "terminal" },
  { label: "Design GFX", sub: "UI/UX, Graphic Design", icon: "palette" },
  { label: "Maintenance Info", sub: "Réseaux, Support IT", icon: "build" },
  { label: "Agriculture", sub: "Agri-tech, Production", icon: "eco" },
  { label: "Finance", sub: "Bourse, Fintech", icon: "account_balance" },
  { label: "Autre", sub: "Ton domaine personnalisé", icon: "more_horiz" },
];

const STEPS = [
  { id: "domain",  question: "Quel domaine\nveux-tu apprendre ?", sub: "Notre IA personnalisera ton parcours." },
  { id: "level",   question: "Quel est ton\nniveau actuel ?", sub: "Adapte le contenu à ton expérience.", options: ["Débutant", "Intermédiaire", "Avancé"] },
  { id: "goal",    question: "Quel est ton\nobjectif principal ?", sub: "Oriente ton apprentissage vers ton avenir.", options: ["Premier emploi", "Freelance", "Reconversion"] },
  { id: "weeks",   question: "Sur combien de\nsemaines ?", sub: "Planifie ton engagement.", options: ["2 semaines", "4 semaines", "8 semaines", "12 semaines", "16 semaines"] },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ domain: "", level: "", goal: "", weeks: "" });
  const [selected, setSelected] = useState<string>("");
  const [customDomain, setCustomDomain] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function selectOption(value: string) {
    if (currentStep.id === "domain" && value === "Autre") {
      setShowCustom(true);
      setSelected("Autre");
      return;
    }
    setSelected(value);
    setShowCustom(false);
  }

  function handleNext() {
    const value = showCustom ? customDomain.trim() : selected;
    if (!value) return;
    const next = { ...answers, [currentStep.id]: value };
    setAnswers(next);
    setSelected("");
    setShowCustom(false);
    setCustomDomain("");
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      generatePath(next);
    }
  }

  async function generatePath(final: typeof answers) {
    setLoading(true);
    try {
      const weeksNum = parseInt(final.weeks);
      const BATCH = 4;

      async function fetchBatch(batchSize: number, startWeek: number): Promise<any[]> {
        const prompt = `Génère un parcours de formation pour les semaines ${startWeek} à ${startWeek + batchSize - 1} (${batchSize} semaines).\n\nProfil: domaine="${final.domain}", niveau="${final.level}", objectif="${final.goal}"\n\nRéponds UNIQUEMENT avec un tableau JSON (sans texte autour) :\n[\n  {\n    "week": ${startWeek},\n    "title": "Titre de la semaine",\n    "objective": "Objectif principal",\n    "modules": [\n      {\n        "id": "w${startWeek}m1",\n        "title": "Titre du module",\n        "description": "Description détaillée en 3 à 4 phrases expliquant les concepts et leur utilité pratique.",\n        "keywords": ["terme YouTube 1", "terme YouTube 2", "terme YouTube 3"],\n        "exercises": "Exercice pratique : description concrète de l'exercice.",\n        "quiz": {\n          "question": "Question de validation ?",\n          "options": ["Option A", "Option B", "Option C", "Option D"],\n          "answer": 0\n        }\n      }\n    ]\n  }\n]\n\nRègles : exactement ${batchSize} semaines (semaines ${startWeek} à ${startWeek + batchSize - 1}), 3 modules par semaine, index answer (0-3), tout en français.`;

        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur API");

        const cleaned = data.reply.replace(/```json|```/g, "").trim();
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (!arrMatch) throw new Error("Pas de tableau JSON");
        const batch = JSON.parse(arrMatch[0]);
        if (!Array.isArray(batch) || !batch[0]?.modules) throw new Error("Structure invalide");
        return batch;
      }

      let allWeeks: any[] = [];
      for (let start = 1; start <= weeksNum; start += BATCH) {
        const batchSize = Math.min(BATCH, weeksNum - start + 1);
        const batch = await fetchBatch(batchSize, start);
        allWeeks = [...allWeeks, ...batch];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: inserted, error: insertError } = await supabase
        .from("user_courses")
        .insert({
          user_id: user.id,
          title: `${final.domain} — ${final.level} — ${final.weeks}`,
          modules: allWeeks,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      router.push(`/learn/${inserted.id}`);

    } catch (err: any) {
      console.error(err);
      alert("Erreur : " + (err.message || "Impossible de générer le parcours"));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-6 p-6">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="text-center">
          <p className="text-primary font-bold text-lg">L&apos;IA prépare ton parcours…</p>
          <p className="text-on-surface-variant text-sm mt-1">Cela peut prendre 30 à 60 secondes</p>
        </div>
        {/* decorative glows */}
        <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-background flex flex-col">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-nav shadow-[0_4px_24px_rgba(25,28,35,0.04)] flex justify-between items-center px-6 py-4">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-base font-bold text-primary">GSN Assistant</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 mt-20 px-6 pb-12 max-w-2xl mx-auto w-full">

        {/* Progress */}
        <div className="mt-4 mb-10">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Étape {step + 1} sur {STEPS.length}
            </span>
            <span className="text-xs font-medium text-on-surface-variant">{Math.round(progress)}% Complété</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <section className="mb-10">
          <h1 className="text-[2.2rem] font-extrabold leading-[1.15] tracking-tight text-on-background mb-3">
            {currentStep.question.split("\n").map((line, i) => (
              <span key={i}>
                {i === 0 ? line : <><br /><span className="text-primary">{line}</span></>}
              </span>
            ))}
          </h1>
          <p className="text-on-surface-variant leading-relaxed">{currentStep.sub}</p>
        </section>

        {/* Domain grid */}
        {currentStep.id === "domain" && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {DOMAINS.map((d) => {
              const isSelected = selected === d.label;
              return (
                <button
                  key={d.label}
                  onClick={() => selectOption(d.label)}
                  className={`relative p-5 rounded-xl text-left transition-all active:scale-[0.97] ${
                    isSelected
                      ? "bg-surface-container-lowest border-2 border-primary shadow-[0_4px_16px_rgba(0,91,191,0.15)]"
                      : "bg-surface-container-lowest border-2 border-transparent shadow-sm hover:border-primary-fixed hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface"}`}>
                      <span className="material-symbols-outlined text-[20px]" style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>{d.icon}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-white">check</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-on-background">{d.label}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{d.sub}</p>
                  {d.label === "Autre" && showCustom && (
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Précise ton domaine..."
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      className="mt-2 w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 p-0 py-1 text-sm placeholder:text-on-surface-variant/50 outline-none"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Options list for other steps */}
        {currentStep.id !== "domain" && currentStep.options && (
          <div className="space-y-3 mb-8">
            {currentStep.options.map((opt) => {
              const isSelected = selected === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  className={`w-full p-4 rounded-xl text-left font-semibold transition-all active:scale-[0.98] flex items-center justify-between ${
                    isSelected
                      ? "bg-surface-container-lowest border-2 border-primary text-primary shadow-[0_4px_16px_rgba(0,91,191,0.12)]"
                      : "bg-surface-container-lowest border-2 border-transparent text-on-background shadow-sm hover:border-primary-fixed"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-white">check</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!selected && !customDomain.trim()}
          className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {step < STEPS.length - 1 ? "Suivant" : "Générer mon parcours avec l'IA"}
          <span className="material-symbols-outlined">{step < STEPS.length - 1 ? "arrow_forward" : "auto_awesome"}</span>
        </button>
        <p className="text-center text-xs text-on-surface-variant mt-5">
          Tu pourras modifier tes préférences plus tard dans les paramètres.
        </p>
      </div>

      {/* Decorative glows */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}
