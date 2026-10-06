import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: link, error } = await sbAdmin
      .from("prep_parent_links")
      .select("access_code, parent_email, created_at")
      .eq("student_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[parent-code GET error]", error);
      return NextResponse.json({ error: "Erreur de base de données" }, { status: 500 });
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
    console.error("[parent-code GET exception]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Generate or renew secure parent code
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateStudent(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parentEmail = (body.parentEmail || "").trim();
    const forceRenew = Boolean(body.renew);

    const sbAdmin = getServiceSupabase();

    // Check if code already exists for this student
    const { data: existingLink } = await sbAdmin
      .from("prep_parent_links")
      .select("access_code, parent_email")
      .eq("student_user_id", user.id)
      .maybeSingle();

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
      return NextResponse.json({ error: "Impossible de générer un code unique. Veuillez réessayer." }, { status: 500 });
    }

    // Upsert into prep_parent_links via service_role client
    const { error: upsertError } = await sbAdmin
      .from("prep_parent_links")
      .upsert({
        student_user_id: user.id,
        parent_email: parentEmail || "Non renseigné",
        access_code: newCode,
      }, { onConflict: "student_user_id" });

    if (upsertError) {
      console.error("[parent-code upsert error]", upsertError);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement du code." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      code: newCode,
      parentEmail: parentEmail || "Non renseigné",
      existing: false,
    });
  } catch (err: unknown) {
    console.error("[parent-code POST exception]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
