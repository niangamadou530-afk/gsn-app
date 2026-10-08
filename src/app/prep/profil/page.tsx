"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";

export default function StudentProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    name: string;
    exam_type: string;
    serie: string | null;
    ecole: string | null;
    phone: string | null;
  } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login?source=prep");
        return;
      }

      setUser({ id: session.user.id, email: session.user.email });

      const [{ data: userRow }, { data: studentRow }] = await Promise.all([
        supabase.from("users").select("name, phone").eq("id", session.user.id).maybeSingle(),
        supabase.from("prep_students").select("exam_type, serie, ecole").eq("user_id", session.user.id).maybeSingle(),
      ]);

      setStudentInfo({
        name: userRow?.name || "Élève GSN",
        phone: userRow?.phone || null,
        exam_type: studentRow?.exam_type || "BAC",
        serie: studentRow?.serie || "S2",
        ecole: studentRow?.ecole || null,
      });

      setLoading(false);
    }

    loadData();
  }, [router]);

  async function handleDeleteAccount() {
    setError("");
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setDeleting(false);
        return;
      }

      const res = await fetch("/api/prep/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || "Ta demande n'a pas pu être terminée, réessaie ou contacte le support");
        setDeleting(false);
        return;
      }

      // Nettoyer la session locale uniquement si suppression complète confirmée
      await supabase.auth.signOut();
      try {
        localStorage.clear();
      } catch {}

      router.push("/prep?deleted=1");
    } catch (err: unknown) {
      setError("Ta demande n'a pas pu être terminée, réessaie ou contacte le support");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 text-sm">
        Chargement de ton profil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/prep/dashboard"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
              title="Retour au tableau de bord"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900">Mon Profil Élève</h1>
              <p className="text-xs text-slate-500">Paramètres et gestion de compte</p>
            </div>
          </div>
          <Link
            href="/prep/dashboard"
            className="text-xs font-bold text-[#005bbf] hover:underline"
          >
            Tableau de bord
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#005bbf] to-[#1a73e8] text-white flex items-center justify-center font-black text-lg shadow-sm">
              {studentInfo?.name?.charAt(0).toUpperCase() || "E"}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{studentInfo?.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00]">
                  {studentInfo?.exam_type} 2027
                </span>
                {studentInfo?.serie && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#005bbf]">
                    Série {studentInfo.serie}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-semibold">Téléphone enregistré</span>
              <span className="font-bold text-slate-800">{studentInfo?.phone || "Non renseigné"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-semibold">Établissement scolaire</span>
              <span className="font-bold text-slate-800">{studentInfo?.ecole || "Non spécifié"}</span>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
            <Link href="/privacy" className="hover:text-[#005bbf] underline">
              Politique de confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[#005bbf] underline">
              Conditions d&apos;utilisation (CGU)
            </Link>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="bg-white rounded-3xl p-6 border-2 border-rose-200 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">delete_forever</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                Zone de suppression définitive
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Conformément à la Loi sénégalaise n° 2008-12, tu peux demander à tout moment la suppression intégrale et irréversible de ton compte et de toutes tes données scolaires associées.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            <span>Supprimer mon compte et mes données</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                Confirmer la suppression définitive
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Cette action est <strong>irréversible</strong>. En confirmant :
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>Ton compte et tes identifiants seront définitivement effacés de la plateforme.</li>
                <li>Tous tes scores de quiz, tes fiches et cartes de révision, tes résumés et ton niveau seront supprimés.</li>
                <li>Ton code d&apos;accès Espace Parents et l&apos;adresse de suivi familial seront révoqués.</li>
                <li>Tes compteurs d&apos;utilisation quotidienne et les données associées seront effacés.</li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold text-slate-700" htmlFor="delete-confirm">
                Pour confirmer, tape <strong className="text-rose-700 font-black">SUPPRIMER</strong> ci-dessous :
              </label>
              <input
                id="delete-confirm"
                type="text"
                placeholder="SUPPRIMER"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              />
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">error</span>
                  <p className="font-semibold leading-relaxed">
                    {error}
                  </p>
                </div>
                <div className="pt-1 border-t border-rose-200/60">
                  <a
                    href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl("Bonjour, ma demande de suppression de compte GSN PREP n'a pas pu être terminée.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-rose-900 underline hover:text-rose-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>Contacter le support WhatsApp ({PREP_WHATSAPP_SUPPORT.phoneFormatted})</span>
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                  setError("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim() !== "SUPPRIMER" || deleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <span>Suppression en cours...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
