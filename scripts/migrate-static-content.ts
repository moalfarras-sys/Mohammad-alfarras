import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type RawVideos = Array<{
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  thumbnail: string;
  duration: string;
  views: number;
  publishedAt: string;
}>;

async function main() {
  const root = path.resolve(process.cwd(), "..");
  const videosPath = path.join(root, "data", "videos.json");
  const dynamicPath = path.join(root, "data", "dynamic-content.json");

  const [videosRaw, dynamicRaw] = await Promise.all([
    readFile(videosPath, "utf8"),
    readFile(dynamicPath, "utf8"),
  ]);

  const videos = JSON.parse(videosRaw) as RawVideos;
  const dynamic = JSON.parse(dynamicRaw) as Record<string, unknown>;

  const output = {
    imported_at: new Date().toISOString(),
    videos_count: videos.length,
    dynamic_keys: Object.keys(dynamic),
    videos: videos.map((video, index) => ({
      id: `legacy-${index + 1}`,
      youtube_id: video.id,
      title_ar: video.title_ar,
      title_en: video.title_en,
      description_ar: video.description_ar,
      description_en: video.description_en,
      thumbnail: video.thumbnail,
      duration: video.duration,
      views: video.views,
      published_at: video.publishedAt,
      sort_order: index + 1,
      is_featured: index === 0,
      is_active: true,
    })),
  };

  const targetPath = path.join(process.cwd(), "src", "data", "legacy-import.json");
  await writeFile(targetPath, JSON.stringify(output, null, 2), "utf8");

  console.log(`Imported ${videos.length} videos into ${targetPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
