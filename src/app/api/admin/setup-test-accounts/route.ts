import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "niangamadou530@gmail.com";

const ACCOUNTS = [
  {
    email:     "yacine.bac@gsnprep.local",
    password:  "YacineBAC2026",
    name:      "Yacine BAC",
    exam_type: "BAC",
    serie:     "S1",
  },
  {
    email:     "yacine.bfem@gsnprep.local",
    password:  "YacineBFEM2026",
    name:      "Yacine BFEM",
    exam_type: "BFEM",
    serie:     null,
  },
];

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquante" }, { status: 500 });

  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sbAnon.auth.getUser();
  if (user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  const results = [];

  for (const acc of ACCOUNTS) {
    let userId: string | null = null;
    let action = "";

    // Chercher l'utilisateur existant via toutes les pages
    let page = 1;
    outer: while (true) {
      const { data } = await sbAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!data?.users?.length) break;
      for (const u of data.users) {
        if (u.email === acc.email) { userId = u.id; break outer; }
      }
      if (data.users.length < 1000) break;
      page++;
    }

    if (userId) {
      // Compte existant → juste réinitialiser le mot de passe
      const { error } = await sbAdmin.auth.admin.updateUserById(userId, {
        password: acc.password,
        email_confirm: true,
      });
      action = error ? `update_error: ${error.message}` : "password_updated";
    } else {
      // Nouveau compte
      const { data: created, error: createErr } = await sbAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
      });
      if (createErr || !created.user) {
        results.push({ email: acc.email, error: createErr?.message ?? "Création impossible" });
        continue;
      }
      userId = created.user.id;
      action = "created";
    }

    if (userId) {
      await sbAdmin.from("users").upsert(
        { id: userId, name: acc.name, score: 0, profile_type: "eleve" },
        { onConflict: "id" }
      );
      await sbAdmin.from("prep_students").upsert(
        {
          user_id:   userId,
          prenom:    "Yacine",
          ecole:     "Compte test GSN",
          exam_type: acc.exam_type,
          serie:     acc.serie,
          unlimited: true,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    results.push({ email: acc.email, action, userId });
  }

  return NextResponse.json({ ok: true, results });
}
