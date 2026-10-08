import Link from "next/link";
import {
  PREP_CONTACT_EMAIL,
  PREP_LEGAL_CONFIG,
  PREP_WHATSAPP_SUPPORT,
} from "@/lib/prep-config";

export default function TermsPage() {
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
        {/* Document Header */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <span className="text-xs font-black uppercase tracking-widest text-[#005bbf]">
            Conditions d&apos;utilisation
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dernière mise à jour : 8 octobre 2026 · {PREP_LEGAL_CONFIG.address}
          </p>
        </div>

        {/* Section 1 : Objet */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            1. Objet et présentation du service
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            La plateforme <strong>{PREP_LEGAL_CONFIG.publisher}</strong> met à
            disposition des élèves et candidats sénégalais préparant les examens
            nationaux du Baccalauréat (BAC) et du Brevet de Fin d&apos;Études
            Moyennes (BFEM) un module pédagogique gratuit d&apos;entraînement
            dénommé <strong>GSN PREP</strong>.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Le service propose la consultation d&apos;annales d&apos;épreuves
            officielles, des corrigés types numérisés, des quiz interactifs
            d&apos;entraînement, des fiches de révision et un tuteur pédagogique
            virtuel.
          </p>
        </section>

        {/* Section 2 : Accès et Inscription */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            2. Modalités d&apos;accès et compte utilisateur
          </h2>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <li>
              L&apos;inscription à GSN PREP est accessible au moyen d&apos;un
              numéro de téléphone mobile (+221) ou d&apos;une adresse email
              valide.
            </li>
            <li>
              L&apos;élève s&apos;engage à renseigner des informations loyales
              (prénom usuel, examen et série préparés) afin de recevoir un
              programme adapté à son niveau.
            </li>
            <li>
              Le compte est strictement individuel. L&apos;élève est responsable
              de la confidentialité de son mot de passe.
            </li>
            <li>
              En cas d&apos;oubli de ses identifiants ou de besoin d&apos;aide,
              l&apos;élève peut solliciter l&apos;assistance officielle via
              WhatsApp au{" "}
              <strong>{PREP_LEGAL_CONFIG.supportPhoneFormatted}</strong> ou par
              courriel à{" "}
              <a
                href={`mailto:${PREP_CONTACT_EMAIL}`}
                className="text-[#005bbf] font-bold underline"
              >
                {PREP_CONTACT_EMAIL}
              </a>
              .
            </li>
          </ul>
        </section>

        {/* Section 3 : Propriété intellectuelle des annales et épreuves */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
            3. Propriété intellectuelle et épreuves officielles
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Les sujets des épreuves du Baccalauréat et du BFEM constituent des
            documents publics issus de l&apos;Office du Baccalauréat et des
            directions ministérielles en charge des examens au Sénégal.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Leur mise à disposition sur GSN PREP est effectuée à des{" "}
            <strong>fins exclusivement pédagogiques, non commerciales et d&apos;intérêt public</strong>
            , afin de garantir l&apos;égalité d&apos;accès aux ressources pour
            tous les élèves. Les corrigés originaux, synthèses méthodologiques et
            modules interactifs développés par GSN demeurent la propriété de la
            plateforme.
          </p>
        </section>

        {/* Section 4 : Règles d'usage des outils d'IA */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            4. Usage loyal et équitable des outils d&apos;assistance IA
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Le Coach IA est un tuteur virtuel d&apos;accompagnement à la
            révision scolaire. L&apos;élève s&apos;interdit toute formulation
            injurieuse, diffamatoire ou contraire aux règles de respect et de
            sécurité.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Afin de préserver la qualité de service et la disponibilité pour
            l&apos;ensemble de la communauté d&apos;élèves, des quotas
            quotidiens d&apos;utilisation équitable sont appliqués à chaque
            compte.
          </p>
        </section>

        {/* Section 5 : Droit applicable et litiges */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            5. Droit applicable et juridiction compétente
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Les présentes Conditions Générales d&apos;Utilisation sont régies
            par le droit applicable en <strong>République du Sénégal</strong>.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            En cas de difficulté relative à l&apos;utilisation des services, les
            parties recherchent en priorité un règlement amiable avec
            l&apos;équipe de GSN à Dakar.
          </p>
        </section>

        {/* Section 6 : Contact officiel */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            6. Contacts et éditeur
          </h2>
          <div className="text-xs sm:text-sm text-slate-700 space-y-1 leading-relaxed">
            <p>
              <strong>Éditeur :</strong> {PREP_LEGAL_CONFIG.publisher}
            </p>
            <p>
              <strong>Responsable :</strong> {PREP_LEGAL_CONFIG.responsibleName}
            </p>
            <p>
              <strong>Courriel :</strong>{" "}
              <a
                href={`mailto:${PREP_CONTACT_EMAIL}`}
                className="text-[#005bbf] font-bold underline"
              >
                {PREP_CONTACT_EMAIL}
              </a>
            </p>
            <p>
              <strong>Assistance WhatsApp :</strong>{" "}
              <a
                href={PREP_WHATSAPP_SUPPORT.getGeneralHelpUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold underline"
              >
                {PREP_LEGAL_CONFIG.supportPhoneFormatted}
              </a>
            </p>
            <p>
              <strong>Siège :</strong> {PREP_LEGAL_CONFIG.address}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-slate-800 underline">
            Politique de confidentialité
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
