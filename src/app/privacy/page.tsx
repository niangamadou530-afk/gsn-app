import Link from "next/link";
import { PREP_WHATSAPP_SUPPORT } from "@/lib/prep-config";

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
              <strong>Espace Parents sécurisé :</strong> L&apos;accès parental s&apos;effectue au moyen d&apos;un code à 6 caractères généré et révocable à tout moment par l&apos;élève. Ce portail présente exclusivement des résumés synthétiques d&apos;assiduité (quiz réalisés dans la semaine, jours actifs, indicateur de régularité sans reproche, moyenne globale réelle des quiz et conseils d&apos;accompagnement bienveillants). Aucun mot de passe, aucun identifiant interne, aucun email personnel d&apos;élève, ni aucun échange privé n&apos;est exposé au parent. Lors de la création ou du renouvellement de ce code, l&apos;élève peut facultativement renseigner l&apos;adresse électronique de son parent ou tuteur (champ <code>parent_email</code> dans la table <code>prep_parent_links</code>). Cette adresse est enregistrée pour associer le suivi légal à l&apos;élève ; aucun courriel automatique n&apos;est envoyé par la plateforme.
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
                <p className="text-slate-600">Résultats aux quiz, annales consultées, flashcards mémorisées, résumés enregistrés (les échanges avec le Coach IA sont éphémères et ne sont pas conservés en base de données).</p>
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
            4. Traitement des requêtes par l&apos;Intelligence Artificielle (Groq)
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Pour générer les explications pédagogiques, les quiz d&apos;entraînement, les flashcards et les corrigés détaillés, la plateforme utilise l&apos;API d&apos;inférence fournie par le prestataire <strong>Groq Inc.</strong>
            </p>
            <p>
              <strong>Ce qui est effectivement transmis au prestataire IA :</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Instructions et contexte pédagogique :</strong> Matière sélectionnée, série d&apos;examen, chapitre du programme officiel sénégalais et type d&apos;exercice demandé.
              </li>
              <li>
                <strong>Messages libres dans le chat Coach IA :</strong> L&apos;intégralité des messages rédigés par l&apos;élève dans la fenêtre de discussion avec le Coach IA est transmise pour permettre la formulation de la réponse. Si l&apos;élève mentionne librement son nom, son établissement ou des situations personnelles dans son texte, ces éléments font partie du contenu envoyé au modèle.
              </li>
              <li>
                <strong>Documents et devoirs soumis pour évaluation :</strong> Lorsqu&apos;un élève utilise les fonctions d&apos;évaluation ou de correction (rédaction de dissertation, commentaire de texte, ou transcription de notes/bulletins scolaires), le texte ou le document extrait est transmis au modèle pour analyse et notation.
              </li>
              <li>
                <strong>Photos, PDF et textes envoyés dans « Générer » :</strong> Les photos de devoirs ou de cahiers, les documents PDF et les textes collés envoyés dans l&apos;outil « Générer » (Mode A) sont transmis à Groq Inc. pour produire le résultat demandé (résumé, quiz ou flashcards). Ces fichiers, photos et textes bruts ne sont pas conservés par GSN (aucun enregistrement sur les serveurs ou en base de données). Seuls les quiz, résumés ou flashcards produits sont conservés sur le compte de l&apos;élève s&apos;il choisit de les sauvegarder.
              </li>
            </ul>
            <p className="text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <strong>Région d&apos;hébergement des serveurs d&apos;inférence Groq :</strong> [À COMPLÉTER : Région des datacenters Groq, ex: États-Unis / Union Européenne].
            </p>
          </div>
        </section>

        {/* Section 5 : Sous-traitants et prestataires techniques */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            5. Sous-traitants techniques et flux réels de données
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Pour assurer l&apos;hébergement, la sécurité et la haute disponibilité de la plateforme, les données transitent auprès des prestataires suivants :
          </p>
          <div className="space-y-3 pt-1 text-xs sm:text-sm">
            {/* Vercel */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Vercel Inc.</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Hébergement Applicatif & Serverless</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Données traitées :</strong> Adresses IP publiques de connexion des utilisateurs, en-têtes HTTP (navigateur, terminal, horodatage), requêtes web et données en transit transitant par les fonctions d&apos;API Next.js (/api/*) faisant l&apos;intermédiaire avec Supabase et Groq.
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Région des serveurs Vercel : [À COMPLÉTER : Région de déploiement des fonctions serverless, ex: cdg1 Paris / fra1 Francfort / iad1 Washington]
              </p>
            </div>

            {/* Supabase */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Supabase Inc.</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Base de données, Auth & Stockage</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Données stockées :</strong> Comptes utilisateurs (numéro de téléphone portable sénégalais, adresse email optionnelle, mot de passe chiffré par Supabase Auth, identifiant UUID), profil scolaire (prénom, examen, série, lycée), progression (scores de quiz, flashcards maîtrisées, résumés enregistrés, date d&apos;examen personnalisée, compteurs d&apos;usage quotidien ; les conversations avec le Coach IA sont éphémères et ne sont pas stockées en base), sécurité (compteur de tentatives de connexion anti-bruteforce, codes de liaison parent-élève) et documents d&apos;annales officielles (PDF).
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Région des serveurs Supabase : [À COMPLÉTER : Région du projet de base de données Supabase, ex: eu-west-3 Paris / eu-central-1 Francfort / us-east-1]
              </p>
            </div>

            {/* Groq */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">Groq Inc.</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Modèles de Langage & Inférence IA</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Données traitées :</strong> Prompts pédagogiques (matière, niveau, série), messages saisis librement par l&apos;élève au Coach IA, ainsi que les photos, documents PDF et textes transmis dans l&apos;outil « Générer » (traitement éphémère d&apos;inférence, non conservés par GSN).
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Région des serveurs Groq : [À COMPLÉTER : Région des clusters de calcul Groq, ex: États-Unis / Union Européenne]
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 : Droits des utilisateurs (Loi n° 2008-12) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            6. Vos droits (Accès, Rectification, Suppression)
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Conformément à la Loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, chaque élève et tuteur légal dispose des droits suivants :
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-1.5 leading-relaxed">
            <li><strong>Droit d&apos;accès et d&apos;information :</strong> Obtenir communication de l&apos;intégralité des données vous concernant.</li>
            <li><strong>Droit de rectification :</strong> Modifier ses informations à tout moment depuis son espace ou via le support.</li>
            <li>
              <strong>Droit de suppression définitive :</strong> Supprimer son compte et l&apos;ensemble de ses données enregistrées sur la plateforme en un clic via le bouton dédié dans l&apos;espace profil. La suppression définitive efface irréversiblement :
              <ul className="list-circle pl-5 mt-1 space-y-0.5 text-xs text-slate-600">
                <li>Le compte utilisateur et les identifiants d&apos;authentification.</li>
                <li>Le profil scolaire de l&apos;élève (série, type d&apos;examen, établissement, auto-évaluation).</li>
                <li>L&apos;historique complet des quiz et scores d&apos;entraînement (<code>quiz_results</code>).</li>
                <li>Toutes les fiches de révision créées par l&apos;élève (<code>flashcards</code>).</li>
                <li>Tous les résumés de cours générés et sauvegardés (<code>prep_resumes</code>).</li>
                <li>Les statistiques et points d&apos;expérience dans l&apos;arène (<code>prep_player_stats</code>).</li>
                <li>Le lien et le code d&apos;accès au portail de suivi des parents (<code>prep_parent_links</code>).</li>
                <li>L&apos;historique des compteurs quotidiens d&apos;utilisation IA (<code>prep_usage_quotidien</code>).</li>
                <li>Les avis et retours formulés (<code>prep_feedback</code>).</li>
                <li>Les journaux de réinitialisation administrative de mot de passe (<code>prep_admin_password_resets</code>).</li>
                <li>Les compteurs temporaires de sécurité anti-bruteforce liés à l&apos;élève (<code>prep_rate_limits</code>).</li>
              </ul>
            </li>
          </ul>
          <p className="text-xs text-slate-600 pt-2">
            Pour exercer ces droits ou pour toute question relative à vos données, vous pouvez contacter notre assistance par WhatsApp au <strong>{PREP_WHATSAPP_SUPPORT.phoneFormatted}</strong> ou par courriel à <strong>[À COMPLÉTER : contact@domaine.sn]</strong>.
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
