import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
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
