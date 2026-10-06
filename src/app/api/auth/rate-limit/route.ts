import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementServerRateLimit, resetServerRateLimit } from "@/lib/serverRateLimit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, identifier, success } = body;

    if (!action || !identifier) {
      return NextResponse.json({ error: "Action et identifiant requis" }, { status: 400 });
    }

    const key = `${action}:${identifier.trim().toLowerCase()}`;

    // Si authentification réussie, effacer le compteur
    if (success === true) {
      await resetServerRateLimit(key);
      return NextResponse.json({ ok: true });
    }

    // Limites : 5 essais en 15 minutes pour login, 5 essais en 15 minutes pour signup
    const maxAttempts = action === "login" ? 5 : 5;
    const result = await checkAndIncrementServerRateLimit(key, maxAttempts, 15);

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          error: `Trop de tentatives pour ce compte. Par mesure de sécurité, patiente ${result.waitMinutes || 15} minute(s) avant de réessayer.`,
          waitMinutes: result.waitMinutes,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      allowed: true,
      attempts: result.attempts,
      remaining: Math.max(0, maxAttempts - result.attempts),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur de limitation" }, { status: 500 });
  }
}
