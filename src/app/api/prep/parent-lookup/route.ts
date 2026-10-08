import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAndIncrementServerRateLimit, resetServerRateLimit } from "@/lib/serverRateLimit";
import { getSeriesExamInfo } from "@/lib/prep-config";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json().catch(() => ({}));
    const cleanCode = (code || "").trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 4 || cleanCode.length > 10) {
      return NextResponse.json({ error: "Code d'accès invalide" }, { status: 400 });
    }

    const clientIp = getClientIp(req);

    // 1. Limite persistante par code parent ciblé (max 5 tentatives par 15 min)
    const codeRateResult = await checkAndIncrementServerRateLimit(`parent:${cleanCode}`, 5, 15);
    if (!codeRateResult.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives pour ce code d'accès. Par sécurité, patiente ${codeRateResult.waitMinutes || 15} minute(s) avant de réessayer.`,
          rateLimited: true,
          waitMinutes: codeRateResult.waitMinutes,
        },
        { status: 429 }
      );
    }

    // 2. Limite par IP (max 15 tentatives par 15 min tous codes confondus pour bloquer le balayage)
    const ipRateResult = await checkAndIncrementServerRateLimit(`parent-ip:${clientIp}`, 15, 15);
    if (!ipRateResult.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives depuis votre connexion. Patiente ${ipRateResult.waitMinutes || 15} minute(s).`,
          rateLimited: true,
          waitMinutes: ipRateResult.waitMinutes,
        },
        { status: 429 }
      );
    }

    // Cas de démonstration : actif UNIQUEMENT si PREP_ENABLE_DEMO === "true"
    if (cleanCode === "DEMO12" && process.env.PREP_ENABLE_DEMO === "true") {
      await resetServerRateLimit(`parent:${cleanCode}`);
      const seriesInfo = getSeriesExamInfo("S2", "BAC");
      return NextResponse.json({
        found: true,
        studentFirstName: "Élève Démo",
        examType: "BAC",
        serie: "S2",
        quizzesThisWeek: 4,
        activeDaysThisWeek: 3,
        averageScore: 78,
        realSubjectStats: {
          "Mathématiques": { count: 4, score: 85, level: "Fort", hasEnoughData: true },
          "Sciences Physiques": { count: 3, score: 80, level: "Fort", hasEnoughData: true },
          "SVT": { count: 1, score: null, level: "Pas assez de données", hasEnoughData: false },
        },
        selfAssessment: {
          "Mathématiques": { level: "Fort", score: 85 },
          "Sciences Physiques": { level: "Fort", score: 88 },
          "SVT": { level: "Moyen", score: 72 },
        },
        recentScores: [
          { subject: "Mathématiques", scoreSur20: 17, date: "2026-10-06" },
          { subject: "Sciences Physiques", scoreSur20: 16, date: "2026-10-05" },
          { subject: "SVT", scoreSur20: 14, date: "2026-10-04" },
        ],
        examInfo: {
          targetDate: seriesInfo.targetDate,
          displayDateFr: seriesInfo.displayDateFr,
          statutNote: "Date estimée, à confirmer",
          examType: "BAC",
          serie: "S2",
        },
        regularity: {
          daysSinceLastActivity: 1,
          lastActivityText: "Hier",
          streakDays: 3,
          isInactiveNotice: false,
          inactiveMessage: null,
        },
        parentAdvice: {
          general: [
            "Veillez à un sommeil régulier de 7 à 8 heures : le repos nocturne consolide la mémorisation.",
            "Privilégiez des séances courtes de 20 à 30 minutes plutôt que de longues sessions épuisantes.",
            "Valorisez ses efforts constants et sa régularité plutôt que les notes brutes pour préserver sa confiance.",
            "Encouragez une pause avec étirements et hydratation après chaque série de quiz pour relâcher la tension.",
          ],
          subjectSpecific: null,
        },
      });
    }

    // Client administratif Supabase sécurisé
    const sbAdmin = getServiceSupabase();
    if (!sbAdmin) {
      console.error("[parent-lookup] configuration manquante");
      return NextResponse.json(
        { error: "Le service de consultation parent est momentanément indisponible. Réessayez dans quelques instants." },
        { status: 500 }
      );
    }

    const { data: link, error: linkError } = await sbAdmin
      .from("prep_parent_links")
      .select("student_user_id")
      .eq("access_code", cleanCode)
      .maybeSingle();

    if (linkError) {
      console.error(
        "[parent-lookup error]",
        `Code: ${linkError.code || "inconnu"}, Message: ${linkError.message || "erreur"}`
      );
      return NextResponse.json({ found: false, error: "Erreur lors de la vérification du code." }, { status: 500 });
    }

    if (!link) {
      return NextResponse.json({ found: false, error: "Code d'accès introuvable ou expiré." }, { status: 404 });
    }

    // Code valide trouvé -> Réinitialiser le compteur de tentatives pour ce code
    await resetServerRateLimit(`parent:${cleanCode}`);

    const studentId = link.student_user_id;

    // Charger les informations pour le parent
    const [{ data: profile }, { data: stu }, { data: allQuizzes }] = await Promise.all([
      sbAdmin.from("users").select("name").eq("id", studentId).maybeSingle(),
      sbAdmin.from("prep_students").select("prenom, exam_type, serie, level_per_subject").eq("user_id", studentId).maybeSingle(),
      sbAdmin
        .from("quiz_results")
        .select("matiere, score, total, created_at")
        .eq("user_id", studentId)
        .order("created_at", { ascending: false }),
    ]);

    // Prénom uniquement (jamais le nom complet)
    const rawName = stu?.prenom || profile?.name || "Élève";
    const studentFirstName = rawName.trim().split(/\s+/)[0] || "Élève";

    const examType = stu?.exam_type || "BAC";
    const serie = stu?.serie || null;

    // Calculs d'activité sur les 7 derniers jours (réel serveur sans limite de 10)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const quizList = allQuizzes || [];
    const weekQuizzes = quizList.filter(q => q.created_at && q.created_at >= sevenDaysAgo);
    const quizzesThisWeek = weekQuizzes.length;
    const activeDaysThisWeek = new Set(weekQuizzes.map(q => q.created_at.slice(0, 10))).size;

    // Moyenne calculée uniquement sur les quiz réels (jamais sur l'auto-évaluation)
    let averageScore: number | null = null;
    if (quizList.length > 0) {
      const sumPct = quizList.reduce((acc, q) => {
        const t = Math.max(1, q.total || 10);
        return acc + ((q.score / t) * 100);
      }, 0);
      averageScore = Math.round(sumPct / quizList.length);
    }

    // Résultats réels par matière (calculés uniquement si >= 3 quiz par matière)
    const byMatiere: Record<string, { totalPct: number; count: number }> = {};
    for (const q of quizList) {
      if (!q.matiere) continue;
      const m = q.matiere.trim();
      if (!byMatiere[m]) byMatiere[m] = { totalPct: 0, count: 0 };
      const t = Math.max(1, q.total || 10);
      byMatiere[m].totalPct += (q.score / t) * 100;
      byMatiere[m].count += 1;
    }

    const realSubjectStats: Record<string, { count: number; score: number | null; level: string; hasEnoughData: boolean }> = {};
    for (const [m, data] of Object.entries(byMatiere)) {
      if (data.count >= 3) {
        const avg = Math.round(data.totalPct / data.count);
        const level = avg >= 75 ? "Fort" : avg >= 50 ? "Moyen" : "À consolider";
        realSubjectStats[m] = { count: data.count, score: avg, level, hasEnoughData: true };
      } else {
        realSubjectStats[m] = { count: data.count, score: null, level: "Pas assez de données", hasEnoughData: false };
      }
    }

    // 5 derniers scores avec la date du jour sans l'heure
    const recentScores = quizList.slice(0, 5).map(q => {
      const t = Math.max(1, q.total || 10);
      const note20 = Math.round((q.score / t) * 20);
      return {
        subject: q.matiere,
        scoreSur20: note20,
        date: q.created_at ? q.created_at.slice(0, 10) : "",
      };
    });

    // Date de référence officielle prise dans src/lib/prep-config.ts
    const seriesInfo = getSeriesExamInfo(serie, examType);
    const examInfo = {
      targetDate: seriesInfo.targetDate,
      displayDateFr: seriesInfo.displayDateFr,
      statutNote: "Date estimée, à confirmer",
      examType,
      serie,
    };

    // 1. Calcul de régularité
    let daysSinceLastActivity: number | null = null;
    let lastActivityText = "Aucune activité enregistrée";
    let isInactiveNotice = false;

    if (quizList.length > 0 && quizList[0].created_at) {
      const lastDate = new Date(quizList[0].created_at.slice(0, 10));
      const today = new Date(new Date().toISOString().slice(0, 10));
      const diffMs = today.getTime() - lastDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      daysSinceLastActivity = diffDays;
      if (diffDays === 0) {
        lastActivityText = "Aujourd'hui";
      } else if (diffDays === 1) {
        lastActivityText = "Hier";
      } else {
        lastActivityText = `Il y a ${diffDays} jours`;
      }
      if (diffDays >= 3) {
        isInactiveNotice = true;
      }
    } else {
      isInactiveNotice = true;
    }

    // 2. Série de jours consécutifs (streak)
    const uniqueDates = Array.from(
      new Set(
        quizList
          .map(q => q.created_at?.slice(0, 10))
          .filter(Boolean) as string[]
      )
    ).sort().reverse(); // plus récentes d'abord

    let streakDays = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streakDays = 1;
        let currentDate = new Date(uniqueDates[0]);

        for (let i = 1; i < uniqueDates.length; i++) {
          const prevExpected = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          if (uniqueDates[i] === prevExpected) {
            streakDays += 1;
            currentDate = new Date(uniqueDates[i]);
          } else {
            break;
          }
        }
      }
    }

    // 3. Conseils "Comment l'aider"
    const generalAdvice = [
      "Veillez à un sommeil régulier de 7 à 8 heures : le repos nocturne consolide la mémorisation.",
      "Privilégiez des séances courtes de 20 à 30 minutes plutôt que de longues sessions épuisantes.",
      "Valorisez ses efforts constants et sa régularité plutôt que les notes brutes pour préserver sa confiance.",
      "Encouragez une pause avec étirements et hydratation après chaque série de quiz pour relâcher la tension.",
    ];

    let subjectSpecificAdvice: string | null = null;
    for (const [m, data] of Object.entries(realSubjectStats)) {
      if (data.hasEnoughData && data.score !== null && data.score < 50) {
        subjectSpecificAdvice = `En ${m}, encouragez votre enfant à relire calmement les résumés et formules clés avant de refaire un quiz pas à pas, sans se décourager.`;
        break;
      }
    }

    return NextResponse.json({
      found: true,
      studentFirstName,
      examType,
      serie,
      quizzesThisWeek,
      activeDaysThisWeek,
      averageScore,
      realSubjectStats,
      selfAssessment: stu?.level_per_subject || {},
      recentScores,
      examInfo,
      regularity: {
        daysSinceLastActivity,
        lastActivityText,
        streakDays,
        isInactiveNotice,
        inactiveMessage: isInactiveNotice
          ? "Une petite pause permet de recharger les batteries. Un quiz rapide de 5 minutes aujourd'hui l'aidera à garder le rythme en toute sérénité !"
          : null,
      },
      parentAdvice: {
        general: generalAdvice,
        subjectSpecific: subjectSpecificAdvice,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[parent-lookup exception]", msg);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification du code" },
      { status: 500 }
    );
  }
}
