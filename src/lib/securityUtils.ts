/**
 * Utilitaires de sécurité et de protection pour l'authentification GSN
 * - Détection et blocage des emails jetables
 * - Limitation de débit (rate limiting) par appareil/navigateur
 * - Normalisation et messages chaleureux en français
 */

// Liste exhaustive des domaines d'emails jetables et temporaires les plus courants
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "tempmail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "mailinator.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "trashmail.com",
  "trashmail.net",
  "throwawaymail.com",
  "sharklasers.com",
  "dispostable.com",
  "getnada.com",
  "fakemailgenerator.com",
  "mohmal.com",
  "crazymailing.com",
  "emailondeck.com",
  "generator.email",
  "dropmail.me",
  "mintemail.com",
  "mytemp.email",
  "tempail.com",
  "burnermail.io",
  "inboxkitten.com",
  "mailnull.com",
  "spam4.me",
  "bccto.me",
  "chacuo.net",
]);

/**
 * Vérifie si une adresse email provient d'un service jetable / temporaire.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];

  if (DISPOSABLE_DOMAINS.has(domain)) return true;

  // Détection des sous-domaines (ex: *.mailinator.com)
  for (const disposable of DISPOSABLE_DOMAINS) {
    if (domain.endsWith("." + disposable)) return true;
  }

  // Motifs suspects fréquents
  if (/^(temp|trash|fake|disposable|throwaway|burner|spam)/.test(domain)) {
    return true;
  }

  return false;
}

/**
 * Limite de débit côté client (par empreinte d'appareil / session)
 * Protège contre le spam d'inscription / bruteforce
 */
export function checkClientRateLimit(
  actionKey: "signup" | "login",
  maxAttempts: number = 5,
  windowMinutes: number = 5
): { allowed: boolean; remainingAttempts: number; waitMinutes?: number } {
  if (typeof window === "undefined") {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  const storageKey = `gsn_rate_${actionKey}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  try {
    const raw = window.localStorage.getItem(storageKey);
    const record: { timestamps: number[] } = raw ? JSON.parse(raw) : { timestamps: [] };

    // Filtrer les tentatives expirées
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= maxAttempts) {
      const oldest = validTimestamps[0];
      const waitMs = windowMs - (now - oldest);
      const waitMinutes = Math.max(1, Math.ceil(waitMs / (60 * 1000)));
      return { allowed: false, remainingAttempts: 0, waitMinutes };
    }

    return {
      allowed: true,
      remainingAttempts: maxAttempts - validTimestamps.length,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts };
  }
}

/**
 * Enregistre une tentative dans le limiteur de débit
 */
export function recordClientAttempt(actionKey: "signup" | "login"): void {
  if (typeof window === "undefined") return;
  const storageKey = `gsn_rate_${actionKey}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // Garder 15 minutes d'historique max

  try {
    const raw = window.localStorage.getItem(storageKey);
    const record: { timestamps: number[] } = raw ? JSON.parse(raw) : { timestamps: [] };
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    record.timestamps.push(now);
    window.localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Silencieux si localStorage n'est pas disponible
  }
}

/**
 * Réinitialise le compteur de débit après un succès
 */
export function resetClientRateLimit(actionKey: "signup" | "login"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`gsn_rate_${actionKey}`);
  } catch {
    // Silencieux
  }
}

/**
 * Traduction conviviale et chaleureuse des erreurs Supabase Auth en français
 */
export function getFriendlyAuthErrorMessage(
  rawError: string,
  authMethod: "email" | "phone"
): { message: string; isAlreadyRegistered?: boolean } {
  const err = (rawError || "").toLowerCase();

  if (
    err.includes("user already registered") ||
    err.includes("already registered") ||
    err.includes("email already in use") ||
    err.includes("phone number already registered")
  ) {
    return {
      message:
        authMethod === "phone"
          ? "Ce numéro est déjà inscrit. Veux-tu te connecter ?"
          : "Cette adresse email est déjà inscrite. Veux-tu te connecter ?",
      isAlreadyRegistered: true,
    };
  }

  if (
    err.includes("invalid login credentials") ||
    err.includes("invalid credentials") ||
    err.includes("invalid username or password")
  ) {
    return {
      message:
        authMethod === "phone"
          ? "Numéro ou mot de passe incorrect. Vérifie ta saisie."
          : "Adresse email ou mot de passe incorrect. Vérifie ta saisie.",
    };
  }

  if (err.includes("password should be at least")) {
    return {
      message: "Ton mot de passe doit comporter au moins 6 caractères pour protéger ton compte.",
    };
  }

  if (err.includes("rate limit") || err.includes("too many requests")) {
    return {
      message: "Trop de tentatives successives. Patiente 2 minutes avant de réessayer.",
    };
  }

  if (err.includes("network") || err.includes("failed to fetch")) {
    return {
      message: "Problème de connexion internet. Vérifie ton réseau et réessaie.",
    };
  }

  return {
    message: rawError || "Une erreur est survenue lors de l'opération. Réessaie.",
  };
}
