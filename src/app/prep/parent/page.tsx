"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";

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
      parent_email: myEmail || t("prep.parent.emailNotProvided"),
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

      if (!link?.[0]) {
        if (isPreviewEnvironment() && accessCode.toUpperCase().trim() === "DEMO12") {
          setStudentName("Amadou Niang (Démo)");
          setStudentData({
            exam_type: "BAC",
            serie: "S2",
            country: "Sénégal",
            level_per_subject: {
              "Mathématiques": { level: "Fort", score: 85 },
              "Sciences Physiques": { level: "Fort", score: 88 },
              "SVT": { level: "Moyen", score: 72 },
              "Philosophie": { level: "Moyen", score: 65 },
              "Français": { level: "Fort", score: 78 }
            }
          });
          setExamDate("2026-07-02");
          setResults([
            { subject: "Mathématiques", score: 17, created_at: new Date().toISOString() },
            { subject: "Sciences Physiques", score: 16, created_at: new Date(Date.now() - 86400000).toISOString() },
            { subject: "SVT", score: 14, created_at: new Date(Date.now() - 172800000).toISOString() }
          ]);
          setMode("student_view");
          setLoading(false);
          return;
        }
        setMode("not_found");
        setLoading(false);
        return;
      }

      const studentId = link[0].student_user_id;

      const [{ data: profile }, { data: stu }, { data: prog }, { data: res }] = await Promise.all([
        supabase.from("users").select("name").eq("id", studentId).single(),
        supabase.from("prep_students").select("*").eq("user_id", studentId).limit(1),
        supabase.from("prep_programs").select("exam_date").eq("user_id", studentId).limit(1),
        supabase.from("prep_results").select("subject, score, created_at").eq("user_id", studentId).order("created_at", { ascending: false }).limit(20),
      ]);

      setStudentName(profile?.name ?? t("prep.parent.studentFallback"));
      setStudentData((stu?.[0] as StudentData) ?? null);
      setExamDate(prog?.[0]?.exam_date ?? "");
      setResults((res ?? []) as typeof results);
      setMode("student_view");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("prep.parent.error.generic"));
    } finally {
      setLoading(false);
    }
  }

  function daysLeft() {
    if (!examDate) return null;
    return Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000));
  }

  const globalAvg = studentData && studentData.level_per_subject
    ? Math.round(Object.values(studentData.level_per_subject).reduce((s, v) => s + v.score, 0) / Math.max(1, Object.keys(studentData.level_per_subject).length))
    : 0;

  const reviewedDays = new Set(results.map(r => r.created_at?.slice(0, 10))).size;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">family_restroom</span>
            <span>Portail Suivi Parents GSN PREP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.parent.title")}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Consultez en temps réel l&apos;assiduité, les notes d&apos;entraînement et l&apos;état de préparation de votre enfant.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Student code generation card */}
        {isStudent && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm">{t("prep.parent.share.title")}</h2>
                <p className="text-xs text-slate-500">{t("prep.parent.share.desc")}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={myEmail}
                onChange={e => setMyEmail(e.target.value)}
                placeholder={t("prep.parent.share.emailPlaceholder")}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#005bbf]"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-5 py-3 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                {t("prep.parent.share.generateButton")}
              </button>
            </div>

            {codeSaved && myCode && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-emerald-800">{t("prep.parent.share.giveCode")}</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-900 tracking-widest">{myCode}</p>
              </div>
            )}
          </div>
        )}

        {/* ── LOOKUP MODE ── */}
        {mode === "lookup" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{t("prep.parent.lookup.title")}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("prep.parent.lookup.desc")}</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder={t("prep.parent.lookup.placeholder")}
                maxLength={6}
                className="w-full p-4 text-center text-3xl font-black tracking-widest rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:border-[#005bbf] focus:outline-none uppercase transition-all"
              />
              {error && <p className="text-rose-600 text-xs text-center font-bold">{error}</p>}
              <button
                onClick={lookupCode}
                disabled={loading || accessCode.length < 6}
                className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all shadow-xs active:scale-[0.98] text-sm"
                style={{ backgroundColor: "#FF6B00" }}
              >
                {loading ? t("prep.parent.lookup.searching") : t("prep.parent.lookup.submit")}
              </button>
            </div>
          </div>
        )}

        {/* ── NOT FOUND ── */}
        {mode === "not_found" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">search_off</span>
            </div>
            <p className="font-extrabold text-slate-900 text-base">{t("prep.parent.notFound.title")}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("prep.parent.notFound.desc")}</p>
            <button
              onClick={() => { setMode("lookup"); setAccessCode(""); }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              {t("prep.parent.notFound.retry")}
            </button>
          </div>
        )}

        {/* ── STUDENT VIEW ── */}
        {mode === "student_view" && studentData && (
          <div className="space-y-5">
            {/* Student Header Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">school</span>
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">{studentName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {studentData.exam_type}{studentData.serie ? ` · Série ${studentData.serie}` : ""} ({studentData.country || "Sénégal"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setMode("lookup"); setAccessCode(""); }}
                className="text-xs font-bold text-[#005bbf] hover:underline"
              >
                Changer de code
              </button>
            </div>

            {/* Countdown Banner */}
            {daysLeft() !== null && (
              <div className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 text-white shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">{t("prep.parent.countdown")}</span>
                  <p className="text-3xl sm:text-4xl font-black mt-1">J-{daysLeft()}</p>
                </div>
                <span className="material-symbols-outlined text-[44px] text-white/30">timer</span>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t("prep.parent.stats.avgScore"), value: `${globalAvg}%`, color: "text-[#005bbf]", bg: "bg-blue-50" },
                { label: t("prep.parent.stats.daysReviewed"), value: reviewedDays.toString(), color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: t("prep.parent.stats.mockExams"), value: results.length.toString(), color: "text-purple-700", bg: "bg-purple-50" },
              ].map(s => (
                <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
                  <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Levels breakdown */}
            {studentData.level_per_subject && Object.keys(studentData.level_per_subject).length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">{t("prep.parent.levelsTitle")}</h3>
                <div className="space-y-2.5">
                  {Object.entries(studentData.level_per_subject).map(([subj, info]) => (
                    <div key={subj} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 flex-1 truncate">{subj}</p>
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#005bbf] rounded-full" style={{ width: `${info.score}%` }} />
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          info.level === "Fort" ? "bg-emerald-100 text-emerald-800" :
                          info.level === "Moyen" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {info.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Exam Results */}
            {results.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">{t("prep.parent.recentExams")}</h3>
                <div className="space-y-2">
                  {results.slice(0, 5).map((r, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{r.subject}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${r.score >= 10 ? "text-emerald-700" : "text-rose-600"}`}>
                          {r.score}/20
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
