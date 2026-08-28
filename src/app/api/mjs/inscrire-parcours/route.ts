import { NextResponse } from "next/server";
import { getUserFromRequest, hasServiceRoleKey } from "@/lib/supabase-admin";
import { getOrGenerateModules } from "@/lib/mjs-parcours-server";

export async function POST(request: Request) {
  if (!hasServiceRoleKey()) {
    return NextResponse.json(
      { error: "SERVICE_ROLE_MISSING", use_client: true },
      { status: 503 }
    );
  }
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

  try {
    const modules = await getOrGenerateModules(user.id, parcoursId);
    return NextResponse.json({ modules, inscribed: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inscription";
    console.error("inscrire-parcours:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
