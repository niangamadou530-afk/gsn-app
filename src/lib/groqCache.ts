import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function buildCacheKey(...parts: (string | undefined)[]): string {
  return parts.map(p => (p ?? "").toLowerCase().trim()).join("|");
}

export async function getCached(key: string): Promise<unknown | null> {
  try {
    const { data } = await sb()
      .from("prep_cache")
      .select("payload")
      .eq("cache_key", key)
      .maybeSingle();
    return data?.payload ?? null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, payload: unknown): Promise<void> {
  try {
    await sb()
      .from("prep_cache")
      .upsert({ cache_key: key, payload }, { onConflict: "cache_key" });
  } catch {
    // fail silently — un cache miss est acceptable
  }
}
