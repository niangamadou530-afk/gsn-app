"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { sounds } from "@/lib/soundEffects";
import { SoundToggle } from "@/components/SoundToggle";

type Tab = "stress" | "pomodoro" | "methodes" | "motivation";

const CHECKLIST = [
  t("prep.softSkills.checklist.item1"),
  t("prep.softSkills.checklist.item2"),
  t("prep.softSkills.checklist.item3"),
  t("prep.softSkills.checklist.item4"),
  t("prep.softSkills.checklist.item5"),
  t("prep.softSkills.checklist.item6"),
  t("prep.softSkills.checklist.item7"),
  t("prep.softSkills.checklist.item8"),
];

const METHODES = [
  { title: t("prep.softSkills.methodes.method1.title"), steps: [t("prep.softSkills.methodes.method1.step1"), t("prep.softSkills.methodes.method1.step2"), t("prep.softSkills.methodes.method1.step3"), t("prep.softSkills.methodes.method1.step4")] },
  { title: t("prep.softSkills.methodes.method2.title"), steps: [t("prep.softSkills.methodes.method2.step1"), t("prep.softSkills.methodes.method2.step2"), t("prep.softSkills.methodes.method2.step3"), t("prep.softSkills.methodes.method2.step4")] },
  { title: t("prep.softSkills.methodes.method3.title"), steps: [t("prep.softSkills.methodes.method3.step1"), t("prep.softSkills.methodes.method3.step2"), t("prep.softSkills.methodes.method3.step3"), t("prep.softSkills.methodes.method3.step4"), t("prep.softSkills.methodes.method3.step5")] },
  { title: t("prep.softSkills.methodes.method4.title"), steps: [t("prep.softSkills.methodes.method4.step1"), t("prep.softSkills.methodes.method4.step2"), t("prep.softSkills.methodes.method4.step3"), t("prep.softSkills.methodes.method4.step4")] },
];

const QUOTES = [
  t("prep.softSkills.quotes.q1"),
  t("prep.softSkills.quotes.q2"),
  t("prep.softSkills.quotes.q3"),
  t("prep.softSkills.quotes.q4"),
  t("prep.softSkills.quotes.q5"),
];

const STRESS_LEVELS = [
  { level: 1, emoji: "😌", label: "Zen absolu", color: "bg-emerald-500 text-white" },
  { level: 2, emoji: "😊", label: "Calme & serein", color: "bg-teal-500 text-white" },
  { level: 3, emoji: "😐", label: "Neutre / équilibré", color: "bg-amber-500 text-white" },
  { level: 4, emoji: "😰", label: "Tension passagère", color: "bg-orange-500 text-white" },
  { level: 5, emoji: "🤯", label: "Stress intense", color: "bg-rose-500 text-white" },
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

  // Breathing loop with gentle audio
  function startBreathing() {
    setBreathCount(0);
    runBreath();
  }

  function runBreath() {
    setBreathPhase("inspire");
    sounds.playBreathIn();

    breathRef.current = setTimeout(() => {
      setBreathPhase("retiens");
      breathRef.current = setTimeout(() => {
        setBreathPhase("expire");
        sounds.playBreathOut();

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
            sounds.playPomodoroBell();
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

  function handleTogglePomodoro() {
    if (!pomodoroRunning) {
      sounds.playPomodoroStart();
    }
    setPomodoroRunning(r => !r);
  }

  function resetPomodoro() {
    setPomodoroRunning(false);
    setPomodoroPhase("travail");
    setPomodoroTime(25 * 60);
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const breathLabel: Record<typeof breathPhase, string> = {
    inspire: t("prep.softSkills.breath.inspire"),
    retiens: t("prep.softSkills.breath.retiens"),
    expire: t("prep.softSkills.breath.expire"),
    idle: t("prep.softSkills.breath.idle"),
  };

  const breathSize = breathPhase === "inspire" || breathPhase === "retiens"
    ? "scale-125 bg-blue-100/80 border-[#005bbf]"
    : breathPhase === "expire"
    ? "scale-75 bg-blue-50/40 border-blue-300"
    : "scale-100 bg-slate-50 border-slate-300";

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "stress", icon: "self_improvement", label: t("prep.softSkills.tabs.stress") },
    { id: "pomodoro", icon: "timer", label: t("prep.softSkills.tabs.pomodoro") },
    { id: "methodes", icon: "menu_book", label: t("prep.softSkills.tabs.methodes") },
    { id: "motivation", icon: "emoji_events", label: t("prep.softSkills.tabs.motivation") },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Préparation mentale, sommeil & efficacité</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t("prep.softSkills.title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t("prep.softSkills.subtitle")}
            </p>
          </div>
          <div className="self-start sm:self-center">
            <SoundToggle />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs flex gap-1">
        {TABS.map(tItem => (
          <button
            key={tItem.id}
            type="button"
            onClick={() => setTab(tItem.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === tItem.id
                ? "bg-[#005bbf] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tItem.icon}</span>
            <span className="hidden sm:inline">{tItem.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">

        {/* ── GESTION DU STRESS & RESPIRATION ── */}
        {tab === "stress" && (
          <div className="space-y-6">
            {/* Box Breathing */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-6">
              <div>
                <h2 className="font-extrabold text-lg sm:text-xl text-slate-900">
                  {t("prep.softSkills.stress.breathingTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {t("prep.softSkills.stress.breathingDesc")}
                </p>
              </div>

              {/* Animated Circle */}
              <div className="flex items-center justify-center py-6">
                <div
                  className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${breathSize}`}
                >
                  <p className="font-black text-slate-800 text-sm tracking-wide">{breathLabel[breathPhase]}</p>
                  {breathCount > 0 && (
                    <span className="text-[11px] font-bold text-slate-400 mt-1">
                      Cycle {breathCount} terminé
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={startBreathing}
                  disabled={breathPhase !== "idle"}
                  className="px-6 py-3 font-extrabold text-white text-xs rounded-xl shadow-xs disabled:opacity-40 active:scale-95 transition-all"
                  style={{ backgroundColor: "#FF6B00" }}
                >
                  {t("prep.softSkills.stress.startBreathing")}
                </button>
                <button
                  type="button"
                  onClick={stopBreathing}
                  className="px-5 py-3 font-bold text-slate-700 text-xs rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  {t("prep.softSkills.stress.stopBreathing")}
                </button>
              </div>
            </div>

            {/* Stress Journal with Expressive Emojis */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Journal d&apos;évaluation du stress</h3>
                  <p className="text-xs text-slate-500">Comment te sens-tu face à tes révisions aujourd&apos;hui ?</p>
                </div>
                <span className="text-2xl">{STRESS_LEVELS[stressLevel - 1].emoji}</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {STRESS_LEVELS.map(item => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => { setStressLevel(item.level); setStressSaved(false); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      stressLevel === item.level
                        ? "border-[#005bbf] bg-blue-50/70 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl mb-1">{item.emoji}</span>
                    <span className="font-black text-xs text-slate-900">{item.level}</span>
                    <span className="text-[10px] text-slate-500 hidden sm:block text-center mt-0.5 truncate w-full">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <p className="text-xs font-bold text-slate-700">
                  Ressenti actuel : <strong className="text-[#005bbf]">{STRESS_LEVELS[stressLevel - 1].label}</strong> ({STRESS_LEVELS[stressLevel - 1].emoji})
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setStressSaved(true); sounds.playMastery(); }}
                className="w-full py-3.5 font-extrabold text-white text-xs rounded-xl shadow-xs transition-colors"
                style={{ backgroundColor: "#FF6B00" }}
              >
                {stressSaved ? "✓ Ressenti enregistré pour la journée !" : t("prep.softSkills.stress.saveButton")}
              </button>
            </div>

            {/* Anti-Stress Tips with Expressive Emojis */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">{t("prep.softSkills.stress.tipsTitle")}</h3>
              <div className="space-y-2.5">
                {[
                  { emoji: "🧘‍♀️", text: t("prep.softSkills.stress.tip1") },
                  { emoji: "⏰", text: t("prep.softSkills.stress.tip2") },
                  { emoji: "🚶‍♂️", text: t("prep.softSkills.stress.tip3") },
                  { emoji: "📴", text: t("prep.softSkills.stress.tip4") },
                  { emoji: "🎒", text: t("prep.softSkills.stress.tip5") },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                    <span className="text-2xl shrink-0 leading-none">{item.emoji}</span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── POMODORO ── */}
        {tab === "pomodoro" && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-xs space-y-6">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold ${
                pomodoroPhase === "travail" ? "bg-blue-50 text-[#005bbf] border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                <span className="material-symbols-outlined text-[16px]">
                  {pomodoroPhase === "travail" ? "psychology" : "coffee"}
                </span>
                <span>{pomodoroPhase === "travail" ? t("prep.softSkills.pomodoro.work") : t("prep.softSkills.pomodoro.pause")}</span>
              </div>

              <p className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight font-mono">
                {formatTime(pomodoroTime)}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleTogglePomodoro}
                  className="px-8 py-3.5 font-extrabold text-white rounded-xl text-xs shadow-xs active:scale-95 transition-all"
                  style={{ backgroundColor: pomodoroRunning ? "#64748b" : "#FF6B00" }}
                >
                  {pomodoroRunning ? t("prep.softSkills.pomodoro.pauseButton") : t("prep.softSkills.pomodoro.startButton")}
                </button>
                <button
                  type="button"
                  onClick={resetPomodoro}
                  className="px-5 py-3.5 font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs transition-colors"
                >
                  {t("prep.softSkills.pomodoro.reset")}
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">{t("prep.softSkills.pomodoro.howItWorks")}</h3>
              <div className="space-y-2">
                {[t("prep.softSkills.pomodoro.step1"), t("prep.softSkills.pomodoro.step2"), t("prep.softSkills.pomodoro.step3"), t("prep.softSkills.pomodoro.step4")].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0" style={{ backgroundColor: "#FF6B00" }}>
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-700 font-medium">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── METHODES DE REVISION & CHECKLIST J-1 ── */}
        {tab === "methodes" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {METHODES.map((m, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-sm">{m.title}</h3>
                  <div className="space-y-2">
                    {m.steps.map((step, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-blue-50 text-[#005bbf] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {j + 1}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist J-1 */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t("prep.softSkills.methodes.checklistTitle")}</h3>
                  <p className="text-xs text-slate-500">Cochez chaque élément préparé dans votre sac</p>
                </div>
                <span className="text-xs font-extrabold text-[#005bbf] bg-blue-50 px-2.5 py-1 rounded-lg">
                  {checked.size}/{CHECKLIST.length}
                </span>
              </div>

              <div className="space-y-2">
                {CHECKLIST.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setChecked(p => { const n = new Set(p); n.has(item) ? n.delete(item) : n.add(item); return n; })}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      checked.has(item)
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                        : "bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      checked.has(item) ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                      {checked.has(item) && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold ${checked.has(item) ? "line-through text-slate-400" : ""}`}>
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MOTIVATION with expressive emojis ── */}
        {tab === "motivation" && (
          <div className="space-y-5">
            {/* Random Quote Hero */}
            <div className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 sm:p-8 text-center text-white shadow-lg space-y-3">
              <span className="text-3xl">✨</span>
              <p className="text-base sm:text-lg font-bold leading-relaxed max-w-lg mx-auto">
                &ldquo;{QUOTES[quoteIdx]}&rdquo;
              </p>
              <p className="text-blue-100 text-xs font-semibold">{t("prep.softSkills.motivation.quoteLabel")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { emoji: "🏆", title: t("prep.softSkills.motivation.card1.title"), desc: t("prep.softSkills.motivation.card1.desc") },
                { emoji: "🔥", title: t("prep.softSkills.motivation.card2.title"), desc: t("prep.softSkills.motivation.card2.desc") },
                { emoji: "🌟", title: t("prep.softSkills.motivation.card3.title"), desc: t("prep.softSkills.motivation.card3.desc") },
                { emoji: "🚀", title: t("prep.softSkills.motivation.card4.title"), desc: t("prep.softSkills.motivation.card4.desc") },
              ].map((m, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
                  <span className="text-3xl shrink-0">{m.emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{m.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/prep/orientation"
              className="block w-full py-4 text-center font-extrabold text-white text-xs rounded-2xl shadow-xs transition-colors"
              style={{ backgroundColor: "#FF6B00" }}
            >
              {t("prep.softSkills.motivation.viewOrientation")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
