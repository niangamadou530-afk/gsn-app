import { supabase } from "@/lib/supabase";
import {
  GSN_CLOSED_SPACES_GUARD,
  isAccountAllowedInClosedSpaces,
  GSN_CLOSED_SPACE_ACCESS_MESSAGE,
} from "@/lib/prep-config";

export interface SpaceAccessCheckResult {
  allowed: boolean;
  needsRedirect: boolean;
  redirectTo?: string;
  message?: string;
  isStudent?: boolean;
}

/**
 * Garde d'entrée unifiée pour LEARN et PAY (Partie K7)
 * Règle :
 * 1. Si pas de session -> redirection vers /login
 * 2. Si compte créé avant la date pivot (GSN_CLOSED_SPACES_CUTOFF) -> autorisé (testeur)
 * 3. Si compte créé à partir de la date pivot -> refusé :
 *    - Si l'utilisateur est un élève PREP (profil 'eleve') -> redirection vers /prep
 *    - Sinon -> redirection vers /login avec message explicite
 */
export async function checkClosedSpaceAccess(): Promise<SpaceAccessCheckResult> {
  if (!GSN_CLOSED_SPACES_GUARD) {
    return { allowed: true, needsRedirect: false };
  }

  try {
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user) {
      return {
        allowed: false,
        needsRedirect: true,
        redirectTo: "/login",
      };
    }

    const userCreatedAt = auth.user.created_at;
    const isAllowed = isAccountAllowedInClosedSpaces(userCreatedAt);

    if (isAllowed) {
      return { allowed: true, needsRedirect: false };
    }

    // Le compte a été créé après la date de coupure : déterminer la destination de repli
    // Vérifier si le compte a un profil élève dans public.users
    let isStudent = false;
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("profile_type")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile?.profile_type === "eleve") {
        isStudent = true;
      }
    } catch {
      // Ignorer l'erreur et rediriger par précaution
    }

    return {
      allowed: false,
      needsRedirect: true,
      redirectTo: isStudent ? "/prep" : "/login",
      message: GSN_CLOSED_SPACE_ACCESS_MESSAGE,
      isStudent,
    };
  } catch {
    return {
      allowed: false,
      needsRedirect: false,
      message: GSN_CLOSED_SPACE_ACCESS_MESSAGE,
    };
  }
}
