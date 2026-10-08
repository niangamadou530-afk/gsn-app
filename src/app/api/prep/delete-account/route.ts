import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 1. Vérifier l'identité de l'utilisateur exclusivement via le jeton
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
    console.error("[delete-account] configuration manquante (SUPABASE_SERVICE_ROLE_KEY)");
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

  // Filtrage strict sur l'identifiant issu du jeton validé uniquement
  const userId = user.id;
  const userEmail = user.email || "";

  try {
    // 2. Garde-fou strict : vérifier qu'il s'agit bien d'un compte élève PREP
    const [{ data: studentRecord }, { data: userRecord }] = await Promise.all([
      sbAdmin.from("prep_students").select("user_id, phone").eq("user_id", userId).maybeSingle(),
      sbAdmin.from("users").select("role, phone").eq("id", userId).maybeSingle(),
    ]);

    const isPrepStudent = Boolean(studentRecord) || userRecord?.role === "eleve";
    if (!isPrepStudent) {
      return NextResponse.json(
        { error: "Ce compte n'est pas un compte élève PREP, contacte le support", isPrepStudent: false },
        { status: 403 }
      );
    }

    const userPhone = (studentRecord?.phone || userRecord?.phone || "").trim();

    // Récupérer le code parent s'il en existe un avant suppression
    const { data: parentLink } = await sbAdmin
      .from("prep_parent_links")
      .select("access_code")
      .eq("student_user_id", userId)
      .maybeSingle();

    const parentCode = parentLink?.access_code?.trim().toLowerCase();

    const failedSteps: string[] = [];

    // 3. Suppression dans toutes les tables applicatives contenant des données de l'élève
    const tablesToDelete: { table: string; col: string }[] = [
      { table: "prep_coach_files", col: "user_id" },
      { table: "prep_coach_messages", col: "user_id" },
      { table: "prep_coach_conversations", col: "user_id" },
      { table: "prep_students", col: "user_id" },
      { table: "quiz_results", col: "user_id" },
      { table: "flashcards", col: "user_id" },
      { table: "prep_resumes", col: "user_id" },
      { table: "prep_player_stats", col: "user_id" },
      { table: "prep_parent_links", col: "student_user_id" },
      { table: "prep_usage_quotidien", col: "user_id" },
      { table: "prep_feedback", col: "user_id" },
      { table: "prep_flashcards_progress", col: "user_id" },
      { table: "users", col: "id" },
    ];

    for (const { table, col } of tablesToDelete) {
      const { error } = await sbAdmin.from(table).delete().eq(col, userId);
      if (error) {
        const isTableMissing =
          error.code === "42P01" ||
          error.code === "PGRST204" ||
          error.code === "PGRST205" ||
          (error.message && /relation.*does not exist|could not find the table/i.test(error.message));

        if (isTableMissing) {
          console.log(`[delete-account] Table ${table} inexistante (étape ignorée).`);
        } else {
          console.warn(`[delete-account] Échec suppression dans ${table}:`, `Code: ${error.code || "inconnu"}, Message: ${error.message}`);
          failedSteps.push(`Table ${table} : ${error.message}`);
        }
      }
    }

    // 4. Nettoyage de prep_admin_password_resets (par target_user_id et par target_phone)
    try {
      await sbAdmin.from("prep_admin_password_resets").delete().eq("target_user_id", userId);
      if (userPhone) {
        await sbAdmin.from("prep_admin_password_resets").delete().eq("target_phone", userPhone);
      }
    } catch (auditErr: any) {
      if (auditErr?.code !== "42P01") {
        console.warn("[delete-account] Note prep_admin_password_resets:", auditErr?.message);
      }
    }

    // 5. Nettoyage de prep_rate_limits (par identifiants de l'élève : code parent, téléphone, email)
    try {
      const identifiersToPurge: string[] = [];
      if (parentCode) identifiersToPurge.push(`parent:${parentCode}`);
      if (userPhone) {
        identifiersToPurge.push(`login:${userPhone.toLowerCase()}`);
        identifiersToPurge.push(`signup:${userPhone.toLowerCase()}`);
      }
      if (userEmail) {
        identifiersToPurge.push(`login:${userEmail.toLowerCase()}`);
        identifiersToPurge.push(`signup:${userEmail.toLowerCase()}`);
      }

      for (const idf of identifiersToPurge) {
        await sbAdmin.from("prep_rate_limits").delete().eq("target_identifier", idf);
      }
    } catch (rlErr: any) {
      if (rlErr?.code !== "42P01") {
        console.warn("[delete-account] Note prep_rate_limits:", rlErr?.message);
      }
    }

    // 6. Vérification par comptage qu'aucune ligne ne subsiste dans les tables principales de l'élève
    for (const { table, col } of tablesToDelete) {
      const { count, error: countErr } = await sbAdmin
        .from(table)
        .select(col, { count: "exact", head: true })
        .eq(col, userId);

      if (countErr) {
        const isTableMissing =
          countErr.code === "42P01" ||
          countErr.code === "PGRST204" ||
          countErr.code === "PGRST205" ||
          (countErr.message && /relation.*does not exist|could not find the table/i.test(countErr.message));

        if (!isTableMissing) {
          failedSteps.push(`Vérification ${table} : ${countErr.message}`);
        }
      } else if (typeof count === "number" && count > 0) {
        failedSteps.push(`Table ${table} : ${count} enregistrement(s) subsistant(s) après suppression`);
      }
    }

    // 7. Si une étape précédente a échoué, NE PAS supprimer dans auth et renvoyer une erreur explicite
    if (failedSteps.length > 0) {
      console.error("[delete-account] Étapes échouées :", failedSteps);
      return NextResponse.json(
        {
          success: false,
          error: "La suppression complète du compte n'a pas pu être finalisée.",
          details: failedSteps,
        },
        { status: 500 }
      );
    }

    // 8. Suppression définitive du compte dans auth.users uniquement si toutes les étapes précédentes ont réussi
    const { error: deleteAuthError } = await sbAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[delete-account] Échec suppression compte auth:", deleteAuthError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Échec lors de la suppression finale du compte d'authentification.",
          details: [`Compte d'authentification : ${deleteAuthError.message}`],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Votre compte et l'ensemble de vos données ont été définitivement supprimés.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[delete-account exception]", msg);
    return NextResponse.json(
      { error: "Erreur inattendue lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
