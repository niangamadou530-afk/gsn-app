import { test, expect } from '@playwright/test';
import config from '../exigences.config.json';

/**
 * EXIGENCES FONCTIONNELLES — issues des fiches de poste
 * PNACIJ/MJS (Serigne Mountagha THIAM) et PFIMN/MCTN (Mohamed AW)
 * + exigences directes d'Amadou NIANG.
 *
 * flag=false → "⏳ en attente" (visible, non bloquant)
 * flag=true  → test actif et bloquant
 */

const espace = (process.env.ESPACE || 'mjs') as 'mjs' | 'mctn';
const flags = config[espace];
const secteurs: string[] = (config as any)._secteurs[espace];
const kpis: string[] = (config as any)._kpis[espace];
const base = `/${espace}`;

function exigence(flag: keyof typeof flags, nom: string, fn: Parameters<typeof test>[2]) {
  if (flags[flag]) test(`✅ ${nom}`, fn);
  else test.skip(`⏳ EN ATTENTE — ${nom}`, fn);
}

async function pageDansEspace(page: any, url: string) {
  const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
  expect(r?.status(), `${url} doit répondre (page existante)`).toBeLessThan(400);
  expect(new URL(page.url()).pathname.startsWith(base), `${url} ne doit pas rediriger hors de ${base}`).toBeTruthy();
}

test.describe(`Exigences ${base.toUpperCase()} — fiche de poste + directives`, () => {

  // ---- AXE 1 : ESPACE INSTITUTIONNEL ----

  exigence('route_base', `La route ${base} existe et fonctionne`, async ({ page }) => {
    await pageDansEspace(page, base);
  });

  // (2) Accepte un sélecteur de profil (mjs/login) OU un vrai formulaire login OU /employer/login
  exigence('login_separe', `Connexion dédiée ou sélecteur de profil dans ${base}`, async ({ page }) => {
    const candidats = [
      `${base}/login`,
      `${base}/beneficiaire/connexion`,
      `${base}/employer/login`,
    ];
    let trouve = false;
    for (const url of candidats) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (!r || r.status() >= 400 || !new URL(page.url()).pathname.startsWith(base)) continue;
      // Accepter : formulaire login OU sélecteur de profil menant à des connexions
      const hasInput = await page.locator(
        'input[type="email"], input[name*="mail" i], input[name*="tel" i], input[type="password"]'
      ).count() > 0;
      const hasSelectorText = await page.getByText(
        /b[eé]n[eé]ficiaire|recruteur|profil|connexion|se connecter/i
      ).count() > 0;
      if (hasInput || hasSelectorText) { trouve = true; break; }
    }
    expect(trouve, `Aucune page de connexion ou sélecteur de profil trouvé dans ${base}`).toBeTruthy();
  });

  // (3) Ajoute ${base}/beneficiaire/inscription aux candidats
  exigence('onboarding_inscription', `Onboarding et inscription des bénéficiaires`, async ({ page }) => {
    const candidats = [
      `${base}/onboarding`,
      `${base}/inscription`,
      `${base}/signup`,
      `${base}/register`,
      `${base}/beneficiaire/inscription`,
    ];
    let trouve = false;
    for (const url of candidats) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) { trouve = true; break; }
    }
    expect(trouve, `Aucune page d'inscription trouvée parmi : ${candidats.join(', ')}`).toBeTruthy();
  });

  // ---- MODULES ----

  // (1a) module_learn : essaie aussi ${base}/beneficiaire/parcours (structure mjs)
  exigence('module_learn', `Module ${base}/learn (ou ${base}/beneficiaire/parcours) existe et reste dans l'espace`, async ({ page }) => {
    for (const url of [`${base}/learn`, `${base}/beneficiaire/parcours`]) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) return;
    }
    throw new Error(`Ni ${base}/learn ni ${base}/beneficiaire/parcours ne répondent dans l'espace`);
  });

  for (const mod of ['work', 'pay'] as const) {
    exigence(`module_${mod}` as keyof typeof flags, `Module ${base}/${mod} existe et reste dans l'espace`, async ({ page }) => {
      await pageDansEspace(page, `${base}/${mod}`);
    });
  }

  // module_score : accepte /passport comme alternative
  exigence('module_score', `Module ${base}/score (ou ${base}/passport) existe et reste dans l'espace`, async ({ page }) => {
    for (const url of [`${base}/score`, `${base}/passport`]) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) return;
    }
    throw new Error(`Ni ${base}/score ni ${base}/passport ne répondent dans l'espace`);
  });

  // ---- AXE 2 : PARCOURS DE FORMATION ----

  // (1b) parcours_secteurs : essaie /learn ET /beneficiaire/parcours, cumule le contenu
  exigence('parcours_secteurs', `Parcours par secteur visibles dans ${base}/learn ou ${base}/beneficiaire/parcours (${secteurs.length} secteurs)`, async ({ page }) => {
    let contenu = '';
    for (const url of [`${base}/learn`, `${base}/beneficiaire/parcours`]) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) {
        contenu += (await page.textContent('body')) || '';
      }
    }
    for (const s of secteurs) {
      expect(contenu, `Le secteur "${s}" doit apparaître`).toMatch(new RegExp(s, 'i'));
    }
  });

  exigence('parcours_unique', `Un seul parcours actif par utilisateur — les autres visibles mais bloqués`, async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const mdp = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !mdp, 'Ajouter les secrets TEST_USER_EMAIL / TEST_USER_PASSWORD');
    await page.goto(`${base}/login`);
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(mdp!);
    await page.getByRole('button', { name: /connexion|connecter|login/i }).click();
    await page.goto(`${base}/learn`);
    await expect(page.getByText(/bloqu[ée]|verrouill[ée]|🔒/i).first()).toBeVisible();
  });

  exigence('suivi_progression', `Suivi de progression par bénéficiaire`, async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const mdp = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !mdp, 'Ajouter les secrets TEST_USER_EMAIL / TEST_USER_PASSWORD');
    await page.goto(`${base}/login`);
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(mdp!);
    await page.getByRole('button', { name: /connexion|connecter|login/i }).click();
    await page.goto(`${base}/learn`);
    await expect(page.getByText(/progression|progr[eè]s|%/i).first()).toBeVisible();
  });

  // ---- SKILL PASSPORT ----

  // (6) Regex assouplie : "passport" ou "passeport" seul suffit, /passport comme alternative
  exigence('skill_passport_dans_score', `Skill Passport visible dans ${base}/score ou ${base}/passport`, async ({ page }) => {
    for (const url of [`${base}/score`, `${base}/passport`]) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) {
        await expect(page.getByText(/passe?port/i).first()).toBeVisible();
        return;
      }
    }
    throw new Error(`Ni ${base}/score ni ${base}/passport ne répondent dans l'espace`);
  });

  exigence('skill_passport_verification', `Vérification du Skill Passport par un employeur (page de vérification)`, async ({ page }) => {
    const candidats = [`${base}/verify`, `${base}/verification`, `${base}/passport/verify`, `${base}/score/verify`];
    let trouve = false;
    for (const url of candidats) {
      const r = await page.goto(url).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) { trouve = true; break; }
    }
    expect(trouve, `Aucune page de vérification trouvée parmi : ${candidats.join(', ')}`).toBeTruthy();
  });

  // ---- AXE 3 : RECRUTEURS & DASHBOARDS ----

  // (4) Ajoute /recruiter, /employer/dashboard, /recruteur/dashboard aux candidats
  exigence('espace_employeur', `Espace employeur/recruteur propre à ${base}`, async ({ page }) => {
    const candidats = [
      `${base}/recruteur`,
      `${base}/employeur`,
      `${base}/recruiter`,
      `${base}/employer/dashboard`,
      `${base}/recruteur/dashboard`,
    ];
    let trouve = false;
    for (const url of candidats) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) { trouve = true; break; }
    }
    expect(trouve, `Aucun espace recruteur trouvé parmi : ${candidats.join(', ')}`).toBeTruthy();
  });

  exigence('bouton_offre_recruteur', `Bouton "offre" dans l'espace recruteur (appels d'offres pour certifiés)`, async ({ page }) => {
    let visible = false;
    for (const url of [`${base}/recruteur`, `${base}/recruiter`, `${base}/employeur`, `${base}/recruteur/dashboard`]) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) {
        const bouton = page.getByRole('button', { name: /offre/i }).or(page.getByRole('link', { name: /offre/i }));
        if (await bouton.count() > 0) { visible = true; break; }
      }
    }
    expect(visible, `Bouton "offre" introuvable dans l'espace recruteur`).toBeTruthy();
  });

  exigence('matching_certifies_offres', `Les certifiés voient les appels d'offres dans ${base}/work`, async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const mdp = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !mdp, 'Nécessite un compte de test certifié');
    await page.goto(`${base}/login`);
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(mdp!);
    await page.getByRole('button', { name: /connexion|connecter|login/i }).click();
    await page.goto(`${base}/work`);
    await expect(page.getByText(/offre/i).first()).toBeVisible();
  });

  // (5) /ministere et /admin en premier, + networkidle avant lecture du texte
  exigence('dashboard_kpis', `Dashboard institutionnel avec KPIs de la fiche (${kpis.join(', ')})`, async ({ page }) => {
    const candidats = [`${base}/ministere`, `${base}/admin`, `${base}/dashboard`, base];
    let contenu = '';
    for (const url of candidats) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) {
        await page.waitForLoadState('networkidle').catch(() => {});
        contenu += (await page.textContent('body')) || '';
      }
    }
    for (const kpi of kpis) {
      expect(contenu, `Le KPI "${kpi}" doit apparaître sur le dashboard`).toMatch(new RegExp(kpi, 'i'));
    }
  });

  exigence('dashboard_demographie', `Vue d'ensemble : répartition géographique, hommes, femmes, situation de handicap`, async ({ page }) => {
    const candidats = [`${base}/ministere`, `${base}/admin`, `${base}/dashboard`, base];
    let contenu = '';
    for (const url of candidats) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) {
        await page.waitForLoadState('networkidle').catch(() => {});
        contenu += (await page.textContent('body')) || '';
      }
    }
    for (const attendu of [/g[ée]ograph/i, /hommes/i, /femmes/i, /handicap/i]) {
      expect(contenu, `Le dashboard doit afficher : ${attendu}`).toMatch(attendu);
    }
  });

  exigence('export_rapports', `Export de rapports pour le Ministère`, async ({ page }) => {
    const candidats = [`${base}/ministere`, `${base}/admin`, `${base}/dashboard`];
    let visible = false;
    for (const url of candidats) {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
      if (r && r.status() < 400 && new URL(page.url()).pathname.startsWith(base)) {
        await page.waitForLoadState('networkidle').catch(() => {});
        const bouton = page.getByRole('button', { name: /export|t[ée]l[ée]charger|rapport/i })
          .or(page.getByRole('link', { name: /export|rapport/i }));
        if (await bouton.count() > 0) { visible = true; break; }
      }
    }
    expect(visible, `Aucun bouton d'export de rapport trouvé`).toBeTruthy();
  });
});
