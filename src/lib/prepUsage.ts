import { createClient } from "@supabase/supabase-js";

export type UsageField = "quiz_count" | "flashcards_count" | "resume_count" | "coach_count";

const DAILY_LIMITS: Record<UsageField, number> = {
  quiz_count: 5,
  flashcards_count: 5,
  resume_count: 3,
  coach_count: 15,
};

export const LIMIT_MESSAGE =
  "Tu as atteint ta limite du jour pour cette fonctionnalité. Reviens demain pour continuer à réviser.";

function sbWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export type UsageCheck =
  | { allowed: false; reason: "auth" | "limit" }
  | { allowed: true; userId: string; current: number; rowExists: boolean };

export async function checkUsage(token: string, field: UsageField): Promise<UsageCheck> {
  if (!token) return { allowed: false, reason: "auth" };

  const sb = sbWithToken(token);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { allowed: false, reason: "auth" };

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
}

export async function incrementUsage(
  token: string,
  userId: string,
  field: UsageField,
  current: number,
  rowExists: boolean,
): Promise<void> {
  const sb = sbWithToken(token);
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
}
