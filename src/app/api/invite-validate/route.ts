import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: { code?: string; dry_run?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Requête invalide." }, { status: 400 });
  }

  const { code, dry_run = false } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false, error: "Code manquant." }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();
  const sb = sbClient();

  if (dry_run) {
    // Check only — no increment
    const { data, error } = await sb
      .from("invite_codes")
      .select("actif, utilisations_actuelles, max_utilisations, exam_type")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: "Code invalide." });
    }
    if (!data.actif) {
      return NextResponse.json({ valid: false, error: "Ce code n'est plus actif." });
    }
    if (data.utilisations_actuelles >= data.max_utilisations) {
      return NextResponse.json({ valid: false, error: "Ce code a atteint sa limite d'utilisations." });
    }
    return NextResponse.json({ valid: true, exam_type: data.exam_type ?? "BFEM" });
  } else {
    // Atomic check + increment via SECURITY DEFINER RPC
    const { data, error } = await sb.rpc("use_invite_code", { p_code: normalizedCode });

    if (error) {
      console.error("[invite-validate] RPC error:", error);
      return NextResponse.json({ valid: false, error: "Erreur serveur. Réessaie." }, { status: 500 });
    }

    return NextResponse.json(data as { valid: boolean; exam_type?: string; error?: string });
  }
}
