import { supabase } from "@/lib/supabase";
import { buildParcoursPrompt, parseModulesJson } from "@/lib/mjs-parcours-utils";
import type { ModuleContenu, ParcoursDetail } from "./types";

export async function inscrireParcoursClient(userId: string, parcoursId: string) {
  // Check if already enrolled in this exact course
  const { data: existingTarget } = await supabase
    .from("mjs_inscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("parcours_id", parcoursId)
    .eq("tenant_id", "mjs")
    .maybeSingle();

  if (!existingTarget) {
    // Fetch all current inscriptions
    const { data: allInsc, error: inscFetchError } = await supabase
      .from("mjs_inscriptions")
      .select("parcours_id")
      .eq("user_id", userId)
      .eq("tenant_id", "mjs");

    if (inscFetchError) throw inscFetchError;

    if (allInsc && allInsc.length > 0) {
      // Fetch all delivered passports (completed courses)
      const { data: allPassports, error: passFetchError } = await supabase
        .from("mjs_skill_passports")
        .select("parcours_id")
        .eq("user_id", userId)
        .eq("tenant_id", "mjs");

      if (passFetchError) throw passFetchError;

      const certSet = new Set((allPassports ?? []).map((p) => p.parcours_id));
      const activeParcours = allInsc.find((i) => !certSet.has(i.parcours_id));

      if (activeParcours) {
        throw new Error("Vous suivez déjà un parcours actif. Vous devez l'abandonner ou le terminer avant de vous inscrire à un autre.");
      }
    }
  }

  const { error: inscError } = await supabase
    .from("mjs_inscriptions")
    .upsert(
      { user_id: userId, tenant_id: "mjs", parcours_id: parcoursId },
      { onConflict: "user_id,parcours_id" }
    );
  if (inscError) throw inscError;

  const { error: progError } = await supabase
    .from("mjs_progression")
    .upsert(
      {
        user_id: userId,
        tenant_id: "mjs",
        parcours_id: parcoursId,
        modules_faits: 0,
        pourcentage: 0,
        modules_faits_ids: [],
      },
      { onConflict: "user_id,parcours_id" }
    );
  if (progError) throw progError;
}

export async function genererContenuClient(p: ParcoursDetail): Promise<ModuleContenu[]> {
  const prompt = buildParcoursPrompt({
    titre: p.titre,
    niveau: p.niveau,
    duree_semaines: p.duree_semaines,
    modules_total: p.modules_total,
    secteurNom: p.mjs_secteurs?.nom ?? "—",
  });

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur API IA");

  const modules = parseModulesJson(data.reply);

  const { error: updateError } = await supabase
    .from("mjs_parcours")
    .update({ modules_contenu: modules })
    .eq("id", p.id)
    .eq("tenant_id", "mjs");

  if (updateError) {
    throw new Error(
      "Impossible de sauvegarder le contenu généré. " +
      "Exécute le fichier src/db/mjs_rls_extra.sql dans l'éditeur SQL Supabase. " +
      `(${updateError.message})`
    );
  }

  return modules;
}

export async function inscrireEtGenererClient(
  userId: string,
  parcours: ParcoursDetail
): Promise<ModuleContenu[]> {
  await inscrireParcoursClient(userId, parcours.id);

  if (parcours.modules_contenu && parcours.modules_contenu.length > 0) {
    return parcours.modules_contenu;
  }

  return genererContenuClient(parcours);
}
