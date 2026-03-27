"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const DOMAINS = [
  "Développement Web",
  "Design GFX",
  "Marketing Digital",
  "Maintenance Info",
  "Agriculture",
  "Autre",
];

const STEPS = [
  { id: "domain",  question: "Quel domaine t'intéresse ?" },
  { id: "level",   question: "Quel est ton niveau actuel ?",   options: ["Débutant", "Intermédiaire", "Avancé"] },
  { id: "goal",    question: "Quel est ton objectif ?",        options: ["Premier emploi", "Freelance", "Reconversion"] },
  { id: "weeks",   question: "Sur combien de semaines ?",      options: ["2 semaines", "4 semaines", "8 semaines", "12 semaines", "16 semaines"] },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ domain: "", level: "", goal: "", weeks: "" });
  const [customDomain, setCustomDomain] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function pickOption(value: string) {
    const key = STEPS[step].id as keyof typeof answers;

    if (key === "domain" && value === "Autre") {
      setShowCustom(true);
      return;
    }

    const next = { ...answers, [key]: value };
    setAnswers(next);
    setShowCustom(false);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      generatePath(next);
    }
  }

  function confirmCustomDomain() {
    const domain = customDomain.trim();
    if (!domain) return;
    pickOption(domain);
  }

  async function generatePath(final: typeof answers) {
    setLoading(true);
    try {
      const weeksNum = parseInt(final.weeks);

      const prompt = `Génère un parcours de formation de ${weeksNum} semaines.

Profil: domaine="${final.domain}", niveau="${final.level}", objectif="${final.goal}"

Réponds UNIQUEMENT avec un tableau JSON (sans texte autour) :
[
  {
    "week": 1,
    "title": "Titre de la semaine",
    "objective": "Objectif principal",
    "modules": [
      {
        "id": "w1m1",
        "title": "Titre du module",
        "description": "Description détaillée en 3 à 4 phrases expliquant les concepts et leur utilité pratique.",
        "keywords": ["terme YouTube 1", "terme YouTube 2", "terme YouTube 3"],
        "exercises": "Exercice pratique : description concrète de l'exercice.",
        "quiz": {
          "question": "Question de validation ?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0
        }
      }
    ]
  }
]

Règles : exactement ${weeksNum} semaines, 3 modules par semaine, index answer (0-3), tout en français.`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur API");

      let weeks: any[];
      try {
        const cleaned = data.reply.replace(/```json|```/g, "").trim();
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (!arrMatch) throw new Error("Pas de tableau JSON");
        weeks = JSON.parse(arrMatch[0]);
        if (!Array.isArray(weeks) || !weeks[0]?.modules) throw new Error("Structure invalide");
      } catch (e) {
        console.error("Parse error:", data.reply?.slice(0, 200));
        throw new Error("La réponse IA n'est pas au bon format");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: inserted, error: insertError } = await supabase
        .from("user_courses")
        .insert({
          user_id: user.id,
          title: `${final.domain} — ${final.level} — ${final.weeks}`,
          modules: weeks,
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
      <div className="flex flex-col h-screen items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-blue-600 font-semibold">L&apos;IA prépare ton parcours…</p>
        <p className="text-sm text-gray-400">Cela peut prendre 30 à 60 secondes</p>
      </div>
    );
  }

  const currentStep = STEPS[step];
  const options = currentStep.id === "domain" ? DOMAINS : (currentStep as any).options as string[];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg border border-blue-100">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">GSN Learn</span>
        <h1 className="text-2xl font-bold mt-2">{currentStep.question}</h1>
        <div className="w-full bg-gray-200 h-1.5 mt-4 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-1.5 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Étape {step + 1} / {STEPS.length}</p>
      </div>

      {/* Custom domain input */}
      {showCustom ? (
        <div className="space-y-3">
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="Ex : Comptabilité, Photographie, Couture…"
            className="w-full p-4 border-2 border-blue-300 rounded-lg outline-none focus:border-blue-500 font-medium"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && confirmCustomDomain()}
          />
          <button
            onClick={confirmCustomDomain}
            disabled={!customDomain.trim()}
            className="w-full p-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Continuer →
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            ← Retour
          </button>
        </div>
      ) : (
        /* Options list */
        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => pickOption(opt)}
              className="w-full p-4 text-left border-2 border-gray-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium active:scale-95"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
