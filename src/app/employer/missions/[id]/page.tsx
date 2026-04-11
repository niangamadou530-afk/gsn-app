"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Mission = {
  id: string;
  title: string;
  description: string | null;
  domain: string;
  budget_fcfa: number;
  duration_type: string;
  min_gsn_score: number;
  status: string;
  created_at: string;
};

type Skill = {
  domain: string;
  score: number;
  date: string;
  weeks?: number;
  cert_id?: string;
  level?: string;
};

type Candidate = {
  id: string;
  user_id: string;
  status: string;
  applied_at: string;
  user?: {
    name: string;
    score: number;
    skills: Skill[];
  };
};

export default function MissionCandidatesPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingMission, setClosingMission] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/employer/login"); return; }

      const { data: emps } = await supabase.from("employers").select("id").eq("auth_id", auth.user.id).limit(1);
      const emp = emps?.[0] ?? null;
      if (!emp) { router.replace("/employer/login"); return; }

      const { data: m, error: mErr } = await supabase
        .from("employer_missions")
        .select("*")
        .eq("id", missionId)
        .eq("employer_id", emp.id)
        .single();
      if (mErr || !m) { router.replace("/employer/dashboard"); return; }
      setMission(m);

      const { data: apps } = await supabase
        .from("applications")
        .select("*, users(id, name, score, skills)")
        .eq("mission_id", params.id);

      if (apps && apps.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCandidates(apps.map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          status: a.status,
          applied_at: a.applied_at,
          user: a.users ? {
            name: a.users.name,
            score: a.users.score,
            skills: a.users.skills ?? [],
          } : undefined,
        })));
      } else {
        setCandidates([]);
      }

      setLoading(false);
    }
    load();
  }, [missionId, router]);

  async function updateApplicationStatus(appId: string, newStatus: string) {
    await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    setCandidates(prev => prev.map(c => c.id === appId ? { ...c, status: newStatus } : c));
  }

  async function toggleMissionStatus() {
    if (!mission) return;
    setClosingMission(true);
    const newStatus = mission.status === "active" ? "closed" : "active";
    await supabase.from("employer_missions").update({ status: newStatus }).eq("id", mission.id);
    setMission(prev => prev ? { ...prev, status: newStatus } : prev);
    setClosingMission(false);
  }

  function durationLabel(type: string) {
    if (type === "short") return "Court terme";
    if (type === "long") return "Long terme";
    return "Freelance";
  }

  function gsnLevel(score: number) {
    if (score >= 75) return { label: "Premium", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (score >= 50) return { label: "Medium", color: "text-blue-600", bg: "bg-blue-50" };
    if (score >= 20) return { label: "Small", color: "text-green-600", bg: "bg-green-50" };
    return { label: "Débutant", color: "text-outline", bg: "bg-surface-container-low" };
  }

  function formatDateFr(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  function statusColor(s: string) {
    if (s === "accepted") return "bg-primary/10 text-primary";
    if (s === "rejected") return "bg-error/10 text-error";
    return "bg-outline-variant/20 text-outline";
  }

  function statusLabel(s: string) {
    if (s === "accepted") return "Accepté";
    if (s === "rejected") return "Refusé";
    return "En attente";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/employer/dashboard" className="text-outline hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-on-surface-variant font-medium">Mission</p>
          <p className="font-bold text-on-surface truncate">{mission?.title}</p>
        </div>
        <button
          onClick={toggleMissionStatus}
          disabled={closingMission}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${mission?.status === "active" ? "bg-error/10 text-error hover:bg-error/20" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
          {mission?.status === "active" ? "Fermer" : "Réactiver"}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Mission summary */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_16px_rgba(25,28,35,0.06)] space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${mission?.status === "active" ? "bg-primary/10 text-primary" : "bg-outline-variant/20 text-outline"}`}>
              {mission?.status === "active" ? "Actif" : "Fermé"}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">{durationLabel(mission?.duration_type ?? "")}</span>
            {mission?.domain && <span className="text-[11px] text-on-surface-variant font-medium">· {mission.domain}</span>}
          </div>

          {mission?.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed">{mission.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {mission?.budget_fcfa ? (
              <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                <div>
                  <p className="text-xs text-on-surface-variant">Budget</p>
                  <p className="text-sm font-bold text-on-surface">{mission.budget_fcfa.toLocaleString()} FCFA</p>
                </div>
              </div>
            ) : null}
            {mission && mission.min_gsn_score > 0 ? (
              <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <div>
                  <p className="text-xs text-on-surface-variant">Score min. requis</p>
                  <p className="text-sm font-bold text-on-surface">{mission.min_gsn_score}%</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Candidates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">Candidatures</h2>
            <span className="text-sm text-on-surface-variant font-medium">{candidates.length} candidat{candidates.length !== 1 ? "s" : ""}</span>
          </div>

          {candidates.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-[0_4px_16px_rgba(25,28,35,0.06)]">
              <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>group_off</span>
              <p className="text-on-surface-variant text-sm font-medium">Aucune candidature pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map(c => {
                const level = gsnLevel(c.user?.score ?? 0);
                const skills: Skill[] = c.user?.skills ?? [];
                return (
                <div key={c.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(25,28,35,0.06)] space-y-4">

                  {/* Header candidat */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{c.user?.name ?? "Talent GSN"}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-xs text-on-surface-variant font-semibold">{c.user?.score ?? 0}% GSN</span>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>
                            {level.label}
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-medium">
                            {skills.length} certification{skills.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </div>

                  {/* Skill Passport — certifications complètes */}
                  {skills.length > 0 && (
                    <div className="pt-3 border-t border-outline-variant/15 space-y-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        Skill Passport
                      </p>
                      <div className="space-y-2">
                        {skills.map((sk, i) => (
                          <div key={i} className="bg-surface-container-low rounded-xl p-3 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-on-surface truncate">{sk.domain}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                {sk.level && (
                                  <span className="text-[11px] text-on-surface-variant">{sk.level}</span>
                                )}
                                {sk.weeks && (
                                  <span className="text-[11px] text-on-surface-variant">{sk.weeks} sem.</span>
                                )}
                                {sk.date && (
                                  <span className="text-[11px] text-on-surface-variant">{formatDateFr(sk.date)}</span>
                                )}
                                {sk.cert_id && (
                                  <span className="text-[11px] font-mono text-outline">{sk.cert_id}</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span className="text-base font-extrabold text-primary">{sk.score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {c.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => updateApplicationStatus(c.id, "accepted")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Accepter
                      </button>
                      <button onClick={() => updateApplicationStatus(c.id, "rejected")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-error/10 text-error font-bold text-sm rounded-xl hover:bg-error/20 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
