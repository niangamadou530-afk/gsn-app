import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ error: "q requis" }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;

  // No API key → return empty (client shows styled search links)
  if (!apiKey) {
    return NextResponse.json({ items: [], fallback: true });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "3");
    url.searchParams.set("relevanceLanguage", "fr");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("videoEmbeddable", "true");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    const items = (data.items ?? []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? "",
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("YouTube API error:", error.message);
    return NextResponse.json({ items: [], error: error.message });
  }
}
