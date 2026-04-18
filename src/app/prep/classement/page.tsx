"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
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
          prenom: stuMap[uid]?.prenom ?? "Élève",
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
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );

  const list = tab === "general" ? general : bySerie;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">Classement {myExamType}</h1>
        <p className="text-on-surface-variant text-sm">Inter-écoles · Sénégal</p>
      </header>

      <div className="px-6 mb-4">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1">
          {([
            { key: "general", label: "Général" },
            ...(myExamType !== "BFEM" ? [{ key: "serie", label: `Série ${mySerie || ""}` }] : []),
            { key: "ecole",   label: "Écoles" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.key ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-3">

        {tab !== "ecole" && (
          list.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm">
              <p className="font-bold text-on-surface">Aucun résultat disponible</p>
              <p className="text-sm text-on-surface-variant mt-1">Sois le premier à passer un quiz !</p>
            </div>
          ) : (
            <>
              {/* Podium top 3 */}
              <div className="flex items-end justify-center gap-3 py-3">
                {([list[1], list[0], list[2]] as (Player | undefined)[]).map((p, idx) => {
                  const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                  const h = rank === 1 ? "h-24" : rank === 2 ? "h-16" : "h-12";
                  const bg = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32";
                  if (!p) return <div key={idx} className="flex-1" />;
                  return (
                    <div key={p.user_id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xl">{MEDAL[rank - 1]}</span>
                      <p className="text-xs font-bold text-on-surface text-center truncate w-full">{p.prenom}</p>
                      <p className="text-xs text-on-surface-variant">{p.avg_score}%</p>
                      <div className={`w-full ${h} rounded-t-xl flex items-end justify-center pb-1.5`} style={{ backgroundColor: bg }}>
                        <span className="text-white font-black text-sm">{rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {list.slice(3).map((p, i) => (
                <div key={p.user_id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl shadow-sm ${p.user_id === myId ? "bg-primary/5 border-2 border-primary/20" : "bg-surface-container-lowest"}`}>
                  <span className="w-7 text-center font-black text-on-surface-variant text-sm">#{i + 4}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm truncate">{p.prenom}{p.user_id === myId ? " (toi)" : ""}</p>
                    {p.ecole && <p className="text-xs text-on-surface-variant truncate">{p.ecole}</p>}
                  </div>
                  <span className={`font-black text-sm px-3 py-1 rounded-full ${p.avg_score >= 60 ? "bg-green-100 text-green-700" : p.avg_score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {p.avg_score}%
                  </span>
                </div>
              ))}

              {myRank !== null && myRank > 10 && tab === "general" && (
                <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">Ton rang national</p>
                  <p className="text-sm font-black text-primary">#{myRank}</p>
                </div>
              )}
            </>
          )
        )}

        {tab === "ecole" && (
          byEcole.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center shadow-sm">
              <p className="font-bold text-on-surface">Aucune école classée</p>
              <p className="text-sm text-on-surface-variant mt-1">Renseigne ton école dans le profil.</p>
            </div>
          ) : byEcole.map((s, i) => (
            <div key={s.ecole}
              className={`flex items-center gap-3 p-4 rounded-xl shadow-sm ${s.ecole === myEcole ? "bg-primary/5 border-2 border-primary/20" : "bg-surface-container-lowest"}`}>
              <span className="text-xl w-8 text-center">{i < 3 ? MEDAL[i] : `#${i + 1}`}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface truncate">{s.ecole}</p>
                <p className="text-xs text-on-surface-variant">{s.count} élève{s.count > 1 ? "s" : ""}</p>
              </div>
              <span className={`font-black text-sm px-3 py-1 rounded-full ${s.avg_score >= 60 ? "bg-green-100 text-green-700" : s.avg_score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {s.avg_score}%
              </span>
            </div>
          ))
        )}

      </div>
    </main>
  );
}
