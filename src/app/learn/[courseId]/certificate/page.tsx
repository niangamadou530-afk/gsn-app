"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [userName, setUserName] = useState("Apprenant");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [courseId]);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/login"); return; }

    const [courseRes, profileRes] = await Promise.all([
      supabase.from("user_courses").select("*").eq("id", courseId).eq("user_id", auth.user.id).single(),
      supabase.from("users").select("name").eq("id", auth.user.id).single(),
    ]);

    if (courseRes.error || !courseRes.data) { router.replace(`/learn/${courseId}/test`); return; }
    if (!courseRes.data.certificate_id) { router.replace(`/learn/${courseId}/test`); return; }

    setCourse(courseRes.data);
    setUserName(profileRes.data?.name ?? "Apprenant");
    setLoading(false);
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
  if (!course) return null;

  const completedDate = course.completed_at
    ? new Date(course.completed_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .cert-wrap { margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
        }
      `}</style>

      <main className="min-h-screen bg-[#f4f8ff] pb-16">

        {/* Controls — hidden on print */}
        <div className="no-print max-w-3xl mx-auto p-6">
          <Link href={`/learn/${courseId}`} className="text-sm text-blue-600 hover:underline">← Retour au parcours</Link>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-[#1a73e8] text-white px-6 py-3 font-semibold hover:opacity-90"
            >
              Télécharger en PDF
            </button>
            <Link href="/score" className="rounded-lg border border-blue-200 text-[#1a73e8] px-6 py-3 font-semibold hover:bg-blue-50">
              Mon Skill Passport
            </Link>
            <Link href="/learn" className="rounded-lg border border-gray-200 text-gray-600 px-6 py-3 font-semibold hover:bg-gray-50">
              Mes parcours
            </Link>
          </div>
        </div>

        {/* Certificate */}
        <div className="max-w-3xl mx-auto px-6">
          <div
            className="cert-wrap bg-white rounded-2xl shadow-2xl p-10 relative overflow-hidden"
            style={{ border: "4px solid #1a73e8" }}
          >
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1a73e8] via-[#34a853] to-[#1a73e8]" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1a73e8] via-[#34a853] to-[#1a73e8]" />

            {/* Corner decoration */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-[#1a73e8] opacity-30 rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-[#1a73e8] opacity-30 rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-[#1a73e8] opacity-30 rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-[#1a73e8] opacity-30 rounded-br-lg" />

            {/* Logo */}
            <div className="text-center mb-8 mt-2">
              <div className="text-5xl font-black text-[#1a73e8] tracking-tight">GSN</div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Global Skills Network</p>
            </div>

            {/* Certificate body */}
            <div className="text-center mb-8">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Certificat de Formation</p>
              <p className="text-gray-500 mb-2">Ce certificat est décerné à</p>

              <h2 className="text-4xl font-bold text-[#1a73e8] mb-3" style={{ fontFamily: "Georgia, serif" }}>
                {userName}
              </h2>

              <p className="text-gray-500 mb-2">pour avoir complété avec succès le parcours</p>
              <h3 className="text-xl font-bold text-gray-800 mb-6">{course.title}</h3>

              {/* Score badge */}
              <div className="inline-flex items-center gap-3 bg-[#e8f0fe] rounded-full px-8 py-3">
                <span className="text-[#1a73e8] font-black text-3xl">{course.test_score}%</span>
                <span className="text-gray-500 text-sm">Score obtenu</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Date d&apos;obtention</p>
                <p className="font-semibold text-gray-700">{completedDate}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-1">🏆</div>
                <p className="text-xs text-gray-400 font-medium">Certifié GSN</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">N° Certificat</p>
                <p className="font-mono text-xs font-semibold text-gray-600">{course.certificate_id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
