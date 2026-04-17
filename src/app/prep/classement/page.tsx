"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "general" | "serie" | "ecole";
type Player = { user_id: string; prenom: string | null; ecole: string | null; serie: string | null; avg_score: number; quiz_count: number };
type SchoolStat = { ecole: string; avg_score: number; count: number };

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL = ["🥇", "🥈", "🥉"];

function ScoreBadge({ pct }: { pct: number }) {
  const bg   = pct >= 70 ? "#dcfce7" : pct >= 45 ? "#fef9c3" : "#fee2e2";
  const text = pct >= 70 ? "#15803d" : pct >= 45 ? "#854d0e" : "#991b1b";
  return <span className="text-sm font-black px-3 py-1 rounded-full" style={{ backgroundColor: bg, color: text }}>{pct}%</span>;
}

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
      const serie    = stu?.serie ?? "";
      const ecole    = stu?.ecole ?? "";
      const examType = stu?.exam_type ?? "BAC";
      setMySerie(serie); setMyEcole(ecole); setMyExamType(examType);

      const { data: results } = await supabase.from("quiz_results").select("user_id, score, total");
      if (!results || results.length === 0) { setLoading(false); return; }

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
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
    </div>
  );

  const list = tab === "general" ? general : bySerie;

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-8">

      {/* Header */}
      <div className="px-6 pt-8 pb-5 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)" }}>
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #FFD700, transparent)" }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg,#FFD700,#f97316)" }}>🏆</div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Classement {myExamType}</h1>
            <p className="text-white/50 text-xs font-medium">Inter-écoles · Sénégal</p>
          </div>
        </div>

        {/* Mon rang */}
        {myRank !== null && (
          <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-4 py-2.5 relative z-10">
            <span className="material-symbols-outlined text-white/70 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <p className="text-white/80 text-sm font-semibold">Ton classement national :</p>
            <p className="text-white font-black text-lg ml-auto">#{myRank}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1">
          {([
            { key: "general", label: "Général" },
            ...(myExamType !== "BFEM" ? [{ key: "serie", label: `Série ${mySerie || ""}` }] : []),
            { key: "ecole", label: "Écoles" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === t.key ? "text-primary shadow-sm" : "text-on-surface-variant"}`}
              style={tab === t.key ? { backgroundColor: "white" } : {}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {tab !== "ecole" && (
          list.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-bold text-on-surface">Aucun résultat disponible</p>
              <p className="text-sm text-on-surface-variant mt-1">Sois le premier à passer un quiz !</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center mb-4">Top 3</p>
                <div className="flex items-end justify-center gap-3">
                  {([list[1], list[0], list[2]] as (Player | undefined)[]).map((p, idx) => {
                    const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                    const colH = rank === 1 ? 80 : rank === 2 ? 56 : 44;
                    const color = MEDAL_COLORS[rank - 1];
                    if (!p) return <div key={idx} className="flex-1" />;
                    const isMe = p.user_id === myId;
                    return (
                      <div key={p.user_id} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-xl">{MEDAL[rank - 1]}</span>
                        <p className={`text-xs font-bold text-center truncate w-full leading-tight ${isMe ? "text-primary" : "text-on-surface"}`}>
                          {p.prenom}{isMe ? " ★" : ""}
                        </p>
                        <p className="text-xs text-on-surface-variant">{p.avg_score}%</p>
                        <div className="w-full rounded-t-xl flex items-end justify-center pb-2"
                          style={{ height: colH, backgroundColor: color, opacity: 0.9 }}>
                          <span className="text-white font-black text-lg">{rank}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {list.slice(3).map((p, i) => {
                const isMe = p.user_id === myId;
                return (
                  <div key={p.user_id}
                    className="flex items-center gap-3 p-3.5 rounded-xl shadow-sm"
                    style={{
                      backgroundColor: isMe ? "#fff7ed" : "var(--color-surface-container-lowest)",
                      borderLeft: isMe ? "3px solid #FF6B00" : "3px solid transparent",
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black bg-surface-container text-on-surface-variant flex-shrink-0">
                      #{i + 4}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isMe ? "text-primary" : "text-on-surface"}`}>
                        {p.prenom}{isMe ? " (toi)" : ""}
                      </p>
                      {p.ecole && <p className="text-xs text-on-surface-variant truncate">{p.ecole}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-on-surface-variant">{p.quiz_count} quiz</span>
                      <ScoreBadge pct={p.avg_score} />
                    </div>
                  </div>
                );
              })}
            </>
          )
        )}

        {tab === "ecole" && (
          byEcole.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <p className="font-bold text-on-surface">Aucune école classée</p>
              <p className="text-sm text-on-surface-variant mt-1">Renseigne ton école dans le profil.</p>
            </div>
          ) : byEcole.map((s, i) => {
            const isMySchool = s.ecole === myEcole;
            return (
              <div key={s.ecole}
                className="flex items-center gap-3 p-4 rounded-xl shadow-sm"
                style={{
                  backgroundColor: isMySchool ? "#fff7ed" : "var(--color-surface-container-lowest)",
                  borderLeft: isMySchool ? "3px solid #FF6B00" : "3px solid transparent",
                }}>
                <span className="text-xl w-8 text-center flex-shrink-0">{i < 3 ? MEDAL[i] : `#${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-sm ${isMySchool ? "text-primary" : "text-on-surface"}`}>{s.ecole}</p>
                  <p className="text-xs text-on-surface-variant">{s.count} élève{s.count > 1 ? "s" : ""}</p>
                </div>
                <ScoreBadge pct={s.avg_score} />
              </div>
            );
          })
        )}

      </div>
    </main>
  );
}
