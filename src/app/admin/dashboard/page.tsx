"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "niangamadou530@gmail.com";
const MAX_PLACES  = 500;
const REFRESH_MS  = 30_000;

type Student = {
  user_id:    string;
  nom:        string;
  prenom:     string;
  ecole:      string | null;
  telephone:  string | null;
  inscrit_le: string;
  quiz:       number;
  flashcards: number;
  resumes:    number;
  coach:      number;
};

type Stats = {
  total:      number;
  last24h:    number;
  lastHour:   number;
  quiz:       number;
  flashcards: number;
  resumes:    number;
  coach:      number;
  quiz_today:       number;
  flashcards_today: number;
  resumes_today:    number;
  coach_today:      number;
  students:   Student[];
};

type ResetState = { userId: string; name: string; password: string; status: "idle" | "loading" | "done" | "error"; message: string };

function genPassword() {
  return "GSN" + Math.floor(100000 + Math.random() * 900000);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats]           = useState<Stats | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError]           = useState("");
  const [token, setToken]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [reset, setReset]           = useState<ResetState | null>(null);
  const [setupStatus, setSetupStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [setupMsg, setSetupMsg]     = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email !== ADMIN_EMAIL) { router.replace("/"); return; }
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);
    })();
  }, [router]);

  const fetchStats = useCallback(async (t: string) => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) { setError("Erreur de chargement"); return; }
      setStats(await res.json());
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("Connexion impossible");
    }
  }, []);

  useEffect(() => { if (token) fetchStats(token); }, [token, fetchStats]);
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchStats(token), REFRESH_MS);
    return () => clearInterval(id);
  }, [token, fetchStats]);

  async function handleLogout() {
    await supabase.auth.signOut();
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/");
  }

  function openReset(s: Student) {
    setReset({ userId: s.user_id, name: `${s.prenom} ${s.nom}`, password: genPassword(), status: "idle", message: "" });
  }

  async function setupTestAccounts() {
    if (!token) return;
    setSetupStatus("loading");
    try {
      const res = await fetch("/api/admin/setup-test-accounts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupStatus("error");
        setSetupMsg(data.error ?? "Erreur");
      } else {
        setSetupStatus("done");
        setSetupMsg(data.results?.map((r: {email: string; action?: string; error?: string}) => `${r.email}: ${r.action ?? r.error}`).join(" | ") ?? "OK");
      }
    } catch {
      setSetupStatus("error");
      setSetupMsg("Connexion impossible");
    }
  }

  async function confirmReset() {
    if (!reset || !token) return;
    setReset(r => r ? { ...r, status: "loading" } : r);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: reset.userId, newPassword: reset.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReset(r => r ? { ...r, status: "error", message: data.error ?? "Erreur" } : r);
      } else {
        setReset(r => r ? { ...r, status: "done" } : r);
      }
    } catch {
      setReset(r => r ? { ...r, status: "error", message: "Connexion impossible" } : r);
    }
  }

  const pct = stats ? Math.min(100, Math.round((stats.total / MAX_PLACES) * 100)) : 0;

  const filtered = (stats?.students ?? []).filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.nom       ?? "").toLowerCase().includes(q) ||
      (s.prenom    ?? "").toLowerCase().includes(q) ||
      (s.ecole     ?? "").toLowerCase().includes(q) ||
      (s.telephone ?? "").includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-surface text-on-surface p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary">GSN PREP</h1>
            <p className="text-sm text-on-surface-variant font-medium">Dashboard Admin</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {lastRefresh && (
              <span className="text-xs text-on-surface-variant">
                Màj : {lastRefresh.toLocaleTimeString("fr-FR")}
              </span>
            )}
            <div className="flex flex-col items-end gap-1">
              <button onClick={setupTestAccounts} disabled={setupStatus === "loading"}
                className="text-xs text-primary font-bold px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50">
                {setupStatus === "loading" ? "…" : "Créer comptes Yacine"}
              </button>
              {setupMsg && (
                <span className={`text-[10px] ${setupStatus === "error" ? "text-error" : "text-green-600"}`}>
                  {setupMsg}
                </span>
              )}
            </div>
            <button onClick={handleLogout}
              className="text-xs text-error font-bold px-3 py-1.5 rounded-lg border border-error/30 hover:bg-error/10 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 text-error rounded-xl px-4 py-3 text-sm font-medium">{error}</div>
        )}

        {!stats ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Inscrits */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Inscrits depuis le lancement
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total" value={stats.total} accent />
                <StatCard label="24 dernières h" value={stats.last24h} />
                <StatCard label="Dernière heure" value={stats.lastHour} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">Places occupées</span>
                  <span className="font-bold text-primary">{pct}%</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>{stats.total} inscrits</span>
                  <span>{MAX_PLACES} places</span>
                </div>
              </div>
            </section>

            {/* Utilisation — aujourd'hui */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Utilisation aujourd'hui
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <UsageRow icon="quiz"      label="Quiz"      value={stats.quiz_today} />
                <UsageRow icon="style"     label="Flashcards" value={stats.flashcards_today} />
                <UsageRow icon="summarize" label="Résumés"   value={stats.resumes_today} />
                <UsageRow icon="smart_toy" label="Coach"     value={stats.coach_today} />
              </div>
            </section>

            {/* Utilisation — total cumulé */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Utilisation totale — correspond à la somme du tableau
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <UsageRow icon="quiz"      label="Quiz"      value={stats.quiz} />
                <UsageRow icon="style"     label="Flashcards" value={stats.flashcards} />
                <UsageRow icon="summarize" label="Résumés"   value={stats.resumes} />
                <UsageRow icon="smart_toy" label="Coach"     value={stats.coach} />
              </div>
            </section>

            {/* Table élèves */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Élèves inscrits ({stats.students.length})
                </h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[16px]">search</span>
                  <input type="text" placeholder="Nom, téléphone…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 text-sm bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors w-52" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-outline-variant/20">
                      <th className="pb-3 pr-3 text-xs font-semibold text-on-surface-variant">Élève</th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-on-surface-variant">Identifiant</th>
                      <th className="pb-3 pr-3 text-xs font-semibold text-on-surface-variant">Inscrit le</th>
                      <th className="pb-3 pr-2 text-xs font-semibold text-on-surface-variant text-center">Quiz</th>
                      <th className="pb-3 pr-2 text-xs font-semibold text-on-surface-variant text-center">Flash.</th>
                      <th className="pb-3 pr-2 text-xs font-semibold text-on-surface-variant text-center">Résumés</th>
                      <th className="pb-3 pr-2 text-xs font-semibold text-on-surface-variant text-center">Coach</th>
                      <th className="pb-3 text-xs font-semibold text-on-surface-variant text-center">MdP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-on-surface-variant text-sm">
                          {search ? "Aucun résultat" : "Aucun élève inscrit"}
                        </td>
                      </tr>
                    ) : filtered.map((s, i) => (
                      <tr key={i} className="hover:bg-surface-container/50 transition-colors">
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-on-surface leading-tight">{s.prenom} {s.nom}</p>
                          {s.ecole && <p className="text-xs text-on-surface-variant truncate max-w-[130px]">{s.ecole}</p>}
                        </td>
                        <td className="py-3 pr-3">
                          {s.telephone ? (
                            <span className="text-xs font-mono bg-surface-container px-2 py-1 rounded-lg text-on-surface">
                              {s.telephone}
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">email</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-on-surface-variant text-xs whitespace-nowrap">
                          {new Date(s.inscrit_le).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 pr-2 text-center"><Badge value={s.quiz} color="blue" /></td>
                        <td className="py-3 pr-2 text-center"><Badge value={s.flashcards} color="purple" /></td>
                        <td className="py-3 pr-2 text-center"><Badge value={s.resumes} color="green" /></td>
                        <td className="py-3 pr-2 text-center"><Badge value={s.coach} color="orange" /></td>
                        <td className="py-3 text-center">
                          <button onClick={() => openReset(s)}
                            className="text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
                            title="Réinitialiser le mot de passe">
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-center text-xs text-on-surface-variant">
              Rafraîchissement automatique toutes les 30 secondes
            </p>
          </>
        )}
      </div>

      {/* Modal reset mot de passe */}
      {reset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-on-surface text-lg">Réinitialiser le mot de passe</h3>
            <p className="text-sm text-on-surface-variant">{reset.name}</p>

            {reset.status === "done" ? (
              <div className="space-y-3">
                <p className="text-sm text-on-surface">Nouveau mot de passe :</p>
                <div className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-3">
                  <span className="font-mono font-bold text-primary text-lg flex-1">{reset.password}</span>
                  <button onClick={() => navigator.clipboard.writeText(reset.password)}
                    className="text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant">Communique ce mot de passe à l'élève.</p>
                <button onClick={() => setReset(null)}
                  className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl">
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">Mot de passe temporaire</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reset.password}
                      onChange={e => setReset(r => r ? { ...r, password: e.target.value } : r)}
                      className="flex-1 font-mono bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2.5 text-on-surface outline-none focus:border-primary"
                    />
                    <button onClick={() => setReset(r => r ? { ...r, password: genPassword() } : r)}
                      className="p-2.5 bg-surface-container rounded-xl text-outline hover:text-primary transition-colors"
                      title="Regénérer">
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
                  </div>
                </div>

                {reset.status === "error" && (
                  <p className="text-xs text-error">{reset.message}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setReset(null)}
                    className="flex-1 py-3 border border-outline-variant/30 text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-colors">
                    Annuler
                  </button>
                  <button onClick={confirmReset} disabled={reset.status === "loading"}
                    className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl disabled:opacity-50 transition-opacity">
                    {reset.status === "loading" ? "…" : "Confirmer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center ${accent ? "bg-primary/10" : "bg-surface-container"}`}>
      <p className={`text-3xl font-extrabold ${accent ? "text-primary" : "text-on-surface"}`}>
        {value.toLocaleString("fr-FR")}
      </p>
      <p className="text-xs text-on-surface-variant mt-1 font-medium">{label}</p>
    </div>
  );
}

function UsageRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3">
      <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-on-surface-variant truncate">{label}</p>
        <p className="text-lg font-bold text-on-surface">{value.toLocaleString("fr-FR")}</p>
      </div>
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  green:  "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
};

function Badge({ value, color }: { value: number; color: string }) {
  if (value === 0) return <span className="text-outline text-xs">—</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${BADGE_COLORS[color]}`}>
      {value}
    </span>
  );
}
