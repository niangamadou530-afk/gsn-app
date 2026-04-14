"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PlayerStat = {
  user_id: string;
  display_name: string | null;
  total_xp: number;
  current_level: string;
  best_streak: number;
  school: string | null;
  classe: string | null;
  serie: string | null;
};

const LEVEL_EMOJI: Record<string, string> = {
  "Novice": "🌱", "Apprenti": "📚", "Confirmé": "⭐",
  "Expert": "🔥", "Brillant": "💎", "Maître BAC": "👑",
};

export default function ClassementPage() {
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [myStats, setMyStats] = useState<PlayerStat | null>(null);
  const [top, setTop] = useState<PlayerStat[]>([]);
  const [filter, setFilter] = useState<"national" | "serie">("national");
  const [mySerie, setMySerie] = useState("");
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState("");
  const [classe, setClasse] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setMyId(user.id);

      const [{ data: statsData }, { data: stuData }] = await Promise.all([
        supabase.from("prep_player_stats").select("*").order("total_xp", { ascending: false }).limit(50),
        supabase.from("prep_students").select("serie, school, classe").eq("user_id", user.id).limit(1),
      ]);

      const allStats = (statsData ?? []) as PlayerStat[];
      setTop(allStats);
      const mine = allStats.find(s => s.user_id === user.id) ?? null;
      setMyStats(mine);
      setMySerie(stuData?.[0]?.serie ?? "");
      setSchool(mine?.school ?? stuData?.[0]?.school ?? "");
      setClasse(mine?.classe ?? stuData?.[0]?.classe ?? "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function saveProfile() {
    if (!myId) return;
    setSaving(true);
    await supabase.from("prep_player_stats").upsert({ user_id: myId, school, classe }, { onConflict: "user_id" });
    await supabase.from("prep_students").update({ school, classe }).eq("user_id", myId);
    setSaving(false);
    alert("Profil mis à jour !");
  }

  const displayed = filter === "serie" && mySerie
    ? top.filter(s => s.serie === mySerie)
    : top;

  const myRank = displayed.findIndex(s => s.user_id === myId) + 1;

  function medalColor(rank: number) {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-on-surface-variant";
  }

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
        <div>
          <p className="text-xs text-on-surface-variant font-medium">GSN PREP</p>
          <p className="font-bold text-on-surface">Classement Sénégal</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-5">

        {/* Ma position */}
        {myStats ? (
          <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-semibold">Ma position</p>
                <p className="text-3xl font-black">#{myRank || "—"}</p>
                <p className="text-white/90 text-sm font-semibold mt-0.5">
                  {LEVEL_EMOJI[myStats.current_level] ?? "🌱"} {myStats.current_level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs font-semibold">XP total</p>
                <p className="text-3xl font-black">{myStats.total_xp}</p>
                <p className="text-white/70 text-xs mt-0.5">Streak max : {myStats.best_streak}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-5 bg-surface-container-lowest shadow-sm text-center space-y-2">
            <span className="material-symbols-outlined text-[40px] text-outline-variant">emoji_events</span>
            <p className="font-bold text-on-surface">Passe un examen pour apparaître au classement !</p>
            <Link href="/prep/simulateur" className="inline-block mt-2 px-5 py-2 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: "#FF6B00" }}>
              Jouer maintenant
            </Link>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {(["national", "serie"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === f ? "text-white" : "bg-surface-container-lowest text-on-surface-variant"}`}
              style={filter === f ? { backgroundColor: "#FF6B00" } : {}}>
              {f === "national" ? "🇸🇳 National" : `Série ${mySerie || "—"}`}
            </button>
          ))}
        </div>

        {/* Top players */}
        <div className="space-y-2">
          {displayed.slice(0, 20).map((player, idx) => {
            const rank = idx + 1;
            const isMe = player.user_id === myId;
            return (
              <div key={player.user_id}
                className={`flex items-center gap-3 rounded-xl p-3 shadow-sm transition-all ${isMe ? "border-2 border-primary bg-primary/5" : "bg-surface-container-lowest"}`}>
                <div className="w-8 text-center">
                  {rank <= 3
                    ? <span className={`material-symbols-outlined ${medalColor(rank)}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {rank === 1 ? "military_tech" : "workspace_premium"}
                      </span>
                    : <span className="text-sm font-black text-on-surface-variant">#{rank}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-on-surface truncate">
                    {isMe ? "👤 Moi" : (player.display_name ?? "Joueur anonyme")}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {LEVEL_EMOJI[player.current_level] ?? "🌱"} {player.current_level}
                    {player.school ? ` · ${player.school}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{player.total_xp} XP</p>
                  <p className="text-[10px] text-on-surface-variant">🔥 {player.best_streak}</p>
                </div>
              </div>
            );
          })}
          {displayed.length === 0 && (
            <div className="text-center py-10">
              <p className="text-on-surface-variant font-medium">Aucun joueur dans cette catégorie.</p>
            </div>
          )}
        </div>

        {/* Mon école / classe */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
          <p className="font-bold text-on-surface text-sm">Mon profil compétition</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Mon école</label>
              <input
                type="text" placeholder="Ex: Lycée Cheikh Anta Diop"
                value={school} onChange={e => setSchool(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Ma classe</label>
              <input
                type="text" placeholder="Ex: Term S1 A"
                value={classe} onChange={e => setClasse(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: "#FF6B00" }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>

      </div>
    </main>
  );
}
