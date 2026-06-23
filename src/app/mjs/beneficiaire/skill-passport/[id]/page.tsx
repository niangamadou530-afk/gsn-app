"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NIVEAU_LABEL } from "../../parcours/types";

type PassportData = {
  delivre_le: string;
  parcours: {
    titre: string;
    niveau: string | null;
    mjs_secteurs: { nom: string } | null;
  } | null;
  beneficiaire: { prenom: string; nom: string } | null;
};

export default function SkillPassportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/mjs/beneficiaire/connexion"); return; }

    const [{ data: passport }, { data: ben }] = await Promise.all([
      supabase
        .from("mjs_skill_passports")
        .select("delivre_le, mjs_parcours ( titre, niveau, mjs_secteurs ( nom ) )")
        .eq("user_id", user.id)
        .eq("parcours_id", id)
        .eq("tenant_id", "mjs")
        .maybeSingle(),
      supabase
        .from("mjs_beneficiaires")
        .select("prenom, nom")
        .eq("user_id", user.id)
        .eq("tenant_id", "mjs")
        .maybeSingle(),
    ]);

    if (!passport) {
      router.push(`/mjs/beneficiaire/parcours/${id}`);
      return;
    }

    setData({
      delivre_le: passport.delivre_le,
      parcours: passport.mjs_parcours as PassportData["parcours"],
      beneficiaire: ben,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!data) return null;

  const date = new Date(data.delivre_le).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-24">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur border-b border-outline-variant/10 flex justify-between items-center px-6 py-4">
        <button onClick={() => router.push("/mjs/beneficiaire/dashboard")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <span className="text-base font-bold text-primary">Skill Passport</span>
        <div className="w-10" />
      </header>

      <div className="pt-24 px-6 max-w-md mx-auto">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 text-on-primary shadow-xl shadow-primary/25 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">MJS · PNACIJ</p>
          </div>

          <div>
            <p className="text-sm opacity-90">Certifie que</p>
            <h1 className="text-2xl font-extrabold mt-1">
              {data.beneficiaire?.prenom} {data.beneficiaire?.nom}
            </h1>
          </div>

          <div className="border-t border-white/20 pt-4 space-y-2">
            <p className="text-sm opacity-90">a validé le parcours</p>
            <p className="text-xl font-bold">{data.parcours?.titre}</p>
            <p className="text-sm opacity-80">
              {data.parcours?.mjs_secteurs?.nom}
              {data.parcours?.niveau && ` · ${NIVEAU_LABEL[data.parcours.niveau] ?? data.parcours.niveau}`}
            </p>
          </div>

          <p className="text-xs opacity-70">Délivré le {date}</p>
        </div>

        <button
          onClick={() => router.push(`/mjs/beneficiaire/parcours/${id}`)}
          className="w-full mt-6 py-3.5 border-2 border-outline-variant text-on-surface-variant rounded-xl font-bold text-sm hover:bg-surface-container transition-colors"
        >
          Retour au parcours
        </button>
      </div>
    </main>
  );
}
