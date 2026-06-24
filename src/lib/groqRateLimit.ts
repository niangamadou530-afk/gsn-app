import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const RATE_LIMIT_ERROR =
  "Beaucoup d'élèves génèrent du contenu en ce moment, réessaie dans quelques secondes.";

function sbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Tente d'acquérir un slot Groq dans la fenêtre d'une minute.
 * Retourne true si autorisé, false si la limite de 28 req/min est atteinte.
 * En cas d'erreur Supabase, laisse passer pour ne pas bloquer l'app.
 */
export async function acquireGroqSlot(): Promise<boolean> {
  try {
    const { data, error } = await sbClient().rpc("check_groq_rate_limit");
    if (error) {
      console.error("groq_rate_limit rpc error:", error.message);
      return true;
    }
    return data === true;
  } catch {
    return true;
  }
}

/** Retourne directement une NextResponse 503 avec le message standard. */
export function rateLimitResponse() {
  return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 503 });
}
