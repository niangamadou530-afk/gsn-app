import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { phoneToFakeEmail, normalizePhone, isValidPhone } from "@/lib/phoneUtils";
import { isUserAdmin } from "@/lib/adminAuth";
import crypto from "crypto";

// Limiteur de réinitialisations par jour et par compte (en mémoire)
const dailyResetsByAccount = new Map<string, { date: string; count: number }>();
const MAX_RESETS_PER_DAY = 3;

/**
 * Génère un mot de passe temporaire aléatoire cryptographiquement sécurisé
 * d'au moins 10 caractères (12 caractères), sans modèle fixe.
 */
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%*";
  const allChars = upper + lower + digits + special;

  const bytes = crypto.randomBytes(12);
  const pwdChars = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    special[bytes[3] % special.length],
  ];

  for (let i = 4; i < 12; i++) {
    pwdChars.push(allChars[bytes[i] % allChars.length]);
  }

  // Mélange aléatoire avec crypto
  for (let i = pwdChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [pwdChars[i], pwdChars[j]] = [pwdChars[j], pwdChars[i]];
  }

  return pwdChars.join("");
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Non authentifié. Connexion requise." }, { status: 401 });
  }

  // 1. Vérifier strictement que l'appelant est l'administrateur GSN
  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await sbAnon.auth.getUser();
  if (!user || !isUserAdmin(user.email)) {
    return NextResponse.json({ error: "Accès refusé. Réservé à l'administrateur." }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY manquante dans l'environnement serveur" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { phone, userId, customPassword } = body;

  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  let targetUserId = userId;
  let studentName = "Élève GSN";
  let targetPhone = phone ? normalizePhone(phone) : "";

  // Si l'administrateur fournit un numéro de téléphone sénégalais
  if (phone) {
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Numéro de téléphone sénégalais invalide (ex : 77 123 45 67 ou +221 77...)" },
        { status: 400 }
      );
    }

    const fakeEmail = phoneToFakeEmail(phone);
    targetPhone = normalizePhone(phone);

    // Chercher l'utilisateur dans public.users par téléphone ou par id
    const { data: userRow } = await sbAdmin
      .from("users")
      .select("id, name")
      .eq("phone", targetPhone)
      .maybeSingle();

    if (userRow) {
      targetUserId = userRow.id;
      studentName = userRow.name || "Élève GSN";
    } else {
      // Rechercher dans auth.users via son fake email
      const { data: authList, error: listError } = await sbAdmin.auth.admin.listUsers();
      if (!listError && authList?.users) {
        const found = authList.users.find(
          (u) => u.email?.toLowerCase() === fakeEmail.toLowerCase()
        );
        if (found) {
          targetUserId = found.id;
          const { data: profile } = await sbAdmin
            .from("users")
            .select("name")
            .eq("id", found.id)
            .maybeSingle();
          if (profile?.name) studentName = profile.name;
        }
      }
    }
  }

  if (!targetUserId) {
    return NextResponse.json(
      { error: `Aucun compte élève trouvé avec le numéro ${targetPhone || phone}.` },
      { status: 404 }
    );
  }

  // 2. Limite de réinitialisations par compte et par jour (max 3/jour)
  const today = new Date().toISOString().slice(0, 10);
  const resetRecord = dailyResetsByAccount.get(targetUserId) || { date: today, count: 0 };
  if (resetRecord.date !== today) {
    resetRecord.date = today;
    resetRecord.count = 0;
  }

  if (resetRecord.count >= MAX_RESETS_PER_DAY) {
    return NextResponse.json(
      {
        error: `Ce compte a déjà atteint la limite maximale de ${MAX_RESETS_PER_DAY} réinitialisations aujourd'hui. Réessaie demain.`,
        limitReached: true,
      },
      { status: 429 }
    );
  }

  // 3. Génération du mot de passe temporaire
  const temporaryPassword = customPassword && customPassword.length >= 6
    ? customPassword
    : generateTempPassword();

  // 4. Mise à jour du mot de passe dans Supabase Auth
  const { error: updateError } = await sbAdmin.auth.admin.updateUserById(targetUserId, {
    password: temporaryPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Incrémenter le compteur
  resetRecord.count += 1;
  dailyResetsByAccount.set(targetUserId, resetRecord);

  // 5. Journalisation d'audit dans la table prep_admin_password_resets (si existante)
  try {
    await sbAdmin.from("prep_admin_password_resets").insert({
      admin_email: user.email,
      target_user_id: targetUserId,
      target_phone: targetPhone || null,
      target_name: studentName,
      created_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.warn("Audit log table prep_admin_password_resets non encore créée :", logErr);
  }

  // Message WhatsApp prêt à être copié
  const whatsappMessage = `Bonjour ${studentName}, voici votre nouveau mot de passe temporaire pour GSN PREP : ${temporaryPassword}\nConnectez-vous dès maintenant sur https://gsnprep.sn/login et modifiez-le si vous le souhaitez.`;

  return NextResponse.json({
    ok: true,
    studentName,
    studentPhone: targetPhone,
    temporaryPassword,
    resetsToday: resetRecord.count,
    maxResetsPerDay: MAX_RESETS_PER_DAY,
    whatsappMessage,
  });
}
