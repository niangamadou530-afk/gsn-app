import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Variables Supabase manquantes" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const [
    enrollRes,
    passportRes,
    insertedRes,
    domaineRes,
    missionsRes,
    appsRes,
    usersRes,
  ] = await Promise.all([
    supabase.from("pfimn_enrollments").select("*", { count: "exact", head: true }),
    supabase.from("pfimn_enrollments").select("*", { count: "exact", head: true }).eq("skill_passport_issued", true),
    supabase.from("pfimn_enrollments").select("*", { count: "exact", head: true }).eq("inserted", true),
    supabase.from("pfimn_enrollments").select("domaine"),
    supabase.from("employer_missions").select("*", { count: "exact", head: true }).eq("tenant_id", "mctn").eq("status", "active"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
  ]);

  const domaineCounts: Record<string, number> = {};
  (domaineRes.data ?? []).forEach((e: any) => {
    if (e.domaine) domaineCounts[e.domaine] = (domaineCounts[e.domaine] ?? 0) + 1;
  });

  const totalInscrits   = enrollRes.count   ?? 0;
  const passports       = passportRes.count ?? 0;
  const insertions      = insertedRes.count ?? 0;
  const missionsActives = missionsRes.count ?? 0;
  const candidatures    = appsRes.count     ?? 0;
  const totalUsers      = usersRes.count    ?? 0;

  const tauxInsertion = totalInscrits > 0
    ? Math.round((insertions / totalInscrits) * 100)
    : 0;

  return NextResponse.json({
    kpis: {
      totalInscrits,
      passports,
      insertions,
      tauxInsertion,
      missionsActives,
      candidatures,
      totalUsers,
    },
    domaineBreakdown: domaineCounts,
    objectifsNDT: {
      diplomes: { actuel: passports, cible: 100000 },
      startups: { actuel: missionsActives, cible: 500 },
    },
  });
}
