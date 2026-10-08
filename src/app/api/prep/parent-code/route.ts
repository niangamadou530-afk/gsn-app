import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(
    url,
    serviceKey,
    { auth: { persistSession: false } }
  );
}

function getAnonSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Generate a cryptographically secure 6-character uppercase alphanumeric code.
 * Replaces Math.random() with CSPRNG (crypto.randomBytes).
 */
function generateSecureAccessCode(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 unambiguous uppercase chars
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += charset[bytes[i] % charset.length];
  }
  return code;
}

async function authenticateStudent(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const sbAnon = getAnonSupabase();
  const { data: { user }, error } = await sbAnon.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: Retrieve student's current access code if one exists
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateStudent(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const sbAdmin = getServiceSupabase();
    if (!sbAdmin) {
      console.error("[parent-code] configuration manquante");
      return NextResponse.json(
        { error: "Le service de code d'accès parent est momentanément indisponible. Réessaie dans quelques instants !" },
        { status: 500 }
      );
    }

    const { data: link, error } = await sbAdmin
      .from("prep_parent_links")
      .select("access_code, parent_email, created_at")
      .eq("student_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "[parent-code GET error]",
        `Code: ${error.code || "inconnu"}, Message: ${error.message || "erreur"}`
      );
      return NextResponse.json(
        { error: "Impossible de charger ton code d'accès pour le moment. Réessaie dans un instant !" },
        { status: 500 }
      );
    }

    if (!link) {
      return NextResponse.json({ found: false, code: null });
    }

    return NextResponse.json({
      found: true,
      code: link.access_code,
      parentEmail: link.parent_email,
      createdAt: link.created_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[parent-code GET exception]", msg);
    return NextResponse.json(
      { error: "Une interruption temporaire est survenue. Réessaie dans quelques instants !" },
      { status: 500 }
    );
  }
}

// POST: Generate or renew secure parent code
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateStudent(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    const sbAdmin = getServiceSupabase();
    if (!sbAdmin) {
      console.error("[parent-code] configuration manquante");
      return NextResponse.json(
        { error: "Le service de code d'accès parent est momentanément indisponible. Réessaie dans quelques instants !" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parentEmail = (body.parentEmail || "").trim();
    const forceRenew = Boolean(body.renew);

    // Check if code already exists for this student
    const { data: existingLink, error: selectError } = await sbAdmin
      .from("prep_parent_links")
      .select("access_code, parent_email, created_at")
      .eq("student_user_id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error(
        "[parent-code select error]",
        `Code: ${selectError.code || "inconnu"}, Message: ${selectError.message || "erreur"}`
      );
    }

    // If existing code exists and not explicitly renewing, preserve the existing code
    if (existingLink?.access_code && !forceRenew) {
      // If email updated, update email only
      if (parentEmail && parentEmail !== existingLink.parent_email) {
        await sbAdmin
          .from("prep_parent_links")
          .update({ parent_email: parentEmail })
          .eq("student_user_id", user.id);
      }
      return NextResponse.json({
        success: true,
        code: existingLink.access_code,
        parentEmail: parentEmail || existingLink.parent_email,
        existing: true,
        createdAt: existingLink.created_at || null,
      });
    }

    // Generate secure crypto code (ensuring uniqueness across table)
    let newCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      attempts++;
      newCode = generateSecureAccessCode();
      const { data: clash } = await sbAdmin
        .from("prep_parent_links")
        .select("student_user_id")
        .eq("access_code", newCode)
        .maybeSingle();
      if (!clash) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Impossible de générer un code unique pour le moment. Réessaie dans quelques instants !" },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();

    // Upsert into prep_parent_links via service_role client
    const { error: upsertError } = await sbAdmin
      .from("prep_parent_links")
      .upsert({
        student_user_id: user.id,
        parent_email: parentEmail || "Non renseigné",
        access_code: newCode,
        created_at: nowIso,
      }, { onConflict: "student_user_id" });

    if (upsertError) {
      console.error(
        "[parent-code upsert error]",
        `Code: ${upsertError.code || "inconnu"}, Message: ${upsertError.message || "erreur"}`
      );
      return NextResponse.json(
        { error: "Nous n'avons pas pu enregistrer ton code parent pour le moment. Réessaie dans un instant !" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: newCode,
      parentEmail: parentEmail || "Non renseigné",
      existing: false,
      createdAt: nowIso,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[parent-code POST exception]", msg);
    return NextResponse.json(
      { error: "Une interruption temporaire est survenue. Réessaie dans quelques instants !" },
      { status: 500 }
    );
  }
}
