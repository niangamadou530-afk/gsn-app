"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Employer = { id: string; company_name: string; email: string };
type Mission = {
  id: string;
  title: string;
  domain: string;
  duration_type: string;
  budget_fcfa: number;
  min_gsn_score: number;
  status: string;
  created_at: string;
};

export default function EmployerDashboard() {
  const router = useRouter();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/employer/login"); return; }

      const { data: emp, error: empErr } = await supabase
        .from("employers").select("*").eq("auth_id", auth.user.id).single();
      if (empErr || !emp) { router.replace("/employer/login"); return; }
      setEmployer(emp);

      const { data: missionData } = await supabase
        .from("employer_missions")
        .select("*")
        .eq("employer_id", emp.id)
        .order("created_at", { ascending: false });
      setMissions(missionData ?? []);

      if (missionData && missionData.length > 0) {
        const ids = missionData.map((m: Mission) => m.id);
        const { data: apps } = await supabase
          .from("applications")
          .select("mission_id")
          .in("mission_id", ids);
        const counts: Record<string, number> = {};
        (apps ?? []).forEach((a: { mission_id: string }) => {
          counts[a.mission_id] = (counts[a.mission_id] ?? 0) + 1;
        });
        setCandidateCounts(counts);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignout() {
    await supabase.auth.signOut();
    router.replace("/employer/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  const activeMissions = missions.filter(m => m.status === "active");
  const totalCandidates = Object.values(candidateCounts).reduce((a, b) => a + b, 0);

  function durationLabel(type: string) {
    if (type === "short") return "Court terme";
    if (type === "long") return "Long terme";
    return "Freelance";
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-on-primary font-black text-xs">GSN</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Espace Employeur</p>
            <p className="text-sm font-bold text-on-surface leading-tight">{employer?.company_name}</p>
          </div>
        </div>
        <button onClick={handleSignout} className="flex items-center gap-1.5 text-sm text-outline hover:text-error transition-colors font-medium">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Déconnexion
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Tableau de bord</h1>
          <p className="text-on-surface-variant text-sm mt-1">Gérez vos missions et suivez vos candidatures GSN</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "work", label: "Missions publiées", value: missions.length, color: "text-primary" },
            { icon: "check_circle", label: "Missions actives", value: activeMissions.length, color: "text-tertiary" },
            { icon: "group", label: "Candidatures reçues", value: totalCandidates, color: "text-secondary" },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(25,28,35,0.06)] flex flex-col gap-2">
              <span className={`material-symbols-outlined ${stat.color} text-[22px]`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              <span className="text-3xl font-extrabold text-on-surface">{stat.value}</span>
              <span className="text-xs text-on-surface-variant font-medium leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <Link href="/employer/missions/new"
          className="flex items-center gap-3 w-full bg-primary text-on-primary font-bold py-4 px-6 rounded-2xl shadow-[0_4px_12px_rgba(0,91,191,0.25)] hover:opacity-90 active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Publier une nouvelle mission
        </Link>

        {/* Missions list */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-on-surface">Mes missions</h2>

          {missions.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center shadow-[0_4px_16px_rgba(25,28,35,0.06)]">
              <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>work_off</span>
              <p className="text-on-surface-variant text-sm font-medium">Aucune mission publiée pour l&apos;instant.</p>
              <Link href="/employer/missions/new" className="inline-block mt-4 text-primary font-bold text-sm hover:underline">
                Publier votre première mission →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map(m => (
                <Link key={m.id} href={`/employer/missions/${m.id}`}
                  className="block bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(25,28,35,0.06)] hover:shadow-[0_6px_20px_rgba(25,28,35,0.10)] transition-all active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.status === "active" ? "bg-primary/10 text-primary" : "bg-outline-variant/20 text-outline"}`}>
                          {m.status === "active" ? "Actif" : "Fermé"}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">{durationLabel(m.duration_type)}</span>
                      </div>
                      <p className="font-bold text-on-surface truncate">{m.title}</p>
                      {m.domain && <p className="text-sm text-on-surface-variant mt-0.5">{m.domain}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">group</span>
                        <span className="font-semibold">{candidateCounts[m.id] ?? 0}</span>
                      </div>
                      {m.budget_fcfa > 0 && (
                        <p className="text-xs text-on-surface-variant font-medium">{m.budget_fcfa.toLocaleString()} FCFA</p>
                      )}
                    </div>
                  </div>
                  {m.min_gsn_score > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-outline-variant/15">
                      <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                      <span className="text-xs text-on-surface-variant font-medium">Score GSN minimum : {m.min_gsn_score}%</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
