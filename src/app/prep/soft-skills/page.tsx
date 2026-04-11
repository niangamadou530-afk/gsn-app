"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Tab = "stress" | "pomodoro" | "methodes" | "motivation";

const CHECKLIST = [
  "Pièce d'identité",
  "Convocation",
  "Stylos (2 minimum)",
  "Règle et calculatrice",
  "Montre",
  "Eau et en-cas léger",
  "Tenue correcte",
  "Arriver 30 min avant",
];

const METHODES = [
  { title: "Comment lire un sujet de dissertation", steps: ["Lire 2 fois sans noter", "Identifier les mots-clés", "Dégager la problématique", "Faire un plan au brouillon avant de rédiger"] },
  { title: "Gérer le temps en salle d'examen", steps: ["Lire tout le sujet en 5 min", "Répartir le temps par partie", "Rédiger l'introduction en dernier", "Garder 10 min pour relire"] },
  { title: "Technique de mémorisation — répétition espacée", steps: ["Apprendre une notion J0", "Réviser J+1 (5 min)", "Réviser J+3 (3 min)", "Réviser J+7 (2 min)", "Mémorisé à long terme ✓"] },
  { title: "Mind mapping (carte mentale)", steps: ["Mot central au milieu", "Branches principales : les grandes idées", "Sous-branches : les détails", "Couleurs + dessins pour mémoriser"] },
];

const QUOTES = [
  "Le succès, c'est tomber sept fois et se relever huit.",
  "Chaque heure de révision est une brique de ton avenir.",
  "Tu ne travailles pas pour les notes, tu travailles pour ta liberté.",
  "La discipline est le pont entre les objectifs et les résultats.",
  "Commence là où tu es. Utilise ce que tu as. Fais ce que tu peux.",
];

export default function SoftSkillsPage() {
  const [tab, setTab] = useState<Tab>("stress");
  const [breathPhase, setBreathPhase] = useState<"inspire" | "retiens" | "expire" | "idle">("idle");
  const [breathCount, setBreathCount] = useState(0);
  const breathRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pomodoro
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<"travail" | "pause">("travail");
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stress journal
  const [stressLevel, setStressLevel] = useState(3);
  const [stressSaved, setStressSaved] = useState(false);

  // Checklist
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Motivation
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  // Breathing
  function startBreathing() {
    setBreathCount(0);
    runBreath();
  }

  function runBreath() {
    setBreathPhase("inspire");
    breathRef.current = setTimeout(() => {
      setBreathPhase("retiens");
      breathRef.current = setTimeout(() => {
        setBreathPhase("expire");
        breathRef.current = setTimeout(() => {
          setBreathCount(c => c + 1);
          setBreathPhase("idle");
        }, 4000);
      }, 4000);
    }, 4000);
  }

  function stopBreathing() {
    if (breathRef.current) clearTimeout(breathRef.current);
    setBreathPhase("idle");
  }

  // Pomodoro
  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime(t => {
          if (t <= 1) {
            const nextPhase = pomodoroPhase === "travail" ? "pause" : "travail";
            setPomodoroPhase(nextPhase);
            return nextPhase === "travail" ? 25 * 60 : 5 * 60;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    }
    return () => { if (pomodoroRef.current) clearInterval(pomodoroRef.current); };
  }, [pomodoroRunning, pomodoroPhase]);

  function resetPomodoro() {
    setPomodoroRunning(false);
    setPomodoroPhase("travail");
    setPomodoroTime(25 * 60);
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const breathLabel: Record<typeof breathPhase, string> = {
    inspire: "Inspire… 🌬️", retiens: "Retiens… 😶", expire: "Expire… 💨", idle: "Prêt",
  };

  const breathSize = breathPhase === "inspire" ? "scale-125" : breathPhase === "retiens" ? "scale-125" : breathPhase === "expire" ? "scale-75" : "scale-100";

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "stress", icon: "self_improvement", label: "Stress" },
    { id: "pomodoro", icon: "timer", label: "Pomodoro" },
    { id: "methodes", icon: "menu_book", label: "Méthodes" },
    { id: "motivation", icon: "emoji_events", label: "Motivation" },
  ];

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Méthodes & Bien-être</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-6 py-3 border-b border-outline-variant/15">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === t.id ? "text-white" : "bg-surface-container-lowest text-on-surface-variant"}`}
            style={tab === t.id ? { backgroundColor: "#FF6B00" } : {}}>
            <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">

        {/* ── STRESS ── */}
        {tab === "stress" && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface mb-1">Gestion du stress</h2>
              <p className="text-on-surface-variant text-sm">La respiration régule immédiatement l&apos;anxiété.</p>
            </div>

            {/* Breathing exercise */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm space-y-5">
              <p className="font-bold text-on-surface">Exercice de respiration 4-4-4</p>
              <div className="flex items-center justify-center">
                <div className={`w-28 h-28 rounded-full border-4 border-primary transition-all duration-4000 ${breathSize}`}
                  style={{ backgroundColor: breathPhase !== "idle" ? "#1a73e820" : "transparent" }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-bold text-primary text-sm">{breathLabel[breathPhase]}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">Cycles complétés : <strong>{breathCount}</strong></p>
              <div className="flex gap-3 justify-center">
                <button onClick={startBreathing} disabled={breathPhase !== "idle"}
                  className="px-5 py-2.5 font-bold text-white text-sm rounded-xl disabled:opacity-40"
                  style={{ backgroundColor: "#FF6B00" }}>
                  Démarrer
                </button>
                <button onClick={stopBreathing} className="px-5 py-2.5 font-bold text-on-surface-variant text-sm rounded-xl border-2 border-outline-variant/30 hover:bg-surface-container transition-colors">
                  Arrêter
                </button>
              </div>
            </div>

            {/* Stress journal */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
              <p className="font-bold text-on-surface">Journal de stress — aujourd&apos;hui</p>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => { setStressLevel(n); setStressSaved(false); }}
                    className={`flex-1 h-10 rounded-xl font-black text-sm transition-all ${stressLevel === n ? "text-white" : "bg-surface-container text-on-surface-variant"}`}
                    style={stressLevel === n ? { backgroundColor: n <= 2 ? "#22c55e" : n === 3 ? "#f59e0b" : "#ef4444" } : {}}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant text-center">
                {stressLevel <= 2 ? "😊 Très calme" : stressLevel === 3 ? "😐 Neutre" : stressLevel === 4 ? "😟 Un peu stressé" : "😰 Très stressé"}
              </p>
              <button onClick={() => setStressSaved(true)}
                className="w-full py-2.5 font-bold text-white text-sm rounded-xl"
                style={{ backgroundColor: "#FF6B00" }}>
                {stressSaved ? "✓ Sauvegardé" : "Enregistrer mon niveau de stress"}
              </button>
            </div>

            {/* Tips */}
            <div className="space-y-2">
              <p className="font-bold text-on-surface">Conseils anti-stress</p>
              {[
                "Dors au moins 8h la veille de l'examen.",
                "Révise par petites sessions de 25 min, pas de marathon.",
                "Fais une promenade de 15 min par jour.",
                "Évite les réseaux sociaux le soir avant l'examen.",
                "Prépare ta trousse et tes documents la veille.",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                  <span className="text-lg shrink-0">{["🧘", "⏰", "🚶", "📵", "🎒"][i]}</span>
                  <p className="text-sm text-on-surface-variant">{tip}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── POMODORO ── */}
        {tab === "pomodoro" && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface mb-1">Technique Pomodoro</h2>
              <p className="text-on-surface-variant text-sm">25 min de travail intense · 5 min de pause · Répéter.</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm space-y-5">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${pomodoroPhase === "travail" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-700"}`}>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {pomodoroPhase === "travail" ? "psychology" : "coffee"}
                </span>
                {pomodoroPhase === "travail" ? "Travail" : "Pause"}
              </div>
              <p className="text-6xl font-black text-on-surface">{formatTime(pomodoroTime)}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setPomodoroRunning(r => !r)}
                  className="px-6 py-3 font-black text-white rounded-xl text-sm"
                  style={{ backgroundColor: pomodoroRunning ? "#6b7280" : "#FF6B00" }}>
                  {pomodoroRunning ? "⏸ Pause" : "▶ Démarrer"}
                </button>
                <button onClick={resetPomodoro}
                  className="px-4 py-3 font-bold text-on-surface-variant rounded-xl border-2 border-outline-variant/30 text-sm hover:bg-surface-container transition-colors">
                  Réinitialiser
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <p className="font-bold text-on-surface">Comment ça marche</p>
              {["Choisis une matière à réviser", "Travaille 25 min sans interruption", "Fais une pause de 5 min", "Après 4 cycles → pause longue (15-30 min)"].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ backgroundColor: "#FF6B00" }}>{i + 1}</span>
                  <p className="text-sm text-on-surface-variant">{s}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── METHODES ── */}
        {tab === "methodes" && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface mb-1">Méthodes d&apos;examen</h2>
              <p className="text-on-surface-variant text-sm">Techniques éprouvées pour maximiser tes résultats.</p>
            </div>

            {METHODES.map((m, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
                <p className="font-bold text-on-surface">{m.title}</p>
                <div className="space-y-2">
                  {m.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                      <p className="text-sm text-on-surface-variant">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Checklist J-1 */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <p className="font-bold text-on-surface">Checklist le jour J ✅</p>
              <div className="space-y-2">
                {CHECKLIST.map(item => (
                  <button key={item} onClick={() => setChecked(p => { const n = new Set(p); n.has(item) ? n.delete(item) : n.add(item); return n; })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${checked.has(item) ? "bg-green-50" : "bg-surface-container"}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked.has(item) ? "bg-green-500 border-green-500" : "border-outline-variant"}`}>
                      {checked.has(item) && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                    </div>
                    <span className={`text-sm font-medium ${checked.has(item) ? "line-through text-on-surface-variant" : "text-on-surface"}`}>{item}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant text-center">{checked.size}/{CHECKLIST.length} préparé{checked.size > 1 ? "s" : ""}</p>
            </div>
          </>
        )}

        {/* ── MOTIVATION ── */}
        {tab === "motivation" && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface mb-1">Reste motivé !</h2>
              <p className="text-on-surface-variant text-sm">Chaque jour de révision compte.</p>
            </div>

            <div className="rounded-2xl p-6 text-center space-y-3 text-white" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
              <span className="material-symbols-outlined text-[40px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
              <p className="text-lg font-bold leading-snug">&ldquo;{QUOTES[quoteIdx]}&rdquo;</p>
              <p className="text-white/70 text-xs">Citation du jour</p>
            </div>

            {[
              { icon: "🎓", title: "Ton objectif", desc: "Avoir ton diplôme, c'est ouvrir la porte à toutes les opportunités." },
              { icon: "💪", title: "Tu as déjà commencé", desc: "Le fait d'être ici et de réviser te place déjà dans le top." },
              { icon: "🌟", title: "Chaque progrès compte", desc: "Même 30 minutes de révision sérieuse font avancer." },
              { icon: "🚀", title: "GSN Learn t'attend", desc: "Après ton examen, lance-toi dans une formation pro avec GSN Learn." },
            ].map((m, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="font-bold text-on-surface text-sm">{m.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}

            <Link href="/prep/orientation"
              className="block w-full py-3.5 text-center font-black text-white rounded-2xl"
              style={{ backgroundColor: "#FF6B00" }}>
              Voir mon orientation après l&apos;examen →
            </Link>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur border-t border-outline-variant/20 flex justify-around items-center px-4 pb-6 pt-3">
        <Link href="/prep/dashboard" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium mt-0.5">Accueil</span>
        </Link>
        <Link href="/prep/bibliotheque" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">library_books</span>
          <span className="text-[10px] font-medium mt-0.5">Épreuves</span>
        </Link>
        <Link href="/prep/simulateur" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">quiz</span>
          <span className="text-[10px] font-medium mt-0.5">Examen</span>
        </Link>
        <Link href="/prep/progression" className="flex flex-col items-center text-outline active:scale-90 transition-transform">
          <span className="material-symbols-outlined">trending_up</span>
          <span className="text-[10px] font-medium mt-0.5">Progrès</span>
        </Link>
        <Link href="/prep/soft-skills" className="flex flex-col items-center active:scale-90 transition-transform" style={{ color: "#FF6B00" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>self_improvement</span>
          <span className="text-[10px] font-medium mt-0.5">Méthodes</span>
        </Link>
      </nav>
    </main>
  );
}
