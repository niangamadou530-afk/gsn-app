"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminResetElevePage() {
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    studentName: string;
    studentPhone: string;
    temporaryPassword: string;
    resetsToday: number;
    maxResetsPerDay: number;
    whatsappMessage: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        setCheckingAuth(false);
        setAdminUser(null);
        setToken(null);
        return;
      }

      try {
        const res = await fetch("/api/admin/verify", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setAdminUser(data.email || session.user.email || "Admin");
          setToken(accessToken);
        } else {
          setAdminUser(null);
          setToken(null);
        }
      } catch {
        setAdminUser(null);
        setToken(null);
      } finally {
        setCheckingAuth(false);
      }
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setCopied(false);

    if (!phone.trim()) {
      setError("Veuillez saisir un numéro de téléphone sénégalais.");
      return;
    }

    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter en tant qu'administrateur.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la réinitialisation.");
        setLoading(false);
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500 text-sm">
        Vérification de la session administrateur...
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <span className="material-symbols-outlined text-rose-500 text-4xl">lock</span>
          <h1 className="text-lg font-bold text-slate-900">Espace Administrateur Réservé</h1>
          <p className="text-xs text-slate-600">
            Cette interface de support est strictement réservée à l&apos;administrateur GSN.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-[#005bbf] text-white rounded-xl font-bold text-xs"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#005bbf] text-white flex items-center justify-center text-xs font-black">
              GSN
            </span>
            <div>
              <h1 className="text-base font-extrabold text-slate-900">Support Élève · Réinitialisation</h1>
              <p className="text-[11px] text-slate-500">Connecté : {adminUser}</p>
            </div>
          </div>
          <Link
            href="/prep"
            className="text-xs text-[#005bbf] font-bold hover:underline"
          >
            Retour PREP
          </Link>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900">
              Générer un mot de passe temporaire pour un élève
            </h2>
            <p className="text-xs text-slate-600">
              Saisissez le numéro WhatsApp de l&apos;élève qui vous a contacté. Le système trouvera son compte et créera un mot de passe temporaire à lui transmettre.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700" htmlFor="phone">
                Numéro de téléphone de l&apos;élève (+221)
              </label>
              <input
                id="phone"
                type="text"
                placeholder="ex : 77 123 45 67 ou +221 77 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-[#005bbf] outline-none font-medium"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#005bbf] hover:bg-[#004ca3] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Recherche et génération...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">key</span>
                  <span>Générer le mot de passe temporaire</span>
                </>
              )}
            </button>
          </form>

          {/* Result Card */}
          {result && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  <span>Mot de passe généré avec succès !</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {result.resetsToday}/{result.maxResetsPerDay} réinitialisations aujourd&apos;hui
                </span>
              </div>

              <div className="bg-white rounded-xl p-3 border border-emerald-100 space-y-1.5">
                <p className="text-xs text-slate-600">
                  Élève : <strong className="text-slate-900">{result.studentName}</strong> ({result.studentPhone})
                </p>
                <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg font-mono text-sm font-black text-slate-900">
                  <span>{result.temporaryPassword}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.temporaryPassword)}
                    className="text-xs text-[#005bbf] font-bold hover:underline"
                  >
                    Copier le code
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.whatsappMessage)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copied ? "done" : "content_copy"}
                  </span>
                  <span>{copied ? "Message copié !" : "Copier le message complet"}</span>
                </button>

                <a
                  href={`https://wa.me/${result.studentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(result.whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Envoyer par WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-[11px] text-slate-500 text-center space-y-1">
          <p>Chaque action est journalisée avec l&apos;adresse email de l&apos;administrateur et l&apos;horodatage.</p>
          <p>Limite de sécurité : 3 réinitialisations maximum par compte d&apos;élève et par tranche de 24h.</p>
        </div>
      </div>
    </div>
  );
}
