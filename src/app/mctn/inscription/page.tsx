"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DOMAINS = [
  { id: "dev-web",   label: "Développement Web & Mobile", sub: "React, Next.js, Flutter, APIs", icon: "code",             color: "#005bbf" },
  { id: "data",      label: "Data Science & IA",           sub: "Python, ML, Groq, Analyse",    icon: "psychology",        color: "#2b5bb5" },
  { id: "cybersec",  label: "Cybersécurité & Sys. Admin",  sub: "Linux, réseaux, pen-test",      icon: "security",          color: "#7b1fa2" },
  { id: "ux",        label: "UX Design & Contenu Digital", sub: "Figma, UI, rédaction web",      icon: "palette",           color: "#e65100" },
  { id: "ecommerce", label: "E-commerce & Marketing",      sub: "Boutique, SEO, Ads, CRM",       icon: "storefront",        color: "#2e7d32" },
  { id: "cloud",     label: "Cloud Computing & DevOps",    sub: "AWS, Docker, CI/CD, Terraform", icon: "cloud",             color: "#00695c" },
];

const NIVEAUX   = ["Débutant", "Intermédiaire", "Avancé"];
const OBJECTIFS = ["Premier emploi", "Freelance", "Reconversion", "Créer ma startup"];

type Answers = {
  prenom: string; nom: string; age: string; phone: string;
  domaine: string; niveau: string; objectif: string;
  email: string; password: string;
};

function InscriptionContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [answers, setAnswers] = useState<Answers>({
    prenom: "", nom: "", age: "", phone: "",
    domaine: searchParams.get("domaine") ?? "",
    niveau: "", objectif: "",
    email: "", password: "",
  });

  const progress = (step / 4) * 100;

  function set(key: keyof Answers, val: string) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }

  function canNext(): boolean {
    if (step === 1) return !!(answers.prenom && answers.nom && answers.age);
    if (step === 2) return !!answers.domaine;
    if (step === 3) return !!(answers.niveau && answers.objectif);
    if (step === 4) return !!(answers.email && answers.password);
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Créer le compte Supabase Auth
      const { data, error: authErr } = await supabase.auth.signUp({
        email: answers.email,
        password: answers.password,
      });

      if (authErr) throw authErr;
      const userId = data.user?.id;
      if (!userId) throw new Error("Compte non créé");

      // 2. Insérer dans users avec tenant_id = 'mctn'
      const { error: userErr } = await supabase.from("users").insert({
        id:           userId,
        name:         `${answers.prenom} ${answers.nom}`,
        score:        0,
        profile_type: "professionnel",
        tenant_id:    "mctn",
        phone:        answers.phone || null,
        age:          parseInt(answers.age) || null,
      });

      if (userErr) throw userErr;

      // 3. Créer l'enrollment PFIMN
      const { error: enrollErr } = await supabase.from("pfimn_enrollments").insert({
        user_id:  userId,
        domaine:  answers.domaine,
        niveau:   answers.niveau,
        objectif: answers.objectif,
      });

      if (enrollErr) throw enrollErr;

      router.push("/mctn/learn");
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col">

      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-5">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.push("/mctn"))}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px]">GSN</span>
          </div>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">PFIMN</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress */}
      <div className="px-6 mb-2">
        <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-2">
          <span>Étape {step} sur 4</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 px-6 pb-12 max-w-md mx-auto w-full mt-4">

        {/* ── STEP 1 : Profil ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-background">
                Ton <span className="text-primary">profil</span>
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">Informations personnelles pour le programme PFIMN</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">Prénom *</label>
                  <input
                    type="text"
                    value={answers.prenom}
                    onChange={(e) => set("prenom", e.target.value)}
                    placeholder="Prénom"
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors text-sm"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">Nom *</label>
                  <input
                    type="text"
                    value={answers.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    placeholder="Nom de famille"
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Âge *</label>
                <input
                  type="number"
                  value={answers.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="Entre 18 et 35 ans"
                  min={18} max={35}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Téléphone</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">🇸🇳</span>
                  <input
                    type="tel"
                    value={answers.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-10 pr-4 py-3 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 : Domaine NDT ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-background">
                Ton <span className="text-primary">métier</span>
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">Choisis le domaine numérique que tu veux apprendre</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {DOMAINS.map((d) => {
                const sel = answers.domaine === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => set("domaine", d.id)}
                    className={`p-4 rounded-2xl text-left transition-all active:scale-[0.97] border-2 space-y-2 ${
                      sel
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-transparent bg-surface-container-lowest shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${d.color}15`, color: d.color }}>
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                      </div>
                      {sel && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-on-surface leading-snug">{d.label}</p>
                    <p className="text-[10px] text-on-surface-variant">{d.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3 : Niveau & Objectif ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-background">
                Ton <span className="text-primary">niveau</span>
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">Pour personnaliser ton parcours PFIMN</p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold text-on-surface mb-3">Niveau actuel</p>
                <div className="space-y-2">
                  {NIVEAUX.map((n) => {
                    const sel = answers.niveau === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set("niveau", n)}
                        className={`w-full p-4 rounded-xl text-left font-semibold transition-all active:scale-[0.98] flex items-center justify-between border-2 ${
                          sel
                            ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/10"
                            : "border-transparent bg-surface-container-lowest text-on-background shadow-sm"
                        }`}
                      >
                        <span>{n}</span>
                        {sel && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[16px]">check</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-on-surface mb-3">Objectif principal</p>
                <div className="space-y-2">
                  {OBJECTIFS.map((o) => {
                    const sel = answers.objectif === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => set("objectif", o)}
                        className={`w-full p-4 rounded-xl text-left font-semibold transition-all active:scale-[0.98] flex items-center justify-between border-2 ${
                          sel
                            ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/10"
                            : "border-transparent bg-surface-container-lowest text-on-background shadow-sm"
                        }`}
                      >
                        <span>{o}</span>
                        {sel && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[16px]">check</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4 : Compte ── */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6" id="form-compte">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-background">
                Ton <span className="text-primary">compte</span>
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">Crée tes identifiants pour accéder à la plateforme GSN</p>
            </div>

            {/* Résumé du profil */}
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Récapitulatif</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: "person",   val: `${answers.prenom} ${answers.nom}` },
                  { icon: "code",     val: DOMAINS.find((d) => d.id === answers.domaine)?.label ?? answers.domaine },
                  { icon: "trending_up", val: answers.niveau },
                  { icon: "flag",     val: answers.objectif },
                ].map((item) => (
                  <div key={item.icon} className="flex items-center gap-1 bg-surface-container rounded-xl px-3 py-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary">{item.icon}</span>
                    <span className="text-xs font-medium text-on-surface">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">mail</span>
                <input
                  type="email"
                  value={answers.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="Adresse email"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-11 pr-4 py-4 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">lock</span>
                <input
                  type="password"
                  value={answers.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Mot de passe (8 caractères min.)"
                  minLength={8}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl pl-11 pr-4 py-4 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-error/10 text-error rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </form>
        )}

        {/* CTA */}
        <div className="mt-8">
          {step < 4 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] active:scale-[0.98] transition-all disabled:opacity-40"
            >
              Suivant
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <button
              type="submit"
              form="form-compte"
              disabled={loading || !canNext()}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,91,191,0.2)] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  Rejoindre le PFIMN
                  <span className="material-symbols-outlined">rocket_launch</span>
                </>
              )}
            </button>
          )}
        </div>

        {step === 1 && (
          <p className="text-center text-sm text-on-surface-variant mt-6">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">Se connecter</Link>
          </p>
        )}
      </div>

      {/* Decorative glows */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed top-32 -left-24 w-48 h-48 bg-secondary-container/10 rounded-full blur-[80px] pointer-events-none" />
    </main>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <InscriptionContent />
    </Suspense>
  );
}
