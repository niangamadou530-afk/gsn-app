/**
 * Détection stricte et sécurisée du mode Aperçu (Preview)
 * RÈGLES STRICTES :
 * - Le nom d'hôte se termine exactement par ".run.app"
 * - OU est exactement "localhost" ou "127.0.0.1"
 * - Ne reconnaît JAMAIS "vercel.app"
 * - N'utilise PAS de wildcard large comme "ais-"
 * En production (vrai domaine ou Vercel), cette fonction renvoie TOUJOURS false.
 */
export function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();

  // Ne jamais reconnaître vercel.app comme un aperçu
  if (host.endsWith(".vercel.app") || host === "vercel.app") {
    return false;
  }

  // Autorisé uniquement : se termine par .run.app ou exactement localhost / 127.0.0.1
  return (
    host.endsWith(".run.app") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

export const PREVIEW_BANNER_TEXT = "Mode Aperçu GSN PREP · Visualisation de l'interface avec données fictives (inactif en production)";
