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

type Candidate = {
  id: string;
  user_id: string;
  status: string;
  applied_at: string;
  user?: {
    name: string;
    score: number;
    skills: { domain: string; score: number; date: string }[];
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

      const { data: emp } = await supabase.from("employers").select("id").eq("auth_id", auth.user.id).single();
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
        .select("id, user_id, status, applied_at")
        .eq("mission_id", missionId)
        .order("applied_at", { ascending: false });

      if (apps && apps.length > 0) {
        const userIds = apps.map((a: Candidate) => a.user_id);
        const { data: users } = await supabase
          .from("users")
          .select("id, name, score, skills")
          .in("id", userIds);

        const userMap: Record<string, Candidate["user"]> = {};
        (users ?? []).forEach((u: { id: string; name: string; score: number; skills: { domain: string; score: number; date: string }[] }) => {
          userMap[u.id] = { name: u.name, score: u.score, skills: u.skills ?? [] };
        });

        setCandidates(apps.map((a: Candidate) => ({ ...a, user: userMap[a.user_id] })));
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
              {candidates.map(c => (
                <div key={c.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(25,28,35,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{c.user?.name ?? "Talent GSN"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-primary text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs text-on-surface-variant font-semibold">Score GSN : {c.user?.score ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusColor(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </div>

                  {/* Skills */}
                  {c.user?.skills && c.user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-outline-variant/15">
                      {c.user.skills.slice(0, 4).map((sk, i) => (
                        <span key={i} className="text-[11px] bg-surface-container-low text-on-surface-variant font-medium px-2 py-0.5 rounded-full">
                          {sk.domain} {sk.score}%
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {c.status === "pending" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant/15">
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
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
