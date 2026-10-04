import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ results: [], students: [] });
  }

  const { data: results } = await supabaseAdmin
    .from("quiz_results")
    .select("user_id, score, total");

  if (!results || results.length === 0) {
    return NextResponse.json({ results: [], students: [] });
  }

  const uids = [...new Set(results.map((r: { user_id: string }) => r.user_id))];

  const { data: students } = await supabaseAdmin
    .from("prep_students")
    .select("user_id, prenom, ecole, serie, exam_type")
    .in("user_id", uids);

  return NextResponse.json({ results, students: students ?? [] });
}
