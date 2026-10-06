import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 1. Vérifier l'identité de l'élève appelant
  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await sbAnon.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Configuration serveur incomplète (clé de service manquante)" },
      { status: 500 }
    );
  }

  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  const userId = user.id;

  try {
    // 2. Suppression de toutes les données associées à l'élève dans les tables applicatives
    await Promise.allSettled([
      sbAdmin.from("prep_students").delete().eq("user_id", userId),
      sbAdmin.from("prep_quiz_results").delete().eq("user_id", userId),
      sbAdmin.from("prep_flashcards_progress").delete().eq("user_id", userId),
      sbAdmin.from("prep_parent_links").delete().eq("student_user_id", userId),
      sbAdmin.from("prep_usage_quotidien").delete().eq("user_id", userId),
      sbAdmin.from("prep_feedback").delete().eq("user_id", userId),
      sbAdmin.from("users").delete().eq("id", userId),
    ]);

    // 3. Suppression définitive du compte dans auth.users
    const { error: deleteAuthError } = await sbAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.warn("Notice deleteAuthUser:", deleteAuthError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Votre compte et l'ensemble de vos données ont été définitivement supprimés.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
