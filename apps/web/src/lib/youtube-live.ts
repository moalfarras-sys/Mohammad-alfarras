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

export async function getLiveYoutubeData(channelId?: string): Promise<LiveYoutubeStats | null> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = channelId || process.env.YOUTUBE_CHANNEL_ID;

  if (!API_KEY || !CHANNEL_ID) {
    console.warn("YouTube API keys missing. Returning null.");
    return null;
  }

  try {
    // 1. Fetch channel stats and metadata
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const channelData = (await channelRes.json()) as YoutubeChannelResponse;
    const channelItem = channelData.items?.[0];
    const stats = channelItem?.statistics || {};
    const snippet = channelItem?.snippet || {};

    // 2. Fetch Latest 6 videos
    const latestSearchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=6&key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const latestSearchData = (await latestSearchRes.json()) as YoutubeSearchResponse;
    const latestVideoIds = latestSearchData.items?.map((item) => item.id.videoId).join(",") || "";

    // 3. Fetch Most Popular 6 videos
    const popularSearchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=viewCount&type=video&maxResults=6&key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const popularSearchData = (await popularSearchRes.json()) as YoutubeSearchResponse;
    const popularVideoIds = popularSearchData.items?.map((item) => item.id.videoId).join(",") || "";

    async function fetchVideoDetails(ids: string): Promise<LiveYoutubeVideo[]> {
      if (!ids) return [];
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${API_KEY}`,
        { next: { revalidate: 3600 } }
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

    // 4. Fetch comments from the most popular video for better "Social Proof"
    const comments: LiveYoutubeComment[] = [];
    const targetVidId = popularVideos[0]?.id || latestVideos[0]?.id;

    if (targetVidId) {
      const commentsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${targetVidId}&maxResults=10&order=relevance&key=${API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (commentsRes.ok) {
        const commentsData = (await commentsRes.ok ? commentsRes.json() : {}) as YoutubeCommentThreadsResponse;
        if (commentsData.items) {
          commentsData.items.forEach((item) => {
            const topComment = item.snippet.topLevelComment.snippet;
            const text = topComment.textOriginal || topComment.textDisplay;
            if (text.length > 15 && !text.includes("http")) {
               comments.push({
                 id: item.id,
                 author: topComment.authorDisplayName,
                 text: text,
                 likes: parseInt(String(topComment.likeCount || "0"), 10),
                 videoId: targetVidId,
               });
            }
          });
        }
      }
    }

    return {
      subscribers: parseInt(stats.subscriberCount || "0", 10),
      totalViews: parseInt(stats.viewCount || "0", 10),
      videoCount: parseInt(stats.videoCount || "0", 10),
      channelTitle: snippet.title,
      channelHandle: snippet.customUrl,
      videos: latestVideos,
      popularVideos: popularVideos,
      comments: comments.slice(0, 8),
    };

  } catch (error) {
    console.error("Failed fetching live Youtube data:", error);
    return null;
  }
}
