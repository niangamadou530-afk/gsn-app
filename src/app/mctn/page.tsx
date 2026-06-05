import Link from "next/link";

const DOMAINS = [
  { id: "dev-web",   label: "Développement Web & Mobile", icon: "code",             color: "#005bbf" },
  { id: "data",      label: "Data Science & IA",           icon: "psychology",        color: "#2b5bb5" },
  { id: "cybersec",  label: "Cybersécurité & Sys. Admin",  icon: "security",          color: "#7b1fa2" },
  { id: "ux",        label: "UX Design & Contenu Digital", icon: "palette",           color: "#e65100" },
  { id: "ecommerce", label: "E-commerce & Marketing",      icon: "storefront",        color: "#2e7d32" },
  { id: "cloud",     label: "Cloud Computing & DevOps",    icon: "cloud",             color: "#00695c" },
];

const STATS = [
  { value: "5 000",  label: "Jeunes formés (Phase 1)",   icon: "school" },
  { value: "2 000",  label: "Insertions tech visées",     icon: "work" },
  { value: "6",      label: "Métiers du numérique",       icon: "hub" },
  { value: "3 régions", label: "Dakar · Thiès · Ziguinchor", icon: "location_on" },
];

const TIMELINE = [
  { months: "M 1–2",  label: "Cadrage institutionnel",  desc: "Signature MCTN × SenaySkills × GSN" },
  { months: "M 3–4",  label: "Préparation",             desc: "Formation coachs · Identification bénéficiaires" },
  { months: "M 5–8",  label: "Lancement Phase 1",       desc: "Sessions terrain & digital · Skill Passports délivrés" },
  { months: "M 9–10", label: "Insertion & Matching",    desc: "Activation GSN WORK · Placements tech" },
  { months: "M 11–12",label: "Financement startups",    desc: "Activation GSN PAY · Micro-crédits projets tech" },
];

export default function PfimnLandingPage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface">

      {/* ── Top bar ── */}
      <header className="fixed top-0 w-full z-50 bg-[#0a1628]/95 backdrop-blur-md flex items-center justify-between px-6 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow">
            <span className="text-white font-black text-sm">GSN</span>
          </div>
          <div className="h-5 w-px bg-white/20" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">PFIMN · MCTN</span>
        </div>
        <Link
          href="/mctn/inscription"
          className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl shadow active:scale-95 transition-all"
        >
          S'inscrire
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-6 text-center bg-gradient-to-b from-[#0a1628] to-[#0d1f3c] relative overflow-hidden">
        {/* decorative glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Badge NDT */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-[14px] text-yellow-400">verified</span>
            New Deal Technologique · Vision Sénégal 2050
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Programme<br />
            <span className="text-primary">PFIMN</span>
          </h1>

          <p className="text-white/70 text-base leading-relaxed max-w-lg mx-auto">
            Programme National de Formation et d'Insertion aux Métiers du Numérique
            · Ministère de la Communication, des Télécommunications et du Numérique
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mctn/inscription"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              S'inscrire au PFIMN
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-6 py-3.5 rounded-xl border border-white/15 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Déjà inscrit
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[#0d1f3c] pb-10 px-6">
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {s.icon}
              </span>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-[11px] text-white/50 font-medium leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 space-y-12 py-12">

        {/* ── Trois fractures ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pourquoi le PFIMN ?</h2>
          {[
            { color: "#005bbf", icon: "school",           title: "Fracture de formation",    desc: "Pas de parcours courts, certifiants et alignés sur les métiers réels du numérique" },
            { color: "#2b5bb5", icon: "work",             title: "Fracture d'insertion",     desc: "Entreprises tech et administrations peinent à identifier des profils certifiés locaux" },
            { color: "#e65100", icon: "account_balance",  title: "Fracture de financement",  desc: "Exclusion du système bancaire — frein à l'émergence des startups du New Deal" },
          ].map((f) => (
            <div key={f.title} className="bg-surface-container-lowest rounded-2xl p-5 flex gap-4 shadow-sm"
              style={{ borderLeft: `4px solid ${f.color}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${f.color}15`, color: f.color }}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{f.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── 6 Domaines NDT ── */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">6 Métiers du Numérique</h2>
            <span className="text-xs text-on-surface-variant font-medium">Axe NDT</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DOMAINS.map((d) => (
              <Link
                key={d.id}
                href={`/mctn/inscription?domaine=${d.id}`}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all border-2 border-transparent hover:border-primary/20 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${d.color}15`, color: d.color }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                </div>
                <p className="text-sm font-bold text-on-surface leading-snug">{d.label}</p>
              </Link>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant text-center pt-1">
            Modalité hybride · Présentiel SenaySkills + Digital GSN
          </p>
        </section>

        {/* ── Modules GSN ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Comment ça marche ?</h2>
          {[
            { step: "01", color: "#005bbf", icon: "school",        label: "GSN LEARN",    desc: "Suis ton parcours certifiant · IA · quiz · projets pratiques" },
            { step: "02", color: "#2b5bb5", icon: "workspace_premium", label: "Skill Passport", desc: "Reçois ton portefeuille numérique certifié à la fin du parcours" },
            { step: "03", color: "#2e7d32", icon: "work",           label: "GSN WORK",    desc: "Connecte-toi aux entreprises tech et administrations NDT" },
            { step: "04", color: "#e65100", icon: "account_balance_wallet", label: "GSN PAY", desc: "Finance ton projet tech via le scoring alternatif basé sur tes compétences" },
          ].map((m) => (
            <div key={m.step} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm text-white"
                style={{ backgroundColor: m.color }}>
                {m.step}
              </div>
              <div className="flex-1 bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: m.color, fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                  <p className="font-bold text-sm text-on-surface">{m.label}</p>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Calendrier ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Calendrier de Déploiement</h2>
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-outline-variant" />
            {TIMELINE.map((t, i) => (
              <div key={t.months} className="relative flex gap-4 pb-5 last:pb-0">
                <div className={`absolute -left-[13px] top-1 w-3 h-3 rounded-full border-2 z-10 ${i === 0 ? "bg-primary border-primary" : "bg-surface border-outline-variant"}`} />
                <div className="ml-2 flex-1 bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-black text-primary uppercase tracking-wider">{t.months}</span>
                    <span className="text-xs font-bold text-on-surface">{t.label}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-center space-y-4 shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined text-5xl text-white/40" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <h2 className="text-2xl font-extrabold text-white">Rejoins le PFIMN</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Gratuit · Certifiant · Aligné sur le marché du travail numérique sénégalais
          </p>
          <Link
            href="/mctn/inscription"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-6 py-3.5 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            S'inscrire maintenant
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="text-center space-y-2 pb-4">
          <p className="text-xs text-on-surface-variant font-medium">
            PFIMN · Ministère de la Communication, des Télécommunications et du Numérique
          </p>
          <p className="text-xs text-outline">
            SenaySkills · Global Skills Network (GSN) · Dakar, Sénégal · 2025–2034
          </p>
        </footer>

      </div>
    </main>
  );
}
