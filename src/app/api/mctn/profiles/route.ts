import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const domaine = url.searchParams.get("domaine") ?? "";
  const certified = url.searchParams.get("certified") === "true";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  let query = admin
    .from("pfimn_enrollments")
    .select("user_id, domaine, niveau, objectif, skill_passport_issued, enrolled_at, course_id");

  if (certified) query = query.eq("skill_passport_issued", true);
  if (domaine)   query = query.eq("domaine", domaine);

  query = (query as any).order("enrolled_at", { ascending: false }).limit(100);

  const { data: enrollments, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json({ profiles: [] });
  }

  // Fetch user names
  const userIds = enrollments.map((e: any) => e.user_id);
  const { data: users } = await admin
    .from("users")
    .select("id, name")
    .in("id", userIds);

  const nameMap: Record<string, string> = {};
  (users ?? []).forEach((u: any) => { nameMap[u.id] = u.name ?? "—"; });

  // Fetch test scores for certified profiles
  const courseIds = enrollments
    .map((e: any) => e.course_id)
    .filter(Boolean);

  const scoreMap: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: courses } = await admin
      .from("user_courses")
      .select("id, test_score")
      .in("id", courseIds);
    (courses ?? []).forEach((c: any) => {
      if (c.test_score !== null) scoreMap[c.id] = c.test_score;
    });
  }

  const profiles = enrollments.map((e: any) => ({
    user_id:              e.user_id,
    name:                 nameMap[e.user_id] ?? "—",
    domaine:              e.domaine,
    niveau:               e.niveau,
    objectif:             e.objectif,
    skill_passport_issued: e.skill_passport_issued,
    enrolled_at:          e.enrolled_at,
    score:                e.course_id ? (scoreMap[e.course_id] ?? null) : null,
  }));

  return NextResponse.json({ profiles });
}
