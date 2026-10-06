import { createClient } from "@supabase/supabase-js";
import { PREP_DAILY_QUOTAS, PrepUsageField } from "./prep-config";

export type UsageField = PrepUsageField;

export const DAILY_LIMITS = PREP_DAILY_QUOTAS;

export function limitMessage(field: UsageField): string {
  const lim = DAILY_LIMITS[field];
  switch (field) {
    case "quiz_count":
      return `Tu as bien travaillé aujourd'hui ! Tu as atteint ton quota quotidien de quiz IA (${lim}/${lim}). Le Coach IA, les annales et les flashcards restent à ta disposition. Reviens demain pour de nouveaux quiz !`;
    case "flashcards_count":
      return `Super séance de mémorisation ! Tu as atteint ton quota quotidien de flashcards (${lim}/${lim}). Tu peux continuer à t'exercer avec les annales et le Coach IA. À demain pour de nouvelles fiches !`;
    case "resume_count":
      return `Beau travail de synthèse ! Tu as atteint ta limite de résumés de cours pour aujourd'hui (${lim}/${lim}). Continue de tester tes connaissances avec les quiz et les épreuves réelles.`;
    case "coach_count":
      return `Tu as posé de très bonnes questions aujourd'hui ! Ton quota de messages au Coach IA (${lim}/${lim}) est atteint pour cette journée. Révise tes annales et exercices corrigés en attendant la recharge demain.`;
  }
}

function sbWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// Client administratif avec service role : seules les routes serveur peuvent insérer/incrémenter les quotas
function sbAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export type UsageCheck =
  | { allowed: false; reason: "auth" | "limit" }
  | { allowed: true; userId: string; current: number; rowExists: boolean };

export async function checkUsage(token: string, field: UsageField): Promise<UsageCheck> {
  if (!token) return { allowed: false, reason: "auth" };

  try {
    const sb = sbWithToken(token);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { allowed: false, reason: "auth" };

    // Comptes illimités (stagiaires / testeurs)
    const { data: studentRow } = await sb
      .from("prep_students")
      .select("unlimited")
      .eq("user_id", user.id)
      .maybeSingle();
    if (studentRow?.unlimited === true) {
      return { allowed: true, userId: user.id, current: 0, rowExists: false };
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: row } = await sb
      .from("prep_usage_quotidien")
      .select(field)
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const current = ((row as Record<string, number> | null)?.[field] ?? 0);
    if (current >= DAILY_LIMITS[field]) return { allowed: false, reason: "limit" };

    return { allowed: true, userId: user.id, current, rowExists: !!row };
  } catch {
    // Si la table n'est pas encore créée dans Supabase, ne pas bloquer l'élève
    return { allowed: true, userId: "", current: 0, rowExists: false };
  }
}

export async function incrementUsage(
  _token: string,
  userId: string,
  field: UsageField,
  current: number,
  rowExists: boolean,
): Promise<void> {
  if (!userId) return;
  try {
    // Utilisation stricte de la clé service role côté serveur (aucun droit d'écriture accordé au navigateur)
    const sb = sbAdmin();
    const today = new Date().toISOString().slice(0, 10);

    if (!rowExists) {
      await sb.from("prep_usage_quotidien").insert({
        user_id: userId,
        date: today,
        [field]: 1,
      });
    } else {
      await sb
        .from("prep_usage_quotidien")
        .update({ [field]: current + 1 })
        .eq("user_id", userId)
        .eq("date", today);
    }
  } catch (err) {
    console.warn("Notice incrementUsage (table prep_usage_quotidien en attente de migration):", err);
  }
}
