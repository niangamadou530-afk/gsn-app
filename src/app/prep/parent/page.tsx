"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";

type ParentViewData = {
  studentFirstName: string;
  examType: string;
  serie: string | null;
  quizzesThisWeek: number;
  activeDaysThisWeek: number;
  averageScore: number | null;
  realSubjectStats: Record<string, { count: number; score: number | null; level: string; hasEnoughData: boolean }>;
  selfAssessment: Record<string, { level: string; score: number }>;
  recentScores: { subject: string; scoreSur20: number; date: string }[];
  examInfo: {
    targetDate: string;
    displayDateFr: string;
    statutNote: string;
    examType: string;
    serie: string | null;
  };
};

type Mode = "lookup" | "student_view" | "not_found";

export default function ParentPage() {
  const [mode, setMode] = useState<Mode>("lookup");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [parentData, setParentData] = useState<ParentViewData | null>(null);
  const [error, setError] = useState("");

  // Student mode: generate access code
  const [myCode, setMyCode]           = useState("");
  const [myEmail, setMyEmail]         = useState("");
  const [codeSaved, setCodeSaved]     = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError]     = useState("");
  const [isStudent, setIsStudent]     = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (!user) return;
      supabase.from("prep_students").select("exam_type").eq("user_id", user.id).limit(1)
        .then(({ data }) => { if (data?.[0]) setIsStudent(true); });

      // Load existing code if already created
      if (session?.access_token) {
        fetch("/api/prep/parent-code", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then(res => res.json())
          .then(data => {
            if (data.found && data.code) {
              setMyCode(data.code);
              if (data.parentEmail && data.parentEmail !== "Non renseigné") {
                setMyEmail(data.parentEmail);
              }
              setCodeSaved(true);
            }
          })
          .catch(() => {});
      }
    });
  }, []);

  async function generateCode() {
    setCodeError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setCodeError("Reconnecte-toi puis réessaie");
      return;
    }
    setCodeLoading(true);
    try {
      const res = await fetch("/api/prep/parent-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ parentEmail: myEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setCodeError("Reconnecte-toi puis réessaie");
      } else if (res.ok && data.code) {
        setMyCode(data.code);
        setCodeSaved(true);
        setCodeError("");
      } else {
        setCodeError(data.error || "Oups ! Le code parent n'a pas pu être généré. Rassure-toi, ton compte est intact !");
      }
    } catch {
      setCodeError("Impossible de contacter le serveur pour générer le code. Vérifie ta connexion puis réessaie.");
    } finally {
      setCodeLoading(false);
    }
  }

  async function lookupCode() {
    if (!accessCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/prep/parent-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode.toUpperCase().trim() }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError(data.error || "Trop de tentatives pour ce code. Patiente 15 minutes.");
        setLoading(false);
        return;
      }

      if (!res.ok || !data.found) {
        setMode("not_found");
        setLoading(false);
        return;
      }

      setParentData(data as ParentViewData);
      setMode("student_view");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("prep.parent.errorLookup"));
    } finally {
      setLoading(false);
    }
  }

  function daysLeft() {
    if (!parentData?.examInfo?.targetDate) return null;
    return Math.max(0, Math.ceil((new Date(parentData.examInfo.targetDate).getTime() - Date.now()) / 86400000));
  }

  const isInactiveWeek = Boolean(
    parentData && parentData.quizzesThisWeek === 0 && parentData.activeDaysThisWeek === 0
  );

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
                disabled={codeLoading}
                className="px-5 py-3 rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                {codeLoading ? "Création du code en cours…" : t("prep.parent.share.generateButton")}
              </button>
            </div>

            {codeError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
                  <p className="leading-snug">{codeError}</p>
                </div>
                <button
                  type="button"
                  onClick={generateCode}
                  disabled={codeLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors disabled:opacity-50"
                >
                  Réessayer
                </button>
              </div>
            )}

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
        {mode === "student_view" && parentData && (
          <div className="space-y-5">
            {/* Student Header Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">school</span>
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {parentData.studentFirstName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {parentData.examType}{parentData.serie ? ` · Série ${parentData.serie}` : ""}
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
            {daysLeft() !== null && parentData.examInfo && (
              <div className="bg-gradient-to-br from-[#005bbf] to-indigo-700 rounded-3xl p-6 text-white shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                    {t("prep.parent.countdown")}
                  </span>
                  <p className="text-3xl sm:text-4xl font-black mt-1">J-{daysLeft()}</p>
                  <p className="text-xs text-blue-100 mt-1">
                    Examen prévu : {parentData.examInfo.displayDateFr}{" "}
                    <span className="text-blue-200 text-[11px]">({parentData.examInfo.statutNote})</span>
                  </p>
                </div>
                <span className="material-symbols-outlined text-[44px] text-white/30">timer</span>
              </div>
            )}

            {/* Inactivity banner if 0 quizzes and 0 active days */}
            {isInactiveWeek && (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
                <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">info</span>
                <p>Pas encore d&apos;activité cette semaine. L&apos;élève pourra s&apos;entraîner dès ses prochains quiz !</p>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stat 1: Moyenne des quiz réels */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-[#005bbf]">
                  {parentData.averageScore !== null ? `${parentData.averageScore}%` : "Pas encore de quiz"}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Moyenne des quiz
                </p>
              </div>

              {/* Stat 2: Jours actifs cette semaine (sur 7) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-emerald-700">
                  {parentData.activeDaysThisWeek > 0 ? `${parentData.activeDaysThisWeek}/7` : "Pas encore d'activité cette semaine"}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Jours actifs cette semaine (sur 7)
                </p>
              </div>

              {/* Stat 3: Quiz terminés cette semaine */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-purple-700">
                  {parentData.quizzesThisWeek > 0 ? `${parentData.quizzesThisWeek}` : "Pas encore d'activité cette semaine"}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  Quiz terminés cette semaine
                </p>
              </div>
            </div>

            {/* Section A : Résultats réels par matière (>= 3 quiz) */}
            {parentData.realSubjectStats && Object.keys(parentData.realSubjectStats).length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Résultats réels par matière</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Calculés sur les quiz complétés (minimum 3 quiz requis)</p>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(parentData.realSubjectStats).map(([subj, info]) => (
                    <div key={subj} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{subj}</p>
                        <span className="text-[11px] text-slate-400">{info.count} quiz effectué{info.count > 1 ? "s" : ""}</span>
                      </div>
                      {info.hasEnoughData && info.score !== null ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 sm:w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#005bbf] rounded-full" style={{ width: `${info.score}%` }} />
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            info.level === "Fort" ? "bg-emerald-100 text-emerald-800" :
                            info.level === "Moyen" ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {info.level} ({info.score}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-1 rounded-md">
                          Pas assez de données ({info.count}/3)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section B : Auto-évaluation de l'élève */}
            {parentData.selfAssessment && Object.keys(parentData.selfAssessment).length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Auto-évaluation de l&apos;élève</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Niveau initial déclaré par l&apos;élève dans son profil</p>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(parentData.selfAssessment).map(([subj, info]) => (
                    <div key={subj} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 flex-1 truncate">{subj}</p>
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 sm:w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: `${info.score}%` }} />
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {info.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Exam Results */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm">{t("prep.parent.recentExams")}</h3>
              {parentData.recentScores && parentData.recentScores.length > 0 ? (
                <div className="space-y-2">
                  {parentData.recentScores.map((r, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{r.subject}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${r.scoreSur20 >= 10 ? "text-emerald-700" : "text-rose-600"}`}>
                          {r.scoreSur20}/20
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {r.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Pas encore de quiz enregistré.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
