"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BFEM_DATE = "2027-07-15";
const BAC_DATE  = "2027-06-30";
const PREP_START = new Date("2026-08-09");

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

type Student = {
  prenom: string | null;
  exam_type: string;
  serie: string | null;
  ecole: string | null;
};

export default function PrepDashboardPage() {
  const router  = useRouter();
  const [student, setStudent]     = useState<Student | null>(null);
  const [loading, setLoading]     = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [flashCount, setFlashCount] = useState(0);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);

  // Star particle animation on the countdown card
  useEffect(() => {
    const cv = starCanvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    function resize() {
      if (!cv) return;
      const parent = cv.parentElement as HTMLElement | null;
      cv.width  = parent?.offsetWidth  ?? 300;
      cv.height = parent?.offsetHeight ?? 200;
    }
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * (cv.width  || 300),
      y: Math.random() * (cv.height || 200),
      r: 0.5 + Math.random() * 1.5,
      a: Math.random() * 0.5,
      ta: 0.2 + Math.random() * 0.7,
      life: 0,
      maxLife: 100 + Math.random() * 200,
    }));

    function frame() {
      if (!cv || !ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      stars.forEach(s => {
        s.life++;
        if (s.a < s.ta) s.a = Math.min(s.ta, s.a + 0.02);
        if (s.life > s.maxLife) {
          s.a -= 0.02;
          if (s.a <= 0) {
            s.x = Math.random() * cv.width;
            s.y = Math.random() * cv.height;
            s.r = 0.5 + Math.random() * 1.5;
            s.a = 0; s.ta = 0.2 + Math.random() * 0.7;
            s.life = 0; s.maxLife = 100 + Math.random() * 200;
          }
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.a);
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0, s.r), 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();
      });
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: stu } = await supabase
        .from("prep_students")
        .select("prenom, exam_type, serie, ecole")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!stu) { router.push("/prep/onboarding"); return; }
      setStudent(stu);

      const { data: quizData } = await supabase
        .from("quiz_results")
        .select("score, total")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (quizData) setQuizScore(Math.round((quizData.score / quizData.total) * 100));

      const { count } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("maitrisee", true);

      setFlashCount(count ?? 0);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: "#6366F1", borderTopColor: "transparent" }} />
    </div>
  );

  const examDate   = student?.exam_type === "BFEM" ? BFEM_DATE : BAC_DATE;
  const examLabel  = student?.exam_type === "BFEM" ? "BFEM" : "BAC";
  const examFull   = student?.exam_type === "BFEM" ? "15 juil. 2027" : "30 juin 2027";
  const days       = daysUntil(examDate);
  const totalDays  = Math.ceil((new Date(examDate).getTime() - PREP_START.getTime()) / 86400000);
  const pct        = Math.max(0, Math.min(100, Math.round((1 - days / totalDays) * 100)));
  const prenom     = student?.prenom ?? "Élève";

  return (
    <main className="min-h-screen bg-surface text-on-surface">

      {/* Header */}
      <header className="px-5 pt-7 pb-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg font-black tracking-tight" style={{ color: "#6366F1" }}>GSN</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "#6366F1", letterSpacing: ".06em" }}>PREP</span>
          </div>
          <p className="text-xs font-semibold" style={{ color: "#9396B8" }}>Bonjour,</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#1E1B4B" }}>{prenom} 👋</h1>
          {student?.serie && (
            <p className="text-[11px] mt-0.5" style={{ color: "#9396B8" }}>
              {examLabel} · Série {student.serie}{student.ecole ? ` · ${student.ecole}` : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "#ECEEF8", border: "1px solid rgba(99,102,241,0.12)" }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#9396B8" }}>logout</span>
        </button>
      </header>

      <div className="px-5 pt-4 space-y-3 pb-8">

        {/* ── Countdown Card — Indigo gradient + star canvas ── */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#312E81 0%,#4F46E5 45%,#7C3AED 100%)", minHeight: "190px", boxShadow: "0 8px 32px rgba(79,70,229,0.35)" }}>

          {/* Star canvas */}
          <canvas ref={starCanvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.6 }} />

          {/* Shine overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg,rgba(255,255,255,.08) 0%,transparent 50%)" }} />

          <div className="relative z-10 p-6 flex flex-col justify-between" style={{ minHeight: "190px" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.7)" }}>
                Compte à rebours
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ color: "#fff", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)" }}>
                {examLabel} 2027
              </span>
            </div>

            <div className="flex items-baseline gap-1 -mt-1">
              <span className="font-black leading-none" style={{ fontSize: "46px", color: "rgba(255,255,255,.45)", fontVariantNumeric: "tabular-nums" }}>J-</span>
              <span className="font-black leading-none tracking-tighter" style={{ fontSize: "100px", color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 0 40px rgba(255,255,255,.2)", lineHeight: ".9" }}>{days}</span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: "rgba(255,255,255,.65)" }}>
                Examen le <span className="font-bold text-white">{examFull}</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="rounded-full overflow-hidden" style={{ width: "72px", height: "3px", background: "rgba(255,255,255,.2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#fff", opacity: .9 }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,.75)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Générer CTA — Indigo gradient ── */}
        <Link href="/prep/generer"
          className="flex items-center gap-4 p-5 rounded-2xl text-white active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
          <span className="material-symbols-outlined text-[34px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div className="flex-1">
            <p className="font-black text-[17px] tracking-tight">Générer avec l&apos;IA</p>
            <p className="text-sm" style={{ opacity: .8 }}>Flashcards · Quiz · Résumé</p>
          </div>
          <span className="material-symbols-outlined text-[22px]" style={{ opacity: .7 }}>chevron_right</span>
        </Link>

        {/* ── Stats rapides ── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="quiz"  label="Dernier quiz" value={quizScore !== null ? `${quizScore}%` : "—"} sub="Score quiz"   color="#6366F1" bgColor="rgba(99,102,241,0.08)"  />
          <StatCard icon="style" label="Flashcards"   value={String(flashCount)}                          sub="Maîtrisées"   color="#10B981" bgColor="rgba(16,185,129,0.08)"  />
        </div>

        {/* ── Coach IA ── */}
        <Link href="/prep/coach"
          className="flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: "#fff", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 4px rgba(30,27,75,0.06),0 4px 16px rgba(30,27,75,0.04)" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#8B5CF6,#6366F1)" }}>
            🤖
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "#1E1B4B" }}>Coach IA Personnel</p>
            <p className="text-xs" style={{ color: "#9396B8" }}>Conseils basés sur tes résultats</p>
          </div>
          <span className="material-symbols-outlined" style={{ color: "#9396B8" }}>chevron_right</span>
        </Link>

        {/* ── Outils ── */}
        <div className="grid grid-cols-2 gap-3">
          <ToolCard
            href="/prep/soft-skills"
            icon="self_improvement"
            label="Bien-être & Organisation"
            desc="Stress · Pomodoro · Planning"
            iconColor="#EF4444"
            iconBg="rgba(239,68,68,0.08)"
          />
          <ToolCard
            href={student?.exam_type === "BFEM" ? "/prep/bfem" : "/prep/epreuves"}
            icon="description"
            label="Épreuves & Corrigés"
            desc={student?.exam_type === "BFEM" ? "Sujets officiels BFEM" : "Sujets officiels BAC"}
            iconColor="#F59E0B"
            iconBg="rgba(245,158,11,0.08)"
          />
        </div>

      </div>
    </main>
  );
}

function StatCard({ icon, label, value, sub, color, bgColor }: {
  icon: string; label: string; value: string; sub: string; color: string; bgColor: string;
}) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: "#fff", border: "1px solid rgba(99,102,241,0.10)", boxShadow: "0 1px 4px rgba(30,27,75,0.06),0 4px 16px rgba(30,27,75,0.04)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bgColor }}>
        <span className="material-symbols-outlined text-[18px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <p className="text-2xl font-black tracking-tight" style={{ color: "#1E1B4B", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: "#6366A0" }}>{sub}</p>
      <p className="text-[11px] mt-0.5" style={{ color: "#C4C6DD" }}>{label}</p>
    </div>
  );
}

function ToolCard({ href, icon, label, desc, iconColor, iconBg }: {
  href: string; icon: string; label: string; desc: string; iconColor: string; iconBg: string;
}) {
  return (
    <Link href={href}
      className="flex items-start gap-3 p-3 rounded-xl active:scale-[0.97] transition-transform"
      style={{ background: "#fff", border: "1px solid rgba(99,102,241,0.10)", boxShadow: "0 1px 4px rgba(30,27,75,0.06)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <span className="material-symbols-outlined text-[20px]" style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-xs leading-tight" style={{ color: "#1E1B4B" }}>{label}</p>
        <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "#9396B8" }}>{desc}</p>
      </div>
    </Link>
  );
}
