"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMatieres, getChapitres } from "@/data/programmes";

type Profile = { prenom: string | null; exam_type: string; serie: string | null };

export default function ProgrammePage() {
  const router = useRouter();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [worked,   setWorked]   = useState<Set<string>>(new Set());   // "Matière||Chapitre"
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
        w.add(`${r.matiere}||`);   // matiere worked (no chapter)
      }
      setWorked(w);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
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

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">Programme officiel</h1>
        <p className="text-on-surface-variant text-sm mt-0.5">
          {exam}{serie ? ` · Série ${serie}` : ""} · Office du BAC Sénégal
        </p>
      </header>

      <div className="px-6 space-y-4">

        {/* Global progress */}
        {totalChaps > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-on-surface">Avancement global</p>
              <p className="text-sm font-black text-primary">{totalDone}/{totalChaps} chapitres</p>
            </div>
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${totalChaps > 0 ? Math.round((totalDone / totalChaps) * 100) : 0}%`, backgroundColor: "#FF6B00" }}
              />
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
            <div key={m} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
              {/* Header matière */}
              <button
                onClick={() => toggle(m)}
                className="w-full flex items-center gap-3 p-4 text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${matiereWorked ? "bg-orange-100" : "bg-surface-container"}`}>
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: matiereWorked ? "#FF6B00" : "var(--color-on-surface-variant)", fontVariationSettings: "'FILL' 1" }}>
                    {matiereWorked ? "check_circle" : "menu_book"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface text-sm">{m}</p>
                  {total > 0 && (
                    <p className="text-xs text-on-surface-variant mt-0.5">{done}/{total} chapitres · {pct}%</p>
                  )}
                  {total > 0 && (
                    <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: pct && pct >= 60 ? "#22c55e" : "#FF6B00" }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); goGenerer(m); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform"
                    style={{ backgroundColor: "#FF6B00" }}>
                    Générer
                  </button>
                  <span
                    className="material-symbols-outlined text-on-surface-variant text-[20px] transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    expand_more
                  </span>
                </div>
              </button>

              {/* Chapitres */}
              {isOpen && chaps.length > 0 && (
                <div className="border-t border-outline-variant/15 divide-y divide-outline-variant/10">
                  {chaps.map(c => {
                    const done = worked.has(`${m}||${c}`);
                    return (
                      <div key={c} className={`flex items-center gap-3 px-4 py-3 ${done ? "bg-green-50/50" : ""}`}>
                        <span
                          className="material-symbols-outlined text-[16px] flex-shrink-0"
                          style={{ color: done ? "#22c55e" : "var(--color-on-surface-variant)", fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
                          {done ? "task_alt" : "radio_button_unchecked"}
                        </span>
                        <p className={`flex-1 text-sm ${done ? "text-on-surface line-through decoration-green-400" : "text-on-surface"}`}>{c}</p>
                        <button
                          onClick={() => goGenerer(m, c)}
                          className="text-xs font-semibold text-primary underline active:opacity-70">
                          Réviser
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isOpen && chaps.length === 0 && (
                <div className="border-t border-outline-variant/15 px-4 py-4">
                  <button
                    onClick={() => goGenerer(m)}
                    className="w-full py-3 rounded-xl font-bold text-white text-sm active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: "#FF6B00" }}>
                    Générer du contenu pour {m}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {matieres.length === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm">
            <p className="font-bold text-on-surface">Profil incomplet</p>
            <p className="text-sm text-on-surface-variant mt-1">Complète ton profil pour voir ton programme.</p>
            <button
              onClick={() => router.push("/prep/onboarding")}
              className="mt-4 px-6 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "#FF6B00" }}>
              Compléter mon profil
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
