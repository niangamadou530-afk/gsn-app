import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/adminAuth";

async function verifyAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isUserAdmin(user.email)) {
    return NextResponse.json({ error: "Accès refusé. Réservé à l'administrateur." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, email: user.email });
  response.cookies.set("gsn_admin", "1", {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "lax",
  });
  return response;
}

export async function POST(req: Request) {
  return verifyAdmin(req);
}

export async function GET(req: Request) {
  return verifyAdmin(req);
}
