import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/adminAuth";

const LAUNCH_DATE = "2026-07-01T00:00:00Z";

function sb(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  );
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: { user } } = await sb(token).auth.getUser();
  if (!user || !isUserAdmin(user.email)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const client = sb();
  const [statsRes, studentsRes] = await Promise.all([
    client.rpc("get_admin_stats",    { launch_ts: LAUNCH_DATE }),
    client.rpc("get_admin_students", { launch_ts: LAUNCH_DATE }),
  ]);

  if (statsRes.error) {
    console.error("get_admin_stats error:", statsRes.error.message);
    return NextResponse.json({ error: statsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...statsRes.data,
    students: studentsRes.data ?? [],
  });
}
