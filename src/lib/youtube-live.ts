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
  videos: LiveYoutubeVideo[];
  comments: LiveYoutubeComment[];
};

type YoutubeChannelResponse = {
  items?: Array<{ statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string } }>;
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
    statistics?: { viewCount?: string };
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

export async function getLiveYoutubeData(): Promise<LiveYoutubeStats | null> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  if (!API_KEY || !CHANNEL_ID) {
    console.warn("YouTube API keys missing. Returning null.");
    return null;
  }

  try {
    // 1. Fetch channel stats
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const channelData = (await channelRes.json()) as YoutubeChannelResponse;
    const stats = channelData.items?.[0]?.statistics || {};

    // 2. Fetch top 4 videos (Order by date or viewCount. Since it's search, we get latest first for relevance, but limit to 4)
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&maxResults=4&key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const searchData = (await searchRes.json()) as YoutubeSearchResponse;
    
    const videos: LiveYoutubeVideo[] = [];
    const videoIds = searchData.items?.map((item) => item.id.videoId).join(",") || "";

    // 3. Fetch exact views for those videos
    if (videoIds) {
      const vidStatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      const vidStatsData = (await vidStatsRes.json()) as YoutubeVideoDetailsResponse;
      
      vidStatsData.items?.forEach((item) => {
        videos.push({
          id: item.id,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "/images/placeholder.jpg",
          views: parseInt(item.statistics?.viewCount || "0", 10),
        });
      });
    }

    // 4. Fetch a few top comments from the most recent video
    const comments: LiveYoutubeComment[] = [];
    if (videos.length > 0) {
      const topVidId = videos[0].id;
      const commentsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${topVidId}&maxResults=5&order=relevance&key=${API_KEY}`,
        { next: { revalidate: 3600 } }
      );
      if (commentsRes.ok) {
        const commentsData = (await commentsRes.json()) as YoutubeCommentThreadsResponse;
        commentsData.items?.forEach((item) => {
          const topComment = item.snippet.topLevelComment.snippet;
          // Filter out too short or link spam comments
          if (topComment.textDisplay.length > 20 && !topComment.textDisplay.includes("http")) {
             comments.push({
               id: item.id,
               author: topComment.authorDisplayName,
               text: topComment.textOriginal, // Use original to avoid HTML tags
               likes: parseInt(String(topComment.likeCount || "0"), 10),
               videoId: topVidId,
             });
          }
        });
      }
    }

    return {
      subscribers: parseInt(stats.subscriberCount || "0", 10),
      totalViews: parseInt(stats.viewCount || "0", 10),
      videoCount: parseInt(stats.videoCount || "0", 10),
      videos,
      comments: comments.slice(0, 4), // Take top 4 clean comments
    };

  } catch (error) {
    console.error("Failed fetching live Youtube data:", error);
    return null;
  }
}
