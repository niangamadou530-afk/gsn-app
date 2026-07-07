import { test, expect } from '@playwright/test';

/**
 * EXIGENCE N°1 — ISOLATION TOTALE (toujours active, jamais en attente)
 * Tout reste dans l'espace /mjs ou /mctn. Aucun lien, aucune redirection
 * ne doit faire basculer l'utilisateur vers le grand espace GSN.
 */

const espace = process.env.ESPACE || 'mjs';
const base = `/${espace}`;

// Routes du grand espace strictement interdites depuis un espace institutionnel
const ROUTES_INTERDITES = [
  '/dashboard', '/learn', '/work', '/pay', '/score',
  '/login', '/signup', '/profile', '/demsg', '/mairie',
];

test.describe(`Isolation de l'espace ${base}`, () => {
  test(`Aucun lien ne sort de ${base} (exploration automatique)`, async ({ page }) => {
    const aVisiter: string[] = [base];
    const visites = new Set<string>();
    const erreurs: string[] = [];

    while (aVisiter.length > 0 && visites.size < 40) {
      const url = aVisiter.pop()!;
      if (visites.has(url)) continue;
      visites.add(url);

      const reponse = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (!reponse || reponse.status() >= 400) continue;

      // 1. Vérifier qu'on n'a pas été REDIRIGÉ hors de l'espace
      const cheminActuel = new URL(page.url()).pathname;
      if (!cheminActuel.startsWith(base)) {
        erreurs.push(`❌ REDIRECTION HORS ESPACE : ${url} → ${cheminActuel}`);
        continue;
      }

      // 2. Vérifier chaque lien de la page
      const liens = await page.$$eval('a[href]', (els) =>
        els.map((e) => e.getAttribute('href') || '')
      );
      for (const href of liens) {
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        const chemin = href.split('?')[0];
        if (!chemin.startsWith(base)) {
          erreurs.push(`❌ LIEN INTERDIT sur ${url} : "${href}" pointe hors de ${base}`);
        } else if (!visites.has(chemin)) {
          aVisiter.push(chemin);
        }
      }
    }

    expect(erreurs, `Fuites détectées hors de ${base} :\n${erreurs.join('\n')}`).toHaveLength(0);
  });

  test(`Les routes du grand espace ne sont pas accessibles en navigant depuis ${base}`, async ({ page }) => {
    // Chaque page de l'espace ne doit contenir aucun bouton/lien vers le grand espace
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    for (const route of ROUTES_INTERDITES) {
      const lien = page.locator(`a[href="${route}"], a[href^="${route}/"]`);
      await expect(lien, `Lien vers le grand espace détecté : ${route}`).toHaveCount(0);
    }
  });
});
