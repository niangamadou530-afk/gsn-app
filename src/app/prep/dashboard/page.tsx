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

const A = "#00C9A7";          // accent teal
const C = "#111118";          // card bg
const B = "rgba(255,255,255,0.07)"; // border

type Student = { prenom: string | null; exam_type: string; serie: string | null; ecole: string | null };

export default function PrepDashboardPage() {
  const router = useRouter();
  const [student, setStudent]     = useState<Student | null>(null);
  const [loading, setLoading]     = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [flashCount, setFlashCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: stu } = await supabase
        .from("prep_students").select("prenom, exam_type, serie, ecole")
        .eq("user_id", user.id).maybeSingle();

      if (!stu) { router.push("/prep/onboarding"); return; }
      setStudent(stu);

      const { data: quizData } = await supabase
        .from("quiz_results").select("score, total")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

      if (quizData) setQuizScore(Math.round((quizData.score / quizData.total) * 100));

      const { count } = await supabase
        .from("flashcards").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("maitrisee", true);

      setFlashCount(count ?? 0);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: A, borderTopColor: "transparent" }} />
    </div>
  );

  const examLabel = student?.exam_type === "BFEM" ? "BFEM" : "BAC";
  const days      = daysUntil(student?.exam_type === "BFEM" ? BFEM_DATE : BAC_DATE);
  const prenom    = student?.prenom ?? "Élève";

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Greeting */}
      <div className="px-6 pt-10 pb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#A0A0B0" }}>Bonjour,</p>
          <h1 className="text-2xl font-black text-white mt-0.5">{prenom} 👋</h1>
          {(student?.serie || student?.ecole) && (
            <p className="text-xs mt-1 font-medium" style={{ color: "#5A5A70" }}>
              {examLabel}{student.serie ? ` · Série ${student.serie}` : ""}{student.ecole ? ` · ${student.ecole}` : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-95"
          style={{ backgroundColor: C, border: `1px solid ${B}` }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: "#A0A0B0" }}>logout</span>
        </button>
      </div>

      <div className="px-6 pt-6 pb-24 space-y-4">

        {/* Countdown */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A0A0B0" }}>
            Compte à rebours · {examLabel}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-6xl font-black" style={{ color: A }}>J-{days}</span>
            <span className="text-lg font-semibold" style={{ color: "#A0A0B0" }}>jours</span>
          </div>
          <div className="mt-3 h-1 w-full rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(2, 100 - (days / 365) * 100))}%`, backgroundColor: A }} />
          </div>
          <p className="text-xs mt-1.5 font-medium" style={{ color: "#5A5A70" }}>
            {examLabel} · {student?.exam_type === "BFEM" ? "15 juillet 2026" : "30 juin 2026"}
          </p>
        </div>

        {/* CTA Générer */}
        <Link href="/prep/generer"
          className="flex items-center gap-4 p-5 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ backgroundColor: A, color: "#003328" }}>
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div className="flex-1">
            <p className="font-black text-lg">Générer avec l'IA</p>
            <p className="text-sm opacity-75 font-medium">Flashcards · Quiz · Résumé</p>
          </div>
          <span className="material-symbols-outlined opacity-60">chevron_right</span>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>quiz</span>
            <p className="text-3xl font-black text-white mt-2">
              {quizScore !== null ? `${quizScore}%` : "—"}
            </p>
            <p className="text-xs mt-0.5 font-semibold" style={{ color: "#A0A0B0" }}>Dernier quiz</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>style</span>
            <p className="text-3xl font-black text-white mt-2">{flashCount}</p>
            <p className="text-xs mt-0.5 font-semibold" style={{ color: "#A0A0B0" }}>Flashcards maîtrisées</p>
          </div>
        </div>

        {/* Coach IA */}
        <Link href="/prep/coach"
          className="flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ backgroundColor: C, border: `1px solid ${B}` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: "rgba(0,201,167,0.12)", border: "1px solid rgba(0,201,167,0.2)" }}>
            🤖
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Coach IA Personnel</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#A0A0B0" }}>Conseils basés sur tes résultats</p>
          </div>
          <span className="material-symbols-outlined text-[20px]" style={{ color: "#5A5A70" }}>chevron_right</span>
        </Link>

        {/* Outils */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/prep/soft-skills", icon: "self_improvement", label: "Bien-être & Organisation", desc: "Stress · Pomodoro · Planning" },
            { href: "/prep/epreuves",    icon: "description",      label: "Épreuves & Corrigés",     desc: "Sujets officiels BAC/BFEM" },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="flex items-start gap-3 p-3.5 rounded-2xl active:scale-[0.97] transition-transform"
              style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(0,201,167,0.08)" }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs leading-tight">{t.label}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "#A0A0B0" }}>{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
