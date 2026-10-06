/**
 * Vérification stricte de l'administrateur GSN côté serveur
 * L'adresse email de l'administrateur est configurée via la variable d'environnement ADMIN_EMAIL sur Vercel.
 */
export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "niangamadou530@gmail.com").trim().toLowerCase();
}

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const configured = getAdminEmail();
  return Boolean(configured && email.trim().toLowerCase() === configured);
}
