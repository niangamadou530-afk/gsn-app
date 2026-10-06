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
    const failedSteps: string[] = [];

    // 2. Suppression de toutes les données associées à l'élève dans les tables applicatives existantes
    const tablesToDelete = [
      { table: "prep_students", col: "user_id" },
      { table: "prep_quiz_results", col: "user_id" },
      { table: "prep_flashcards_progress", col: "user_id" },
      { table: "prep_parent_links", col: "student_user_id" },
      { table: "prep_usage_quotidien", col: "user_id" },
      { table: "prep_feedback", col: "user_id" },
      { table: "users", col: "id" },
    ];

    for (const { table, col } of tablesToDelete) {
      const { error } = await sbAdmin.from(table).delete().eq(col, userId);
      if (error && error.code !== "42P01") { // Ignore if table does not exist
        console.warn(`[delete-account] Échec suppression dans ${table}:`, error.message);
        failedSteps.push(`Table ${table} : ${error.message}`);
      }
    }

    // 3. Suppression définitive du compte dans auth.users
    const { error: deleteAuthError } = await sbAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[delete-account] Échec suppression compte auth:", deleteAuthError.message);
      failedSteps.push(`Compte d'authentification : ${deleteAuthError.message}`);
    }

    // 4. Si une étape essentielle a échoué, le signaler explicitement
    if (failedSteps.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La suppression complète du compte a échoué sur certaines étapes.",
          details: failedSteps,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Votre compte et l'ensemble de vos données ont été définitivement supprimés.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur inattendue lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
