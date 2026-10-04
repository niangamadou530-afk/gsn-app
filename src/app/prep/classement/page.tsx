"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice } from "@/components/SlowConnectionNotice";

type Tab = "general" | "serie" | "ecole";

type Player = {
  user_id: string;
  prenom: string | null;
  ecole: string | null;
  serie: string | null;
  avg_score: number;
  quiz_count: number;
};

type SchoolStat = { ecole: string; avg_score: number; count: number };

const MEDAL = ["🥇", "🥈", "🥉"];

export default function ClassementPage() {
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>("general");
  const [myId, setMyId]       = useState("");
  const [mySerie, setMySerie] = useState("");
  const [myEcole, setMyEcole] = useState("");
  const [myExamType, setMyExamType] = useState("BAC");
  const [general, setGeneral] = useState<Player[]>([]);
  const [bySerie, setBySerie] = useState<Player[]>([]);
  const [byEcole, setByEcole] = useState<SchoolStat[]>([]);
  const [myRank, setMyRank]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setIsSlowConnection(false);

    const slowTimer = setTimeout(() => {
      if (mounted && loading) {
        setIsSlowConnection(true);
      }
    }, 8000);

    async function load() {
      try {
        const authPromise = supabase.auth.getUser();
        const previewTimeout = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 1200)
        );
        const authResult = isPreviewEnvironment()
          ? await Promise.race([authPromise, previewTimeout])
          : await authPromise;
        const user = authResult.data?.user;

        if (!user) {
          if (isPreviewEnvironment()) {
            if (mounted) {
              setIsPreview(true);
              setMyId("preview-user");
              setMySerie("S2");
              setMyEcole("Lycée Pilote de l'Avenir (Fictif)");
              setMyExamType("BAC");
              setMyRank(3);
              const mockGeneral = [
                { user_id: "u1", prenom: "Awa (Démo)", ecole: "Lycée Pilote de l'Avenir (Fictif)", serie: "S1", avg_score: 96, quiz_count: 42 },
                { user_id: "u2", prenom: "Cheikh (Démo)", ecole: "Lycée d'Excellence Étoile du Baobab (Fictif)", serie: "S2", avg_score: 92, quiz_count: 38 },
                { user_id: "preview-user", prenom: "Amadou (Toi - Démo)", ecole: "Lycée Pilote de l'Avenir (Fictif)", serie: "S2", avg_score: 88, quiz_count: 35 },
                { user_id: "u4", prenom: "Fatou (Démo)", ecole: "Institut Moderne Teranga (Fictif)", serie: "L2", avg_score: 85, quiz_count: 29 },
                { user_id: "u5", prenom: "Babacar (Démo)", ecole: "Complexe Scolaire Horizons Nouveaux (Fictif)", serie: "S2", avg_score: 83, quiz_count: 27 },
              ];
              setGeneral(mockGeneral);
              setBySerie(mockGeneral.filter(p => p.serie === "S2"));
              setByEcole([
                { ecole: "Lycée Pilote de l'Avenir (Fictif)", avg_score: 96, count: 42 },
                { ecole: "Lycée d'Excellence Étoile du Baobab (Fictif)", avg_score: 92, count: 38 },
                { ecole: "Institut Moderne Teranga (Fictif)", avg_score: 85, count: 29 },
              ]);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }
        setMyId(user.id);

        const { data: stu } = await supabase
          .from("prep_students").select("serie, ecole, exam_type").eq("user_id", user.id).maybeSingle();
        const serie    = stu?.serie ?? "";
        const ecole    = stu?.ecole ?? "";
        const examType = stu?.exam_type ?? "BAC";
        setMySerie(serie);
        setMyEcole(ecole);
        setMyExamType(examType);

        const { data: results } = await supabase.from("quiz_results").select("user_id, score, total");
        if (!results || results.length === 0) { setLoading(false); return; }

        const byUser: Record<string, number[]> = {};
        for (const r of results) {
          if (!byUser[r.user_id]) byUser[r.user_id] = [];
          byUser[r.user_id].push(Math.round((r.score / r.total) * 100));
        }

        const uids = Object.keys(byUser);
        const { data: students } = await supabase
          .from("prep_students").select("user_id, prenom, ecole, serie, exam_type").in("user_id", uids);

        const stuMap: Record<string, { prenom: string | null; ecole: string | null; serie: string | null; exam_type: string }> = {};
        for (const s of students ?? []) stuMap[s.user_id] = { prenom: s.prenom, ecole: s.ecole, serie: s.serie, exam_type: s.exam_type ?? "BAC" };

        const players: Player[] = uids
          .filter(uid => (stuMap[uid]?.exam_type ?? "BAC") === examType)
          .map(uid => ({
            user_id: uid,
            prenom: stuMap[uid]?.prenom ?? t("prep.classement.defaultName"),
            ecole: stuMap[uid]?.ecole ?? null,
            serie: stuMap[uid]?.serie ?? null,
            avg_score: Math.round(byUser[uid].reduce((a, b) => a + b, 0) / byUser[uid].length),
            quiz_count: byUser[uid].length,
          })).sort((a, b) => b.avg_score - a.avg_score);

        setGeneral(players.slice(0, 10));
        const myIdx = players.findIndex(p => p.user_id === user.id);
        setMyRank(myIdx >= 0 ? myIdx + 1 : null);
        if (serie) setBySerie(players.filter(p => p.serie === serie).slice(0, 10));

        const ecoleMap: Record<string, number[]> = {};
        for (const p of players) {
          if (p.ecole) {
            if (!ecoleMap[p.ecole]) ecoleMap[p.ecole] = [];
            ecoleMap[p.ecole].push(p.avg_score);
          }
        }
        setByEcole(
          Object.entries(ecoleMap)
            .map(([e, sc]) => ({ ecole: e, avg_score: Math.round(sc.reduce((a, b) => a + b, 0) / sc.length), count: sc.length }))
            .sort((a, b) => b.avg_score - a.avg_score).slice(0, 10)
        );
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (isPreviewEnvironment() && mounted) {
          setIsPreview(true);
          setLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      clearTimeout(slowTimer);
    };
  }, [router, retryCount]);

  if (isSlowConnection && loading) return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <SlowConnectionNotice
        onRetry={() => {
          setIsSlowConnection(false);
          setLoading(true);
          setRetryCount(c => c + 1);
        }}
      />
    </div>
  );

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-3" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="text-xs font-bold text-slate-500">Calcul du classement des majors...</p>
    </div>
  );

  const list = tab === "general" ? general : bySerie;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {isPreview && <PreviewBanner />}
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">emoji_events</span>
            <span>Palmarès d&apos;excellence GSN PREP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.classement.title", { examType: myExamType })}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {t("prep.classement.subtitle")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs flex gap-1">
        {([
          { key: "general", label: t("prep.classement.tabGeneral"), icon: "public" },
          ...(myExamType !== "BFEM" ? [{ key: "serie", label: t("prep.classement.tabSerie", { serie: mySerie || "" }), icon: "category" }] : []),
          { key: "ecole",   label: t("prep.classement.tabSchools"), icon: "school" },
        ] as { key: Tab; label: string; icon: string }[]).map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === tabItem.key
                ? "bg-[#005bbf] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tabItem.icon}</span>
            <span>{tabItem.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {tab !== "ecole" && (
          list.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">emoji_events</span>
              </div>
              <p className="font-extrabold text-slate-900 text-base">{t("prep.classement.emptyResultsTitle")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("prep.classement.emptyResultsSubtitle")}</p>
            </div>
          ) : (
            <>
              {/* Podium Top 3 */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
                <p className="text-center font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-6">
                  Podium des Majors de promo
                </p>
                <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4 max-w-lg mx-auto">
                  {/* Rank 2 (Silver) */}
                  {list[1] ? (
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-2xl mb-1">{MEDAL[1]}</span>
                      <p className="text-xs font-black text-slate-900 text-center truncate w-full">{list[1].prenom}</p>
                      <span className="text-[11px] font-bold text-slate-500 mb-2">{list[1].avg_score}%</span>
                      <div className="w-full h-24 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 border-t-2 border-slate-300 flex items-center justify-center shadow-inner">
                        <span className="text-slate-600 font-black text-lg">2</span>
                      </div>
                    </div>
                  ) : <div className="flex-1" />}

                  {/* Rank 1 (Gold) */}
                  {list[0] ? (
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-3xl mb-1">{MEDAL[0]}</span>
                      <p className="text-xs sm:text-sm font-black text-slate-900 text-center truncate w-full">{list[0].prenom}</p>
                      <span className="text-xs font-black text-amber-600 mb-2">{list[0].avg_score}%</span>
                      <div className="w-full h-32 rounded-t-2xl bg-gradient-to-t from-amber-200 to-amber-100 border-t-2 border-amber-300 flex items-center justify-center shadow-inner">
                        <span className="text-amber-800 font-black text-2xl">1</span>
                      </div>
                    </div>
                  ) : <div className="flex-1" />}

                  {/* Rank 3 (Bronze) */}
                  {list[2] ? (
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-2xl mb-1">{MEDAL[2]}</span>
                      <p className="text-xs font-black text-slate-900 text-center truncate w-full">{list[2].prenom}</p>
                      <span className="text-[11px] font-bold text-slate-500 mb-2">{list[2].avg_score}%</span>
                      <div className="w-full h-18 rounded-t-2xl bg-gradient-to-t from-amber-100 to-orange-100 border-t-2 border-orange-200 flex items-center justify-center shadow-inner">
                        <span className="text-amber-900 font-black text-base">3</span>
                      </div>
                    </div>
                  ) : <div className="flex-1" />}
                </div>
              </div>

              {/* Ranks 4 to 10 */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Rangs suivants
                </p>
                {list.slice(3).map((p, i) => {
                  const isMe = p.user_id === myId;
                  return (
                    <div
                      key={p.user_id}
                      className={`flex items-center gap-3.5 p-4 rounded-2xl transition-all ${
                        isMe
                          ? "bg-blue-50/70 border-2 border-[#005bbf] shadow-xs"
                          : "bg-white border border-slate-200/80 shadow-xs"
                      }`}
                    >
                      <div className="w-8 text-center font-black text-slate-400 text-sm">
                        #{i + 4}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900 text-sm truncate">
                            {p.prenom}
                          </p>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-md bg-[#005bbf] text-white text-[10px] font-black uppercase tracking-wider">
                              {t("prep.classement.youLabel")}
                            </span>
                          )}
                        </div>
                        {p.ecole && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {p.ecole} {p.serie ? `· Série ${p.serie}` : ""}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-black text-xs px-3 py-1.5 rounded-xl ${
                          p.avg_score >= 60
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.avg_score >= 40
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {p.avg_score}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Personal rank callout if > 10 */}
              {myRank !== null && myRank > 10 && tab === "general" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#005bbf] text-[20px]">person</span>
                    <p className="text-sm font-bold text-slate-800">{t("prep.classement.nationalRankLabel")}</p>
                  </div>
                  <span className="text-sm font-black text-[#005bbf] px-3 py-1 bg-white rounded-lg border border-blue-200">
                    #{myRank}
                  </span>
                </div>
              )}
            </>
          )
        )}

        {/* Tab Ecoles / Lycées */}
        {tab === "ecole" && (
          byEcole.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#005bbf] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">school</span>
              </div>
              <p className="font-extrabold text-slate-900 text-base">{t("prep.classement.emptySchoolsTitle")}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("prep.classement.emptySchoolsSubtitle")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {byEcole.map((s, i) => {
                const isMySchool = s.ecole === myEcole;
                return (
                  <div
                    key={s.ecole}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl transition-all ${
                      isMySchool
                        ? "bg-blue-50/70 border-2 border-[#005bbf] shadow-xs"
                        : "bg-white border border-slate-200/80 shadow-xs"
                    }`}
                  >
                    <span className="text-xl w-8 text-center shrink-0">
                      {i < 3 ? MEDAL[i] : `#${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{s.ecole}</p>
                        {isMySchool && (
                          <span className="px-2 py-0.5 rounded-md bg-[#005bbf] text-white text-[10px] font-black uppercase">
                            Ton lycée
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t(s.count > 1 ? "prep.classement.studentCountPlural" : "prep.classement.studentCountSingular", { count: s.count })}
                      </p>
                    </div>
                    <span
                      className={`font-black text-xs px-3 py-1.5 rounded-xl ${
                        s.avg_score >= 60
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : s.avg_score >= 40
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {s.avg_score}%
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
