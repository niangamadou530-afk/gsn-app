import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Route sécurisée de vidéos pédagogiques YouTube (Phase 7 - GSN PREP)
 * - Jeton validé côté serveur
 * - Cache de 30 jours (table prep_cache si présente)
 * - Limite de 10 recherches par jour et par élève
 * - Limite de rafale (burst) par IP hachée
 * - Plafond global journalier PREP_YT_DAILY_UNITS (8 000 par défaut sur 10 000 max Google)
 * - Filtres stricts : safeSearch=strict, videoEmbeddable=true, relevanceLanguage=fr, regionCode=SN
 * - Sans YOUTUBE_API_KEY : masquer proprement sans erreur
 */

// Mémoire vive pour burst rate limit et compteur d'unités journalier global
interface BurstRecord {
  count: number;
  resetAt: number;
}
const burstMap = new Map<string, BurstRecord>();

let globalDailyUnitsUsed = 0;
let globalDailyResetDate = new Date().toISOString().slice(0, 10);

function checkGlobalDailyUnits(cost = 100): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== globalDailyResetDate) {
    globalDailyResetDate = today;
    globalDailyUnitsUsed = 0;
  }
  const maxUnits = parseInt(process.env.PREP_YT_DAILY_UNITS || "8000", 10);
  if (globalDailyUnitsUsed + cost > maxUnits) {
    return false;
  }
  globalDailyUnitsUsed += cost;
  return true;
}

function checkBurstLimit(ipHash: string, maxRequests = 5, windowMs = 30000): boolean {
  const now = Date.now();
  const rec = burstMap.get(ipHash);
  if (!rec || now > rec.resetAt) {
    burstMap.set(ipHash, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= maxRequests) {
    return false;
  }
  rec.count++;
  return true;
}

export async function POST(req: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Phase 7.5 : sans clé, la section est masquée proprement sans erreur
    return NextResponse.json({ videos: [], configured: false });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ videos: [], message: "Non authentifié" }, { status: 401 });
  }

  // 1. Validation du jeton de l'élève
  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await sbAnon.auth.getUser();
  if (!user) {
    return NextResponse.json({ videos: [], message: "Session invalide" }, { status: 401 });
  }
  const userId = user.id;

  // Hachage de l'adresse IP avec sel serveur (Phase 6.4 & 7.3)
  const forwarded = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIp = forwarded.split(",")[0].trim();
  const ipSalt = process.env.PREP_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "prep_salt_secret";
  const ipHash = crypto.createHmac("sha256", ipSalt).update(clientIp).digest("hex").slice(0, 16);

  // Vérification de rafale (5 requêtes par tranche de 30 secondes)
  if (!checkBurstLimit(ipHash)) {
    return NextResponse.json(
      { videos: [], message: "Trop de requêtes rapides. Réessaie dans quelques secondes." },
      { status: 429 }
    );
  }

  let body: { matiere?: string; chapitre?: string; examType?: string; serie?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ videos: [] });
  }

  const { matiere = "", chapitre = "", examType = "BAC", serie = "" } = body;
  const cacheKey = `yt:${examType.toLowerCase()}:${serie.toLowerCase()}:${matiere.toLowerCase()}:${chapitre.toLowerCase()}:fr`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sbAdmin = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false } })
    : null;

  // 2. Lecture du cache de 30 jours avant tout appel externe (Phase 7.2)
  if (sbAdmin) {
    try {
      const { data: cached } = await sbAdmin
        .from("prep_cache")
        .select("payload, created_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      if (cached?.payload && cached.created_at) {
        const ageDays = (Date.now() - new Date(cached.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays <= 30) {
          // Servir depuis le cache : ne compte ni dans la limite de l'élève ni dans les unités YouTube
          return NextResponse.json({ videos: cached.payload, cached: true });
        }
      }
    } catch {
      // Table optionnelle
    }
  }

  // 3. Vérification du quota journalier de l'élève (10 recherches / jour)
  const todayStr = new Date().toISOString().slice(0, 10);
  if (sbAdmin) {
    try {
      const { data: usage } = await sbAdmin
        .from("prep_usage_quotidien")
        .select("youtube_count")
        .eq("user_id", userId)
        .eq("date", todayStr)
        .maybeSingle();

      const currentCount = usage?.youtube_count || 0;
      if (currentCount >= 10) {
        return NextResponse.json({
          videos: [],
          message: "Tu as atteint ta limite de 10 recherches vidéo pour aujourd'hui. Reviens demain !"
        });
      }
    } catch {
      // Si la colonne n'existe pas encore, autoriser
    }
  }

  // 4. Plafond global journalier PREP_YT_DAILY_UNITS (défaut 8 000 unités)
  if (!checkGlobalDailyUnits(100)) {
    return NextResponse.json({
      videos: [],
      message: "Les vidéos reviennent demain."
    });
  }

  // 5. Appel de l'API YouTube avec filtres stricts (Phase 7.4)
  const q = `${matiere}${chapitre ? " " + chapitre : ""} cours ${examType} Sénégal`;
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "3");
    url.searchParams.set("relevanceLanguage", "fr");
    url.searchParams.set("regionCode", "SN");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("videoDuration", "medium");
    url.searchParams.set("part", "snippet");

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({
        videos: [],
        message: "Les vidéos reviennent demain."
      });
    }

    const data = await res.json();
    const decodeHtml = (str: string) =>
      str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

    const videos = (data.items ?? []).map((item: any) => {
      const thumbs = item.snippet?.thumbnails || {};
      const bestThumbnail =
        thumbs.maxres?.url ||
        thumbs.standard?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url ||
        thumbs.default?.url ||
        "";
      return {
        videoId: item.id?.videoId,
        title: decodeHtml(item.snippet?.title ?? ""),
        thumbnail: bestThumbnail,
      };
    });

    // 6. Écriture dans prep_cache et incrémentation quota élève
    if (sbAdmin && videos.length > 0) {
      try {
        await sbAdmin.from("prep_cache").upsert({
          cache_key: cacheKey,
          payload: videos,
          created_at: new Date().toISOString(),
        });
      } catch {}

      try {
        await sbAdmin.from("prep_usage_quotidien").upsert({
          user_id: userId,
          date: todayStr,
          youtube_count: 1,
        }, { onConflict: "user_id,date" });
      } catch {}
    }

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({
      videos: [],
      message: "Les vidéos reviennent demain."
    });
  }
}
