import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAndIncrementServerRateLimit, resetServerRateLimit } from "@/lib/serverRateLimit";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const cleanCode = (code || "").trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 4 || cleanCode.length > 10) {
      return NextResponse.json({ error: "Code d'accès invalide" }, { status: 400 });
    }

    const clientIp = getClientIp(req);

    // 1. Limite persistante par code parent ciblé (max 5 tentatives par 15 min)
    const codeRateResult = await checkAndIncrementServerRateLimit(`parent:${cleanCode}`, 5, 15);
    if (!codeRateResult.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives pour ce code d'accès. Par sécurité, patiente ${codeRateResult.waitMinutes || 15} minute(s) avant de réessayer.`,
          rateLimited: true,
          waitMinutes: codeRateResult.waitMinutes,
        },
        { status: 429 }
      );
    }

    // 2. Limite par IP (max 15 tentatives par 15 min tous codes confondus pour bloquer le balayage)
    const ipRateResult = await checkAndIncrementServerRateLimit(`parent-ip:${clientIp}`, 15, 15);
    if (!ipRateResult.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives depuis votre connexion. Patiente ${ipRateResult.waitMinutes || 15} minute(s).`,
          rateLimited: true,
          waitMinutes: ipRateResult.waitMinutes,
        },
        { status: 429 }
      );
    }

    // Cas de démonstration (pour l'environnement preview / test)
    if (cleanCode === "DEMO12") {
      await resetServerRateLimit(`parent:${cleanCode}`);
      return NextResponse.json({
        found: true,
        studentName: "Amadou Niang (Démo)",
        studentData: {
          exam_type: "BAC",
          serie: "S2",
          country: "Sénégal",
          level_per_subject: {
            "Mathématiques": { level: "Fort", score: 85 },
            "Sciences Physiques": { level: "Fort", score: 88 },
            "SVT": { level: "Moyen", score: 72 },
            "Philosophie": { level: "Moyen", score: 65 },
            "Français": { level: "Fort", score: 78 },
          },
        },
        examDate: "2026-07-02",
        results: [
          { subject: "Mathématiques", score: 17, created_at: new Date().toISOString() },
          { subject: "Sciences Physiques", score: 16, created_at: new Date(Date.now() - 86400000).toISOString() },
          { subject: "SVT", score: 14, created_at: new Date(Date.now() - 172800000).toISOString() },
        ],
      });
    }

    // Interrogation Supabase côté serveur avec client service_role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: link, error: linkError } = await supabase
      .from("prep_parent_links")
      .select("student_user_id")
      .eq("access_code", cleanCode)
      .maybeSingle();

    if (linkError || !link) {
      return NextResponse.json({ found: false, error: "Code d'accès introuvable ou expiré." }, { status: 404 });
    }

    // Code valide trouvé -> Réinitialiser le compteur persistant pour ce code
    await resetServerRateLimit(`parent:${cleanCode}`);

    const studentId = link.student_user_id;

    // Charger les informations pour le parent
    const [{ data: profile }, { data: stu }, { data: res }] = await Promise.all([
      supabase.from("users").select("name").eq("id", studentId).maybeSingle(),
      supabase.from("prep_students").select("exam_type, serie, country, level_per_subject").eq("user_id", studentId).maybeSingle(),
      supabase.from("quiz_results").select("subject:matiere, score, created_at").eq("user_id", studentId).order("created_at", { ascending: false }).limit(10),
    ]);

    return NextResponse.json({
      found: true,
      studentName: profile?.name || "Élève GSN",
      studentData: stu || {
        exam_type: "BAC",
        serie: "S2",
        country: "Sénégal",
        level_per_subject: {},
      },
      results: res || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur serveur lors de la vérification du code" },
      { status: 500 }
    );
  }
}
