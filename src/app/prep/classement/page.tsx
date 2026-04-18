"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const A  = "#00C9A7";
const C  = "#111118";
const B  = "rgba(255,255,255,0.07)";
const T2 = "#A0A0B0";

type Tab = "general" | "serie" | "ecole";
type Player = { user_id: string; prenom: string | null; ecole: string | null; serie: string | null; avg_score: number; quiz_count: number };
type SchoolStat = { ecole: string; avg_score: number; count: number };

function scoreColor(pct: number) {
  if (pct >= 70) return A;
  if (pct >= 45) return "#FFB800";
  return "#FF5B79";
}

const PODIUM_SIZES = [56, 80, 44]; // 2nd, 1st, 3rd heights (px)

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

      const { data: stu } = await supabase.from("prep_students").select("serie, ecole, exam_type").eq("user_id", user.id).maybeSingle();
      const serie = stu?.serie ?? ""; const ecole = stu?.ecole ?? ""; const examType = stu?.exam_type ?? "BAC";
      setMySerie(serie); setMyEcole(ecole); setMyExamType(examType);

      const { data: results } = await supabase.from("quiz_results").select("user_id, score, total");
      if (!results?.length) { setLoading(false); return; }

      const byUser: Record<string, number[]> = {};
      for (const r of results) {
        if (!byUser[r.user_id]) byUser[r.user_id] = [];
        byUser[r.user_id].push(Math.round((r.score / r.total) * 100));
      }
      const uids = Object.keys(byUser);
      const { data: students } = await supabase.from("prep_students").select("user_id, prenom, ecole, serie, exam_type").in("user_id", uids);
      const stuMap: Record<string, { prenom: string | null; ecole: string | null; serie: string | null; exam_type: string }> = {};
      for (const s of students ?? []) stuMap[s.user_id] = { prenom: s.prenom, ecole: s.ecole, serie: s.serie, exam_type: s.exam_type ?? "BAC" };

      const players: Player[] = uids
        .filter(uid => (stuMap[uid]?.exam_type ?? "BAC") === examType)
        .map(uid => ({
          user_id: uid, prenom: stuMap[uid]?.prenom ?? "Élève",
          ecole: stuMap[uid]?.ecole ?? null, serie: stuMap[uid]?.serie ?? null,
          avg_score: Math.round(byUser[uid].reduce((a, b) => a + b, 0) / byUser[uid].length),
          quiz_count: byUser[uid].length,
        })).sort((a, b) => b.avg_score - a.avg_score);

      setGeneral(players.slice(0, 10));
      const myIdx = players.findIndex(p => p.user_id === user.id);
      setMyRank(myIdx >= 0 ? myIdx + 1 : null);
      if (serie) setBySerie(players.filter(p => p.serie === serie).slice(0, 10));

      const ecoleMap: Record<string, number[]> = {};
      for (const p of players) {
        if (p.ecole) { if (!ecoleMap[p.ecole]) ecoleMap[p.ecole] = []; ecoleMap[p.ecole].push(p.avg_score); }
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: A, borderTopColor: "transparent" }} />
    </div>
  );

  const list = tab === "general" ? general : bySerie;

  return (
    <main className="min-h-screen text-white pb-8" style={{ backgroundColor: "#0A0A0F" }}>

      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Classement {myExamType}</h1>
            <p className="text-xs font-medium" style={{ color: T2 }}>Inter-écoles · Sénégal</p>
          </div>
        </div>
        {myRank !== null && (
          <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5"
            style={{ backgroundColor: "rgba(0,201,167,0.08)", border: "1px solid rgba(0,201,167,0.15)" }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: A, fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <p className="text-sm font-semibold" style={{ color: T2 }}>Ton classement national :</p>
            <p className="font-black text-lg ml-auto" style={{ color: A }}>#{myRank}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
          {([
            { key: "general", label: "Général" },
            ...(myExamType !== "BFEM" ? [{ key: "serie", label: `Série ${mySerie || ""}` }] : []),
            { key: "ecole", label: "Écoles" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                backgroundColor: tab === t.key ? "rgba(0,201,167,0.12)" : "transparent",
                color: tab === t.key ? A : "#5A5A70",
                border: tab === t.key ? "1px solid rgba(0,201,167,0.2)" : "1px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-3">

        {tab !== "ecole" && (
          list.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <p className="text-3xl mb-3">🏆</p>
              <p className="font-bold text-white">Aucun résultat disponible</p>
              <p className="text-sm mt-1" style={{ color: T2 }}>Sois le premier à passer un quiz !</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-4" style={{ color: T2 }}>Top 3</p>
                <div className="flex items-end justify-center gap-3">
                  {([list[1], list[0], list[2]] as (Player | undefined)[]).map((p, idx) => {
                    const rank  = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                    const h     = PODIUM_SIZES[idx];
                    const medal = ["🥈", "🥇", "🥉"][idx];
                    const col   = rank === 1 ? A : rank === 2 ? "#C0C0C0" : "#CD7F32";
                    if (!p) return <div key={idx} className="flex-1" />;
                    const isMe  = p.user_id === myId;
                    return (
                      <div key={p.user_id} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xl">{medal}</span>
                        <p className="text-xs font-bold text-center truncate w-full leading-tight"
                          style={{ color: isMe ? A : "white" }}>
                          {p.prenom}{isMe ? " ★" : ""}
                        </p>
                        <p className="text-xs" style={{ color: T2 }}>{p.avg_score}%</p>
                        <div className="w-full rounded-t-xl flex items-end justify-center pb-1.5"
                          style={{ height: h, backgroundColor: `${col}25`, border: `1px solid ${col}40` }}>
                          <span className="font-black text-lg" style={{ color: col }}>{rank}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {list.slice(3).map((p, i) => {
                const isMe = p.user_id === myId;
                const col  = scoreColor(p.avg_score);
                return (
                  <div key={p.user_id} className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{
                      backgroundColor: isMe ? "rgba(0,201,167,0.06)" : C,
                      border: isMe ? "1px solid rgba(0,201,167,0.2)" : `1px solid ${B}`,
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)", color: T2 }}>
                      {i + 4}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: isMe ? A : "white" }}>
                        {p.prenom}{isMe ? " (toi)" : ""}
                      </p>
                      {p.ecole && <p className="text-xs truncate" style={{ color: "#5A5A70" }}>{p.ecole}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: "#5A5A70" }}>{p.quiz_count} quiz</span>
                      <span className="text-sm font-black px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${col}15`, color: col }}>{p.avg_score}%</span>
                    </div>
                  </div>
                );
              })}
            </>
          )
        )}

        {tab === "ecole" && (
          byEcole.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: C, border: `1px solid ${B}` }}>
              <p className="font-bold text-white">Aucune école classée</p>
              <p className="text-sm mt-1" style={{ color: T2 }}>Renseigne ton école dans le profil.</p>
            </div>
          ) : byEcole.map((s, i) => {
            const isMe = s.ecole === myEcole;
            const col  = scoreColor(s.avg_score);
            return (
              <div key={s.ecole} className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: isMe ? "rgba(0,201,167,0.06)" : C,
                  border: isMe ? "1px solid rgba(0,201,167,0.2)" : `1px solid ${B}`,
                }}>
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: isMe ? A : "white" }}>{s.ecole}</p>
                  <p className="text-xs" style={{ color: "#5A5A70" }}>{s.count} élève{s.count > 1 ? "s" : ""}</p>
                </div>
                <span className="text-sm font-black px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${col}15`, color: col }}>{s.avg_score}%</span>
              </div>
            );
          })
        )}

      </div>
    </main>
  );
}
