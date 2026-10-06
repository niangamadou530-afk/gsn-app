import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#005bbf]/15 selection:text-[#005bbf]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#005bbf] text-white flex items-center justify-center font-black text-xs">
              GSN
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              GLOBAL SKILLS NETWORK
            </span>
          </Link>
          <Link href="/prep" className="text-xs font-bold text-[#005bbf] hover:underline">
            Accès GSN PREP
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Banner: Brouillon Juridique */}
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">
            warning
          </span>
          <div className="space-y-1">
            <p className="font-black text-sm uppercase tracking-wide">
              Document de travail — Brouillon à faire relire par un juriste
            </p>
            <p className="text-xs leading-relaxed text-amber-800">
              Ce document constitue une base de travail préparée pour la plateforme GSN et son module éducatif GSN PREP. Il doit être validé et complété par un conseiller juridique avant toute mise en conformité formelle auprès de la Commission des Données Personnelles (CDP) du Sénégal.
            </p>
          </div>
        </div>

        {/* Document Header */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <span className="text-xs font-black uppercase tracking-widest text-[#005bbf]">
            Protection des données personnelles
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Politique de Confidentialité et Protection de la Vie Privée
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dernière mise à jour : 4 octobre 2026 · Conforme aux principes de la Loi sénégalaise n° 2008-12
          </p>
        </div>

        {/* Section 1 : Responsable de Traitement */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            1. Responsable du traitement des données
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            La présente politique s&apos;applique à l&apos;ensemble des services numériques édités sous la marque <strong>Global Skills Network (GSN)</strong> et son programme de révision aux examens nationaux <strong>GSN PREP</strong>.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5 font-mono">
            <p><strong>Raison sociale :</strong> [À COMPLÉTER : Dénomination légale de l&apos;entité éditrice au Sénégal]</p>
            <p><strong>Numéro NINEA / RCCM :</strong> [À COMPLÉTER : Numéro d&apos;immatriculation]</p>
            <p><strong>Siège social :</strong> [À COMPLÉTER : Adresse physique du siège, Dakar, Sénégal]</p>
            <p><strong>Délégué à la Protection des Données (DPO) :</strong> [À COMPLÉTER : email de contact officiel, ex : dpo@domaine.sn]</p>
            <p><strong>Déclaration CDP :</strong> [À COMPLÉTER : Numéro de déclaration / récépissé auprès de la Commission des Données Personnelles du Sénégal]</p>
          </div>
        </section>

        {/* Section 2 : Protection spécifique des mineurs et élèves */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
            2. Protection renforcée des élèves et candidats mineurs
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            GSN PREP est destiné à la préparation des examens du BFEM (élèves de 3ème de collège, généralement âgés de 13 à 16 ans) et du Baccalauréat (élèves de Terminale de lycée, généralement âgés de 16 à 19 ans).
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <li>
              <strong>Consentement parental :</strong> Pour les élèves âgés de moins de 18 ans, l&apos;utilisation de la plateforme doit être effectuée avec l&apos;accord préalable ou sous la supervision d&apos;un parent ou tuteur légal.
            </li>
            <li>
              <strong>Espace Parents sécurisé :</strong> L&apos;accès parental s&apos;effectue exclusivement au moyen d&apos;un code temporaire à 6 caractères généré par l&apos;élève. Les parents ne créent pas de mot de passe et n&apos;ont accès qu&apos;aux indicateurs pédagogiques (assiduité, moyennes par matière).
            </li>
            <li>
              <strong>Zéro profilage publicitaire :</strong> Aucune donnée d&apos;élève n&apos;est vendue, louée ou cédée à des tiers pour des finalités commerciales ou de ciblage publicitaire.
            </li>
          </ul>
        </section>

        {/* Section 3 : Données collectées */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            3. Données collectées et finalités
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <p>Nous limitons la collecte au strict minimum nécessaire à l&apos;apprentissage :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">Identité & Connexion</span>
                <p className="text-slate-600">Prénom, Nom (ou pseudo d&apos;élève), numéro de téléphone portable sénégalais (+221), adresse email (facultative).</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">Profil Scolaire</span>
                <p className="text-slate-600">Examen préparé (BAC ou BFEM), série choisie (S1, S2, L1, L2, STEG, etc.), établissement scolaire (optionnel).</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">Progression Pédagogique</span>
                <p className="text-slate-600">Résultats aux quiz, annales consultées, flashcards mémorisées, historique des échanges avec le Coach IA.</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">Sécurité & Journalisation</span>
                <p className="text-slate-600">Horodatages de connexion, tentatives de connexion (anti-bruteforce), quotas d&apos;utilisation d&apos;IA par jour.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 : Outils d'Intelligence Artificielle */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            4. Traitement des requêtes par l&apos;Intelligence Artificielle
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Les questions posées au Coach IA et les requêtes de génération de quiz sont traitées de manière éphémère par nos modèles d&apos;inférence pédagogique. Nous ne transmettons aucune donnée nominative (numéro de téléphone, nom complet) dans les instructions envoyées aux processeurs de langage.
          </p>
        </section>

        {/* Section 5 : Droits des utilisateurs (Loi n° 2008-12) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            5. Vos droits (Accès, Rectification, Suppression)
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Conformément à la Loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, chaque élève et tuteur légal dispose des droits suivants :
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-1.5 leading-relaxed">
            <li><strong>Droit d&apos;accès et d&apos;information :</strong> Obtenir communication de l&apos;intégralité des données vous concernant.</li>
            <li><strong>Droit de rectification :</strong> Modifier ses informations à tout moment depuis son espace ou via le support.</li>
            <li><strong>Droit de suppression définitive :</strong> Supprimer son compte et l&apos;ensemble des données associées en un clic via le bouton dédié dans l&apos;espace profil.</li>
          </ul>
          <p className="text-xs text-slate-600 pt-2">
            Pour exercer ces droits ou pour toute question relative à vos données, vous pouvez contacter notre assistance par WhatsApp au <strong>+221 78 124 65 04</strong> ou par courriel à <strong>[À COMPLÉTER : contact@domaine.sn]</strong>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2026 GSN (Global Skills Network) · Tous droits réservés · Dakar, Sénégal</p>
      </footer>
    </div>
  );
}
