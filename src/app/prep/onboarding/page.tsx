"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BAC_SERIES = [
  { code: "L",  label: "Série L",  desc: "Lettres & Sciences Humaines" },
  { code: "S1", label: "Série S1", desc: "Maths — Sciences Physiques" },
  { code: "S2", label: "Série S2", desc: "Maths — Sciences Naturelles" },
  { code: "S3", label: "Série S3", desc: "Maths — Technologie" },
  { code: "S4", label: "Série S4", desc: "Maths — Agriculture" },
  { code: "S5", label: "Série S5", desc: "Maths — Alimentation" },
  { code: "F6", label: "Série F6", desc: "Sciences Physiques et Chimie" },
  { code: "T1", label: "Série T1", desc: "Technologie Mécanique" },
  { code: "T2", label: "Série T2", desc: "Électromécanique" },
  { code: "G",  label: "Série G",  desc: "Gestion & Commerce" },
];

function PrepOnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExam = searchParams.get("exam");
  const inviteCode = searchParams.get("code");
  const isLockedBFEM = preselectedExam === "BFEM" && !!inviteCode;

  const [step, setStep]       = useState(0);
  const [prenom, setPrenom]   = useState("");
  const [examType, setExamType] = useState(preselectedExam ?? "");
  const [serie, setSerie]     = useState("");
  const [ecole, setEcole]     = useState("");
  const [classe, setClasse]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  // ── Autocomplete école ──────────────────────────────────────────────────────
  const [ecoleQuery, setEcoleQuery]             = useState("");
  const [ecoleSuggestions, setEcoleSuggestions] = useState<{ nom: string; ville: string }[]>([]);
  const [ecoleManual, setEcoleManual]           = useState(false);
  const [ecoleLoading, setEcoleLoading]         = useState(false);
  const [ecoleOpen, setEcoleOpen]               = useState(false);

  useEffect(() => {
    if (preselectedExam === "BFEM" || preselectedExam === "BAC") setExamType(preselectedExam);
  }, [preselectedExam]);

  useEffect(() => {
    if (ecoleManual || ecoleQuery.trim().length < 2) {
      setEcoleSuggestions([]);
      setEcoleOpen(false);
      setEcoleLoading(false);
      return;
    }
    setEcoleLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("etablissements_senegal")
        .select("nom, ville")
        .ilike("nom", `%${ecoleQuery.trim()}%`)
        .order("nom")
        .limit(8);
      setEcoleSuggestions(data ?? []);
      setEcoleOpen(true);
      setEcoleLoading(false);
    }, 300);
    return () => { clearTimeout(timer); setEcoleLoading(false); };
  }, [ecoleQuery, ecoleManual]);

  function selectEcole(nom: string) {
    setEcole(nom);
    setEcoleQuery(nom);
    setEcoleOpen(false);
  }

  function switchToManual() {
    setEcoleManual(true);
    setEcole(ecoleQuery);
    setEcoleOpen(false);
  }

  function resetEcoleSearch() {
    setEcoleManual(false);
    setEcole("");
    setEcoleQuery("");
    setEcoleSuggestions([]);
  }

  const progress = ((step + 1) / 3) * 100;
  const step0Valid = prenom.trim().length >= 2 && examType !== "" && (examType === "BFEM" || serie !== "");

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const payload = {
        user_id: user.id,
        prenom: prenom.trim(),
        exam_type: examType,
        serie: serie || null,
        ecole: ecole.trim() || null,
        classe: classe.trim() || null,
      };

      const { data: existing } = await supabase
        .from("prep_students").select("id").eq("user_id", user.id).maybeSingle();

      const result = existing
        ? await supabase.from("prep_students").update(payload).eq("user_id", user.id)
        : await supabase.from("prep_students").insert(payload);

      if (result.error) throw new Error(result.error.message);
      router.push("/prep/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (saving) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-4 p-6">
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="font-bold text-lg text-on-surface">Création de ton profil…</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.push("/prep")}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </button>
        <div className="flex-1">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Étape {step + 1} sur 3</span>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: "#FF6B00" }} />
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">

        {/* ── STEP 0 : Prénom + Examen + Série ── */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold mb-1">Bienvenue sur GSN PREP</h1>
              <p className="text-on-surface-variant text-sm">🇸🇳 Sénégal · Programme officiel Office du BAC</p>
            </div>

            {/* Prénom */}
            <div className="space-y-2">
              <label className="font-bold text-on-surface text-sm">Ton prénom</label>
              <input
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="Ex: Aminata, Ibrahima, Fatou..."
                className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Examen */}
            <div className="space-y-2">
              <label className="font-bold text-on-surface text-sm">Quel examen prépares-tu ?</label>
              {isLockedBFEM ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/40 bg-primary/5">
                  <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                  <div className="flex-1">
                    <p className="font-extrabold text-primary">BFEM · 3ème Brevet</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Accès limité · Code {inviteCode}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {["BFEM", "BAC"].map(e => (
                    <button key={e}
                      onClick={() => { setExamType(e); setSerie(""); }}
                      className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all active:scale-[0.97] ${examType === e ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/30"}`}>
                      <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {e === "BFEM" ? "assignment" : "workspace_premium"}
                      </span>
                      <div className="text-center">
                        <p className="font-extrabold text-on-surface">{e}</p>
                        <p className="text-[11px] text-on-surface-variant">{e === "BFEM" ? "3ème · Brevet" : "Terminale · Bac"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Série BAC */}
            {examType === "BAC" && (
              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">Ta série</label>
                <div className="space-y-2">
                  {BAC_SERIES.map(s => (
                    <button key={s.code}
                      onClick={() => setSerie(s.code)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all active:scale-[0.98] text-left ${serie === s.code ? "border-primary bg-primary/5" : "border-transparent bg-surface-container-lowest shadow-sm hover:border-primary/20"}`}>
                      <div>
                        <span className="font-bold text-on-surface">{s.label}</span>
                        <span className="text-xs text-on-surface-variant ml-2">{s.desc}</span>
                      </div>
                      {serie === s.code && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={!step0Valid}
              onClick={() => setStep(1)}
              className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Suivant →
            </button>
          </>
        )}

        {/* ── STEP 1 : École + Classe ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold mb-1">Ton école</h1>
              <p className="text-on-surface-variant text-sm">Optionnel — pour le classement inter-écoles</p>
            </div>

            <div className="space-y-4">

              {/* ── Champ école avec autocomplete ── */}
              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">Nom de l'école ou du lycée</label>

                {ecoleManual ? (
                  /* Mode saisie manuelle */
                  <div className="space-y-2">
                    <input
                      value={ecole}
                      onChange={e => setEcole(e.target.value)}
                      placeholder="Saisir le nom de ton école..."
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={resetEcoleSearch}
                      className="text-xs text-primary underline">
                      ← Retour à la recherche
                    </button>
                  </div>
                ) : (
                  /* Mode recherche */
                  <div className="relative">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">
                        search
                      </span>
                      <input
                        value={ecoleQuery}
                        onChange={e => { setEcoleQuery(e.target.value); setEcole(""); }}
                        onFocus={() => { if (ecoleSuggestions.length > 0) setEcoleOpen(true); }}
                        onBlur={() => setTimeout(() => setEcoleOpen(false), 150)}
                        placeholder="Rechercher mon école…"
                        className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                      />
                      {ecoleLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 rounded-full border-2 animate-spin"
                            style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
                        </div>
                      )}
                      {ecole && !ecoleLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                    </div>

                    {/* Dropdown */}
                    {ecoleOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-surface rounded-xl border border-outline-variant shadow-lg overflow-hidden">
                        {ecoleSuggestions.length === 0 && (
                          <div className="px-4 py-3 text-sm text-on-surface-variant italic">
                            Aucun résultat pour « {ecoleQuery} »
                          </div>
                        )}
                        {ecoleSuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => selectEcole(s.nom)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container text-left transition-colors border-b border-outline-variant/20 last:border-0">
                            <span className="material-symbols-outlined text-primary text-[18px] shrink-0"
                              style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-on-surface text-sm truncate">{s.nom}</p>
                              <p className="text-xs text-on-surface-variant">{s.ville}</p>
                            </div>
                          </button>
                        ))}
                        {/* Option manuelle toujours visible en bas du dropdown */}
                        <button
                          type="button"
                          onMouseDown={switchToManual}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container/60 text-left transition-colors border-t border-outline-variant/30">
                          <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">edit</span>
                          <p className="text-sm text-on-surface-variant italic">Mon école n'est pas dans la liste</p>
                        </button>
                      </div>
                    )}

                    {/* Lien de secours quand dropdown fermé mais query >= 2 sans sélection */}
                    {!ecoleOpen && !ecoleLoading && ecoleQuery.trim().length >= 2 && !ecole && (
                      <button
                        type="button"
                        onClick={switchToManual}
                        className="mt-2 text-xs text-on-surface-variant underline">
                        Mon école n'est pas dans la liste →
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">Ta classe</label>
                <input
                  value={classe}
                  onChange={e => setClasse(e.target.value)}
                  placeholder="Ex: Terminale S1, 3ème B..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-4 font-black text-white rounded-2xl transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              Suivant →
            </button>
            <button onClick={() => setStep(2)} className="w-full text-center text-sm text-on-surface-variant underline">
              Passer cette étape
            </button>
          </>
        )}

        {/* ── STEP 2 : Récapitulatif ── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold mb-1">C'est parti, {prenom} !</h1>
              <p className="text-on-surface-variant text-sm">Vérifie ton profil avant de commencer.</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <Row icon="person" label="Prénom" value={prenom} />
              <Row icon="workspace_premium" label="Examen" value={`${examType}${serie ? " · Série " + serie : ""}`} />
              {ecole && <Row icon="school" label="École" value={ecole} />}
              {classe && <Row icon="class" label="Classe" value={classe} />}
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full py-4 font-black text-white rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FF6B00" }}>
              <span className="material-symbols-outlined">rocket_launch</span>
              Commencer GSN PREP
            </button>
          </>
        )}

      </div>
    </main>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div className="flex-1">
        <span className="text-xs text-on-surface-variant">{label}</span>
        <p className="font-semibold text-on-surface text-sm">{value}</p>
      </div>
    </div>
  );
}

export default function PrepOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      </div>
    }>
      <PrepOnboardingInner />
    </Suspense>
  );
}
