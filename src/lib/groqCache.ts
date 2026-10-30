import { createClient } from "@supabase/supabase-js";

/**
 * Client serveur sécurisé utilisant la clé de service
 * Le navigateur n'accède JAMAIS directement à la table prep_cache.
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


/**
 * Normalise et valide une clé de cache :
 * - Limite de longueur max : 200 caractères
 * - Refuse les caractères spéciaux (seuls alphanumérique, tirets, underscores et barres verticales sont admis)
 */
export function sanitizeCacheKey(rawKey: string): string | null {
  if (!rawKey || typeof rawKey !== "string") return null;
  const trimmed = rawKey.trim();
  if (trimmed.length === 0 || trimmed.length > 200) return null;
  // Autoriser uniquement les lettres (dont accentuées), chiffres, tirets, underscores et séparateurs '|' ou ':'
  const isSafe = /^[a-zA-Z0-9À-ÿ_\-|: ]+$/.test(trimmed);
  if (!isSafe) return null;
  return trimmed.toLowerCase();
}

export function buildCacheKey(...parts: (string | undefined)[]): string {
  return parts.map(p => (p ?? "").toLowerCase().trim()).join("|");
}

export async function getCached(rawKey: string): Promise<unknown | null> {
  const key = sanitizeCacheKey(rawKey);
  if (!key) return null;
  const sb = getAdminClient();
  if (!sb || !key) return null;

  try {
    const { data } = await sb
      .from("prep_cache")
      .select("payload, created_at")
      .eq("cache_key", key)
      .maybeSingle();

    if (!data?.payload) return null;

    // Durée de validité : 30 jours (aligné avec les générations et révisions)
    if (data.created_at) {
      const ageDays = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > 30) {
        return null;
      }
    }

    return data.payload;
  } catch {
    return null;
  }
}

export async function setCached(rawKey: string, payload: unknown): Promise<void> {
  const key = sanitizeCacheKey(rawKey);
  if (!key) return;
  const sb = getAdminClient();
  if (!sb || !key || !payload) return;

  try {
    await sb
      .from("prep_cache")
      .upsert(
        {
          cache_key: key,
          payload,
          created_at: new Date().toISOString(),
        },
        { onConflict: "cache_key" }
      );
  } catch {
    // Fail silently — un échec d'écriture en cache n'interrompt jamais l'élève
  }
}
