import Link from "next/link";
import {
  PREP_CONTACT_EMAIL,
  PREP_LEGAL_CONFIG,
  PREP_WHATSAPP_SUPPORT,
} from "@/lib/prep-config";

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
          <div className="flex items-center gap-3">
            <Link
              href="/prep"
              className="text-xs font-bold text-[#005bbf] hover:underline"
            >
              Accès GSN PREP
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Banner: Cadre Informatique et Libertés Sénégal */}
        <div className="bg-blue-50 border border-blue-200 text-blue-950 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[#005bbf] text-2xl shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="space-y-1">
            <p className="font-black text-sm uppercase tracking-wide text-[#005bbf]">
              Protection des données personnelles · République du Sénégal
            </p>
            <p className="text-xs leading-relaxed text-slate-700">
              Ce document détaille les engagements de confidentialité pris pour
              la plateforme Global Skills Network et son service de préparation
              scolaire GSN PREP, conformément aux principes de la Loi sénégalaise
              n° 2008-12 du 25 janvier 2008 relative à la protection des données
              à caractère personnel.
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
            Dernière mise à jour : 8 octobre 2026 · Dakar, République du Sénégal
          </p>
        </div>

        {/* Section 1 : Responsable de Traitement */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            1. Responsable du traitement des données
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            La présente politique s&apos;applique à l&apos;ensemble des services
            numériques édités sous la dénomination{" "}
            <strong>{PREP_LEGAL_CONFIG.publisher}</strong> et son module de
            révision pour les examens nationaux sénégalais (BAC et BFEM){" "}
            <strong>GSN PREP</strong>.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 space-y-2">
            <p>
              <strong>Éditeur de la plateforme :</strong>{" "}
              {PREP_LEGAL_CONFIG.publisher}
            </p>
            <p>
              <strong>Responsable de la publication et du traitement :</strong>{" "}
              {PREP_LEGAL_CONFIG.responsibleName}
            </p>
            <p>
              <strong>Localisation du siège :</strong>{" "}
              {PREP_LEGAL_CONFIG.address}
            </p>
            <p>
              <strong>Contact officiel :</strong>{" "}
              <a
                href={`mailto:${PREP_CONTACT_EMAIL}`}
                className="font-bold text-[#005bbf] underline"
              >
                {PREP_CONTACT_EMAIL}
              </a>
            </p>
            <p>
              <strong>Assistance WhatsApp officielle :</strong>{" "}
              <span className="font-bold text-slate-900">
                {PREP_LEGAL_CONFIG.supportPhoneFormatted}
              </span>
            </p>
          </div>
        </section>

        {/* Section 2 : Protection spécifique des mineurs et élèves */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
            2. Protection renforcée des élèves et candidats mineurs
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            GSN PREP est conçu pour accompagner la préparation des examens du
            Brevet de Fin d&apos;Études Moyennes (BFEM, collégiens) et du
            Baccalauréat sénégalais (lycéens).
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <li>
              <strong>Accord parental pour les mineurs :</strong> L&apos;accès à
              la plateforme par des candidats mineurs doit être effectué avec
              l&apos;accord préalable ou sous l&apos;accompagnement d&apos;un
              parent ou représentant légal.
            </li>
            <li>
              <strong>Portail de suivi parental sécurisé :</strong> L&apos;accès
              des parents s&apos;effectue uniquement à l&apos;aide d&apos;un code
              d&apos;accès temporaire à 6 lettres, créé directement par
              l&apos;élève et révocable par lui à tout moment. Ce portail ne
              présente que des synthèses d&apos;assiduité utiles (quiz réalisés
              dans la semaine, jours actifs, moyenne des quiz, conseils
              d&apos;encouragement). Aucun mot de passe, aucun identifiant
              interne, aucun email d&apos;élève, ni aucun échange privé
              n&apos;est divulgué.
            </li>
            <li>
              <strong>Adresse électronique du parent :</strong> Lors de la
              création du code d&apos;accès, l&apos;élève peut renseigner de
              manière facultative l&apos;adresse email de son parent pour
              faciliter l&apos;envoi du code. Cette adresse sert uniquement à la
              liaison parentale ; la plateforme n&apos;envoie aucun courriel
              promotionnel ni publicité.
            </li>
            <li>
              <strong>Absence totale de ciblage commercial :</strong> Les
              données scolaires et personnelles des élèves ne sont jamais
              vendues, louées, ni cédées à des annonceurs publicitaires.
            </li>
          </ul>
        </section>

        {/* Section 3 : Catégories de données collectées */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            3. Catégories de données collectées et finalités
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <p>
              Nous appliquons le principe de minimisation en ne collectant que
              les informations strictement nécessaires aux révisions scolaires :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">
                  Compte & Connexion
                </span>
                <p className="text-slate-600">
                  Prénom, nom (ou pseudonyme), numéro de téléphone portable
                  sénégalais (+221) ou adresse email pour la sécurisation du
                  compte.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">
                  Profil Scolaire
                </span>
                <p className="text-slate-600">
                  Examen préparé (BAC ou BFEM), série officielle (S1, S2, L1,
                  L2, STEG, etc.), établissement d&apos;origine (optionnel) et
                  auto-évaluation déclarative.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">
                  Progression & Entraînement
                </span>
                <p className="text-slate-600">
                  Notes et résultats de quiz d&apos;entraînement, fiches et cartes
                  de révision enregistrées, résumés de cours sauvegardés,
                  niveaux et points d&apos;expérience.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-slate-900 block">
                  Sécurité & Assiduité
                </span>
                <p className="text-slate-600">
                  Dates d&apos;activité, compteurs d&apos;utilisation des outils
                  d&apos;intelligence artificielle et compteurs temporaires de
                  protection contre les tentatives abusives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 : Outils d'Intelligence Artificielle */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            4. Fonctionnement de l&apos;Intelligence Artificielle
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Pour formuler des explications pédagogiques claires, produire des
              quiz d&apos;entraînement personnalisés et des corrigés pas à pas,
              la plateforme utilise un service de traitement de langage naturel
              hautes performances.
            </p>
            <p>
              <strong>Fonctionnement respectueux de la vie privée :</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Échanges éphémères avec le Coach IA :</strong> Les
                questions posées au Coach IA sont traitées en temps réel pour
                fournir la réponse pédagogique. Aucun historique de ces
                conversations n&apos;est enregistré dans la base de données.
              </li>
              <li>
                <strong>Documents et photos de cours :</strong> Les photographies
                de devoirs, les extraits de cahiers ou les fichiers de cours
                transmis dans l&apos;espace de révision sont analysés à la volée
                pour produire le quiz ou le résumé demandé. Ces fichiers bruts ne
                sont jamais conservés sur nos serveurs.
              </li>
              <li>
                <strong>Contenus sauvegardés :</strong> Seuls les quiz, résumés
                ou fiches de révision que l&apos;élève décide expressément
                d&apos;enregistrer sont conservés dans son espace personnel.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5 : Prestataires d'infrastructure technique */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            5. Prestataires d&apos;infrastructure technique
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Pour assurer l&apos;hébergement sécurisé, la sauvegarde et la
            disponibilité de la plateforme, nous nous appuyons sur des
            infrastructures cloud modernes et éprouvées :
          </p>
          <div className="space-y-3 pt-1 text-xs sm:text-sm">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="font-extrabold text-slate-900 block">
                Hébergement applicatif sécurisé
              </span>
              <p className="text-slate-600 leading-relaxed">
                Distribution du service web, sécurisation des connexions HTTPS et
                exécution protégée des requêtes applicatives.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="font-extrabold text-slate-900 block">
                Base de données et authentification
              </span>
              <p className="text-slate-600 leading-relaxed">
                Stockage chiffré des profils d&apos;élèves, des mots de passe
                protégés par des fonctions de hachage cryptographique et des
                résultats de révision.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="font-extrabold text-slate-900 block">
                Moteur d&apos;inférence pédagogique IA
              </span>
              <p className="text-slate-600 leading-relaxed">
                Génération en direct des quiz, des synthèses de cours et des
                réponses méthodologiques du tuteur virtuel.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 : Droits des utilisateurs et suppression */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            6. Vos droits (Accès, Rectification, Suppression définitive)
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Conformément à la Loi sénégalaise n° 2008-12, chaque élève et parent
            dispose des droits d&apos;accès, de rectification et de suppression
            totale de ses données personnelles :
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <li>
              <strong>Droit d&apos;accès et d&apos;information :</strong> Savoir
              exactement quelles données sont détenues et comment elles sont
              utilisées pour vos révisions.
            </li>
            <li>
              <strong>Droit de rectification :</strong> Modifier votre profil,
              votre série ou vos coordonnées à tout moment depuis votre compte
              ou avec l&apos;aide du support.
            </li>
            <li>
              <strong>Suppression intégrale et définitive en un clic :</strong>{" "}
              Depuis l&apos;espace « Mon profil élève », tout utilisateur peut
              déclencher la suppression définitive de son compte. Cette action
              efface de manière complète et irréversible :
              <ul className="list-circle pl-5 mt-2 space-y-1 text-slate-600">
                <li>Le compte utilisateur et les identifiants de connexion.</li>
                <li>Le profil scolaire (série, niveau d&apos;examen, lycée).</li>
                <li>L&apos;historique complet des quiz et notes obtenues.</li>
                <li>L&apos;ensemble des fiches et cartes de révision.</li>
                <li>Tous les résumés de cours sauvegardés.</li>
                <li>Les niveaux, points d&apos;expérience et statistiques.</li>
                <li>
                  Le code de liaison parentale et l&apos;adresse email associée.
                </li>
                <li>Les compteurs quotidiens d&apos;utilisation des outils IA.</li>
                <li>Les retours et avis transmis.</li>
                <li>
                  Les demandes d&apos;assistance et réinitialisations traitées.
                </li>
                <li>
                  Les compteurs temporaires de sécurité liés au compte.
                </li>
              </ul>
            </li>
          </ul>

          <div className="pt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">
              Pour toute question ou pour exercer vos droits :
            </p>
            <p>
              • Assistance WhatsApp officielle :{" "}
              <a
                href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 underline"
              >
                {PREP_LEGAL_CONFIG.supportPhoneFormatted}
              </a>
            </p>
            <p>
              • Courriel de contact :{" "}
              <a
                href={`mailto:${PREP_CONTACT_EMAIL}`}
                className="font-bold text-[#005bbf] underline"
              >
                {PREP_CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-800 underline">
            Conditions d&apos;utilisation (CGU)
          </Link>
          <span>·</span>
          <Link href="/prep" className="hover:text-slate-800 underline">
            GSN PREP
          </Link>
          <span>·</span>
          <Link href="/prep/parent" className="hover:text-slate-800 underline">
            Espace Parents
          </Link>
        </div>
        <p>
          © 2026 {PREP_LEGAL_CONFIG.publisher} · {PREP_LEGAL_CONFIG.address}
        </p>
      </footer>
    </div>
  );
}
