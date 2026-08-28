import { NextResponse } from "next/server";
import { createSupabaseAdmin, getUserFromRequest, hasServiceRoleKey } from "@/lib/supabase-admin";
import type { ModuleContenu } from "@/app/mjs/beneficiaire/parcours/types";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let parcoursId: string;
  try {
    const body = await request.json();
    parcoursId = body.parcours_id;
    if (!parcoursId) throw new Error("parcours_id manquant");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Requête invalide";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (!hasServiceRoleKey()) {
    return NextResponse.json(
      { error: "SERVICE_ROLE_MISSING", use_client: true },
      { status: 503 }
    );
  }

  const admin = createSupabaseAdmin();

  const { data: parcours } = await admin
    .from("mjs_parcours")
    .select("modules_contenu")
    .eq("id", parcoursId)
    .eq("tenant_id", "mjs")
    .single();

  const modules = (parcours?.modules_contenu ?? []) as ModuleContenu[];
  const moduleIds = modules.map((m) => m.id);

  const { data: prog } = await admin
    .from("mjs_progression")
    .select("modules_faits_ids")
    .eq("user_id", user.id)
    .eq("parcours_id", parcoursId)
    .eq("tenant_id", "mjs")
    .maybeSingle();

  const passedIds: string[] = prog?.modules_faits_ids ?? [];
  const allModulesDone = moduleIds.length > 0 && moduleIds.every((id) => passedIds.includes(id));

  if (!allModulesDone) {
    return NextResponse.json({ error: "Tous les modules doivent être validés avant le test final" }, { status: 403 });
  }

  const { error: passportError } = await admin
    .from("mjs_skill_passports")
    .upsert(
      { user_id: user.id, tenant_id: "mjs", parcours_id: parcoursId },
      { onConflict: "user_id,parcours_id" }
    );

  if (passportError) {
    return NextResponse.json({ error: passportError.message }, { status: 500 });
  }

  await admin
    .from("mjs_progression")
    .update({ pourcentage: 100, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("parcours_id", parcoursId)
    .eq("tenant_id", "mjs");

  return NextResponse.json({ ok: true });
}
