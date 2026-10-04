"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { t } from "@/lib/i18n";
import { isPreviewEnvironment } from "@/lib/previewAuth";
import { PreviewBanner } from "@/components/PreviewBanner";

const BAC_SERIES = [
  { code: "L",  label: t("prep.onboarding.series.L.label"),  desc: t("prep.onboarding.series.L.desc"), icon: "auto_stories", color: "text-purple-600 bg-purple-50" },
  { code: "S1", label: t("prep.onboarding.series.S1.label"), desc: t("prep.onboarding.series.S1.desc"), icon: "calculate", color: "text-blue-600 bg-blue-50" },
  { code: "S2", label: t("prep.onboarding.series.S2.label"), desc: t("prep.onboarding.series.S2.desc"), icon: "science", color: "text-indigo-600 bg-indigo-50" },
  { code: "S3", label: t("prep.onboarding.series.S3.label"), desc: t("prep.onboarding.series.S3.desc"), icon: "biotech", color: "text-emerald-600 bg-emerald-50" },
  { code: "S4", label: t("prep.onboarding.series.S4.label"), desc: t("prep.onboarding.series.S4.desc"), icon: "eco", color: "text-teal-600 bg-teal-50" },
  { code: "S5", label: t("prep.onboarding.series.S5.label"), desc: t("prep.onboarding.series.S5.desc"), icon: "agriculture", color: "text-green-600 bg-green-50" },
  { code: "F6", label: t("prep.onboarding.series.F6.label"), desc: t("prep.onboarding.series.F6.desc"), icon: "medical_services", color: "text-rose-600 bg-rose-50" },
  { code: "T1", label: t("prep.onboarding.series.T1.label"), desc: t("prep.onboarding.series.T1.desc"), icon: "precision_manufacturing", color: "text-cyan-600 bg-cyan-50" },
  { code: "T2", label: t("prep.onboarding.series.T2.label"), desc: t("prep.onboarding.series.T2.desc"), icon: "memory", color: "text-amber-600 bg-amber-50" },
  { code: "G",  label: t("prep.onboarding.series.G.label"),  desc: t("prep.onboarding.series.G.desc"), icon: "finance_chip", color: "text-orange-600 bg-orange-50" },
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

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isPreviewEnvironment()) {
          router.push("/prep/dashboard");
          return;
        }
        router.push("/login");
        return;
      }

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 p-6 text-center">
      <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }} />
      <p className="font-extrabold text-base text-slate-900">{t("prep.onboarding.creatingProfile")}</p>
      <p className="text-xs text-slate-500">Personnalisation de votre programme d&apos;examen...</p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Onboarding Progress Top Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.push("/prep")}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95 shrink-0"
          title="Retour"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span className="uppercase tracking-wider text-[#005bbf]">
              {t("prep.onboarding.stepIndicator", { step: step + 1, total: 3 })}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "#FF6B00" }}
            />
          </div>
        </div>
      </div>

      {/* ── STEP 0 : Prénom + Examen + Série ── */}
      {step === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t("prep.onboarding.step0.title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("prep.onboarding.step0.subtitle")}
            </p>
          </div>

          {/* Prénom */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              {t("prep.onboarding.step0.firstNameLabel")}
            </label>
            <input
              type="text"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              placeholder={t("prep.onboarding.step0.firstNamePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#005bbf]/20 focus:border-[#005bbf] transition-all"
            />
          </div>

          {/* Examen */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              {t("prep.onboarding.step0.examLabel")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: "BAC", label: "Baccalauréat", sub: "Lycée · Terminale", icon: "workspace_premium" },
                { code: "BFEM", label: "BFEM (Brevet)", sub: "Collège · 3ème", icon: "school" },
              ].map(e => (
                <button
                  key={e.code}
                  type="button"
                  onClick={() => { setExamType(e.code); setSerie(""); }}
                  className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                    examType === e.code
                      ? "border-[#005bbf] bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                    examType === e.code ? "bg-[#005bbf] text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">{e.icon}</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm">{e.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{e.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Série BAC */}
          {examType === "BAC" && (
            <div className="space-y-2 pt-2">
              <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                {t("prep.onboarding.step0.serieLabel")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {BAC_SERIES.map(s => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSerie(s.code)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all active:scale-[0.98] text-left ${
                      serie === s.code
                        ? "border-[#005bbf] bg-blue-50/50 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{s.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{s.desc}</p>
                    </div>
                    {serie === s.code && (
                      <span className="material-symbols-outlined text-[#005bbf] text-[18px] shrink-0">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={!step0Valid}
            onClick={() => setStep(1)}
            className="w-full py-3.5 font-extrabold text-white rounded-xl shadow-xs disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ backgroundColor: "#FF6B00" }}
          >
            <span>{t("prep.onboarding.next")}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* ── STEP 1 : École + Classe ── */}
      {step === 1 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t("prep.onboarding.step1.title")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("prep.onboarding.step1.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                {t("prep.onboarding.step1.schoolLabel")}
              </label>
              <input
                type="text"
                value={ecole}
                onChange={e => setEcole(e.target.value)}
                placeholder={t("prep.onboarding.step1.schoolPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#005bbf]/20 focus:border-[#005bbf] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                {t("prep.onboarding.step1.classLabel")}
              </label>
              <input
                type="text"
                value={classe}
                onChange={e => setClasse(e.target.value)}
                placeholder={t("prep.onboarding.step1.classPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#005bbf]/20 focus:border-[#005bbf] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 font-extrabold text-white rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FF6B00" }}
            >
              <span>{t("prep.onboarding.next")}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {t("prep.onboarding.step1.skip")}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 : Récapitulatif ── */}
      {step === 2 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t("prep.onboarding.step2.title", { prenom })}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("prep.onboarding.step2.subtitle")}
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <Row icon="person" label={t("prep.onboarding.step2.rowFirstName")} value={prenom} />
            <Row
              icon="workspace_premium"
              label={t("prep.onboarding.step2.rowExam")}
              value={`${examType}${serie ? " " + t("prep.onboarding.step2.serieSuffix", { serie }) : ""}`}
            />
            {ecole && <Row icon="school" label={t("prep.onboarding.step2.rowSchool")} value={ecole} />}
            {classe && <Row icon="class" label={t("prep.onboarding.step2.rowClass")} value={classe} />}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-4 font-black text-white rounded-2xl shadow-md disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            style={{ backgroundColor: "#FF6B00" }}
          >
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            <span>{t("prep.onboarding.step2.submit")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <p className="font-extrabold text-slate-900 text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

export default function PrepOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#FF6B00", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <PrepOnboardingInner />
    </Suspense>
  );
}
