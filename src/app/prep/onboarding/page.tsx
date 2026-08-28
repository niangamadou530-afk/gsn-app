"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";

const BAC_SERIES = [
  { code: "L",  label: t("prep.onboarding.series.L.label"),  desc: t("prep.onboarding.series.L.desc") },
  { code: "S1", label: t("prep.onboarding.series.S1.label"), desc: t("prep.onboarding.series.S1.desc") },
  { code: "S2", label: t("prep.onboarding.series.S2.label"), desc: t("prep.onboarding.series.S2.desc") },
  { code: "S3", label: t("prep.onboarding.series.S3.label"), desc: t("prep.onboarding.series.S3.desc") },
  { code: "S4", label: t("prep.onboarding.series.S4.label"), desc: t("prep.onboarding.series.S4.desc") },
  { code: "S5", label: t("prep.onboarding.series.S5.label"), desc: t("prep.onboarding.series.S5.desc") },
  { code: "F6", label: t("prep.onboarding.series.F6.label"), desc: t("prep.onboarding.series.F6.desc") },
  { code: "T1", label: t("prep.onboarding.series.T1.label"), desc: t("prep.onboarding.series.T1.desc") },
  { code: "T2", label: t("prep.onboarding.series.T2.label"), desc: t("prep.onboarding.series.T2.desc") },
  { code: "G",  label: t("prep.onboarding.series.G.label"),  desc: t("prep.onboarding.series.G.desc") },
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
      setError(err instanceof Error ? err.message : t("prep.onboarding.error.unknown"));
    } finally {
      setSaving(false);
    }
  }

  if (saving) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center space-y-4 p-6">
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="font-bold text-lg text-on-surface">{t("prep.onboarding.creatingProfile")}</p>
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
          <span className="text-xs font-bold text-primary uppercase tracking-widest">{t("prep.onboarding.stepIndicator", { step: step + 1, total: 3 })}</span>
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
              <h1 className="text-2xl font-extrabold mb-1">{t("prep.onboarding.step0.title")}</h1>
              <p className="text-on-surface-variant text-sm">{t("prep.onboarding.step0.subtitle")}</p>
            </div>

            {/* Prénom */}
            <div className="space-y-2">
              <label className="font-bold text-on-surface text-sm">{t("prep.onboarding.step0.firstNameLabel")}</label>
              <input
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder={t("prep.onboarding.step0.firstNamePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Examen */}
            <div className="space-y-2">
              <label className="font-bold text-on-surface text-sm">{t("prep.onboarding.step0.examLabel")}</label>
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
                      <p className="text-[11px] text-on-surface-variant">{e === "BFEM" ? t("prep.onboarding.step0.examDescBfem") : t("prep.onboarding.step0.examDescBac")}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Série BAC */}
            {examType === "BAC" && (
              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">{t("prep.onboarding.step0.serieLabel")}</label>
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
              {t("prep.onboarding.next")}
            </button>
          </>
        )}

        {/* ── STEP 1 : École + Classe ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold mb-1">{t("prep.onboarding.step1.title")}</h1>
              <p className="text-on-surface-variant text-sm">{t("prep.onboarding.step1.subtitle")}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">{t("prep.onboarding.step1.schoolLabel")}</label>
                <input
                  value={ecole}
                  onChange={e => setEcole(e.target.value)}
                  placeholder={t("prep.onboarding.step1.schoolPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-on-surface text-sm">{t("prep.onboarding.step1.classLabel")}</label>
                <input
                  value={classe}
                  onChange={e => setClasse(e.target.value)}
                  placeholder={t("prep.onboarding.step1.classPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-4 font-black text-white rounded-2xl transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B00" }}>
              {t("prep.onboarding.next")}
            </button>
            <button onClick={() => setStep(2)} className="w-full text-center text-sm text-on-surface-variant underline">
              {t("prep.onboarding.step1.skip")}
            </button>
          </>
        )}

        {/* ── STEP 2 : Récapitulatif ── */}
        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold mb-1">{t("prep.onboarding.step2.title", { prenom })}</h1>
              <p className="text-on-surface-variant text-sm">{t("prep.onboarding.step2.subtitle")}</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-3">
              <Row icon="person" label={t("prep.onboarding.step2.rowFirstName")} value={prenom} />
              <Row icon="workspace_premium" label={t("prep.onboarding.step2.rowExam")} value={`${examType}${serie ? " " + t("prep.onboarding.step2.serieSuffix", { serie }) : ""}`} />
              {ecole && <Row icon="school" label={t("prep.onboarding.step2.rowSchool")} value={ecole} />}
              {classe && <Row icon="class" label={t("prep.onboarding.step2.rowClass")} value={classe} />}
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
              {t("prep.onboarding.step2.submit")}
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
