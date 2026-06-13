import { youtubeChannel } from "@/content/site-data";

export type LiveYoutubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number;
};

export type LiveYoutubeComment = {
  id: string;
  author: string;
  text: string;
  likes: number;
  videoId: string;
};

export type LiveYoutubeStats = {
  subscribers: number;
  totalViews: number;
  videoCount: number;
  channelTitle?: string;
  channelHandle?: string;
  videos: LiveYoutubeVideo[];
  popularVideos: LiveYoutubeVideo[];
  comments: LiveYoutubeComment[];
};

type YoutubeChannelResponse = {
  items?: Array<{
    snippet?: { title?: string; customUrl?: string };
    statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
  }>;
};

type YoutubeSearchResponse = {
  items?: Array<{ id: { videoId: string } }>;
};

type YoutubeVideoDetailsResponse = {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails?: { high?: { url?: string }; default?: { url?: string } };
    };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  }>;
};

type YoutubeCommentThreadsResponse = {
  items?: Array<{
    id: string;
    snippet: {
      topLevelComment: {
        snippet: {
          authorDisplayName: string;
          textDisplay: string;
          textOriginal: string;
          likeCount?: string | number;
        };
      };
    };
  }>;
};

export async function getLiveYoutubeChannelStats(channelId?: string): Promise<LiveYoutubeStats | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const resolvedChannelId = channelId || process.env.YOUTUBE_CHANNEL_ID || youtubeChannel.id;

  if (!apiKey || !resolvedChannelId) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${resolvedChannelId}&key=${apiKey}`,
      { next: { revalidate: youtubeChannel.revalidateSeconds } },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as YoutubeChannelResponse;
    const item = data.items?.[0];
    if (!item) return null;

    return {
      subscribers: Number(item.statistics?.subscriberCount) || youtubeChannel.fallback.subscribers,
      totalViews: Number(item.statistics?.viewCount) || youtubeChannel.fallback.views,
      videoCount: Number(item.statistics?.videoCount) || youtubeChannel.fallback.videos,
      channelTitle: item.snippet?.title,
      channelHandle: item.snippet?.customUrl,
      videos: [],
      popularVideos: [],
      comments: [],
    };
  } catch {
    return null;
  }
}

export async function getLiveYoutubeData(channelId?: string): Promise<LiveYoutubeStats | null> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = channelId || process.env.YOUTUBE_CHANNEL_ID || youtubeChannel.id;

  if (!API_KEY || !CHANNEL_ID) {
    console.warn("YouTube API keys missing. Returning null.");
    return null;
  }

  try {
    const channelStats = await getLiveYoutubeChannelStats(CHANNEL_ID);
    if (!channelStats) return null;

    // 1. Fetch Latest 6 videos
    const latestSearchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=6&key=${API_KEY}`,
      { next: { revalidate: youtubeChannel.revalidateSeconds } }
    );
    const latestSearchData = (await latestSearchRes.json()) as YoutubeSearchResponse;
    const latestVideoIds = latestSearchData.items?.map((item) => item.id.videoId).join(",") || "";

    // 2. Fetch Most Popular 6 videos
    const popularSearchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=viewCount&type=video&maxResults=6&key=${API_KEY}`,
      { next: { revalidate: youtubeChannel.revalidateSeconds } }
    );
    const popularSearchData = (await popularSearchRes.json()) as YoutubeSearchResponse;
    const popularVideoIds = popularSearchData.items?.map((item) => item.id.videoId).join(",") || "";

    async function fetchVideoDetails(ids: string): Promise<LiveYoutubeVideo[]> {
      if (!ids) return [];
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${API_KEY}`,
        { next: { revalidate: youtubeChannel.revalidateSeconds } }
      );
      const data = (await res.json()) as YoutubeVideoDetailsResponse;
      return (data.items || []).map((item) => ({
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "/images/yt-channel-hero.png",
        views: parseInt(item.statistics?.viewCount || "0", 10),
      }));
    }

    const [latestVideos, popularVideos] = await Promise.all([
      fetchVideoDetails(latestVideoIds),
      fetchVideoDetails(popularVideoIds),
    ]);

    // 3. Fetch comments from the strongest available videos for better social proof.
    const comments: LiveYoutubeComment[] = [];
    const candidateVideoIds = [...new Set([...popularVideos, ...latestVideos].map((video) => video.id).filter(Boolean))].slice(0, 5);

    for (const targetVidId of candidateVideoIds) {
      const commentsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${targetVidId}&maxResults=10&order=relevance&key=${API_KEY}`,
        { next: { revalidate: youtubeChannel.revalidateSeconds } }
      );

      if (!commentsRes.ok) continue;

      const commentsData = (await commentsRes.json()) as YoutubeCommentThreadsResponse;
      for (const item of commentsData.items || []) {
        const topComment = item.snippet.topLevelComment.snippet;
        const text = topComment.textOriginal || topComment.textDisplay;
        if (text.length > 15 && !text.includes("http")) {
          comments.push({
            id: item.id,
            author: topComment.authorDisplayName,
            text,
            likes: parseInt(String(topComment.likeCount || "0"), 10),
            videoId: targetVidId,
          });
        }
      }

      if (comments.length >= 4) break;
    }

    return {
      subscribers: channelStats.subscribers,
      totalViews: channelStats.totalViews,
      videoCount: channelStats.videoCount,
      channelTitle: channelStats.channelTitle,
      channelHandle: channelStats.channelHandle,
      videos: latestVideos,
      popularVideos: popularVideos,
      comments: comments.slice(0, 8),
    };

  } catch (error) {
    console.error("Failed fetching live Youtube data:", error);
    return null;
  }
}
