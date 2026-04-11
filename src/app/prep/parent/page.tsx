"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type StudentData = {
  exam_type: string;
  serie: string | null;
  level_per_subject: Record<string, { level: string; score: number }>;
  country: string;
};

type Mode = "lookup" | "student_view" | "not_found";

export default function ParentPage() {
  const [mode, setMode] = useState<Mode>("lookup");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [studentName, setStudentName] = useState("");
  const [results, setResults] = useState<{ subject: string; score: number; created_at: string }[]>([]);
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState("");

  // Student mode: generate access code
  const [myCode, setMyCode] = useState("");
  const [myEmail, setMyEmail] = useState("");
  const [codeSaved, setCodeSaved] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // Check if user is a student (has prep_student record)
      supabase.from("prep_students").select("exam_type").eq("user_id", user.id).limit(1)
        .then(({ data }) => { if (data?.[0]) setIsStudent(true); });
    });
  }, []);

  async function generateCode() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("prep_parent_links").upsert({
      student_user_id: user.id,
      parent_email: myEmail || "non-renseigné",
      access_code: code,
    }, { onConflict: "student_user_id" });
    if (!error) { setMyCode(code); setCodeSaved(true); }
  }

  async function lookupCode() {
    if (!accessCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data: link } = await supabase
        .from("prep_parent_links")
        .select("student_user_id")
        .eq("access_code", accessCode.toUpperCase().trim())
        .limit(1);

      if (!link?.[0]) { setMode("not_found"); setLoading(false); return; }

      const studentId = link[0].student_user_id;

      const [{ data: profile }, { data: stu }, { data: prog }, { data: res }] = await Promise.all([
        supabase.from("users").select("name").eq("id", studentId).single(),
        supabase.from("prep_students").select("*").eq("user_id", studentId).limit(1),
        supabase.from("prep_programs").select("exam_date").eq("user_id", studentId).limit(1),
        supabase.from("prep_results").select("subject, score, created_at").eq("user_id", studentId).order("created_at", { ascending: false }).limit(20),
      ]);

      setStudentName(profile?.name ?? "Élève");
      setStudentData((stu?.[0] as StudentData) ?? null);
      setExamDate(prog?.[0]?.exam_date ?? "");
      setResults((res ?? []) as typeof results);
      setMode("student_view");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function daysLeft() {
    if (!examDate) return null;
    return Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
  }

  const globalAvg = studentData
    ? Math.round(Object.values(studentData.level_per_subject).reduce((s, v) => s + v.score, 0) / Math.max(1, Object.keys(studentData.level_per_subject).length))
    : 0;

  const reviewedDays = new Set(results.map(r => r.created_at?.slice(0, 10))).size;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <p className="font-bold text-on-surface">Espace Parent</p>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

        {/* Student: generate code */}
        {isStudent && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-on-surface">Partage ta progression avec tes parents</p>
            <p className="text-sm text-on-surface-variant">Génère un code que tes parents peuvent entrer pour suivre ta progression.</p>
            <input type="email" value={myEmail} onChange={e => setMyEmail(e.target.value)}
              placeholder="Email du parent (optionnel)"
              className="w-full p-3 rounded-xl border-2 border-outline-variant/30 bg-surface text-sm focus:border-primary focus:outline-none" />
            <button onClick={generateCode}
              className="w-full py-3 font-bold text-white rounded-xl text-sm"
              style={{ backgroundColor: "#FF6B00" }}>
              Générer mon code parental
            </button>
            {codeSaved && myCode && (
              <div className="bg-white border-2 border-green-400 rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Donne ce code à tes parents</p>
                <p className="text-3xl font-black text-on-surface tracking-widest">{myCode}</p>
              </div>
            )}
          </div>
        )}

        {/* ── LOOKUP ── */}
        {mode === "lookup" && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-1">Suivre la progression de mon enfant</h1>
              <p className="text-on-surface-variant text-sm">Entrez le code fourni par votre enfant pour accéder à son tableau de bord.</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Ex : AB12CD"
                maxLength={6}
                className="w-full p-4 text-center text-2xl font-black tracking-widest rounded-2xl border-2 border-outline-variant/30 bg-surface-container-lowest focus:border-primary focus:outline-none uppercase" />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button onClick={lookupCode} disabled={loading || accessCode.length < 6}
                className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all"
                style={{ backgroundColor: "#FF6B00" }}>
                {loading ? "Recherche…" : "Accéder au suivi"}
              </button>
            </div>
          </>
        )}

        {/* ── NOT FOUND ── */}
        {mode === "not_found" && (
          <div className="text-center py-10 space-y-3">
            <span className="material-symbols-outlined text-[48px] text-outline-variant">search_off</span>
            <p className="font-bold text-on-surface">Code introuvable</p>
            <p className="text-sm text-on-surface-variant">Vérifiez le code avec votre enfant.</p>
            <button onClick={() => { setMode("lookup"); setAccessCode(""); }} className="text-primary font-bold text-sm hover:underline">
              Réessayer
            </button>
          </div>
        )}

        {/* ── STUDENT VIEW ── */}
        {mode === "student_view" && studentData && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div>
                <p className="font-extrabold text-on-surface text-lg">{studentName}</p>
                <p className="text-sm text-on-surface-variant">{studentData.exam_type}{studentData.serie ? " série " + studentData.serie : ""} · {studentData.country}</p>
              </div>
            </div>

            {/* Countdown */}
            {daysLeft() !== null && (
              <div className="rounded-2xl p-4 text-white flex items-center justify-between" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
                <div>
                  <p className="text-white/80 text-sm">Compte à rebours</p>
                  <p className="text-3xl font-black">J-{daysLeft()}</p>
                </div>
                <span className="material-symbols-outlined text-[40px] text-white/30" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Score moyen", value: `${globalAvg}%`, color: "text-primary" },
                { label: "Jours révisés", value: reviewedDays.toString(), color: "text-green-600" },
                { label: "Examens blancs", value: results.length.toString(), color: "text-purple-600" },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4 text-center shadow-sm">
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Levels */}
            <div className="space-y-2">
              <p className="font-bold text-on-surface">Niveau par matière</p>
              {Object.entries(studentData.level_per_subject).map(([subj, info]) => (
                <div key={subj} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-on-surface flex-1">{subj}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${info.score}%` }} />
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${info.level === "Fort" ? "bg-green-100 text-green-700" : info.level === "Moyen" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {info.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent exams */}
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface">Derniers examens blancs</p>
                {results.slice(0, 5).map((r, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <p className="text-sm font-semibold text-on-surface">{r.subject}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${r.score >= 10 ? "text-green-600" : "text-red-500"}`}>{r.score}/20</span>
                      <span className="text-xs text-on-surface-variant">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setMode("lookup"); setAccessCode(""); }}
              className="w-full py-3 border-2 border-outline-variant/30 rounded-xl font-bold text-on-surface-variant text-sm hover:bg-surface-container transition-colors">
              Entrer un autre code
            </button>
          </>
        )}
      </div>
    </main>
  );
}
