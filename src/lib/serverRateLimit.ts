import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Fallback en mémoire en cas de table non encore migrée sur Supabase
const memoryFallback = new Map<string, { count: number; firstAttempt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  attempts: number;
  maxAttempts: number;
  waitMinutes?: number;
}

/**
 * Vérifie et incrémente le compteur de tentatives persistant dans Supabase (table prep_rate_limits)
 * Fonctionne avec fenêtre glissante de 15 minutes, compatible avec le déploiement serverless (Vercel).
 */
export async function checkAndIncrementServerRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<RateLimitResult> {
  const normalizedKey = key.trim().toLowerCase();
  const now = new Date();
  const nowMs = now.getTime();
  const windowMs = windowMinutes * 60 * 1000;
  const cutoffTime = new Date(nowMs - windowMs).toISOString();

  try {
    const sb = getAdminClient();

    // 1. Lire l'enregistrement existant
    const { data: record, error: selectError } = await sb
      .from("prep_rate_limits")
      .select("target_identifier, attempt_count, first_attempt_at, last_attempt_at")
      .eq("target_identifier", normalizedKey)
      .maybeSingle();

    if (selectError && selectError.code === "42P01") {
      // Table prep_rate_limits n'existe pas encore -> Fallback mémoire sécurisé
      return handleMemoryFallback(normalizedKey, maxAttempts, windowMs, nowMs);
    }

    if (!record) {
      // Premier essai
      await sb.from("prep_rate_limits").insert({
        target_identifier: normalizedKey,
        attempt_count: 1,
        first_attempt_at: now.toISOString(),
        last_attempt_at: now.toISOString(),
      });
      return { allowed: true, attempts: 1, maxAttempts };
    }

    const firstAttemptMs = new Date(record.first_attempt_at).getTime();

    // 2. Si la fenêtre de 15 minutes est expirée, on réinitialise le compteur
    if (nowMs - firstAttemptMs > windowMs) {
      await sb
        .from("prep_rate_limits")
        .update({
          attempt_count: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
        })
        .eq("target_identifier", normalizedKey);

      return { allowed: true, attempts: 1, maxAttempts };
    }

    // 3. Fenêtre active : vérifier si le quota d'essais est dépassé
    if (record.attempt_count >= maxAttempts) {
      const remainingMs = windowMs - (nowMs - firstAttemptMs);
      const waitMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
      return {
        allowed: false,
        attempts: record.attempt_count,
        maxAttempts,
        waitMinutes,
      };
    }

    // 4. Incrémenter le compteur
    const newCount = record.attempt_count + 1;
    await sb
      .from("prep_rate_limits")
      .update({
        attempt_count: newCount,
        last_attempt_at: now.toISOString(),
      })
      .eq("target_identifier", normalizedKey);

    return { allowed: true, attempts: newCount, maxAttempts };
  } catch (err) {
    console.warn("Notice rate limit (utilisation fallback mémoire) :", err);
    return handleMemoryFallback(normalizedKey, maxAttempts, windowMs, nowMs);
  }
}

/**
 * Réinitialise le compteur après une authentification réussie
 */
export async function resetServerRateLimit(key: string): Promise<void> {
  const normalizedKey = key.trim().toLowerCase();
  try {
    const sb = getAdminClient();
    await sb.from("prep_rate_limits").delete().eq("target_identifier", normalizedKey);
    memoryFallback.delete(normalizedKey);
  } catch {
    memoryFallback.delete(normalizedKey);
  }
}

function handleMemoryFallback(
  key: string,
  maxAttempts: number,
  windowMs: number,
  nowMs: number
): RateLimitResult {
  const rec = memoryFallback.get(key);
  if (!rec || nowMs - rec.firstAttempt > windowMs) {
    memoryFallback.set(key, { count: 1, firstAttempt: nowMs });
    return { allowed: true, attempts: 1, maxAttempts };
  }

  if (rec.count >= maxAttempts) {
    const waitMinutes = Math.max(1, Math.ceil((windowMs - (nowMs - rec.firstAttempt)) / 60000));
    return { allowed: false, attempts: rec.count, maxAttempts, waitMinutes };
  }

  rec.count += 1;
  memoryFallback.set(key, rec);
  return { allowed: true, attempts: rec.count, maxAttempts };
}
