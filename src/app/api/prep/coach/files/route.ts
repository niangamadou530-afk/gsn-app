/**
 * GARDE-FOU DE CONFIDENTIALITÉ PREP :
 * Cette route permet à l'élève d'accéder à la liste de TOUS ses fichiers générés
 * ou d'en supprimer un. L'accès exige le jeton élève Bearer.
 * Les parents n'y ont aucun accès.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedStudent,
  getServiceSupabase,
  isTableMissingError,
} from "../helper";
import { PREP_COACH_CONFIG } from "@/lib/prep-config";

export async function GET(req: NextRequest) {
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ files: [], historyUnavailable: true });
  }

  try {
    const { data: files, error: dbErr } = await sb
      .from("prep_coach_files")
      .select("id, conversation_id, kind, title, content_md, correction_md, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PREP_COACH_CONFIG.maxFilesTotal);

    if (dbErr) {
      if (isTableMissingError(dbErr)) {
        return NextResponse.json({ files: [], historyUnavailable: true });
      }
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }

    return NextResponse.json({ files: files || [], historyUnavailable: false });
  } catch (err: any) {
    if (isTableMissingError(err)) {
      return NextResponse.json({ files: [], historyUnavailable: true });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let fileId = searchParams.get("id");
  if (!fileId) {
    const body = await req.json().catch(() => ({}));
    fileId = body?.id;
  }

  if (!fileId) {
    return NextResponse.json({ error: "Identifiant du fichier requis" }, { status: 400 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  try {
    const { data: file } = await sb
      .from("prep_coach_files")
      .select("id")
      .eq("id", fileId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!file) {
      return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }

    await sb.from("prep_coach_files").delete().eq("id", fileId).eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
