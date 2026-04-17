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

function countdownColor(days: number): string {
  if (days > 60) return "#22c55e";
  if (days > 30) return "#f97316";
  return "#ef4444";
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

      // Dernier score quiz
      const { data: quizData } = await supabase
        .from("quiz_results")
        .select("score, total")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (quizData) setQuizScore(Math.round((quizData.score / quizData.total) * 100));

      // Flashcards maîtrisées
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
  const cdColor   = countdownColor(days);
  const prenom    = student?.prenom ?? "Élève";

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <p className="text-on-surface-variant text-sm">Bonjour,</p>
          <h1 className="text-2xl font-extrabold text-on-surface">{prenom} 👋</h1>
          {student?.serie && (
            <p className="text-xs text-on-surface-variant mt-0.5">{examLabel} · Série {student.serie}{student.ecole ? ` · ${student.ecole}` : ""}</p>
          )}
        </div>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">logout</span>
        </button>
      </header>

      <div className="px-6 space-y-4 pb-8">

        {/* Compte à rebours */}
        <div className="rounded-2xl p-5 text-white overflow-hidden relative" style={{ backgroundColor: cdColor }}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,white,transparent)]" />
          <p className="text-sm font-semibold opacity-90">Compte à rebours {examLabel}</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-5xl font-black">J-{days}</span>
            <span className="text-lg font-semibold opacity-80 mb-1">jours</span>
          </div>
          <p className="text-xs opacity-75 mt-1">{examLabel} · {student?.exam_type === "BFEM" ? "15 juillet 2026" : "30 juin 2026"}</p>
        </div>

        {/* Générer avec l'IA — CTA principal */}
        <Link href="/prep/generer"
          className="flex items-center gap-4 p-5 rounded-2xl text-white shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #FF6B00, #FF9500)" }}>
          <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div className="flex-1">
            <p className="font-black text-lg">Générer avec l'IA</p>
            <p className="text-sm opacity-85">Flashcards · Quiz · Résumé</p>
          </div>
          <span className="material-symbols-outlined text-[24px] opacity-80">chevron_right</span>
        </Link>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="quiz"
            label="Dernier quiz"
            value={quizScore !== null ? `${quizScore}%` : "—"}
            sub="Score"
            color="#6366f1"
          />
          <StatCard
            icon="style"
            label="Flashcards"
            value={String(flashCount)}
            sub="Maîtrisées"
            color="#10b981"
          />
        </div>

        {/* Coach IA */}
        <Link href="/prep/coach"
          className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 active:scale-[0.98] transition-transform">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xl"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
            🤖
          </div>
          <div className="flex-1">
            <p className="font-bold text-on-surface">Coach IA Personnel</p>
            <p className="text-xs text-on-surface-variant">Conseils basés sur tes résultats</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </Link>

        {/* Outils */}
        <div className="grid grid-cols-2 gap-3">
          <ToolCard href="/prep/soft-skills" icon="self_improvement" label="Bien-être & Organisation" desc="Stress · Pomodoro · Planning" color="#ef4444" bg="bg-red-50" />
          <ToolCard href="/prep/epreuves"    icon="description"      label="Épreuves & Corrigés"     desc="Sujets officiels BAC/BFEM"  color="#f59e0b" bg="bg-amber-50" />
        </div>

      </div>
    </main>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
      <span className="material-symbols-outlined text-[20px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <p className="text-2xl font-black text-on-surface mt-2">{value}</p>
      <p className="text-xs text-on-surface-variant">{sub}</p>
      <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{label}</p>
    </div>
  );
}


function ToolCard({ href, icon, label, desc, color, bg }: { href: string; icon: string; label: string; desc: string; color: string; bg: string }) {
  return (
    <Link href={href}
      className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-lowest shadow-sm active:scale-[0.97] transition-transform">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <span className="material-symbols-outlined text-[20px]" style={{ color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-on-surface text-xs leading-tight">{label}</p>
        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{desc}</p>
      </div>
    </Link>
  );
}
