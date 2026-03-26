"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Module = {
  title: string;
  description: string;
};

type Course = {
  id: string | number;
  title: string;
  modules: Module[];
};

export default function LearnPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_courses")
      .select("id, title, modules")
      .eq("user_id", userData.user.id)
      .order("id", { ascending: false });

    if (!error && data && data.length > 0) {
      setCourses(data as Course[]);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-[#1f2937] pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-[#1a73e8] mb-2">GSN Learn</h1>
        <p className="text-gray-600 mb-6">Ton espace d&apos;apprentissage personnalisé</p>

        {loading ? (
          <p>Chargement...</p>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow border border-blue-100 text-center">
            <p className="text-gray-600 mb-4">Tu n&apos;as pas encore de parcours de formation.</p>
            <Link
              href="/learn/onboarding"
              className="inline-block rounded-lg bg-[#1a73e8] text-white px-6 py-3 font-semibold hover:opacity-90"
            >
              Créer mon parcours avec l&apos;IA
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl p-5 shadow border border-blue-100">
                <h2 className="text-lg font-bold text-[#1a73e8] mb-4">{course.title}</h2>
                <div className="space-y-3">
                  {Array.isArray(course.modules) &&
                    course.modules.map((mod, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 rounded-lg bg-[#f7fbff] border border-blue-50"
                      >
                        <div className="h-8 w-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{mod.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{mod.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Link
                href="/learn/onboarding"
                className="text-[#1a73e8] font-semibold hover:underline text-sm"
              >
                + Créer un nouveau parcours
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 shadow-[0_-4px_20px_rgba(26,115,232,0.08)]">
        <div className="max-w-4xl mx-auto grid grid-cols-5 text-sm">
          <Link href="/dashboard" className="py-3 text-center text-gray-600">Accueil</Link>
          <Link href="/learn" className="py-3 text-center text-[#1a73e8] font-semibold">Apprendre</Link>
          <Link href="/missions" className="py-3 text-center text-gray-600">Missions</Link>
          <Link href="/wallet" className="py-3 text-center text-gray-600">Wallet</Link>
          <Link href="/score" className="py-3 text-center text-gray-600">Score</Link>
        </div>
      </nav>
    </main>
  );
}
