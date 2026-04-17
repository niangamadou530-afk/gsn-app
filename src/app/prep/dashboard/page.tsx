"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BAC_DATE  = "2026-06-30";
const BFEM_DATE = "2026-07-15";

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
  const [student, setStudent]   = useState<Student | null>(null);
  const [loading, setLoading]   = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [flashCount, setFlashCount] = useState(0);

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
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );

  const examDate  = student?.exam_type === "BFEM" ? BFEM_DATE : BAC_DATE;
  const examLabel = student?.exam_type === "BFEM" ? "BFEM" : "BAC";
  const days      = daysUntil(examDate);
  const prenom    = student?.prenom ?? "Élève";

  const urgency = days > 60 ? "success" : days > 30 ? "warning" : "danger";
  const urgencyGrad = urgency === "success"
    ? "linear-gradient(135deg, #22c55e, #16a34a)"
    : urgency === "warning"
    ? "linear-gradient(135deg, #f97316, #ea580c)"
    : "linear-gradient(135deg, #ef4444, #dc2626)";

  return (
    <main className="min-h-screen bg-surface text-on-surface">

      {/* Hero header */}
      <div className="relative overflow-hidden px-6 pt-10 pb-6" style={{ background: "linear-gradient(145deg, #FF6B00 0%, #FF9500 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-white/80 text-sm font-medium">Bonjour,</p>
            <h1 className="text-3xl font-black text-white mt-0.5">{prenom} 👋</h1>
            {(student?.serie || student?.ecole) && (
              <p className="text-white/70 text-xs mt-1 font-medium">
                {examLabel}{student.serie ? ` · Série ${student.serie}` : ""}{student.ecole ? ` · ${student.ecole}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur active:bg-white/30 transition-colors">
            <span className="material-symbols-outlined text-white text-[20px]">logout</span>
          </button>
        </div>

        {/* Countdown inline dans le header */}
        <div className="mt-5 flex items-center gap-3 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 relative z-10">
          <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
          <div>
            <p className="text-white/80 text-xs font-semibold">Compte à rebours {examLabel}</p>
            <p className="text-white font-black text-2xl leading-none">J-{days} <span className="text-base font-semibold opacity-80">jours</span></p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/70 text-[10px]">{examLabel} · {student?.exam_type === "BFEM" ? "15 juil. 2026" : "30 juin 2026"}</p>
            <div className="mt-1 h-1.5 w-20 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, Math.max(5, 100 - (days / 365) * 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-4 pb-24 -mt-2">

        {/* CTA Générer */}
        <Link href="/prep/generer"
          className="flex items-center gap-4 p-5 rounded-2xl text-white shadow-xl active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #FF6B00, #FF9500)" }}>
            <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="flex-1">
            <p className="font-black text-lg text-white">Générer avec l'IA</p>
            <p className="text-sm text-white/60 font-medium">Flashcards · Quiz · Résumé</p>
          </div>
          <span className="material-symbols-outlined text-white/40 text-[24px]">chevron_right</span>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 shadow-sm overflow-hidden relative" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/10 -mr-4 -mt-4" />
            <span className="material-symbols-outlined text-white/80 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <p className="text-3xl font-black text-white mt-2">{quizScore !== null ? `${quizScore}%` : "—"}</p>
            <p className="text-white/70 text-xs font-semibold mt-0.5">Dernier quiz</p>
          </div>
          <div className="rounded-2xl p-4 shadow-sm overflow-hidden relative" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/10 -mr-4 -mt-4" />
            <span className="material-symbols-outlined text-white/80 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            <p className="text-3xl font-black text-white mt-2">{flashCount}</p>
            <p className="text-white/70 text-xs font-semibold mt-0.5">Flashcards maîtrisées</p>
          </div>
        </div>

        {/* Coach IA */}
        <Link href="/prep/coach"
          className="flex items-center gap-4 p-4 rounded-2xl shadow-sm active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe" }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
            🤖
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#4c1d95]">Coach IA Personnel</p>
            <p className="text-xs text-[#6d28d9]/70 font-medium mt-0.5">Conseils basés sur tes résultats</p>
          </div>
          <span className="material-symbols-outlined text-[#8b5cf6]">chevron_right</span>
        </Link>

        {/* Outils */}
        <div className="grid grid-cols-2 gap-3">
          <ToolCard href="/prep/soft-skills" icon="self_improvement" label="Bien-être & Organisation" desc="Stress · Pomodoro · Planning" borderColor="#ef4444" bg="#fef2f2" iconColor="#dc2626" />
          <ToolCard href="/prep/epreuves"    icon="description"      label="Épreuves & Corrigés"     desc="Sujets officiels BAC/BFEM"  borderColor="#f59e0b" bg="#fffbeb" iconColor="#d97706" />
        </div>

      </div>
    </main>
  );
}

function ToolCard({ href, icon, label, desc, borderColor, bg, iconColor }: {
  href: string; icon: string; label: string; desc: string;
  borderColor: string; bg: string; iconColor: string;
}) {
  return (
    <Link href={href}
      className="flex items-start gap-3 p-3.5 rounded-2xl shadow-sm active:scale-[0.97] transition-transform"
      style={{ backgroundColor: bg, borderLeft: `3px solid ${borderColor}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60">
        <span className="material-symbols-outlined text-[20px]" style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-on-surface text-xs leading-tight">{label}</p>
        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{desc}</p>
      </div>
    </Link>
  );
}
