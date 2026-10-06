import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isDisposableEmail } from "@/lib/securityUtils";
import { isValidPhone, normalizePhone } from "@/lib/phoneUtils";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/**
 * Route sécurisée côté serveur pour enregistrer ou synchroniser le profil d'un utilisateur
 * Règle stricte : si source === "prep" ou si l'inscription a choisi un examen (BAC/BFEM),
 * le profil est IMPOSÉ côté serveur comme "eleve", même si le client tente de falsifier la requête.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, email, phone, profileType, source, exam } = body;

    if (!userId) {
      return NextResponse.json({ error: "Identifiant utilisateur manquant" }, { status: 400 });
    }

    // Protection invisible : blocage des emails jetables
    if (email && isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "Les adresses email temporaires ou jetables ne sont pas autorisées." },
        { status: 400 }
      );
    }

    // Validation du numéro sénégalais
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Le numéro sénégalais saisi est invalide (doit comporter 9 chiffres commençant par 7)." },
        { status: 400 }
      );
    }

    // RÈGLE DE SÉCURITÉ SERVEUR :
    // Tout compte provenant de PREP (?source=prep ou avec un paramètre d'examen)
    // se voit OBLIGATOIREMENT attribuer le profil "eleve".
    const isFromPrep = source === "prep" || Boolean(exam);
    const enforcedProfileType = isFromPrep ? "eleve" : (profileType === "professionnel" ? "professionnel" : "eleve");

    const supabase = getServiceSupabase();

    // Insérer ou mettre à jour la table public.users
    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: userId,
        name: name || "Utilisateur GSN",
        score: 0,
        profile_type: enforcedProfileType,
        phone: phone ? normalizePhone(phone) : null,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      // Si la colonne phone n'existe pas encore dans users, tenter un insert sans phone
      const { error: fallbackError } = await supabase.from("users").upsert(
        {
          id: userId,
          name: name || "Utilisateur GSN",
          score: 0,
          profile_type: enforcedProfileType,
        },
        { onConflict: "id" }
      );

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      profileType: enforcedProfileType,
      isEnforcedEleve: isFromPrep,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur serveur lors de l'enregistrement du profil" },
      { status: 500 }
    );
  }
}
