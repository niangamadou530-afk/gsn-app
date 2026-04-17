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

  const [step, setStep]       = useState(0);
  const [prenom, setPrenom]   = useState("");
  const [examType, setExamType] = useState(preselectedExam ?? "");
  const [serie, setSerie]     = useState("");
  const [ecole, setEcole]     = useState("");
  const [classe, setClasse]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (preselectedExam === "BFEM" || preselectedExam === "BAC") setExamType(preselectedExam);
  }, [preselectedExam]);

  const progress = ((step + 1) / 3) * 100;
  const step0Valid = prenom.trim().length >= 2 && examType !== "" && (examType === "BFEM" || serie !== "");
  const step1Valid = true; // école et classe sont optionnels
  const step2Valid = true;

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
              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">Nom de l'école ou du lycée</label>
                <input
                  value={ecole}
                  onChange={e => setEcole(e.target.value)}
                  placeholder="Ex: Lycée Lamine Guèye, Kennedy..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
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
