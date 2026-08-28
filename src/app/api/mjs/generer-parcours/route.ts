import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";
import { fetchParcours, getOrGenerateModules } from "@/lib/mjs-parcours-server";
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

  try {
    const parcours = await fetchParcours(parcoursId);
    const existing = parcours.modules_contenu as ModuleContenu[] | null;
    if (existing && existing.length > 0) {
      return NextResponse.json({ modules: existing });
    }

    const modules = await getOrGenerateModules(user.id, parcoursId);
    return NextResponse.json({ modules });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur génération";
    console.error("generer-parcours:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
