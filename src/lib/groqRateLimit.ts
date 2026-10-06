import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const RATE_LIMIT_ERROR =
  "Beaucoup d'élèves génèrent du contenu en ce moment. Merci de patienter quelques instants avant de réessayer.";

function sbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tente d'acquérir un slot Groq dans la fenêtre d'une minute.
 * En cas de saturation du quota (~28 req/min), patiente jusqu'à 5 secondes max
 * pour obtenir un créneau disponible sans dépasser le budget global.
 * Retourne true si un slot est obtenu, false si la limite reste saturée.
 */
export async function acquireGroqSlot(maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  const retryIntervalMs = 1500;

  while (Date.now() - startTime <= maxWaitMs) {
    try {
      const { data, error } = await sbClient().rpc("check_groq_rate_limit");
      if (error) {
        console.error("groq_rate_limit rpc error:", error.message);
        return true; // En cas d'erreur RPC, on laisse passer pour ne pas bloquer
      }

      if (data === true) {
        return true;
      }
    } catch {
      return true;
    }

    // Si le délai max de 5s est bientôt atteint, ne pas attendre au-delà
    const elapsed = Date.now() - startTime;
    const remaining = maxWaitMs - elapsed;
    if (remaining <= 200) {
      break;
    }

    const wait = Math.min(retryIntervalMs, remaining);
    await sleep(wait);
  }

  return false;
}

/** Retourne directement une NextResponse 503 avec le message standard. */
export function rateLimitResponse() {
  return NextResponse.json({ error: RATE_LIMIT_ERROR }, { status: 503 });
}
