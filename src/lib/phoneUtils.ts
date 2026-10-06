/**
 * Utilitaires pour numéros de téléphone sénégalais (+221)
 * Supporte : Orange (77, 78), Free (76), Expresso (70), Promobile/Hayba (75)
 * Tolère la saisie avec ou sans indicatif (+221, 00221, 221) et avec 0 initial (077...)
 */

function extractSenegaleseLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00221")) {
    digits = digits.slice(5);
  } else if (digits.startsWith("221")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Transforme un numéro sénégalais en email factice pour Supabase Auth.
 * L'élève ne voit jamais cet email — c'est purement interne.
 */
export function phoneToFakeEmail(raw: string): string {
  const local = extractSenegaleseLocalDigits(raw);
  const normalized = `221${local}`;
  return `${normalized}@gsnprep.local`;
}

/** Retourne "+221XXXXXXXXX" pour stockage dans la base. */
export function normalizePhone(raw: string): string {
  const local = extractSenegaleseLocalDigits(raw);
  return `+221${local}`;
}

/**
 * Valide un numéro sénégalais.
 * Mobile sénégalais : 9 chiffres commençant par 7 (ex: 77, 78, 76, 75, 70)
 */
export function isValidPhone(raw: string): boolean {
  if (!raw) return false;
  const local = extractSenegaleseLocalDigits(raw);
  return /^7[0-9]{8}$/.test(local);
}
