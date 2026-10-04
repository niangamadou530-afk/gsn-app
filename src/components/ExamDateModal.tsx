"use client";

import { useState } from "react";
import {
  SERIES_EXAM_CALENDAR,
  SeriesExamDate,
  saveCustomExamDate,
  clearCustomExamDate,
  CustomExamDateRecord,
} from "@/lib/prep-config";

interface ExamDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExamType: "BAC" | "BFEM";
  currentSerie?: string;
  onDateUpdated: (record: CustomExamDateRecord | null) => void;
}

export function ExamDateModal({
  isOpen,
  onClose,
  currentExamType,
  currentSerie,
  onDateUpdated,
}: ExamDateModalProps) {
  const [mode, setMode] = useState<"series" | "custom">("series");
  const [selectedSeriesCode, setSelectedSeriesCode] = useState<string>(
    currentSerie || (currentExamType === "BFEM" ? "BFEM" : "S2")
  );
  const [customDate, setCustomDate] = useState<string>("2027-06-29");

  if (!isOpen) return null;

  const filteredSeries = SERIES_EXAM_CALENDAR.filter(
    (s) => s.examType === currentExamType
  );

  const activeSeriesObj =
    SERIES_EXAM_CALENDAR.find((s) => s.code === selectedSeriesCode) ||
    filteredSeries[0] ||
    SERIES_EXAM_CALENDAR[0];

  function handleSaveSeries(s: SeriesExamDate) {
    const record: CustomExamDateRecord = {
      date: s.targetDate,
      timeUtc: s.targetTimeUtc,
      displayDateFr: s.displayDateFr,
      seriesCode: s.code,
      label: s.name,
      source: s.source,
      isCustom: false,
    };
    saveCustomExamDate(record);
    onDateUpdated(record);
    onClose();
  }

  function handleSaveCustom() {
    if (!customDate) return;
    const parts = customDate.split("-");
    let displayFr = customDate;
    if (parts.length === 3) {
      const months = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre",
      ];
      const d = parseInt(parts[2], 10);
      const m = months[parseInt(parts[1], 10) - 1] || "";
      const y = parts[0];
      displayFr = `${d} ${m} ${y}`;
    }

    const record: CustomExamDateRecord = {
      date: customDate,
      timeUtc: "08:00:00Z",
      displayDateFr: displayFr,
      label: "Date personnalisée",
      source: "Saisie manuelle par l'élève",
      isCustom: true,
    };
    saveCustomExamDate(record);
    onDateUpdated(record);
    onClose();
  }

  function handleReset() {
    clearCustomExamDate();
    onDateUpdated(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#005bbf] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                Modifier ma date d&apos;examen
              </h2>
              <p className="text-xs text-slate-500">
                Enregistrée localement dans ton navigateur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("series")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "series" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Par série officielle
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "custom" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Date personnalisée
          </button>
        </div>

        {mode === "series" ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Sélectionne ta série pour appliquer automatiquement le calendrier officiel prévisionnel :
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredSeries.map((s) => {
                const isSelected = selectedSeriesCode === s.code;
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSelectedSeriesCode(s.code)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-[#005bbf] bg-blue-50/60 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {s.code}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {s.category}
                        </span>
                        <span className="text-xs font-bold text-[#005bbf] ml-auto">
                          {s.displayDateFr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[12px]">info</span>
                        <span>{s.statutNote}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Source card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Source officielle consultée :
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {activeSeriesObj.source}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveSeries(activeSeriesObj)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-[#005bbf] hover:bg-[#004899] active:scale-[0.98] transition-all text-sm shadow-md"
            >
              Appliquer la date de la série {activeSeriesObj.code} ({activeSeriesObj.displayDateFr})
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Saisis une date spécifique (par exemple si ton académie ou ton centre d&apos;examen a un calendrier aménagé) :
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Date de début des épreuves :
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min="2026-10-01"
                max="2027-12-31"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:border-[#005bbf]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveCustom}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-[#005bbf] hover:bg-[#004899] active:scale-[0.98] transition-all text-sm shadow-md"
            >
              Enregistrer cette date personnalisée
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
          >
            Rétablir la date par défaut
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
