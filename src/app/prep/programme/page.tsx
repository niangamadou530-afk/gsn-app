"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres } from "@/data/programmes";

const A  = "#00C9A7";
const C  = "#111118";
const B  = "rgba(255,255,255,0.07)";
const T2 = "#A0A0B0";

type Profile = { prenom: string | null; exam_type: string; serie: string | null };

export default function ProgrammePage() {
  const router = useRouter();
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [worked,   setWorked]   = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: stu }, { data: quiz }, { data: flash }] = await Promise.all([
        supabase.from("prep_students").select("prenom, exam_type, serie").eq("user_id", user.id).maybeSingle(),
        supabase.from("quiz_results").select("matiere, chapitre").eq("user_id", user.id),
        supabase.from("flashcards").select("matiere, chapitre").eq("user_id", user.id),
      ]);

      setProfile(stu as Profile | null);
      const w = new Set<string>();
      for (const r of [...(quiz ?? []), ...(flash ?? [])]) {
        if (r.chapitre) w.add(`${r.matiere}||${r.chapitre}`);
        w.add(`${r.matiere}||`);
      }
      setWorked(w);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: A, borderTopColor: "transparent" }} />
    </div>
  );

  const exam  = profile?.exam_type ?? "BAC";
  const serie = profile?.serie ?? "";
  const matieres = getMatieres(exam, serie);

  function toggle(m: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }

  function matiereProgress(m: string) {
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
    <main className="min-h-screen text-white pb-8" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Header */}
      <div className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Programme officiel</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: T2 }}>
          {exam}{serie ? ` · Série ${serie}` : ""} · Office du BAC Sénégal
        </p>
      </div>

      <div className="px-6 space-y-4">

        {/* Global progress */}
        {totalChaps > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">Avancement global</p>
              <p className="text-sm font-black" style={{ color: A }}>{totalDone}/{totalChaps} chapitres · {globalPct}%</p>
            </div>
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${globalPct}%`, backgroundColor: A }} />
            </div>
          </div>
        )}

        {/* Matières */}
        {matieres.map(m => {
          const chaps = getChapitres(exam, serie, m).filter(c => c !== "Autre");
          const { done, total } = matiereProgress(m);
          const isOpen = expanded.has(m);
          const matiereWorked = worked.has(`${m}||`) || done > 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : null;

          return (
            <div key={m} className="rounded-2xl overflow-hidden" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <button onClick={() => toggle(m)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: matiereWorked ? "rgba(0,201,167,0.12)" : "rgba(255,255,255,0.05)" }}>
                  <span className="material-symbols-outlined text-[18px]"
                    style={{ color: matiereWorked ? A : "#5A5A70", fontVariationSettings: "'FILL' 1" }}>
                    {matiereWorked ? "check_circle" : "menu_book"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{m}</p>
                  {total > 0 && (
                    <>
                      <p className="text-xs mt-0.5" style={{ color: T2 }}>{done}/{total} chapitres · {pct}%</p>
                      <div className="h-1 w-full rounded-full mt-1.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct && pct >= 60 ? A : "rgba(0,201,167,0.5)" }} />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); goGenerer(m); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                    style={{ backgroundColor: "rgba(0,201,167,0.12)", color: A, border: "1px solid rgba(0,201,167,0.2)" }}>
                    Générer
                  </button>
                  <span className="material-symbols-outlined text-[20px] transition-transform"
                    style={{ color: "#5A5A70", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    expand_more
                  </span>
                </div>
              </button>

              {isOpen && chaps.length > 0 && (
                <div style={{ borderTop: `1px solid ${B}` }}>
                  {chaps.map(c => {
                    const isDone = worked.has(`${m}||${c}`);
                    return (
                      <div key={c} className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, backgroundColor: isDone ? "rgba(0,201,167,0.04)" : "transparent" }}>
                        <span className="material-symbols-outlined text-[16px] flex-shrink-0"
                          style={{ color: isDone ? A : "#5A5A70", fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}>
                          {isDone ? "task_alt" : "radio_button_unchecked"}
                        </span>
                        <p className="flex-1 text-sm" style={{
                          color: isDone ? T2 : "white",
                          textDecoration: isDone ? "line-through" : "none",
                        }}>{c}</p>
                        <button onClick={() => goGenerer(m, c)}
                          className="text-xs font-semibold active:opacity-70 flex-shrink-0" style={{ color: A }}>
                          Réviser
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isOpen && chaps.length === 0 && (
                <div className="px-4 py-4" style={{ borderTop: `1px solid ${B}` }}>
                  <button onClick={() => goGenerer(m)}
                    className="w-full py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: A, color: "#003328" }}>
                    Générer du contenu pour {m}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {matieres.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
            <p className="font-bold text-white">Profil incomplet</p>
            <p className="text-sm mt-1" style={{ color: T2 }}>Complète ton profil pour voir ton programme.</p>
            <button onClick={() => router.push("/prep/onboarding")}
              className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ backgroundColor: A, color: "#003328" }}>
              Compléter mon profil
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
