/**
 * GARDE-FOU DE CONFIDENTIALITÉ PREP :
 * Cette route permet à l'élève d'accéder, modifier ou supprimer UNE de ses conversations.
 * Vérification stricte de propriété : l'identifiant utilisateur est obligatoirement vérifié.
 * Si la conversation n'existe pas ou n'appartient pas à l'élève : code HTTP 404 générique.
 * Aucun contenu de message n'est journalisé.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedStudent,
  getServiceSupabase,
  isTableMissingError,
} from "../../helper";
import { PREP_COACH_CONFIG } from "@/lib/prep-config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  try {
    // Vérifier la propriété de la conversation
    const { data: conv, error: convErr } = await sb
      .from("prep_coach_conversations")
      .select("id, title, created_at, updated_at, user_id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (convErr || !conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    // Récupérer les messages (jusqu'à 200, ordonnés chronologiquement)
    const { data: messages } = await sb
      .from("prep_coach_messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(PREP_COACH_CONFIG.maxMessagesPerConversation);

    // Récupérer les fichiers liés à cette conversation
    const { data: files } = await sb
      .from("prep_coach_files")
      .select("id, conversation_id, kind, title, content_md, correction_md, created_at")
      .eq("conversation_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      conversation: {
        id: conv.id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      },
      messages: messages || [],
      files: files || [],
    });
  } catch (err: any) {
    if (isTableMissingError(err)) {
      return NextResponse.json({ error: "Historique indisponible" }, { status: 404 });
    }
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let title = (body?.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    }
    if (title.length > PREP_COACH_CONFIG.titleMaxLength) {
      title = title.slice(0, PREP_COACH_CONFIG.titleMaxLength).trim();
    }

    const { data: updated, error: updErr } = await sb
      .from("prep_coach_conversations")
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, title, updated_at")
      .maybeSingle();

    if (updErr || !updated) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    return NextResponse.json({ conversation: updated });
  } catch {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  try {
    // Vérifier l'existence et la propriété
    const { data: conv } = await sb
      .from("prep_coach_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    // Supprimer les fichiers et messages de cette conversation
    await sb.from("prep_coach_files").delete().eq("conversation_id", id).eq("user_id", userId);
    await sb.from("prep_coach_messages").delete().eq("conversation_id", id).eq("user_id", userId);
    await sb.from("prep_coach_conversations").delete().eq("id", id).eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }
}
