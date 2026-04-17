import { NextResponse } from "next/server";

const SERIES_PATTERN = /partie|part\b|épisode|ep\.|chapitre/i;

interface YTItem {
  id: { videoId: string };
  snippet: { title: string; thumbnails: { medium: { url: string } } };
}

function mapVideos(items: YTItem[]) {
  return items.map(item => ({
    videoId:   item.id.videoId,
    title:     item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? "",
  }));
}

async function ytSearch(apiKey: string, q: string, maxResults: number) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("relevanceLanguage", "fr");
  url.searchParams.set("part", "snippet");
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []) as YTItem[];
}

export async function POST(req: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ videos: [] });

  let body: { matiere?: string; chapitre?: string; examType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ videos: [] });
  }

  const { matiere = "", chapitre = "", examType = "BAC" } = body;
  const q1 = `${matiere}${chapitre ? " " + chapitre : ""} cours ${examType} Sénégal`;
  const q2 = `${matiere}${chapitre ? " " + chapitre : ""} partie`;

  try {
    const [items1, items2] = await Promise.all([
      ytSearch(apiKey, q1, 3),
      ytSearch(apiKey, q2, 50),
    ]);

    const seriesItems = items2.filter(item => SERIES_PATTERN.test(item.snippet.title));

    const videos = seriesItems.length > 0
      ? mapVideos(seriesItems)
      : mapVideos(items1);

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ videos: [] });
  }
}
