"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MATIERES_BY_SERIE, getProgramme } from "@/data/programmes";

const BAC_DATE = "2026-06-30";

function daysUntilBAC() {
  return Math.max(0, Math.ceil((new Date(BAC_DATE).getTime() - Date.now()) / 86400000));
}

type StatutChapitre = "a_travailler" | "en_cours" | "maitrise";

type ChapitreProgress = {
  matiere: string;
  chapitre: string;
  statut: StatutChapitre;
  score: number;
};

type SemaineItem = {
  matiere: string;
  chapitre: string;
  statut: StatutChapitre;
};

type Semaine = {
  label: string;         // "Semaine 1 (14-20 avr)"
  dateRange: string;
  items: SemaineItem[];
};

const STATUT_CONFIG: Record<StatutChapitre, { label: string; icon: string; color: string; bg: string }> = {
  maitrise:      { label: "Maîtrisé",    icon: "check_circle", color: "text-green-600", bg: "bg-green-50"  },
  en_cours:      { label: "En cours",    icon: "pending",      color: "text-yellow-600", bg: "bg-yellow-50" },
  a_travailler:  { label: "À travailler",icon: "radio_button_unchecked", color: "text-on-surface-variant", bg: "bg-surface-container" },
};

function buildWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = ["jan", "fév", "mar", "avr", "mai", "juin", "juil"];
  const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function generatePlan(progressMap: Map<string, StatutChapitre>, allItems: { matiere: string; chapitre: string }[]): Semaine[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bac = new Date(BAC_DATE);
  const totalDays = Math.max(7, Math.ceil((bac.getTime() - today.getTime()) / 86400000));
  const totalWeeks = Math.ceil(totalDays / 7);

  // Items not yet mastered
  const pending = allItems.filter(it => {
    const key = `${it.matiere}::${it.chapitre}`;
    return progressMap.get(key) !== "maitrise";
  });

  const perWeek = Math.max(1, Math.ceil(pending.length / totalWeeks));
  const semaines: Semaine[] = [];

  let weekStart = new Date(today);
  for (let w = 0; w < totalWeeks && semaines.length * perWeek < pending.length; w++) {
    const batch = pending.slice(w * perWeek, (w + 1) * perWeek);
    if (batch.length === 0) break;
    semaines.push({
      label: `Semaine ${w + 1}`,
      dateRange: buildWeekLabel(weekStart),
      items: batch.map(it => ({
        ...it,
        statut: progressMap.get(`${it.matiere}::${it.chapitre}`) ?? "a_travailler",
      })),
    });
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
  }
  return semaines;
}

export default function ProgrammePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [serie, setSerie] = useState("S1");
  const [examType, setExamType] = useState("BAC");
  const [progress, setProgress] = useState<ChapitreProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matiere" | "semaines">("matiere");
  const [expandedMatiere, setExpandedMatiere] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const dl = daysUntilBAC();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    setUserId(user.id);

    const [{ data: stu }, { data: prog }] = await Promise.all([
      supabase.from("prep_students").select("exam_type, serie").eq("user_id", user.id).limit(1),
      supabase.from("prep_chapter_progress").select("*").eq("user_id", user.id),
    ]);

    const et = stu?.[0]?.exam_type ?? "BAC";
    const sr = stu?.[0]?.serie ?? "S1";
    setExamType(et);
    setSerie(sr);
    setProgress((prog ?? []) as ChapitreProgress[]);

    // Seed missing chapters on first visit
    if (!prog?.length && user.id) {
      const matieres = MATIERES_BY_SERIE[sr] ?? [];
      const inserts: { user_id: string; matiere: string; chapitre: string; statut: string }[] = [];
      for (const mat of matieres) {
        const programme = getProgramme(mat, sr);
        if (programme) {
          for (const ch of programme.chapitres) {
            inserts.push({ user_id: user.id, matiere: mat, chapitre: ch, statut: "a_travailler" });
          }
        }
      }
      if (inserts.length) {
        await supabase.from("prep_chapter_progress").upsert(inserts, { onConflict: "user_id,matiere,chapitre" });
        const { data: fresh } = await supabase.from("prep_chapter_progress").select("*").eq("user_id", user.id);
        setProgress((fresh ?? []) as ChapitreProgress[]);
      }
    }

    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function updateStatut(matiere: string, chapitre: string, statut: StatutChapitre) {
    if (!userId) return;
    const key = `${matiere}::${chapitre}`;
    setSaving(key);
    setProgress(prev => {
      const existing = prev.findIndex(p => p.matiere === matiere && p.chapitre === chapitre);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], statut };
        return copy;
      }
      return [...prev, { matiere, chapitre, statut, score: 0 }];
    });
    await supabase.from("prep_chapter_progress").upsert(
      { user_id: userId, matiere, chapitre, statut, updated_at: new Date().toISOString() },
      { onConflict: "user_id,matiere,chapitre" }
    );
    setSaving(null);
  }

  function cycleStatut(current: StatutChapitre): StatutChapitre {
    if (current === "a_travailler") return "en_cours";
    if (current === "en_cours") return "maitrise";
    return "a_travailler";
  }

  const matieres = MATIERES_BY_SERIE[serie] ?? [];
  const progressMap = new Map(progress.map(p => [`${p.matiere}::${p.chapitre}`, p.statut as StatutChapitre]));

  // All chapters
  const allItems: { matiere: string; chapitre: string }[] = [];
  for (const mat of matieres) {
    const prog = getProgramme(mat, serie);
    if (prog) for (const ch of prog.chapitres) allItems.push({ matiere: mat, chapitre: ch });
  }

  // Stats
  const total = allItems.length;
  const maitrise = allItems.filter(it => progressMap.get(`${it.matiere}::${it.chapitre}`) === "maitrise").length;
  const enCours  = allItems.filter(it => progressMap.get(`${it.matiere}::${it.chapitre}`) === "en_cours").length;
  const aTrav    = total - maitrise - enCours;
  const pctGlobal = total > 0 ? Math.round((maitrise / total) * 100) : 0;

  const semaines = generatePlan(progressMap, allItems);

  if (loading) return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </main>
  );

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div className="flex-1">
          <p className="font-bold text-on-surface">Programme de révision</p>
          <p className="text-xs text-on-surface-variant">{examType} série {serie} · BAC dans J-{dl}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        {/* Countdown */}
        <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase">BAC — 30 juin 2026</p>
              <p className="text-3xl font-black">J-{dl}</p>
              <p className="text-white/70 text-xs">{Math.ceil(dl / 7)} semaines restantes</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{pctGlobal}%</p>
              <p className="text-white/80 text-xs">chapitres maîtrisés</p>
              <p className="text-white/70 text-[11px]">{maitrise}/{total}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pctGlobal}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: maitrise, label: "Maîtrisés", color: "text-green-600 bg-green-50"   },
            { val: enCours,  label: "En cours",  color: "text-yellow-600 bg-yellow-50" },
            { val: aTrav,    label: "À travailler", color: "text-red-600 bg-red-50"    },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-3 text-center ${s.color}`}>
              <p className="text-2xl font-black">{s.val}</p>
              <p className="text-[10px] font-semibold leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["matiere", "semaines"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === t ? "text-white" : "bg-surface-container-lowest text-on-surface-variant"}`}
              style={activeTab === t ? { backgroundColor: "#FF6B00" } : {}}>
              {t === "matiere" ? "Par matière" : "Plan semaines"}
            </button>
          ))}
        </div>

        {/* TAB: par matière */}
        {activeTab === "matiere" && (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant">Appuie sur un chapitre pour changer son statut</p>
            {matieres.map(mat => {
              const prog = getProgramme(mat, serie);
              if (!prog) return null;
              const chapitres = prog.chapitres;
              const maitCount = chapitres.filter(ch => progressMap.get(`${mat}::${ch}`) === "maitrise").length;
              const isExpanded = expandedMatiere === mat;

              return (
                <div key={mat} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedMatiere(isExpanded ? null : mat)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface-container transition-colors">
                    <div className="flex-1 text-left">
                      <p className="font-bold text-on-surface text-sm">{mat}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {maitCount}/{chapitres.length} chapitres maîtrisés
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${chapitres.length > 0 ? Math.round((maitCount / chapitres.length) * 100) : 0}%` }} />
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                        {isExpanded ? "expand_less" : "expand_more"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-outline-variant/20 divide-y divide-outline-variant/10">
                      {chapitres.map(ch => {
                        const key = `${mat}::${ch}`;
                        const statut: StatutChapitre = progressMap.get(key) ?? "a_travailler";
                        const cfg = STATUT_CONFIG[statut];
                        const isSaving = saving === key;
                        return (
                          <button
                            key={ch}
                            onClick={() => updateStatut(mat, ch, cycleStatut(statut))}
                            disabled={isSaving}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container transition-colors disabled:opacity-60">
                            <p className="text-sm text-on-surface text-left flex-1 pr-3">{ch}</p>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 ${cfg.bg}`}>
                              {isSaving ? (
                                <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                              ) : (
                                <span className={`material-symbols-outlined text-[14px] ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                              )}
                              <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: plan semaines */}
        {activeTab === "semaines" && (
          <div className="space-y-4">
            {semaines.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[48px] text-green-400 block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-bold text-on-surface">Tous les chapitres sont maîtrisés !</p>
                <p className="text-sm text-on-surface-variant mt-1">Bravo — tu es prêt(e) pour le BAC 🎓</p>
              </div>
            ) : (
              semaines.map((sem, idx) => {
                const isCurrentWeek = idx === 0;
                return (
                  <div key={idx} className={`rounded-2xl shadow-sm overflow-hidden border-2 ${isCurrentWeek ? "border-primary/30" : "border-transparent"}`}>
                    <div className={`px-4 py-3 flex items-center justify-between ${isCurrentWeek ? "bg-primary/5" : "bg-surface-container-lowest"}`}>
                      <div>
                        <p className="font-black text-on-surface text-sm">{sem.label}</p>
                        <p className="text-xs text-on-surface-variant">{sem.dateRange}</p>
                      </div>
                      {isCurrentWeek && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#FF6B00" }}>Cette semaine</span>
                      )}
                    </div>
                    <div className="divide-y divide-outline-variant/10 bg-surface-container-lowest">
                      {sem.items.map((it, i) => {
                        const key = `${it.matiere}::${it.chapitre}`;
                        const statut: StatutChapitre = progressMap.get(key) ?? "a_travailler";
                        const cfg = STATUT_CONFIG[statut];
                        return (
                          <button key={i}
                            onClick={() => updateStatut(it.matiere, it.chapitre, cycleStatut(statut))}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container transition-colors">
                            <div className="text-left flex-1">
                              <p className="text-xs text-on-surface-variant font-semibold">{it.matiere}</p>
                              <p className="text-sm text-on-surface">{it.chapitre}</p>
                            </div>
                            <span className={`material-symbols-outlined text-[20px] ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CTA Quiz */}
        <Link href="/prep/quiz"
          className="flex items-center gap-3 p-4 rounded-2xl text-white shadow-lg"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          <div>
            <p className="font-black">Réviser avec le Quiz IA</p>
            <p className="text-white/80 text-xs">Questions générées sur tes chapitres à travailler</p>
          </div>
          <span className="material-symbols-outlined text-white/70 ml-auto">arrow_forward_ios</span>
        </Link>

      </div>
    </main>
  );
}
