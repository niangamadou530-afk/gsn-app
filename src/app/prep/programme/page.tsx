"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres } from "@/data/programmes";
import { t } from "@/lib/i18n";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SlowConnectionNotice } from "@/components/SlowConnectionNotice";

type Profile = { prenom: string | null; exam_type: string; serie: string | null };

export default function ProgrammePage() {
  const router = useRouter();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [worked,   setWorked]   = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isPreviewEnvironment()) {
            if (mounted) {
              setProfile({ prenom: "Amadou (Démo)", exam_type: "BAC", serie: "S2" });
              setIsPreview(true);
              setLoading(false);
            }
            return;
          }
          router.push("/login");
          setLoading(false);
          return;
        }

        const [{ data: stu }, { data: quiz }, { data: flash }] = await Promise.all([
          supabase.from("prep_students").select("prenom, exam_type, serie").eq("user_id", user.id).maybeSingle(),
          supabase.from("quiz_results").select("matiere, chapitre").eq("user_id", user.id),
          supabase.from("flashcards").select("matiere, chapitre").eq("user_id", user.id),
        ]);

        if (mounted) {
          setProfile(stu as Profile | null);

          const w = new Set<string>();
          for (const r of [...(quiz ?? []), ...(flash ?? [])]) {
            if (r.chapitre) w.add(`${r.matiere}||${r.chapitre}`);
            w.add(`${r.matiere}||`);
          }
          setWorked(w);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isPreviewEnvironment() && mounted) {
          setProfile({ prenom: "Amadou (Démo)", exam_type: "BAC", serie: "S2" });
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
      <p className="text-xs font-bold text-slate-500">Chargement des programmes officiels...</p>
    </div>
  );

  const exam  = profile?.exam_type ?? "BAC";
  const serie = profile?.serie ?? "";
  const matieres = getMatieres(exam, serie);

  function toggle(m: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  }

  function matiereProgress(m: string): { done: number; total: number } {
    const chaps = getChapitres(exam, serie, m).filter(c => c !== "Autre");
    const done  = chaps.filter(c => worked.has(`${m}||${c}`)).length;
    return { done, total: chaps.length };
  }

  function goGenerer(matiere: string, chapitre?: string) {
    const params = new URLSearchParams({ matiere, exam, serie });
    if (chapitre) params.set("chapitre", chapitre);
    router.push(`/prep/generer?${params.toString()}`);
  }

  const totalDone  = matieres.reduce((s, m) => s + matiereProgress(m).done, 0);
  const totalChaps = matieres.reduce((s, m) => s + matiereProgress(m).total, 0);
  const globalPct  = totalChaps > 0 ? Math.round((totalDone / totalChaps) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {isPreview && <PreviewBanner />}
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#005bbf] text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>Programmes conformes aux directives du Ministère sénégalais</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("prep.programme.title")}
          </h1>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {exam}{serie ? t("prep.programme.serieSuffix", { serie }) : ""}{t("prep.programme.officialBoard")}
          </p>
        </div>
      </div>

      {/* Global Curriculum Progress Card */}
      {totalChaps > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-extrabold text-slate-900">{t("prep.programme.globalProgress")}</p>
              <p className="text-xs text-slate-500">Chapitres déjà travaillés en quiz ou flashcards</p>
            </div>
            <span className="text-sm font-black text-[#005bbf]">
              {t("prep.programme.chaptersCount", { done: totalDone, total: totalChaps })} ({globalPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${globalPct}%`, backgroundColor: "#FF6B00" }}
            />
          </div>
        </div>
      )}

      {/* Subjects Accordion List */}
      <div className="space-y-3">
        {matieres.map((m) => {
          const chaps = getChapitres(exam, serie, m).filter(c => c !== "Autre");
          const { done, total } = matiereProgress(m);
          const isOpen = expanded.has(m);
          const matiereWorked = worked.has(`${m}||`) || done > 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : null;

          return (
            <div key={m} className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden transition-all">
              {/* Header row */}
              <div
                onClick={() => toggle(m)}
                className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    matiereWorked ? "bg-orange-50 text-[#FF6B00]" : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {matiereWorked ? "verified" : "menu_book"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{m}</p>
                    {total > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t("prep.programme.matiereProgress", { done, total, pct: pct ?? 0 })}
                      </p>
                    )}
                    {total > 0 && (
                      <div className="h-1.5 w-32 sm:w-48 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct && pct >= 60 ? "#10b981" : "#FF6B00"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); goGenerer(m); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors active:scale-95"
                    style={{ backgroundColor: "#FF6B00" }}
                  >
                    {t("prep.programme.generateButton")}
                  </button>
                  <span
                    className="material-symbols-outlined text-slate-500 text-[20px] transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              {/* Chapters Drawer */}
              {isOpen && chaps.length > 0 && (
                <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/50">
                  {chaps.map((c) => {
                    const isDone = worked.has(`${m}||${c}`);
                    return (
                      <div key={c} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`material-symbols-outlined text-[18px] shrink-0 ${
                              isDone ? "text-emerald-600" : "text-slate-300"
                            }`}
                          >
                            {isDone ? "check_circle" : "radio_button_unchecked"}
                          </span>
                          <span className={`text-xs sm:text-sm font-medium truncate ${
                            isDone ? "text-slate-500 line-through decoration-emerald-500" : "text-slate-800"
                          }`}>
                            {c}
                          </span>
                        </div>
                        <button
                          onClick={() => goGenerer(m, c)}
                          className="text-xs font-bold text-[#005bbf] hover:underline shrink-0"
                        >
                          {t("prep.programme.reviewButton")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isOpen && chaps.length === 0 && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <button
                    onClick={() => goGenerer(m)}
                    className="w-full py-3 rounded-xl font-bold text-white text-xs shadow-xs active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: "#FF6B00" }}
                  >
                    {t("prep.programme.generateContentFor", { matiere: m })}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {matieres.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs space-y-3">
          <p className="font-extrabold text-slate-900 text-base">{t("prep.programme.incompleteProfile.title")}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t("prep.programme.incompleteProfile.desc")}</p>
          <button
            onClick={() => router.push("/prep/onboarding")}
            className="mt-2 px-5 py-2.5 rounded-xl font-bold text-white text-xs shadow-xs"
            style={{ backgroundColor: "#FF6B00" }}
          >
            {t("prep.programme.incompleteProfile.button")}
          </button>
        </div>
      )}
    </div>
  );
}
