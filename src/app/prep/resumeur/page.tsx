"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { saveOffline } from "@/lib/offline";

type Flashcard = { question: string; reponse: string };
type Definition = { terme: string; definition: string };

type ResumeResult = {
  titre: string;
  matiere: string;
  resume: string;
  points_cles: string[];
  formules: string[];
  definitions: Definition[];
  flashcards: Flashcard[];
  conseils_exam: string[];
};

const MATIERES = [
  "Maths", "Français", "Physique-Chimie", "Sciences Naturelles",
  "Histoire-Géographie", "Philosophie", "Anglais", "Comptabilité", "Autre",
];

export default function ResumeurPage() {
  const [matiere, setMatiere] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(f: File) {
    setFile(f);
    setError("");
    setResult(null);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }

  async function analyzeFile() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("matiere", matiere);
      const res = await fetch("/api/prep-resumeur", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      saveOffline(`resume_${Date.now()}`, data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  }

  function toggleCard(i: number) {
    setFlippedCards(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-variant/20 px-6 py-4 flex items-center gap-3">
        <Link href="/prep/dashboard" className="text-outline hover:text-on-surface">
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </Link>
        <div>
          <p className="font-bold text-on-surface">Résumeur de cours</p>
          <p className="text-xs text-on-surface-variant">Upload ton cours · L&apos;IA le résume</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">

        {/* Hero */}
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg,#FF6B00,#FF8C40)" }}>
          <span className="material-symbols-outlined text-[36px] text-white/80 mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          <h1 className="text-xl font-extrabold">Résumé de cours par IA</h1>
          <p className="text-white/80 text-sm mt-1">Uploade ton cours (PDF ou photo) et l&apos;IA génère un résumé structuré avec points clés, formules et flashcards.</p>
        </div>

        {/* Matière */}
        <div className="space-y-2">
          <p className="font-bold text-sm text-on-surface">Matière (optionnel)</p>
          <div className="flex flex-wrap gap-2">
            {MATIERES.map(m => (
              <button key={m} onClick={() => setMatiere(m === matiere ? "" : m)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${matiere === m ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        {!result && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${isDragging ? "border-primary bg-primary/5" : "border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container-lowest"}`}>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={onFileInputChange} />

            {file ? (
              <div className="space-y-3">
                {preview ? (
                  <img src={preview} alt="Aperçu" className="max-h-48 mx-auto rounded-xl object-contain shadow-sm" />
                ) : (
                  <div className="w-14 h-14 mx-auto bg-red-50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                  </div>
                )}
                <p className="font-bold text-on-surface text-sm">{file.name}</p>
                <p className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(0)} Ko — Clique pour changer</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="material-symbols-outlined text-[48px] text-outline-variant block" style={{ fontVariationSettings: "'FILL' 0" }}>upload_file</span>
                <div>
                  <p className="font-bold text-on-surface">Glisse ton cours ici ou clique pour choisir</p>
                  <p className="text-xs text-on-surface-variant mt-1">PDF, JPG ou PNG · Max 10 Mo</p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Analyze button */}
        {!result && file && (
          <button onClick={analyzeFile} disabled={loading}
            className="w-full py-4 font-black text-white rounded-2xl disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ backgroundColor: "#FF6B00" }}>
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_awesome</span>
                Analyser mon cours avec l&apos;IA
              </>
            )}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-5">
            {/* Title + new analysis button */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-on-surface">{result.titre}</h2>
                {result.matiere && <p className="text-xs text-on-surface-variant">{result.matiere}</p>}
              </div>
              <button onClick={() => { setResult(null); setFile(null); setPreview(null); }}
                className="text-xs font-bold text-primary hover:underline shrink-0">
                Nouveau cours
              </button>
            </div>

            {/* Résumé */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
                <p className="font-bold text-blue-800 text-sm">Résumé</p>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">{result.resume}</p>
            </div>

            {/* Points clés */}
            {result.points_cles?.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface text-sm">Points clés</p>
                <div className="space-y-1.5">
                  {result.points_cles.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                      <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-on-surface leading-snug">{pt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formules */}
            {result.formules?.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface text-sm">Formules & règles</p>
                <div className="space-y-1.5">
                  {result.formules.map((f, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl px-4 py-2.5 font-mono text-sm text-on-surface">{f}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Définitions */}
            {result.definitions?.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface text-sm">Définitions</p>
                <div className="rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm">
                  {result.definitions.map((d, i) => (
                    <div key={i} className={`flex gap-3 p-3 ${i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}`}>
                      <span className="font-bold text-primary text-sm shrink-0 w-28 truncate">{d.terme}</span>
                      <span className="text-sm text-on-surface-variant leading-snug">{d.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flashcards */}
            {result.flashcards?.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface text-sm">Flashcards ({result.flashcards.length})</p>
                <div className="space-y-2">
                  {result.flashcards.map((fc, i) => (
                    <div key={i}
                      onClick={() => toggleCard(i)}
                      className="cursor-pointer rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 select-none">
                      <div className={`p-4 transition-colors ${flippedCards.has(i) ? "bg-primary text-on-primary" : "bg-surface-container-lowest"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold leading-snug ${flippedCards.has(i) ? "text-on-primary" : "text-on-surface"}`}>
                            {flippedCards.has(i) ? fc.reponse : fc.question}
                          </p>
                          <span className={`material-symbols-outlined text-[18px] shrink-0 ${flippedCards.has(i) ? "text-on-primary/70" : "text-outline"}`}>
                            {flippedCards.has(i) ? "flip_to_front" : "flip_to_back"}
                          </span>
                        </div>
                        {!flippedCards.has(i) && (
                          <p className="text-[10px] text-on-surface-variant mt-1">Appuie pour voir la réponse</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conseils */}
            {result.conseils_exam?.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-on-surface text-sm">Conseils pour l&apos;examen</p>
                {result.conseils_exam.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                    <p className="text-sm text-amber-900 leading-snug">{c}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link href={`/prep/flashcards?chapter=${encodeURIComponent(result.titre)}&subject=${encodeURIComponent(result.matiere || matiere)}`}
                className="flex-1 py-3 text-center font-bold rounded-xl text-sm border-2 border-primary text-primary hover:bg-primary/5 transition-colors">
                Créer + de flashcards
              </Link>
              <Link href="/prep/simulateur"
                className="flex-1 py-3 text-center font-black text-white rounded-xl text-sm"
                style={{ backgroundColor: "#FF6B00" }}>
                Faire un quiz →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
