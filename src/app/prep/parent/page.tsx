"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";

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
  regularity?: {
    daysSinceLastActivity: number | null;
    lastActivityText: string;
    streakDays: number;
    isInactiveNotice: boolean;
    inactiveMessage: string | null;
  };
  parentAdvice?: {
    general: string[];
    subjectSpecific: string | null;
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
  const [codeCreatedAt, setCodeCreatedAt] = useState<string | null>(null);
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
              if (data.createdAt) {
                setCodeCreatedAt(data.createdAt);
              }
              setCodeSaved(true);
            }
          })
          .catch(() => {});
      }
    });
  }, []);

  async function generateCode(renew = false) {
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
        body: JSON.stringify({ parentEmail: myEmail, renew }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setCodeError("Reconnecte-toi puis réessaie");
      } else if (res.ok && data.code) {
        setMyCode(data.code);
        if (data.createdAt) {
          setCodeCreatedAt(data.createdAt);
        }
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

  function handleShareWhatsApp() {
    if (!parentData) return;
    const text = `*Suivi GSN PREP - ${parentData.studentFirstName}*\n` +
      `• Examen préparé : ${parentData.examType}${parentData.serie ? ` Série ${parentData.serie}` : ""}\n` +
      `• Activité cette semaine : ${parentData.quizzesThisWeek} quiz terminés (${parentData.activeDaysThisWeek}/7 jours actifs)\n` +
      `• Moyenne des quiz : ${parentData.averageScore !== null ? parentData.averageScore + "%" : "Pas encore de quiz"}\n` +
      `• Dernière séance : ${parentData.regularity?.lastActivityText || "Récemment"}\n\n` +
      `Bravo pour le travail fourni ! Continue comme ça.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handlePrintPdf() {
    window.print();
  }

  const isInactiveWeek = Boolean(
    parentData && parentData.quizzesThisWeek === 0 && parentData.activeDaysThisWeek === 0
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card (masqué lors de l'impression) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden print:hidden">
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
        {/* Student code generation card (masqué à l'impression) */}
        {isStudent && (
          <div data-tour="parent-code-card" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 print:hidden">
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
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-base sm:text-sm focus:outline-none focus:border-[#005bbf]"
              />
              <button
                type="button"
                onClick={() => generateCode(false)}
                disabled={codeLoading}
                className="px-5 py-3 min-h-[44px] rounded-xl bg-[#005bbf] hover:bg-[#004899] text-white font-bold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-50"
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
                  onClick={() => generateCode(false)}
                  disabled={codeLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors disabled:opacity-50"
                >
                  Réessayer
                </button>
              </div>
            )}

            {codeSaved && myCode && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-800">{t("prep.parent.share.giveCode")}</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-900 tracking-widest">{myCode}</p>
                {codeCreatedAt && (
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Code actif généré le {new Date(codeCreatedAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => generateCode(true)}
                    disabled={codeLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-extrabold shadow-2xs transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">refresh</span>
                    <span>Renouveler mon code (invalide l&apos;ancien)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Section « Ce que voient tes parents » (Partie K) ── */}
            <div data-tour="parent-what-parents-see" className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs sm:text-sm">
                <span className="material-symbols-outlined text-[18px] text-[#005bbf]">visibility</span>
                <span>Ce que voient tes parents</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Depuis l&apos;Espace Parents, avec ton code d&apos;accès, tes parents peuvent consulter uniquement ces catégories de suivi :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-900 block">Identité scolaire</span>
                  <span className="text-[11px] text-slate-500">Ton prénom, ton examen préparé (BAC ou BFEM) et ta série.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-900 block">Moyenne générale & Assiduité</span>
                  <span className="text-[11px] text-slate-500">Ta moyenne générale aux quiz et ton nombre total de quiz terminés.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-900 block">Performances par matière</span>
                  <span className="text-[11px] text-slate-500">Tes scores moyens et le volume d&apos;entraînement dans chaque discipline.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-900 block">Activités récentes & Échéances</span>
                  <span className="text-[11px] text-slate-500">Les dates des derniers quiz réalisés et les jours restants avant l&apos;examen.</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-200 flex items-start gap-2.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-[18px] text-[#005bbf] shrink-0 mt-0.5">lock</span>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    Depuis l&apos;Espace Parents, ils ne voient jamais tes conversations ni tes fichiers.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Tes échanges avec le Coach IA, tes fiches générées et tes brouillons restent strictement privés.
                    Ne partage pas ton mot de passe : celui qui l&apos;a peut ouvrir ton compte. Tu peux renouveler ton code parent à tout moment : l&apos;ancien cesse alors immédiatement de fonctionner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LOOKUP MODE (masqué à l'impression) ── */}
        {mode === "lookup" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 print:hidden">
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

        {/* ── NOT FOUND (Code expiré ou invalide) ── */}
        {mode === "not_found" && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center shadow-xs space-y-3 print:hidden">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">cancel</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>Code expiré ou invalide</span>
            </div>
            <p className="font-extrabold text-slate-900 text-base">{t("prep.parent.notFound.title")}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Ce code d&apos;accès n&apos;existe pas ou a été renouvelé par l&apos;élève. Demandez à votre enfant de vous partager son code actuel.
            </p>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {parentData.studentFirstName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px] text-emerald-700">verified</span>
                      <span>Code valide</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {parentData.examType}{parentData.serie ? ` · Série ${parentData.serie}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setMode("lookup"); setAccessCode(""); }}
                className="text-xs font-bold text-[#005bbf] hover:underline print:hidden"
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
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  Moyenne des quiz
                </p>
              </div>

              {/* Stat 2: Jours actifs cette semaine (sur 7) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-emerald-700">
                  {parentData.activeDaysThisWeek > 0 ? `${parentData.activeDaysThisWeek}/7` : "0 jour"}
                </p>
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  Jours actifs cette semaine (sur 7)
                </p>
              </div>

              {/* Stat 3: Quiz terminés cette semaine */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
                <p className="text-xl sm:text-2xl font-black text-purple-700">
                  {parentData.quizzesThisWeek > 0 ? `${parentData.quizzesThisWeek}` : "0 quiz"}
                </p>
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  Quiz terminés cette semaine
                </p>
              </div>
            </div>

            {/* Section 1 : Régularité (Point 1) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">pace</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Régularité & Assiduité</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rythme de révision calculé sur les entraînements réels</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Dernière activité
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    {parentData.regularity?.lastActivityText || "Aucune activité enregistrée"}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Série de jours consécutifs
                  </span>
                  <p className="text-base sm:text-lg font-black text-purple-700">
                    🔥 {parentData.regularity?.streakDays || 0} jour{(parentData.regularity?.streakDays || 0) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {parentData.regularity?.isInactiveNotice && parentData.regularity?.inactiveMessage && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
                  <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0 mt-0.5">wb_sunny</span>
                  <p>{parentData.regularity.inactiveMessage}</p>
                </div>
              )}
            </div>

            {/* Section 2 : Comment l'aider au quotidien (Point 2) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Comment l&apos;aider au quotidien</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Recommandations bienveillantes pour accompagner son travail</p>
                </div>
              </div>

              {parentData.parentAdvice?.subjectSpecific && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                  <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">tips_and_updates</span>
                  <div>
                    <span className="font-bold block mb-0.5">Axe de soutien ciblé :</span>
                    <p>{parentData.parentAdvice.subjectSpecific}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                {(parentData.parentAdvice?.general || []).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/50 text-xs text-slate-700 leading-relaxed">
                    <span className="text-sm shrink-0">
                      {idx === 0 ? "😴" : idx === 1 ? "⏱️" : idx === 2 ? "👏" : "🥤"}
                    </span>
                    <p className="flex-1">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section A : Résultats réels par matière (>= 3 quiz) */}
            {parentData.realSubjectStats && Object.keys(parentData.realSubjectStats).length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Résultats réels par matière</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Calculés sur les quiz complétés (minimum 3 quiz requis)</p>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(parentData.realSubjectStats).map(([subj, info]) => (
                    <div key={subj} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{subj}</p>
                        <span className="text-[11px] text-slate-500">{info.count} quiz effectué{info.count > 1 ? "s" : ""}</span>
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
                  <p className="text-xs text-slate-500 mt-0.5">Niveau initial déclaré par l&apos;élève dans son profil</p>
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
                        <span className="text-[11px] text-slate-500">
                          {r.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Pas encore de quiz enregistré.</p>
              )}
            </div>

            {/* Section 3 : Partage WhatsApp & Impression PDF (Point 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="text-lg">📱</span>
                <span>Partager le résumé sur WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Imprimer / Enregistrer en PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer légal et support (masqué lors de l'impression) */}
        <footer className="pt-8 border-t border-slate-200/80 text-center text-xs text-slate-500 space-y-2 print:hidden">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-slate-800 underline">
              Politique de confidentialité
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-800 underline">
              Conditions d&apos;utilisation
            </Link>
            <span>·</span>
            <a
              href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl("Bonjour GSN PREP, je suis parent d'élève et j'ai besoin d'aide pour le suivi.")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800 underline text-emerald-700 font-semibold"
            >
              Assistance WhatsApp
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            GSN PREP · Portail de suivi pour les familles · Dakar, Sénégal
          </p>
        </footer>
      </div>
    </div>
  );
}
