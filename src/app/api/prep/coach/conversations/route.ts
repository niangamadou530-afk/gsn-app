/**
 * GARDE-FOU DE CONFIDENTIALITÉ PREP :
 * Cette route permet à l'élève d'accéder à la liste de ses propres conversations avec le Coach IA.
 * L'identifiant utilisateur est obligatoirement extrait du jeton de session Bearer.
 * Aucun accès parent n'est autorisé. Aucun contenu confidentiel n'est consigné dans les logs.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedStudent,
  getServiceSupabase,
  isTableMissingError,
  purgeExpiredCoachData,
} from "../helper";
import { PREP_COACH_CONFIG } from "@/lib/prep-config";

export async function GET(req: NextRequest) {
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ conversations: [], historyUnavailable: true });
  }

  try {
    const { data, error: dbErr } = await sb
      .from("prep_coach_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(PREP_COACH_CONFIG.maxConversations);

    if (dbErr) {
      if (isTableMissingError(dbErr)) {
        return NextResponse.json({ conversations: [], historyUnavailable: true });
      }
      return NextResponse.json({ error: "Erreur de base de données" }, { status: 500 });
    }

    return NextResponse.json({ conversations: data || [], historyUnavailable: false });
  } catch (err: any) {
    if (isTableMissingError(err)) {
      return NextResponse.json({ conversations: [], historyUnavailable: true });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ conversation: null, historyUnavailable: true });
  }

  try {
    // Purge opportuniste des données inactives de l'élève
    await purgeExpiredCoachData(userId);

    // Vérifier la limite de 50 conversations au total
    const { count: totalCount, error: countErr } = await sb
      .from("prep_coach_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countErr && isTableMissingError(countErr)) {
      return NextResponse.json({ conversation: null, historyUnavailable: true });
    }

    if ((totalCount ?? 0) >= PREP_COACH_CONFIG.maxConversations) {
      return NextResponse.json(
        {
          error:
            "Tu as atteint la limite de 50 conversations. Supprime d'anciennes discussions pour en commencer une nouvelle en toute sérénité.",
          limitReached: true,
        },
        { status: 400 }
      );
    }

    // Vérifier la limite de 20 créations de conversations par jour
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count: todayCount } = await sb
      .from("prep_coach_conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString());

    if ((todayCount ?? 0) >= PREP_COACH_CONFIG.maxNewConversationsPerDay) {
      return NextResponse.json(
        {
          error:
            "Tu as créé 20 nouvelles conversations aujourd'hui. Continue dans tes conversations existantes ou réessaie demain !",
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let title = (body?.title || "Nouvelle discussion").trim();
    if (title.length > PREP_COACH_CONFIG.titleMaxLength) {
      title = title.slice(0, PREP_COACH_CONFIG.titleMaxLength).trim();
    }

    const nowIso = new Date().toISOString();
    const { data: newConv, error: insertErr } = await sb
      .from("prep_coach_conversations")
      .insert({
        user_id: userId,
        title: title || "Nouvelle discussion",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id, title, created_at, updated_at")
      .single();

    if (insertErr) {
      if (isTableMissingError(insertErr)) {
        return NextResponse.json({ conversation: null, historyUnavailable: true });
      }
      return NextResponse.json({ error: "Échec création conversation" }, { status: 500 });
    }

    return NextResponse.json({ conversation: newConv, historyUnavailable: false });
  } catch (err: any) {
    if (isTableMissingError(err)) {
      return NextResponse.json({ conversation: null, historyUnavailable: true });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await getAuthenticatedStudent(req);
  if (error || !userId) {
    return NextResponse.json({ error: error || "Non authentifié" }, { status: 401 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ success: true, historyUnavailable: true });
  }

  try {
    // 1. Supprimer tous les fichiers de l'élève
    await sb.from("prep_coach_files").delete().eq("user_id", userId);
    // 2. Supprimer tous les messages de l'élève
    await sb.from("prep_coach_messages").delete().eq("user_id", userId);
    // 3. Supprimer toutes les conversations de l'élève
    const { error: delErr } = await sb
      .from("prep_coach_conversations")
      .delete()
      .eq("user_id", userId);

    if (delErr && !isTableMissingError(delErr)) {
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true, historyUnavailable: false });
  } catch {
    return NextResponse.json({ success: true, historyUnavailable: true });
  }
}
