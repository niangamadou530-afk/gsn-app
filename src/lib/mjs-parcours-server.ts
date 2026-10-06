import Groq from "groq-sdk";
import { GROQ_MODELS } from "@/lib/groqModels";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { ModuleContenu } from "@/app/mjs/beneficiaire/parcours/types";
import { buildParcoursPrompt, parseModulesJson } from "@/lib/mjs-parcours-utils";

export async function ensureInscription(userId: string, parcoursId: string) {
  const admin = createSupabaseAdmin();

  // Check if already enrolled in this exact course
  const { data: existingTarget } = await admin
    .from("mjs_inscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("parcours_id", parcoursId)
    .eq("tenant_id", "mjs")
    .maybeSingle();

  if (!existingTarget) {
    // Fetch all current inscriptions
    const { data: allInsc, error: inscFetchError } = await admin
      .from("mjs_inscriptions")
      .select("parcours_id")
      .eq("user_id", userId)
      .eq("tenant_id", "mjs");

    if (inscFetchError) throw inscFetchError;

    if (allInsc && allInsc.length > 0) {
      // Fetch all delivered passports (completed courses)
      const { data: allPassports, error: passFetchError } = await admin
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

  const { error: inscError } = await admin
    .from("mjs_inscriptions")
    .upsert(
      { user_id: userId, tenant_id: "mjs", parcours_id: parcoursId },
      { onConflict: "user_id,parcours_id" }
    );
  if (inscError) throw inscError;

  const { error: progError } = await admin
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

export async function fetchParcours(parcoursId: string) {
  const admin = createSupabaseAdmin();
  const { data: parcours, error } = await admin
    .from("mjs_parcours")
    .select("id, titre, niveau, duree_semaines, modules_total, modules_contenu, mjs_secteurs ( nom )")
    .eq("id", parcoursId)
    .eq("tenant_id", "mjs")
    .single();

  if (error || !parcours) throw new Error("Parcours introuvable");
  return parcours;
}

export async function generateModulesForParcours(parcours: {
  id: string;
  titre: string;
  niveau: string | null;
  duree_semaines: number | null;
  modules_total: number;
  mjs_secteurs: { nom: string } | { nom: string }[] | null;
}): Promise<ModuleContenu[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY manquante");

  const secteur = parcours.mjs_secteurs;
  const secteurNom = Array.isArray(secteur) ? secteur[0]?.nom : secteur?.nom ?? "—";

  const prompt = buildParcoursPrompt({
    titre: parcours.titre,
    niveau: parcours.niveau,
    duree_semaines: parcours.duree_semaines,
    modules_total: parcours.modules_total,
    secteurNom,
  });

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans texte, sans markdown." },
      { role: "user", content: prompt },
    ],
    model: GROQ_MODELS.MJS_PARCOURS,
    max_tokens: 8000,
    temperature: 0.2,
  });

  const reply = completion.choices[0]?.message?.content ?? "";
  const modules = parseModulesJson(reply);

  const admin = createSupabaseAdmin();
  const { error: updateError } = await admin
    .from("mjs_parcours")
    .update({ modules_contenu: modules })
    .eq("id", parcours.id);

  if (updateError) throw updateError;
  return modules;
}

export async function getOrGenerateModules(userId: string, parcoursId: string): Promise<ModuleContenu[]> {
  await ensureInscription(userId, parcoursId);
  const parcours = await fetchParcours(parcoursId);
  const existing = parcours.modules_contenu as ModuleContenu[] | null;
  if (existing && existing.length > 0) return existing;
  return generateModulesForParcours(parcours);
}
