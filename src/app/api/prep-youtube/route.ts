import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Return empty silently so the app works without YouTube key
    return NextResponse.json({ videos: [] });
  }

  let body: { matiere?: string; chapitre?: string; examType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ videos: [] });
  }

  const { matiere = "", chapitre = "", examType = "BAC" } = body;
  const q = `${matiere}${chapitre ? " " + chapitre : ""} cours ${examType} Sénégal`;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "3");
    url.searchParams.set("relevanceLanguage", "fr");
    url.searchParams.set("videoDuration", "medium");
    url.searchParams.set("part", "snippet");

    const res  = await fetch(url.toString());
    if (!res.ok) return NextResponse.json({ videos: [] });

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

    const videos = (data.items ?? []).map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails?: {
          maxres?: { url: string };
          standard?: { url: string };
          high?: { url: string };
          medium?: { url: string };
          default?: { url: string };
        };
      };
    }) => {
      const thumbs = item.snippet?.thumbnails || {};
      const bestThumbnail =
        thumbs.maxres?.url ||
        thumbs.standard?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url ||
        thumbs.default?.url ||
        "";

      return {
        videoId:   item.id.videoId,
        title:     decodeHtml(item.snippet?.title ?? ""),
        thumbnail: bestThumbnail,
      };
    });

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ videos: [] });
  }
}
