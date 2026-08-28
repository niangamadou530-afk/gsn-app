"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";

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
    inspire: t("prep.softSkills.breath.inspire"), retiens: t("prep.softSkills.breath.retiens"), expire: t("prep.softSkills.breath.expire"), idle: t("prep.softSkills.breath.idle"),
  };

  const breathSize = breathPhase === "inspire" ? "scale-125" : breathPhase === "retiens" ? "scale-125" : breathPhase === "expire" ? "scale-75" : "scale-100";

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "stress", icon: "self_improvement", label: t("prep.softSkills.tabs.stress") },
    { id: "pomodoro", icon: "timer", label: t("prep.softSkills.tabs.pomodoro") },
    { id: "methodes", icon: "menu_book", label: t("prep.softSkills.tabs.methodes") },
    { id: "motivation", icon: "emoji_events", label: t("prep.softSkills.tabs.motivation") },
  ];

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">{t("prep.softSkills.headerTitle")}</p>
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
              <h2 className="text-xl font-extrabold text-on-surface mb-1">{t("prep.softSkills.stress.title")}</h2>
              <p className="text-on-surface-variant text-sm">{t("prep.softSkills.stress.subtitle")}</p>
            </div>

            {/* Breathing exercise */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm space-y-5">
              <p className="font-bold text-on-surface">{t("prep.softSkills.stress.breathingTitle")}</p>
              <div className="flex items-center justify-center">
                <div className={`w-28 h-28 rounded-full border-4 border-primary transition-all duration-4000 ${breathSize}`}
                  style={{ backgroundColor: breathPhase !== "idle" ? "#1a73e820" : "transparent" }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-bold text-primary text-sm">{breathLabel[breathPhase]}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">{t("prep.softSkills.stress.cyclesLabel")} <strong>{breathCount}</strong></p>
              <div className="flex gap-3 justify-center">
                <button onClick={startBreathing} disabled={breathPhase !== "idle"}
                  className="px-5 py-2.5 font-bold text-white text-sm rounded-xl disabled:opacity-40"
                  style={{ backgroundColor: "#FF6B00" }}>
                  {t("prep.softSkills.stress.startBreathing")}
                </button>
                <button onClick={stopBreathing} className="px-5 py-2.5 font-bold text-on-surface-variant text-sm rounded-xl border-2 border-outline-variant/30 hover:bg-surface-container transition-colors">
                  {t("prep.softSkills.stress.stopBreathing")}
                </button>
              </div>
            </div>

            {/* Stress journal */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-4">
              <p className="font-bold text-on-surface">{t("prep.softSkills.stress.journalTitle")}</p>
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
                {stressLevel <= 2 ? t("prep.softSkills.stress.veryCalm") : stressLevel === 3 ? t("prep.softSkills.stress.neutral") : stressLevel === 4 ? t("prep.softSkills.stress.bitStressed") : t("prep.softSkills.stress.veryStressed")}
              </p>
              <button onClick={() => setStressSaved(true)}
                className="w-full py-2.5 font-bold text-white text-sm rounded-xl"
                style={{ backgroundColor: "#FF6B00" }}>
                {stressSaved ? t("prep.softSkills.stress.saved") : t("prep.softSkills.stress.saveButton")}
              </button>
            </div>

            {/* Tips */}
            <div className="space-y-2">
              <p className="font-bold text-on-surface">{t("prep.softSkills.stress.tipsTitle")}</p>
              {[
                t("prep.softSkills.stress.tip1"),
                t("prep.softSkills.stress.tip2"),
                t("prep.softSkills.stress.tip3"),
                t("prep.softSkills.stress.tip4"),
                t("prep.softSkills.stress.tip5"),
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
              <h2 className="text-xl font-extrabold text-on-surface mb-1">{t("prep.softSkills.pomodoro.title")}</h2>
              <p className="text-on-surface-variant text-sm">{t("prep.softSkills.pomodoro.subtitle")}</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm space-y-5">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${pomodoroPhase === "travail" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-700"}`}>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {pomodoroPhase === "travail" ? "psychology" : "coffee"}
                </span>
                {pomodoroPhase === "travail" ? t("prep.softSkills.pomodoro.work") : t("prep.softSkills.pomodoro.pause")}
              </div>
              <p className="text-6xl font-black text-on-surface">{formatTime(pomodoroTime)}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setPomodoroRunning(r => !r)}
                  className="px-6 py-3 font-black text-white rounded-xl text-sm"
                  style={{ backgroundColor: pomodoroRunning ? "#6b7280" : "#FF6B00" }}>
                  {pomodoroRunning ? t("prep.softSkills.pomodoro.pauseButton") : t("prep.softSkills.pomodoro.startButton")}
                </button>
                <button onClick={resetPomodoro}
                  className="px-4 py-3 font-bold text-on-surface-variant rounded-xl border-2 border-outline-variant/30 text-sm hover:bg-surface-container transition-colors">
                  {t("prep.softSkills.pomodoro.reset")}
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <p className="font-bold text-on-surface">{t("prep.softSkills.pomodoro.howItWorks")}</p>
              {[t("prep.softSkills.pomodoro.step1"), t("prep.softSkills.pomodoro.step2"), t("prep.softSkills.pomodoro.step3"), t("prep.softSkills.pomodoro.step4")].map((s, i) => (
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
              <h2 className="text-xl font-extrabold text-on-surface mb-1">{t("prep.softSkills.methodes.title")}</h2>
              <p className="text-on-surface-variant text-sm">{t("prep.softSkills.methodes.subtitle")}</p>
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
              <p className="font-bold text-on-surface">{t("prep.softSkills.methodes.checklistTitle")}</p>
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
              <p className="text-xs text-on-surface-variant text-center">{t("prep.softSkills.methodes.checklistProgress", { done: checked.size, total: CHECKLIST.length, plural: checked.size > 1 ? "s" : "" })}</p>
            </div>
          </>
        )}

        {/* ── MOTIVATION ── */}
        {tab === "motivation" && (
          <>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface mb-1">{t("prep.softSkills.motivation.title")}</h2>
              <p className="text-on-surface-variant text-sm">{t("prep.softSkills.motivation.subtitle")}</p>
            </div>

            <div className="rounded-2xl p-6 text-center space-y-3 text-white" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
              <span className="material-symbols-outlined text-[40px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
              <p className="text-lg font-bold leading-snug">&ldquo;{QUOTES[quoteIdx]}&rdquo;</p>
              <p className="text-white/70 text-xs">{t("prep.softSkills.motivation.quoteLabel")}</p>
            </div>

            {[
              { icon: "🎓", title: t("prep.softSkills.motivation.card1.title"), desc: t("prep.softSkills.motivation.card1.desc") },
              { icon: "💪", title: t("prep.softSkills.motivation.card2.title"), desc: t("prep.softSkills.motivation.card2.desc") },
              { icon: "🌟", title: t("prep.softSkills.motivation.card3.title"), desc: t("prep.softSkills.motivation.card3.desc") },
              { icon: "🚀", title: t("prep.softSkills.motivation.card4.title"), desc: t("prep.softSkills.motivation.card4.desc") },
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
              {t("prep.softSkills.motivation.viewOrientation")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
