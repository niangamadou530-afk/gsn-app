/**
 * Transforme un numéro sénégalais en email factice pour Supabase Auth.
 * L'élève ne voit jamais cet email — c'est purement interne.
 */
export function phoneToFakeEmail(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let normalized: string;
  if (digits.startsWith("00221")) {
    normalized = digits.slice(2);       // "00221..." → "221..."
  } else if (digits.startsWith("221")) {
    normalized = digits;
  } else {
    normalized = "221" + digits;        // "77XXXXXXX" → "22177XXXXXXX"
  }
  return `${normalized}@gsnprep.local`;
}

/** Retourne "+221XXXXXXXXX" pour stockage dans la base. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00221")) return "+" + digits.slice(2);
  if (digits.startsWith("221"))   return "+" + digits;
  return "+221" + digits;
}

/**
 * Valide un numéro sénégalais.
 * Accepte : "77 123 45 67", "+221 77 123 45 67", "221771234567", "00221771234567"
 */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("00221"))    local = digits.slice(5);
  else if (digits.startsWith("221")) local = digits.slice(3);
  // Mobile sénégalais : 9 chiffres commençant par 7
  return /^7[0-9]{8}$/.test(local);
}
