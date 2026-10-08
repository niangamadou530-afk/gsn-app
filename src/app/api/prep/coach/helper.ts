/**
 * GARDE-FOU DE CONFIDENTIALITÉ PREP :
 * Ces fonctions et routes sont STRICTEMENT RÉSERVÉES À L'ÉLÈVE AUTHENTIFIÉ.
 * L'identifiant de l'élève provient EXCLUSIVEMENT de son jeton de session validé,
 * JAMAIS d'un paramètre de requête. Aucune donnée d'historique (conversations, messages,
 * fichiers) n'est jamais exposée aux parents ni à des tiers.
 * Aucun contenu de message n'est journalisé dans les logs serveur.
 */

import { createClient } from "@supabase/supabase-js";
import { PREP_COACH_CONFIG } from "@/lib/prep-config";

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function getAuthenticatedStudent(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { user: null, userId: null, token: null, error: "Non authentifié" };
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return { user: null, userId: null, token: null, error: "Session invalide ou expirée" };
  }

  return { user, userId: user.id, token, error: null };
}

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    (typeof error.message === "string" &&
      /relation.*does not exist|could not find the table|schema cache/i.test(error.message))
  );
}

/**
 * Purge opportuniste : supprime les conversations de cet élève inactives depuis plus de PREP_COACH_RETENTION_DAYS jours
 */
export async function purgeExpiredCoachData(userId: string) {
  try {
    const sb = getServiceSupabase();
    if (!sb) return;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - PREP_COACH_CONFIG.retentionDays);
    const cutoffIso = cutoffDate.toISOString();

    // Trouver les conversations expirées de l'élève
    const { data: expiredConvs, error: findErr } = await sb
      .from("prep_coach_conversations")
      .select("id")
      .eq("user_id", userId)
      .lt("updated_at", cutoffIso);

    if (findErr || !expiredConvs || expiredConvs.length === 0) return;

    const convIds = expiredConvs.map(c => c.id);

    // Suppression ordonnée (fichiers, messages, conversations)
    await sb.from("prep_coach_files").delete().in("conversation_id", convIds);
    await sb.from("prep_coach_messages").delete().in("conversation_id", convIds);
    await sb.from("prep_coach_conversations").delete().in("id", convIds);
  } catch {
    // Purge opportuniste silencieuse
  }
}
