"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "domain",
    question: "Quel domaine t'intéresse ?",
    options: ["Développement Web", "Design GFX", "Marketing Digital", "Maintenance Info", "Agriculture"],
  },
  {
    id: "level",
    question: "Quel est ton niveau actuel ?",
    options: ["Débutant", "Intermédiaire", "Avancé"],
  },
  {
    id: "goal",
    question: "Quel est ton objectif ?",
    options: ["Premier emploi", "Freelance", "Reconversion"],
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({ domain: "", level: "", goal: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSelect = (value: string) => {
    const key = STEPS[currentStep].id;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generatePath(newAnswers);
    }
  };

  const generatePath = async (finalAnswers: any) => {
    setLoading(true);
    try {
      // 1. Appel à l'API (Groq)
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Génère un parcours de formation de 3 modules précis pour un profil : ${JSON.stringify(finalAnswers)}. 
          Réponds uniquement avec un tableau JSON sans texte autour : [{"title": "Nom du module", "description": "Contenu"}]`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Erreur API");

      // 2. Nettoyage de la réponse IA (pour éviter le crash du JSON.parse)
      let modules;
      try {
        const cleanReply = data.reply.replace(/```json|```/g, "").trim();
        modules = JSON.parse(cleanReply);
      } catch (e) {
        console.error("L'IA n'a pas envoyé de JSON valide:", data.reply);
        throw new Error("Format de réponse IA invalide");
      }

      // 3. Sauvegarde dans Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Tu dois être connecté !");
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase.from("user_courses").insert({
        user_id: user.id,
        title: `Parcours ${finalAnswers.domain}`,
        modules: modules,
      });

      if (insertError) throw insertError;

      // 4. Succès -> Redirection vers la page Learn
      router.push("/learn");

    } catch (error: any) {
      console.error("Erreur complète:", error);
      alert("Erreur : " + (error.message || "Impossible de générer le parcours"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-blue-600 font-medium">L'IA de GSN prépare ton parcours... 🚀</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg border border-blue-100">
      <div className="mb-8">
        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">GSN Learn</span>
        <h1 className="text-2xl font-bold mt-2">{STEPS[currentStep].question}</h1>
        <div className="w-full bg-gray-200 h-1 mt-4 rounded-full overflow-hidden">
           <div 
             className="bg-blue-600 h-1 transition-all duration-500" 
             style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
           ></div>
        </div>
      </div>

      <div className="space-y-3">
        {STEPS[currentStep].options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className="w-full p-4 text-left border-2 border-gray-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium active:scale-95"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
