import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isDisposableEmail } from "@/lib/securityUtils";
import { isValidPhone, normalizePhone } from "@/lib/phoneUtils";
import {
  GSN_SIGNUP_OPEN_PROFILES,
  GSN_SIGNUP_CLOSED_MESSAGE,
  isSignupProfileOpen,
} from "@/lib/prep-config";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/**
 * Route sécurisée côté serveur pour enregistrer ou synchroniser le profil d'un utilisateur
 * PARTIE K6 :
 * - Seul le profil "eleve" (défini dans GSN_SIGNUP_OPEN_PROFILES) est accepté.
 * - Tout profil non autorisé (ex: "professionnel", "employer", etc.) est REFUSÉ avec GSN_SIGNUP_CLOSED_MESSAGE.
 * - Si aucun profil n'est fourni ou s'il est vide, le profil "eleve" est appliqué par défaut.
 * - Ne fait jamais confiance au client.
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

    // RÈGLE CRITIQUE SERVEUR PARTIE K6 :
    // Vérification de la liste des profils ouverts
    const requestedProfile = (profileType || "").trim().toLowerCase();

    // Si le client tente d'enregistrer explicitement un profil fermé (ex: "professionnel")
    if (requestedProfile && !isSignupProfileOpen(requestedProfile)) {
      return NextResponse.json(
        {
          error: GSN_SIGNUP_CLOSED_MESSAGE,
          closed: true,
          openProfiles: GSN_SIGNUP_OPEN_PROFILES,
        },
        { status: 403 }
      );
    }

    // Profil effectif : 'eleve' par défaut si absent ou vide
    const enforcedProfileType = isSignupProfileOpen(requestedProfile)
      ? requestedProfile
      : "eleve";

    const supabase = getServiceSupabase();

    // Insérer ou mettre à jour la table public.users
    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: userId,
        name: name || "Élève GSN PREP",
        score: 0,
        profile_type: enforcedProfileType,
        phone: phone ? normalizePhone(phone) : null,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      // Fallback sans champ phone si la table est en structure basique
      const { error: fallbackError } = await supabase.from("users").upsert(
        {
          id: userId,
          name: name || "Élève GSN PREP",
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
      isOpen: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur serveur lors de l'enregistrement du profil" },
      { status: 500 }
    );
  }
}
