import Link from "next/link";

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
              Les présentes Conditions Générales d&apos;Utilisation (CGU) sont rédigées pour encadrer l&apos;usage de la plateforme GSN et du service de révision GSN PREP. Elles doivent être soumises à la validation d&apos;un conseil juridique qualifié en droit sénégalais des technologies de l&apos;information.
            </p>
          </div>
        </div>

        {/* Document Header */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <span className="text-xs font-black uppercase tracking-widest text-[#005bbf]">
            Conditions d&apos;utilisation
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dernière mise à jour : 4 octobre 2026 · République du Sénégal
          </p>
        </div>

        {/* Section 1 : Objet */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            1. Objet et présentation du service
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            La plateforme <strong>GSN (Global Skills Network)</strong> met à disposition des candidats sénégalais aux examens nationaux du Baccalauréat (BAC) et du Brevet de Fin d&apos;Études Moyennes (BFEM) un module pédagogique gratuit dénommé <strong>GSN PREP</strong>.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Le service comprend l&apos;accès à des annales d&apos;épreuves officielles, des corrigés types numérisés, des quiz interactifs d&apos;entraînement, des fiches de mémorisation (flashcards), un simulateur de moyenne indicatif et une assistance pédagogique assistée par Intelligence Artificielle.
          </p>
        </section>

        {/* Section 2 : Accès et Inscription */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            2. Modalités d&apos;accès et compte utilisateur
          </h2>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
            <li>L&apos;inscription à GSN PREP est accessible au moyen d&apos;un numéro de téléphone mobile sénégalais (+221) ou d&apos;une adresse email.</li>
            <li>L&apos;élève s&apos;engage à fournir des informations loyales (prénom ou nom usuel, série et examen réels).</li>
            <li>L&apos;accès est individuel. L&apos;élève est responsable du maintien de la confidentialité de son mot de passe.</li>
            <li>En cas d&apos;oubli d&apos;identifiants, l&apos;élève peut solliciter l&apos;assistance officielle via le support WhatsApp dédié.</li>
          </ul>
        </section>

        {/* Section 3 : Propriété intellectuelle des annales et épreuves */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
            3. Propriété intellectuelle et épreuves officielles
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Les sujets des épreuves du Baccalauréat et du BFEM constituent des documents publics émanant de l&apos;Office du Baccalauréat et du Ministère de l&apos;Éducation Nationale de la République du Sénégal.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Leur mise à disposition sur GSN PREP est effectuée à des <strong>fins exclusivement pédagogiques, non commerciales et d&apos;intérêt public</strong>, dans le but d&apos;assurer l&apos;égalité des chances pour tous les élèves du Sénégal. Les corrigés, méthodologies et synthèses originaux élaborés par l&apos;équipe GSN restent la propriété exclusive de la plateforme.
          </p>
        </section>

        {/* Section 4 : Règles d'usage de l'Intelligence Artificielle */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            4. Usage loyal des outils d&apos;assistance IA
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Le Coach IA est un tuteur d&apos;accompagnement à la révision. L&apos;élève s&apos;interdit de formuler des requêtes abusives, injurieuses, à caractère diffamatoire ou manifestement étrangères à l&apos;apprentissage scolaire.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Afin de préserver la qualité de service pour l&apos;ensemble des élèves de la communauté, des quotas quotidiens d&apos;utilisation sont appliqués par compte.
          </p>
        </section>

        {/* Section 5 : Droit applicable et litiges */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#005bbf]" />
            5. Droit applicable et juridiction compétente
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Les présentes Conditions Générales d&apos;Utilisation sont régies et interprétées conformément au droit en vigueur en <strong>République du Sénégal</strong>.
          </p>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            En cas de différend relatif à l&apos;utilisation des services, les parties s&apos;engagent à rechercher en priorité une solution amiable avant toute action contentieuse devant les tribunaux compétents de <strong>Dakar</strong>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2026 GSN (Global Skills Network) · Dakar, Sénégal</p>
      </footer>
    </div>
  );
}
