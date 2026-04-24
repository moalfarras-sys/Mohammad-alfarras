import { NextResponse } from "next/server";

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET() {
  if (!CHANNEL_ID || !API_KEY) {
    return NextResponse.json(
      { subscribers: null, totalViews: null, videoCount: null, latestVideoId: null, error: "not_configured" },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
        `part=statistics,snippet&id=${encodeURIComponent(CHANNEL_ID)}&key=${encodeURIComponent(API_KEY)}`,
      { next: { revalidate: 3600 } },
    );
    const data = (await res.json()) as {
      items?: Array<{ statistics?: Record<string, string>; snippet?: { customUrl?: string } }>;
    };
    const stats = data.items?.[0]?.statistics;

    let latestVideoId: string | null = null;
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=id&channelId=${encodeURIComponent(CHANNEL_ID)}&order=date&maxResults=1&type=video&key=${encodeURIComponent(API_KEY)}`,
      { next: { revalidate: 3600 } },
    );
    const searchData = (await searchRes.json()) as { items?: Array<{ id?: { videoId?: string } }> };
    latestVideoId = searchData.items?.[0]?.id?.videoId ?? null;

    return NextResponse.json({
      subscribers: stats?.subscriberCount ?? null,
      totalViews: stats?.viewCount ?? null,
      videoCount: stats?.videoCount ?? null,
      latestVideoId,
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
