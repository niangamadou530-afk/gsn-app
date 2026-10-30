import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Route sécurisée de vidéos pédagogiques YouTube (Phase 7 / PARTIE H)
 * - Jeton validé côté serveur
 * - Cache de 30 jours (table prep_cache avec service role key)
 * - Limite de 10 recherches par jour et par élève dans prep_usage_quotidien (colonne youtube_count)
 * - Limite de rafale (burst) persistante dans prep_rate_limits (target_identifier: "yt_burst:<ipHash>")
 * - Plafond global journalier PREP_YT_DAILY_UNITS persistant dans prep_rate_limits (target_identifier: "yt_global_units:<YYYY-MM-DD>")
 * - Filtres stricts : safeSearch=strict, videoEmbeddable=true, relevanceLanguage=fr, regionCode=SN
 * - Refus propre sans faille (« Les vidéos reviennent demain. »)
 */

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// 1. Limite de rafale (5 requêtes / 30 secondes) persistante dans prep_rate_limits
async function checkBurstRateLimit(sbAdmin: any, ipHash: string): Promise<boolean> {
  const key = `yt_burst:${ipHash}`;
  const now = new Date();
  const windowMs = 30 * 1000;
  const maxRequests = 5;

  if (!sbAdmin) return true;

  try {
    const { data: rec } = await sbAdmin
      .from("prep_rate_limits")
      .select("target_identifier, attempt_count, first_attempt_at")
      .eq("target_identifier", key)
      .maybeSingle();

    if (!rec) {
      await sbAdmin.from("prep_rate_limits").insert({
        target_identifier: key,
        attempt_count: 1,
        first_attempt_at: now.toISOString(),
        last_attempt_at: now.toISOString(),
      });
      return true;
    }

    const firstMs = new Date(rec.first_attempt_at).getTime();
    if (now.getTime() - firstMs > windowMs) {
      await sbAdmin
        .from("prep_rate_limits")
        .update({
          attempt_count: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
        })
        .eq("target_identifier", key);
      return true;
    }

    if (rec.attempt_count >= maxRequests) {
      return false;
    }

    await sbAdmin
      .from("prep_rate_limits")
      .update({
        attempt_count: rec.attempt_count + 1,
        last_attempt_at: now.toISOString(),
      })
      .eq("target_identifier", key);

    return true;
  } catch {
    return true;
  }
}

// 2. Plafond journalier global PREP_YT_DAILY_UNITS persistant dans prep_rate_limits
async function checkAndIncrementGlobalUnits(sbAdmin: any, cost = 100): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `yt_global_units:${today}`;
  const maxUnits = parseInt(process.env.PREP_YT_DAILY_UNITS || "8000", 10);

  if (!sbAdmin) {
    // Si pas de base connectée en service role, refuser prudemment
    return false;
  }

  try {
    const { data: rec } = await sbAdmin
      .from("prep_rate_limits")
      .select("target_identifier, attempt_count")
      .eq("target_identifier", key)
      .maybeSingle();

    const currentUnits = rec?.attempt_count || 0;
    if (currentUnits + cost > maxUnits) {
      return false;
    }

    if (!rec) {
      await sbAdmin.from("prep_rate_limits").insert({
        target_identifier: key,
        attempt_count: cost,
        first_attempt_at: new Date().toISOString(),
        last_attempt_at: new Date().toISOString(),
      });
    } else {
      await sbAdmin
        .from("prep_rate_limits")
        .update({
          attempt_count: currentUnits + cost,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("target_identifier", key);
    }

    return true;
  } catch {
    // En cas d'erreur de base de données, refuser pour ne pas appeler YouTube sans contrôle
    return false;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Sans clé : masquer proprement la section sans erreur
    return NextResponse.json({ videos: [], configured: false });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ videos: [], message: "Non authentifié" }, { status: 401 });
  }

  // Vérification de la session élève
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

  const sbAdmin = getAdminClient();
  if (!sbAdmin) {
    return NextResponse.json({ videos: [], message: "Les vidéos reviennent demain." });
  }

  // Hachage salé de l'adresse IP
  const forwarded = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIp = forwarded.split(",")[0].trim();
  const ipSalt = process.env.PREP_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "prep_salt_secret";
  const ipHash = crypto.createHmac("sha256", ipSalt).update(clientIp).digest("hex").slice(0, 16);

  // Limite de rafale multi-instances
  const burstAllowed = await checkBurstRateLimit(sbAdmin, ipHash);
  if (!burstAllowed) {
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

  // 1. Consultation du cache de 30 jours (ne consomme ni unités ni quota élève)
  try {
    const { data: cached } = await sbAdmin
      .from("prep_cache")
      .select("payload, created_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached?.payload && cached.created_at) {
      const ageDays = (Date.now() - new Date(cached.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays <= 30) {
        return NextResponse.json({ videos: cached.payload, cached: true });
      }
    }
  } catch {
    // Continuer si pas de cache
  }

  // 2. Vérification du quota journalier élève (10 recherches / jour dans prep_usage_quotidien)
  const todayStr = new Date().toISOString().slice(0, 10);
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
    // Continuer
  }

  // 3. Vérification du plafond global journalier (8 000 unités dans prep_rate_limits)
  const unitsAllowed = await checkAndIncrementGlobalUnits(sbAdmin, 100);
  if (!unitsAllowed) {
    return NextResponse.json({
      videos: [],
      message: "Les vidéos reviennent demain."
    });
  }

  // 4. Requête API YouTube officielle avec filtres stricts
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

    // 5. Mise en cache 30 jours et incrémentation quota élève
    if (videos.length > 0) {
      try {
        await sbAdmin.from("prep_cache").upsert({
          cache_key: cacheKey,
          payload: videos,
          created_at: new Date().toISOString(),
        }, { onConflict: "cache_key" });
      } catch {}

      try {
        const { data: usageRow } = await sbAdmin
          .from("prep_usage_quotidien")
          .select("youtube_count")
          .eq("user_id", userId)
          .eq("date", todayStr)
          .maybeSingle();

        const currentYt = usageRow?.youtube_count || 0;
        if (!usageRow) {
          await sbAdmin.from("prep_usage_quotidien").insert({
            user_id: userId,
            date: todayStr,
            youtube_count: 1,
          });
        } else {
          await sbAdmin
            .from("prep_usage_quotidien")
            .update({ youtube_count: currentYt + 1 })
            .eq("user_id", userId)
            .eq("date", todayStr);
        }
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
